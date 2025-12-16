/**
 * 점검 폼 컴포넌트
 * - 카테고리 접기/펼치기
 * - 진행률 표시
 * - 임시저장
 * - 필수항목 강조
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp, Check, AlertCircle, Save, Camera } from 'lucide-react';
import { ProgressBar, usePreventLeave } from './MobileLayout';
import { inspectionDraft } from '../../utils/mobileStorage';

// 점검 항목 그룹 (접기/펼치기)
export function InspectionGroup({ 
  title, 
  items, 
  answers, 
  onAnswerChange,
  defaultExpanded = true 
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const groupRef = useRef(null);

  // 그룹 내 완료 항목 수
  const completedCount = items.filter(item => answers[item.id] !== undefined).length;
  const totalCount = items.length;
  const isComplete = completedCount === totalCount;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 그룹 헤더 */}
      <button
        ref={groupRef}
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50"
      >
        <div className="flex items-center gap-3">
          {isComplete ? (
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          ) : (
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
              {completedCount}
            </div>
          )}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{completedCount}/{totalCount}</span>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* 그룹 내용 */}
      {expanded && (
        <div className="divide-y divide-gray-100">
          {items.map(item => (
            <InspectionItem
              key={item.id}
              item={item}
              value={answers[item.id]}
              onChange={(value) => onAnswerChange(item.id, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 개별 점검 항목
export function InspectionItem({ item, value, onChange }) {
  const [comment, setComment] = useState(value?.comment || '');
  const itemRef = useRef(null);

  const handleResultChange = (result) => {
    onChange({ result, comment });
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
    onChange({ result: value?.result, comment: e.target.value });
  };

  const isAnswered = value?.result !== undefined;
  const isNG = value?.result === 'ng' || value?.result === false;

  return (
    <div 
      ref={itemRef}
      className={`p-4 ${item.is_required && !isAnswered ? 'bg-red-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* 항목명 */}
        <div className="flex-1">
          <p className={`text-sm ${item.is_required ? 'font-medium' : ''}`}>
            {item.item_name}
            {item.is_required && <span className="text-red-500 ml-1">*</span>}
          </p>
          {item.description && (
            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
          )}
        </div>

        {/* 결과 버튼 */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleResultChange('ok')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              value?.result === 'ok' || value?.result === true
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            양호
          </button>
          <button
            type="button"
            onClick={() => handleResultChange('ng')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              isNG
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            불량
          </button>
        </div>
      </div>

      {/* NG 시 코멘트 입력 */}
      {isNG && (
        <div className="mt-3">
          <textarea
            value={comment}
            onChange={handleCommentChange}
            placeholder="불량 내용을 입력하세요"
            className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm resize-none"
            rows={2}
          />
        </div>
      )}
    </div>
  );
}

// 전체 점검 폼
export default function InspectionForm({
  moldId,
  inspectionType, // 'daily' | 'periodic'
  categories,
  onSubmit,
  onCancel
}) {
  const [answers, setAnswers] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const formRef = useRef(null);

  // 이탈 방지
  usePreventLeave(isDirty);

  // 전체 항목 수 계산
  const allItems = categories.flatMap(cat => cat.items);
  const totalItems = allItems.length;
  const answeredItems = Object.keys(answers).filter(id => answers[id]?.result !== undefined).length;
  const requiredItems = allItems.filter(item => item.is_required);
  const answeredRequired = requiredItems.filter(item => answers[item.id]?.result !== undefined).length;

  // 임시저장 불러오기
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await inspectionDraft.load(moldId, inspectionType);
        if (draft) {
          setAnswers(draft.answers || {});
          setLastSaved(draft.savedAt);
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    };
    loadDraft();
  }, [moldId, inspectionType]);

  // 자동 임시저장 (30초마다)
  useEffect(() => {
    if (!isDirty) return;

    const autoSave = async () => {
      try {
        await inspectionDraft.save(moldId, inspectionType, {
          answers,
          savedAt: new Date().toISOString()
        });
        setLastSaved(new Date().toISOString());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [isDirty, answers, moldId, inspectionType]);

  // 답변 변경
  const handleAnswerChange = useCallback((itemId, value) => {
    setAnswers(prev => ({ ...prev, [itemId]: value }));
    setIsDirty(true);
  }, []);

  // 수동 임시저장
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await inspectionDraft.save(moldId, inspectionType, {
        answers,
        savedAt: new Date().toISOString()
      });
      setLastSaved(new Date().toISOString());
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 제출
  const handleSubmit = async () => {
    // 필수 항목 체크
    const missingRequired = requiredItems.filter(item => !answers[item.id]?.result);
    
    if (missingRequired.length > 0) {
      alert(`필수 항목 ${missingRequired.length}개가 누락되었습니다.`);
      
      // 첫 번째 누락 항목으로 스크롤
      const firstMissing = document.querySelector(`[data-item-id="${missingRequired[0].id}"]`);
      firstMissing?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    try {
      await onSubmit(answers);
      
      // 임시저장 삭제
      await inspectionDraft.delete(moldId, inspectionType);
      setIsDirty(false);
    } catch (error) {
      console.error('Submit failed:', error);
      alert('제출에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div ref={formRef} className="min-h-screen bg-gray-50 pb-32">
      {/* 진행률 바 */}
      <ProgressBar
        current={answeredItems}
        total={totalItems}
        label={`점검 진행률 (필수: ${answeredRequired}/${requiredItems.length})`}
      />

      {/* 임시저장 상태 */}
      {lastSaved && (
        <div className="px-4 py-2 bg-blue-50 text-blue-700 text-xs flex items-center gap-2">
          <Save className="w-3 h-3" />
          <span>마지막 저장: {new Date(lastSaved).toLocaleTimeString('ko-KR')}</span>
        </div>
      )}

      {/* 카테고리별 점검 항목 */}
      <div className="p-4 space-y-4">
        {categories.map((category, index) => (
          <InspectionGroup
            key={category.id || index}
            title={category.name}
            items={category.items}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            defaultExpanded={index === 0}
          />
        ))}
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '임시저장'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={answeredRequired < requiredItems.length}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:bg-gray-300"
          >
            제출하기
          </button>
        </div>
        
        {answeredRequired < requiredItems.length && (
          <p className="text-center text-xs text-red-500 mt-2">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            필수 항목 {requiredItems.length - answeredRequired}개를 더 입력해주세요
          </p>
        )}
      </div>
    </div>
  );
}
