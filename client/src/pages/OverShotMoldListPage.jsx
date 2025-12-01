import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import api from '../lib/api';

export default function OverShotMoldListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/hq/molds/over-shot');
      
      if (response.data.success) {
        setItems(response.data.data.items || []);
      } else {
        throw new Error(response.data.error?.message || '데이터 조회 실패');
      }
    } catch (err) {
      console.error('over-shot molds load error', err);
      setError(err.response?.data?.error?.message || '타수 초과 금형 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-lg hover:bg-slate-100 transition"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">타수 초과 금형</h1>
                <p className="text-sm text-slate-500">over_shot 알람이 발생한 금형 목록</p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              새로고침
            </button>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="p-6">
        {/* 로딩 상태 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500">로딩 중...</p>
            </div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">오류 발생</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* 데이터 없음 */}
        {!loading && !error && items.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">타수 초과 금형이 없습니다.</p>
            <p className="text-sm text-slate-400 mt-2">모든 금형이 정상 범위 내에 있습니다.</p>
          </div>
        )}

        {/* 금형 목록 */}
        {!loading && !error && items.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    금형코드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    금형명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    현재 타수 / 목표 타수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    알람 발생일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {items.map((item) => (
                  <tr
                    key={item.alert_id}
                    className="hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => navigate(`/molds/${item.mold_id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {item.mold_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{item.mold_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        <span className="font-semibold text-red-600">
                          {item.current_shots?.toLocaleString() || '-'}
                        </span>
                        {' / '}
                        <span className="text-slate-500">
                          {item.target_shots?.toLocaleString() || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString('ko-KR')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
