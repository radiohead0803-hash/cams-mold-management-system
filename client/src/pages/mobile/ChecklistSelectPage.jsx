import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../../lib/api';

export default function ChecklistSelectPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { mold, templates } = state || {};

  if (!mold || !templates) {
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

  const handleStartChecklist = async (templateId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post(
        `/mobile/molds/${mold.id}/checklists/start`,
        {
          templateId,
          siteType: 'production' // TODO: 사용자 선택 또는 자동 판단
        }
      );

      const { instanceId, template } = response.data.data;

      // 체크리스트 폼 페이지로 이동
      navigate('/mobile/checklist-form', {
        state: { instanceId, mold, template }
      });

    } catch (err) {
      console.error('[ChecklistSelect] error:', err);
      setError(
        err.response?.data?.message || 
        '점검 폼을 생성하지 못했습니다. 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-slate-600 hover:text-slate-800"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">뒤로</span>
        </button>

        {/* 금형 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-slate-500 mb-1">금형 코드</div>
              <div className="text-xl font-bold text-slate-800">{mold.code}</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              mold.status === 'normal' ? 'bg-green-100 text-green-700' :
              mold.status === 'ng' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {mold.status?.toUpperCase() || 'UNKNOWN'}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center text-slate-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>{mold.name || '금형명 없음'}</span>
            </div>
            {mold.plant && (
              <div className="flex items-center text-slate-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{mold.plant.name}</span>
              </div>
            )}
            <div className="flex items-center text-slate-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>현재 샷수: {mold.currentShot?.toLocaleString() || 0}</span>
            </div>
          </div>
        </div>

        {/* 점검 종류 선택 */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-800 mb-3">점검 종류 선택</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleStartChecklist(template.id)}
                disabled={loading}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  loading
                    ? 'bg-slate-50 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md active:scale-98'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        template.category === 'daily' ? 'bg-blue-500' : 'bg-purple-500'
                      }`} />
                      <span className="text-sm font-bold text-slate-800">{template.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      {template.description || 
                        (template.category === 'daily' ? '매일 실시하는 기본 점검' : '정기적으로 실시하는 상세 점검')
                      }
                    </p>
                    {template.shot_interval && (
                      <div className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-semibold">
                        {template.shot_interval.toLocaleString()} Shot 주기
                      </div>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-slate-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
