import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../../lib/api';

export default function ChecklistFormPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { instanceId, mold, template } = state || {};

  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        comment: comment.trim() || null
      };

      await api.post(`/mobile/checklists/${instanceId}/submit`, payload);

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
                <div className="text-lg font-bold text-slate-800">{mold.code}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">점검 종류</div>
                <div className="text-sm font-semibold text-blue-600">{template.name}</div>
              </div>
            </div>
          </div>
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
