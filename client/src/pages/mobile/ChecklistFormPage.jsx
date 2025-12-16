import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Box, Hash, Calendar, Gauge, ChevronDown, ChevronUp, AlertTriangle, Save, Cloud, CloudOff } from 'lucide-react';
import api from '../../lib/api';
import { tempStorage } from '../../utils/mobileStorage';

export default function ChecklistFormPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { instanceId, mold, template } = state || {};

  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 생산수량 관련 상태
  const [productionQty, setProductionQty] = useState('');
  const [currentShots, setCurrentShots] = useState(mold?.current_shots || mold?.shot_count || 0);
  const [showMoldInfo, setShowMoldInfo] = useState(true);

  // 임시저장 키
  const storageKey = instanceId ? `checklist_${instanceId}` : null;

  // 임시저장 데이터 불러오기
  useEffect(() => {
    if (!storageKey) return;
    
    const loadSavedData = async () => {
      try {
        const saved = await tempStorage.get(storageKey);
        if (saved) {
          setAnswers(saved.answers || {});
          setComment(saved.comment || '');
          setProductionQty(saved.productionQty || '');
          setLastSaved(saved.savedAt);
        }
      } catch (err) {
        console.error('Failed to load saved data:', err);
      }
    };
    loadSavedData();
  }, [storageKey]);

  // 자동 임시저장 (30초마다)
  const saveToTemp = useCallback(async () => {
    if (!storageKey || !hasUnsavedChanges) return;
    
    try {
      await tempStorage.save(storageKey, {
        answers,
        comment,
        productionQty,
        savedAt: new Date().toISOString()
      });
      setLastSaved(new Date().toISOString());
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to save:', err);
    }
  }, [storageKey, answers, comment, productionQty, hasUnsavedChanges]);

  useEffect(() => {
    const interval = setInterval(saveToTemp, 30000);
    return () => clearInterval(interval);
  }, [saveToTemp]);

  // 페이지 이탈 시 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges && storageKey) {
        tempStorage.save(storageKey, {
          answers,
          comment,
          productionQty,
          savedAt: new Date().toISOString()
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, storageKey, answers, comment, productionQty]);

  if (!instanceId || !template) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">잘못된 접근입니다.</p>
          <button
            onClick={() => navigate('/mobile/qr-scan')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            QR 스캔으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (itemId, value) => {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
    setHasUnsavedChanges(true);
  };

  // 수동 임시저장
  const handleManualSave = async () => {
    await saveToTemp();
  };

  const handleSubmit = async () => {
    // 필수 항목 검증
    const requiredItems = template.items.filter((item) => item.required);
    const missingItems = requiredItems.filter((item) => answers[item.id] === undefined);

    if (missingItems.length > 0) {
      setError(`필수 항목을 모두 입력해주세요. (${missingItems.length}개 누락)`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        answers: template.items.map((item) => ({
          itemId: item.id,
          fieldType: item.field_type,
          value: answers[item.id] ?? null
        })),
        comment: comment.trim() || null,
        productionQty: productionQty ? parseInt(productionQty) : null,
        currentShots: currentShots
      };

      await api.post(`/mobile/checklists/${instanceId}/submit`, payload);

      // 생산수량이 입력된 경우 숏수 업데이트
      if (productionQty && mold?.id) {
        try {
          await api.post(`/mold-specifications/${mold.id}/shots`, {
            quantity: parseInt(productionQty),
            source: template.type === 'daily' ? 'daily_check' : 'periodic_check'
          });
        } catch (shotErr) {
          console.error('Shot update error:', shotErr);
        }
      }

      // 임시저장 데이터 삭제
      if (storageKey) {
        await tempStorage.remove(storageKey);
      }

      // 완료 페이지로 이동
      navigate('/mobile/checklist-complete', {
        state: { mold, template },
        replace: true
      });

    } catch (err) {
      console.error('[ChecklistForm] submit error:', err);
      setError(
        err.response?.data?.message || 
        '저장 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 섹션별로 항목 그룹화
  const groupedItems = template.items.reduce((acc, item) => {
    const section = item.section || '기타';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24">
      <div className="max-w-md mx-auto">
        {/* 고정 헤더 */}
        <div className="sticky top-0 z-10 bg-white shadow-sm">
          <div className="p-4">
            <button
              onClick={() => navigate(-1)}
              className="mb-3 flex items-center text-slate-600 hover:text-slate-800"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">뒤로</span>
            </button>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">금형 코드</div>
                <div className="text-lg font-bold text-slate-800">{mold.code || mold.mold_code}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">점검 종류</div>
                <div className="text-sm font-semibold text-blue-600">{template.name}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 금형 기본정보 섹션 */}
        <div className="mx-4 mt-4">
          <button
            onClick={() => setShowMoldInfo(!showMoldInfo)}
            className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Box size={18} className="text-blue-600" />
              <span className="font-semibold text-slate-800">금형 기본정보</span>
            </div>
            {showMoldInfo ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>

          {showMoldInfo && (
            <div className="bg-white rounded-b-xl -mt-2 pt-4 pb-3 px-4 shadow-sm border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-xs text-slate-500">금형명</div>
                  <div className="font-medium text-slate-800 truncate">{mold.name || mold.mold_name || '-'}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-xs text-slate-500">차종</div>
                  <div className="font-medium text-slate-800 truncate">{mold.car_model || mold.car_model_name || '-'}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-xs text-slate-500">캐비티</div>
                  <div className="font-medium text-slate-800">{mold.cavity_count || mold.cavity || '-'}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-xs text-slate-500">톤수</div>
                  <div className="font-medium text-slate-800">{mold.tonnage || '-'}T</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-blue-600">현재 숏수</div>
                      <div className="font-bold text-blue-800 text-lg">{(currentShots || 0).toLocaleString()} shots</div>
                    </div>
                    <Gauge size={24} className="text-blue-400" />
                  </div>
                </div>
              </div>

              {/* 보증숏수 경고 */}
              {mold.warranty_shots && currentShots >= mold.warranty_shots * 0.9 && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <span className="text-xs text-amber-700">
                    보증숏수({mold.warranty_shots?.toLocaleString()})의 {Math.round((currentShots / mold.warranty_shots) * 100)}% 도달
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 생산수량 입력 섹션 */}
        <div className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Hash size={18} className="text-emerald-600" />
            <span className="font-semibold text-slate-800">생산수량 입력</span>
            <span className="text-xs text-slate-400">(선택)</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={productionQty}
              onChange={(e) => setProductionQty(e.target.value)}
              placeholder="생산수량 입력"
              className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-medium"
            />
            <span className="text-slate-500 font-medium">개</span>
          </div>
          {productionQty && (
            <div className="mt-2 text-xs text-emerald-600">
              → 점검 완료 시 숏수가 {parseInt(productionQty).toLocaleString()}만큼 증가합니다
            </div>
          )}
        </div>

        {/* 폼 내용 */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* 섹션별 항목 */}
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section} className="mb-6">
              <div className="flex items-center mb-3">
                <div className="w-1 h-5 bg-blue-500 rounded-full mr-2" />
                <h3 className="text-sm font-bold text-slate-700">{section}</h3>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                    {/* 항목 라벨 */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between mb-1">
                        <label className="text-sm font-medium text-slate-800">
                          {item.label}
                          {item.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <span className="text-xs text-slate-400">#{item.order_no}</span>
                      </div>
                      {item.ng_criteria && (
                        <p className="text-xs text-slate-500">{item.ng_criteria}</p>
                      )}
                    </div>

                    {/* Boolean 타입 */}
                    {item.field_type === 'boolean' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleChange(item.id, true)}
                          className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                            answers[item.id] === true
                              ? 'bg-emerald-500 text-white shadow-md scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          ✓ YES
                        </button>
                        <button
                          onClick={() => handleChange(item.id, false)}
                          className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                            answers[item.id] === false
                              ? 'bg-rose-500 text-white shadow-md scale-105'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          ✗ NO
                        </button>
                      </div>
                    )}

                    {/* Number 타입 */}
                    {item.field_type === 'number' && (
                      <input
                        type="number"
                        value={answers[item.id] ?? ''}
                        onChange={(e) => handleChange(item.id, e.target.valueAsNumber || 0)}
                        placeholder="숫자를 입력하세요"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}

                    {/* Text 타입 */}
                    {item.field_type === 'text' && (
                      <textarea
                        value={answers[item.id] ?? ''}
                        onChange={(e) => handleChange(item.id, e.target.value)}
                        placeholder="내용을 입력하세요"
                        rows={3}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 추가 코멘트 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              추가 의견 (선택사항)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="특이사항이나 추가 의견을 입력하세요"
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* 고정 하단 버튼 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full py-3.5 rounded-lg font-bold text-white transition-all ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-lg'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  저장 중...
                </span>
              ) : (
                '점검 결과 저장'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
