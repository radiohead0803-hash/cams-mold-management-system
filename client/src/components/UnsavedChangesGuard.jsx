import { useState, useEffect, useCallback, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { AlertTriangle, Save, Trash2, X, RotateCcw, Info } from 'lucide-react';

// localStorage 키 생성
function getDraftKey(formType, recordId) {
  return `cams_draft_${formType}_${recordId}`;
}

/**
 * UnsavedChangesGuard — 폼 페이지용 변경사항 보호 컴포넌트
 *
 * 기능:
 * 1. 브라우저 beforeunload 경고
 * 2. React Router 네비게이션 차단 (useBlocker)
 * 3. localStorage 자동 임시저장 (30초 간격)
 * 4. 임시저장 복원 프롬프트
 */
export default function UnsavedChangesGuard({
  hasChanges,
  formData,
  formType,
  recordId,
  onSave,
  onRestore,
}) {
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [saving, setSaving] = useState(false);
  const autoSaveTimerRef = useRef(null);
  const formDataRef = useRef(formData);
  const hasChangesRef = useRef(hasChanges);

  // refs를 최신 값으로 유지
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  const draftKey = getDraftKey(formType, recordId);

  // ── 1. 브라우저 beforeunload 경고 ──
  useEffect(() => {
    if (!hasChanges) return;

    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  // ── 2. React Router 네비게이션 차단 ──
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        hasChanges && currentLocation.pathname !== nextLocation.pathname,
      [hasChanges]
    )
  );

  // 임시저장 후 이동
  const handleSaveAndLeave = useCallback(async () => {
    if (!onSave) {
      blocker.proceed?.();
      return;
    }
    try {
      setSaving(true);
      await onSave();
      // 저장 성공 시 임시저장 삭제
      localStorage.removeItem(draftKey);
      blocker.proceed?.();
    } catch {
      // 저장 실패 시 모달 유지
    } finally {
      setSaving(false);
    }
  }, [onSave, blocker, draftKey]);

  // 저장 안함 (이동)
  const handleDiscardAndLeave = useCallback(() => {
    localStorage.removeItem(draftKey);
    blocker.proceed?.();
  }, [blocker, draftKey]);

  // 취소 (머무르기)
  const handleCancelLeave = useCallback(() => {
    blocker.reset?.();
  }, [blocker]);

  // ── 3. localStorage 자동 임시저장 (30초 간격) ──
  useEffect(() => {
    if (hasChanges) {
      // 변경사항이 발생하면 즉시 한 번 저장
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            data: formData,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {
        // localStorage 용량 초과 등 무시
      }

      // 30초 간격 자동 저장 시작
      autoSaveTimerRef.current = setInterval(() => {
        if (hasChangesRef.current && formDataRef.current) {
          try {
            localStorage.setItem(
              draftKey,
              JSON.stringify({
                data: formDataRef.current,
                savedAt: new Date().toISOString(),
              })
            );
          } catch {
            // 무시
          }
        }
      }, 30000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [hasChanges, draftKey, formData]);

  // ── 4. 마운트 시 임시저장 복원 프롬프트 ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.data) {
          setDraftData(parsed);
          setShowDraftBanner(true);
        }
      }
    } catch {
      localStorage.removeItem(draftKey);
    }
    // 마운트 시 1회만 실행
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 복원
  const handleRestore = useCallback(() => {
    if (draftData?.data && onRestore) {
      onRestore(draftData.data);
    }
    setShowDraftBanner(false);
    setDraftData(null);
  }, [draftData, onRestore]);

  // 삭제
  const handleDeleteDraft = useCallback(() => {
    localStorage.removeItem(draftKey);
    setShowDraftBanner(false);
    setDraftData(null);
  }, [draftKey]);

  // 저장 시각 포맷
  const formatSavedAt = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('ko-KR', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* ── 임시저장 복원 배너 ── */}
      {showDraftBanner && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-amber-100 rounded-full shrink-0">
              <Info size={20} className="text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-800">
                이전에 저장하지 않은 작성 내용이 있습니다. 복원하시겠습니까?
              </p>
              {draftData?.savedAt && (
                <p className="text-xs text-amber-600 mt-0.5">
                  임시저장: {formatSavedAt(draftData.savedAt)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRestore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              <RotateCcw size={14} />
              복원
            </button>
            <button
              onClick={handleDeleteDraft}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-300 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors"
            >
              <Trash2 size={14} />
              삭제
            </button>
          </div>
        </div>
      )}

      {/* ── 네비게이션 차단 모달 ── */}
      {blocker.state === 'blocked' && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleCancelLeave}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-yellow-100 shrink-0">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  변경사항 확인
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  저장하지 않은 변경사항이 있습니다. 페이지를 떠나시겠습니까?
                </p>
              </div>
              <button
                onClick={handleCancelLeave}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* 버튼 */}
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={handleCancelLeave}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium order-3 sm:order-1"
              >
                취소
              </button>
              <button
                onClick={handleDiscardAndLeave}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium order-2"
              >
                저장 안함
              </button>
              <button
                onClick={handleSaveAndLeave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-3"
              >
                {saving ? (
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <Save size={16} />
                )}
                임시저장 후 이동
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * 특정 formType/recordId의 임시저장 데이터를 삭제하는 유틸리티
 */
export function clearDraft(formType, recordId) {
  localStorage.removeItem(getDraftKey(formType, recordId));
}

/**
 * 특정 formType/recordId의 임시저장 데이터가 있는지 확인하는 유틸리티
 */
export function hasDraft(formType, recordId) {
  return localStorage.getItem(getDraftKey(formType, recordId)) !== null;
}
