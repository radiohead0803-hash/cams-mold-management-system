import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

/**
 * 수리요청 폼 페이지
 * QR 스캔 후 금형에 대한 수리요청 등록
 */
export default function RepairRequestPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [defectType, setDefectType] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!state || !state.moldId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-slate-400 mb-4">금형 정보가 없습니다.</p>
          <button
            onClick={() => navigate('/qr-login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            QR 스캔하기
          </button>
        </div>
      </div>
    );
  }

  const { sessionToken, moldId, moldCode, moldName } = state;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!defectType.trim() || !description.trim()) {
      setError('불량 유형과 상세 내용을 입력해주세요.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await api.post(`/qr/molds/${moldId}/repairs`, {
        sessionToken,
        defectType: defectType.trim(),
        description: description.trim(),
        urgency
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      }
    } catch (err) {
      console.error('Repair request error:', err);
      setError(
        err.response?.data?.error?.message || 
        '수리요청 등록 중 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 성공 화면
  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">수리요청 완료</h2>
          <p className="text-slate-400 mb-6">
            수리요청이 정상적으로 등록되었습니다.
          </p>
          <p className="text-sm text-slate-500">
            잠시 후 메인 화면으로 이동합니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
            disabled={loading}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">수리요청</h1>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 금형 정보 */}
          <section className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
            <p className="text-sm text-slate-400 mb-1">대상 금형</p>
            <p className="text-lg font-semibold text-white">{moldCode}</p>
            {moldName && (
              <p className="text-sm text-slate-400 mt-1">{moldName}</p>
            )}
          </section>

          {/* 불량 유형 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              불량 유형 <span className="text-rose-400">*</span>
            </label>
            <select
              value={defectType}
              onChange={(e) => setDefectType(e.target.value)}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 text-slate-100 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              disabled={loading}
              required
            >
              <option value="">선택해주세요</option>
              <option value="SHORT_SHOT">쇼트샷 (Short Shot)</option>
              <option value="FLASH">플래시 (Flash)</option>
              <option value="BURN">번 (Burn)</option>
              <option value="CRACK">크랙 (Crack)</option>
              <option value="DEFORMATION">변형 (Deformation)</option>
              <option value="WEAR">마모 (Wear)</option>
              <option value="CONTAMINATION">오염 (Contamination)</option>
              <option value="MALFUNCTION">작동불량 (Malfunction)</option>
              <option value="OTHER">기타</option>
            </select>
          </div>

          {/* 상세 내용 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              상세 내용 <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="불량 현상, 발생 위치, 재현 조건 등을 상세히 입력해주세요."
              className="w-full rounded-xl bg-slate-900 border border-slate-700 text-slate-100 px-4 py-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              disabled={loading}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {description.length} / 500자
            </p>
          </div>

          {/* 긴급도 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              긴급도
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUrgency('low')}
                className={`p-3 rounded-xl border-2 transition ${
                  urgency === 'low'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
                }`}
                disabled={loading}
              >
                <p className="font-medium">낮음</p>
                <p className="text-xs mt-1">일반 수리</p>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('medium')}
                className={`p-3 rounded-xl border-2 transition ${
                  urgency === 'medium'
                    ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
                }`}
                disabled={loading}
              >
                <p className="font-medium">보통</p>
                <p className="text-xs mt-1">빠른 처리 필요</p>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('high')}
                className={`p-3 rounded-xl border-2 transition ${
                  urgency === 'high'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
                }`}
                disabled={loading}
              >
                <p className="font-medium">높음</p>
                <p className="text-xs mt-1">우선 처리</p>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('urgent')}
                className={`p-3 rounded-xl border-2 transition ${
                  urgency === 'urgent'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'
                }`}
                disabled={loading}
              >
                <p className="font-medium">긴급</p>
                <p className="text-xs mt-1">즉시 처리</p>
              </button>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading || !defectType || !description}
            className="w-full py-4 bg-rose-500 hover:bg-rose-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-2xl transition"
          >
            {loading ? '등록 중...' : '수리요청 등록'}
          </button>
        </form>
      </main>
    </div>
  );
}
