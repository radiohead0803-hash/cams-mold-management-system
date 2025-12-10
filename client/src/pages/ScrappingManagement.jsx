import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Trash2, Plus, ArrowLeft, Eye, CheckCircle, XCircle, 
  AlertTriangle, Clock, FileText, BarChart3
} from 'lucide-react';
import api from '../lib/api';

// 상태 배지 컴포넌트
const StatusBadge = ({ status }) => {
  const config = {
    requested: { label: '요청됨', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    first_approved: { label: '1차 승인', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    approved: { label: '승인완료', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: '반려됨', color: 'bg-red-100 text-red-700', icon: XCircle },
    scrapped: { label: '폐기완료', color: 'bg-gray-100 text-gray-700', icon: Trash2 }
  };
  const { label, color, icon: Icon } = config[status] || config.requested;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

// 폐기 요청 목록
function ScrappingList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadRequests();
    loadStatistics();
  }, [filter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/scrapping', { params });
      setRequests(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await api.get('/scrapping/statistics');
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">금형 폐기 관리</h1>
          <p className="text-sm text-gray-600 mt-1">금형 폐기 요청 및 승인 관리</p>
        </div>
        <button
          onClick={() => navigate('/scrapping/new')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus size={18} />
          폐기 요청
        </button>
      </div>

      {/* 통계 카드 */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {statistics.by_status?.map((stat) => (
            <div key={stat.status} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={stat.status} />
                <span className="text-2xl font-bold text-gray-900">{stat.count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        {[
          { value: 'all', label: '전체' },
          { value: 'requested', label: '요청됨' },
          { value: 'first_approved', label: '1차 승인' },
          { value: 'approved', label: '승인완료' },
          { value: 'scrapped', label: '폐기완료' },
          { value: 'rejected', label: '반려됨' }
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === value
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12">
          <Trash2 className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500">폐기 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">요청번호</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">금형코드</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">품번 / 품명</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">폐기사유</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">현재타수</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">상태</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">요청일</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {item.request_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.mold_code || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{item.part_number || '-'}</div>
                    <div className="text-xs text-gray-500">{item.part_name || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.reason || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.current_shots?.toLocaleString() || 0}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {item.requested_at ? new Date(item.requested_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => navigate(`/scrapping/${item.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 폐기 요청 상세
function ScrappingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== 'new') {
      loadRequest();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/scrapping/${id}`);
      setRequest(response.data.data);
    } catch (error) {
      console.error('Failed to load request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFirstApprove = async () => {
    if (!confirm('1차 승인하시겠습니까?')) return;
    try {
      await api.post(`/scrapping/${id}/first-approve`);
      await loadRequest();
      alert('1차 승인되었습니다.');
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('승인에 실패했습니다.');
    }
  };

  const handleSecondApprove = async () => {
    if (!confirm('2차 승인(최종)하시겠습니까?')) return;
    try {
      await api.post(`/scrapping/${id}/second-approve`);
      await loadRequest();
      alert('최종 승인되었습니다.');
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('승인에 실패했습니다.');
    }
  };

  const handleReject = async () => {
    const reason = prompt('반려 사유를 입력하세요:');
    if (!reason) return;
    try {
      await api.post(`/scrapping/${id}/reject`, { reason });
      await loadRequest();
      alert('반려되었습니다.');
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('반려에 실패했습니다.');
    }
  };

  const handleComplete = async () => {
    if (!confirm('폐기 처리를 완료하시겠습니까?')) return;
    try {
      await api.post(`/scrapping/${id}/complete`, {
        disposal_method: '전문업체 위탁',
        disposal_company: '폐기물 처리업체'
      });
      await loadRequest();
      alert('폐기 처리가 완료되었습니다.');
    } catch (error) {
      console.error('Failed to complete:', error);
      alert('처리에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">로딩 중...</div>;
  }

  if (id === 'new') {
    return <ScrappingForm />;
  }

  if (!request) {
    return <div className="p-6 text-center text-gray-500">요청을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/scrapping')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{request.request_number}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {request.mold_code} - {request.part_name}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* 상세 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">금형 정보</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">금형코드</span>
              <span className="font-medium">{request.mold_code || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">품번</span>
              <span className="font-medium">{request.part_number || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">품명</span>
              <span className="font-medium">{request.part_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">차종</span>
              <span className="font-medium">{request.car_model || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">현재 타수</span>
              <span className="font-medium">{request.current_shots?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">목표 타수</span>
              <span className="font-medium">{request.target_shots?.toLocaleString() || '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">폐기 정보</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">폐기 사유</span>
              <span className="font-medium">{request.reason || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">상세 사유</span>
              <span className="font-medium">{request.reason_detail || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">상태 평가</span>
              <span className="font-medium">{request.condition_assessment || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">수리 이력</span>
              <span className="font-medium">{request.repair_history_summary || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">예상 잔존가치</span>
              <span className="font-medium">
                {request.estimated_scrap_value ? `${request.estimated_scrap_value.toLocaleString()}원` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 승인 이력 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">승인 이력</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              request.first_approved_at ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <CheckCircle size={20} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">1차 승인 (금형개발 담당)</div>
              <div className="text-sm text-gray-500">
                {request.first_approved_at 
                  ? `${request.first_approved_by_name} - ${new Date(request.first_approved_at).toLocaleString('ko-KR')}`
                  : '대기중'
                }
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              request.second_approved_at ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <CheckCircle size={20} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">2차 승인 (시스템 관리자)</div>
              <div className="text-sm text-gray-500">
                {request.second_approved_at 
                  ? `${request.second_approved_by_name} - ${new Date(request.second_approved_at).toLocaleString('ko-KR')}`
                  : '대기중'
                }
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              request.scrapped_at ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              <Trash2 size={20} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">폐기 처리 완료</div>
              <div className="text-sm text-gray-500">
                {request.scrapped_at 
                  ? `${request.scrapped_by_name} - ${new Date(request.scrapped_at).toLocaleString('ko-KR')}`
                  : '대기중'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-3">
        {request.status === 'requested' && (
          <>
            <button
              onClick={handleReject}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <XCircle size={18} />
              반려
            </button>
            <button
              onClick={handleFirstApprove}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckCircle size={18} />
              1차 승인
            </button>
          </>
        )}
        {request.status === 'first_approved' && (
          <>
            <button
              onClick={handleReject}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              <XCircle size={18} />
              반려
            </button>
            <button
              onClick={handleSecondApprove}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle size={18} />
              2차 승인 (최종)
            </button>
          </>
        )}
        {request.status === 'approved' && (
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Trash2 size={18} />
            폐기 처리 완료
          </button>
        )}
      </div>
    </div>
  );
}

// 폐기 요청 폼
function ScrappingForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    mold_id: '',
    reason: '',
    reason_detail: '',
    condition_assessment: '',
    estimated_scrap_value: ''
  });
  const [molds, setMolds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMolds();
  }, []);

  const loadMolds = async () => {
    try {
      const response = await api.get('/molds', { params: { limit: 100 } });
      setMolds(response.data.data.items || response.data.data || []);
    } catch (error) {
      console.error('Failed to load molds:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mold_id || !formData.reason) {
      alert('금형과 폐기 사유를 선택해주세요.');
      return;
    }
    
    try {
      setSubmitting(true);
      await api.post('/scrapping', formData);
      alert('폐기 요청이 등록되었습니다.');
      navigate('/scrapping');
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/scrapping')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">폐기 요청 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">금형 선택 *</label>
            <select
              value={formData.mold_id}
              onChange={(e) => setFormData({ ...formData, mold_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            >
              <option value="">금형을 선택하세요</option>
              {molds.map((mold) => (
                <option key={mold.id} value={mold.id}>
                  {mold.mold_code} - {mold.part_name || mold.mold_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">폐기 사유 *</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            >
              <option value="">사유를 선택하세요</option>
              <option value="수명종료">수명 종료</option>
              <option value="수리불가">수리 불가</option>
              <option value="모델단종">모델 단종</option>
              <option value="품질불량">품질 불량</option>
              <option value="경제성부족">경제성 부족</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상세 사유</label>
            <textarea
              value={formData.reason_detail}
              onChange={(e) => setFormData({ ...formData, reason_detail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
              placeholder="상세 사유를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태 평가</label>
            <select
              value={formData.condition_assessment}
              onChange={(e) => setFormData({ ...formData, condition_assessment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">상태를 선택하세요</option>
              <option value="심각">심각 - 즉시 폐기 필요</option>
              <option value="불량">불량 - 수리 비용 과다</option>
              <option value="보통">보통 - 경제성 검토 필요</option>
              <option value="양호">양호 - 모델 단종으로 인한 폐기</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">예상 잔존가치 (원)</label>
            <input
              type="number"
              value={formData.estimated_scrap_value}
              onChange={(e) => setFormData({ ...formData, estimated_scrap_value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="0"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/scrapping')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 size={18} />
              {submitting ? '등록 중...' : '폐기 요청'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// 메인 컴포넌트
export default function ScrappingManagement() {
  const { id } = useParams();
  
  if (id) {
    return <ScrappingDetail />;
  }
  
  return <ScrappingList />;
}
