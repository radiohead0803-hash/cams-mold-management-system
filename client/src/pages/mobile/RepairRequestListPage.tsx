import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, Wrench, AlertCircle, Clock, CheckCircle, Plus, X, Send, Camera } from 'lucide-react';
import api from '../../lib/api';

interface RepairRequest {
  id: number;
  title: string;
  description: string;
  status: 'requested' | 'accepted' | 'in_progress' | 'done' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  mold_code?: string;
  mold_name?: string;
}

interface Props {
  showStatusOnly?: boolean;
}

export default function RepairRequestListPage({ showStatusOnly = false }: Props) {
  const { moldId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  
  const [data, setData] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // 새 수리요청 폼
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    issue_type: '',
    developer_id: null as number | null,
    developer_name: ''
  });

  // 개발담당자 검색
  const [developerSearch, setDeveloperSearch] = useState('');
  const [developers, setDevelopers] = useState<any[]>([]);
  const [showDeveloperDropdown, setShowDeveloperDropdown] = useState(false);

  const searchDevelopers = async (name: string) => {
    if (!name || name.length < 1) {
      setDevelopers([]);
      return;
    }
    try {
      const res = await api.get('/workflow/developers/search', { params: { name, limit: 5 } });
      setDevelopers(res.data.data || []);
    } catch (err) {
      console.error('Developer search error:', err);
    }
  };

  const selectDeveloper = (dev: any) => {
    setNewRequest({
      ...newRequest,
      developer_id: dev.id,
      developer_name: dev.name
    });
    setDeveloperSearch(dev.name);
    setShowDeveloperDropdown(false);
  };

  useEffect(() => {
    fetchList();
  }, [moldId]);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('[RepairRequestList] Fetching for mold:', moldId);

      // API 경로 수정 (baseURL에 /api/v1 포함)
      const res = await api.get('/repair-requests', {
        params: { mold_id: moldId },
      });

      console.log('[RepairRequestList] Data:', res.data);
      setData(res.data.data || []);
    } catch (err: any) {
      console.error('[RepairRequestList] Fetch error:', err);
      // 401 에러는 무시 (인터셉터에서 처리)
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    setCreating(true);
    try {
      // 워크플로우 API 사용 (개발담당자 지정 포함)
      const res = await api.post('/workflow/repair-requests', {
        mold_id: moldId,
        mold_spec_id: moldId,
        title: newRequest.title,
        description: newRequest.description,
        priority: newRequest.priority,
        issue_type: newRequest.issue_type || '기타',
        developer_id: newRequest.developer_id,
        developer_name: newRequest.developer_name
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setNewRequest({ title: '', description: '', priority: 'medium', issue_type: '', developer_id: null, developer_name: '' });
        setDeveloperSearch('');
        fetchList();
        alert('수리요청이 등록되었습니다.');
      }
    } catch (err: any) {
      console.error('[RepairRequest] Create error:', err);
      alert(err.response?.data?.message || '수리요청 등록에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px]">
            <Clock size={10} />
            요청
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px]">
            <AlertCircle size={10} />
            접수
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[10px]">
            <Wrench size={10} />
            진행중
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px]">
            <CheckCircle size={10} />
            완료
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full text-[10px]">
            반려
          </span>
        );
      default:
        return <span className="text-[10px] text-slate-500">{status}</span>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-rose-600';
      case 'medium':
        return 'text-amber-600';
      case 'low':
        return 'text-slate-600';
      default:
        return 'text-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-xs text-slate-500">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="text-[10px] text-slate-500">
                {showStatusOnly ? '금형수리 진행현황' : '수리요청 목록'}
              </div>
              <div className="text-sm font-semibold text-slate-900">
                금형 M-{moldId}
              </div>
            </div>
          </div>
          <Wrench size={18} className="text-slate-600" />
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* 에러 메시지 */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-rose-700">{error}</div>
          </div>
        )}

        {/* 목록 */}
        {data.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <Wrench size={32} className="mx-auto text-slate-300 mb-2" />
            <div className="text-xs text-slate-500">
              이 금형의 수리요청이 없습니다.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((request) => (
              <button
                key={request.id}
                onClick={() =>
                  navigate(
                    `/mobile/molds/${moldId}/repair/requests/${request.id}`,
                    { state }
                  )
                }
                className="w-full text-left bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-900 mb-1">
                      {request.title}
                    </div>
                    {request.description && (
                      <div className="text-[10px] text-slate-600 line-clamp-2 mb-2">
                        {request.description}
                      </div>
                    )}
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    <span className={getPriorityColor(request.priority)}>
                      {request.priority === 'high' && '🔴 긴급'}
                      {request.priority === 'medium' && '🟡 보통'}
                      {request.priority === 'low' && '🟢 낮음'}
                    </span>
                  </div>
                  <div className="text-slate-400">→</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 안내 메시지 */}
        {!showStatusOnly && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="text-[10px] text-blue-900 font-semibold mb-1">
              💡 수리요청 안내
            </div>
            <div className="text-[10px] text-blue-700 space-y-0.5">
              <div>• 점검 중 NG 항목이 발견되면 자동으로 수리요청이 생성됩니다.</div>
              <div>• 수리요청을 클릭하여 상세 내용을 확인할 수 있습니다.</div>
            </div>
          </div>
        )}
      </main>

      {/* 수리요청 추가 버튼 */}
      {!showStatusOnly && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-600 transition-colors z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {/* 수리요청 생성 모달 */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">수리요청 등록</h3>
              <button onClick={() => setShowCreateModal(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 불량 유형 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">불량 유형</label>
                <select
                  value={newRequest.issue_type}
                  onChange={(e) => setNewRequest({ ...newRequest, issue_type: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">선택하세요</option>
                  <option value="파손">파손</option>
                  <option value="마모">마모</option>
                  <option value="변형">변형</option>
                  <option value="누수">누수</option>
                  <option value="작동불량">작동불량</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">제목 *</label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="수리요청 제목을 입력하세요"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* 상세 내용 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">상세 내용</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="불량 상태를 상세히 설명해주세요"
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>

              {/* 긴급도 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">긴급도</label>
                <div className="flex gap-2">
                  {[
                    { value: 'low', label: '낮음', color: 'bg-green-100 text-green-700 border-green-300' },
                    { value: 'medium', label: '보통', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
                    { value: 'high', label: '긴급', color: 'bg-red-100 text-red-700 border-red-300' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setNewRequest({ ...newRequest, priority: opt.value as any })}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                        newRequest.priority === opt.value
                          ? opt.color + ' ring-2 ring-offset-1'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 개발담당자 검색 */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  개발담당자 (승인자) *
                </label>
                <input
                  type="text"
                  value={developerSearch}
                  onChange={(e) => {
                    setDeveloperSearch(e.target.value);
                    searchDevelopers(e.target.value);
                    setShowDeveloperDropdown(true);
                  }}
                  onFocus={() => setShowDeveloperDropdown(true)}
                  placeholder="담당자 이름을 검색하세요"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                {showDeveloperDropdown && developers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {developers.map((dev) => (
                      <button
                        key={dev.id}
                        onClick={() => selectDeveloper(dev)}
                        className="w-full p-3 text-left text-sm hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{dev.name}</div>
                        <div className="text-xs text-gray-500">{dev.company_name || '본사'}</div>
                      </button>
                    ))}
                  </div>
                )}
                {newRequest.developer_id && (
                  <div className="mt-1 text-xs text-green-600">
                    ✓ {newRequest.developer_name} 선택됨
                  </div>
                )}
              </div>

              {/* 제출 버튼 */}
              <button
                onClick={handleCreateRequest}
                disabled={creating || !newRequest.title.trim() || !newRequest.developer_id}
                className="w-full py-3 bg-orange-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
              >
                {creating ? (
                  <span>등록 중...</span>
                ) : (
                  <>
                    <Send size={18} />
                    수리요청 등록
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
