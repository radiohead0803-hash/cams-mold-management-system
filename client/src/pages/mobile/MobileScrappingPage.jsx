import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Trash2, ArrowLeft, Plus, AlertTriangle, CheckCircle, 
  Clock, ChevronRight, X, Camera, FileText
} from 'lucide-react';
import api from '../../lib/api';

// 상태 배지
const StatusBadge = ({ status }) => {
  const config = {
    requested: { label: '요청됨', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    first_approved: { label: '1차승인', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    approved: { label: '승인완료', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: '반려', color: 'bg-red-100 text-red-700', icon: X },
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

// 폐기 사유 옵션
const SCRAPPING_REASONS = [
  { value: 'end_of_life', label: '수명 종료' },
  { value: 'model_discontinue', label: '차종 단종' },
  { value: 'damage', label: '손상/파손' },
  { value: 'obsolete', label: '기술 노후화' },
  { value: 'cost_ineffective', label: '수리 비용 과다' },
  { value: 'other', label: '기타' }
];

// 목록 페이지
function ScrappingList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/scrapping', { params: { limit: 20 } });
      setRequests(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">금형 폐기 관리</h1>
          <p className="text-xs text-gray-500">폐기 요청 및 승인 현황</p>
        </div>
        <button
          onClick={() => navigate('/mobile/scrapping/new')}
          className="p-2 bg-red-600 text-white rounded-lg"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* 목록 */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-500">폐기 요청이 없습니다.</p>
            <button
              onClick={() => navigate('/mobile/scrapping/new')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              폐기 요청
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <button
                key={request.id}
                onClick={() => navigate(`/mobile/scrapping/${request.id}`)}
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{request.mold_code}</div>
                    <div className="text-sm text-gray-600">{request.part_name || '-'}</div>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{SCRAPPING_REASONS.find(r => r.value === request.scrapping_reason)?.label || request.scrapping_reason}</span>
                  <span>{request.requested_at ? new Date(request.requested_at).toLocaleDateString('ko-KR') : '-'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 상세 페이지
function ScrappingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequest();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">요청을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-gray-900">{request.mold_code}</h1>
              <StatusBadge status={request.status} />
            </div>
            <p className="text-xs text-gray-500">{request.part_name || '-'}</p>
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="p-4 space-y-4">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">폐기 정보</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">폐기 사유</span>
              <span className="text-sm font-medium text-gray-900">
                {SCRAPPING_REASONS.find(r => r.value === request.scrapping_reason)?.label || request.scrapping_reason}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">요청일</span>
              <span className="text-sm font-medium text-gray-900">
                {request.requested_at ? new Date(request.requested_at).toLocaleDateString('ko-KR') : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">요청자</span>
              <span className="text-sm font-medium text-gray-900">{request.requester_name || '-'}</span>
            </div>
            {request.estimated_disposal_cost > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">예상 폐기 비용</span>
                <span className="text-sm font-medium text-red-600">
                  {request.estimated_disposal_cost.toLocaleString()}원
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 상세 사유 */}
        {request.detailed_reason && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">상세 사유</h3>
            <p className="text-sm text-gray-700">{request.detailed_reason}</p>
          </div>
        )}

        {/* 승인 이력 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">승인 이력</h3>
          <div className="space-y-3">
            {request.first_approved_at && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">1차 승인</div>
                  <div className="text-xs text-gray-500">
                    {new Date(request.first_approved_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            )}
            {request.final_approved_at && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">최종 승인</div>
                  <div className="text-xs text-gray-500">
                    {new Date(request.final_approved_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            )}
            {request.scrapped_at && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={16} className="text-gray-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">폐기 완료</div>
                  <div className="text-xs text-gray-500">
                    {new Date(request.scrapped_at).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 신규 요청 폼
function ScrappingForm() {
  const navigate = useNavigate();
  const [molds, setMolds] = useState([]);
  const [formData, setFormData] = useState({
    mold_id: '',
    scrapping_reason: '',
    detailed_reason: '',
    estimated_disposal_cost: ''
  });
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

  const handleSubmit = async () => {
    if (!formData.mold_id || !formData.scrapping_reason) {
      alert('금형과 폐기 사유를 선택해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/scrapping', {
        ...formData,
        estimated_disposal_cost: formData.estimated_disposal_cost ? parseInt(formData.estimated_disposal_cost) : null
      });
      alert('폐기 요청이 등록되었습니다.');
      navigate('/mobile/scrapping');
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-900">폐기 요청</h1>
          <p className="text-xs text-gray-500">금형 폐기 요청 등록</p>
        </div>
      </div>

      {/* 폼 */}
      <div className="p-4 space-y-4">
        {/* 금형 선택 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">금형 선택 *</label>
          <select
            value={formData.mold_id}
            onChange={(e) => setFormData({ ...formData, mold_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">금형을 선택하세요</option>
            {molds.map((mold) => (
              <option key={mold.id} value={mold.id}>
                {mold.mold_code} - {mold.part_name || mold.mold_name || '-'}
              </option>
            ))}
          </select>
        </div>

        {/* 폐기 사유 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">폐기 사유 *</label>
          <div className="grid grid-cols-2 gap-2">
            {SCRAPPING_REASONS.map((reason) => (
              <button
                key={reason.value}
                onClick={() => setFormData({ ...formData, scrapping_reason: reason.value })}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  formData.scrapping_reason === reason.value
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {reason.label}
              </button>
            ))}
          </div>
        </div>

        {/* 상세 사유 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">상세 사유</label>
          <textarea
            value={formData.detailed_reason}
            onChange={(e) => setFormData({ ...formData, detailed_reason: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={4}
            placeholder="폐기 사유를 상세히 입력하세요"
          />
        </div>

        {/* 예상 비용 */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">예상 폐기 비용 (원)</label>
          <input
            type="number"
            value={formData.estimated_disposal_cost}
            onChange={(e) => setFormData({ ...formData, estimated_disposal_cost: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="0"
          />
        </div>

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Trash2 size={18} />
          {submitting ? '등록 중...' : '폐기 요청 등록'}
        </button>
      </div>
    </div>
  );
}

// 메인 컴포넌트
export default function MobileScrappingPage() {
  const { id } = useParams();
  const location = window.location.pathname;
  
  if (location.includes('/new')) {
    return <ScrappingForm />;
  }
  
  if (id) {
    return <ScrappingDetail />;
  }
  
  return <ScrappingList />;
}
