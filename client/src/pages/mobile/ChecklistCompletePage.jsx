import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function ChecklistCompletePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { mold, template } = state || {};

  useEffect(() => {
    // 3초 후 자동으로 QR 스캔 페이지로 이동
    const timer = setTimeout(() => {
      navigate('/mobile/qr-scan', { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 성공 아이콘 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-full mb-4 animate-bounce">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">점검 완료!</h1>
          <p className="text-slate-600">점검 결과가 성공적으로 저장되었습니다.</p>
        </div>

        {/* 점검 정보 카드 */}
        {mold && template && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">금형 코드</span>
                <span className="text-sm font-semibold text-slate-800">{mold.code}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">금형명</span>
                <span className="text-sm font-semibold text-slate-800">{mold.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">점검 종류</span>
                <span className="text-sm font-semibold text-blue-600">{template.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">완료 시간</span>
                <span className="text-sm font-semibold text-slate-800">
                  {new Date().toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-700">
              <p>3초 후 자동으로 QR 스캔 화면으로 이동합니다.</p>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="space-y-2">
          <button
            onClick={() => navigate('/mobile/qr-scan', { replace: true })}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
          >
            다른 금형 점검하기
          </button>
          <button
            onClick={() => navigate('/dashboard', { replace: true })}
            className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 transition-colors"
          >
            대시보드로 이동
          </button>
        </div>
      </div>
    </div>
  );
}
