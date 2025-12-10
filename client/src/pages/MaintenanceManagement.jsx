import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Wrench, Plus, ArrowLeft, Eye, Calendar, BarChart3,
  Clock, CheckCircle, Settings, Droplets, Cog
} from 'lucide-react';
import api from '../lib/api';

// 유지보전 유형 아이콘
const TYPE_ICONS = {
  periodic: Calendar,
  cleaning: Droplets,
  lubrication: Droplets,
  fitting: Settings,
  repair: Wrench,
  replacement: Cog,
  calibration: Settings,
  preventive: CheckCircle,
  other: Wrench
};

// 유지보전 유형 라벨
const TYPE_LABELS = {
  periodic: '정기점검',
  cleaning: '세척',
  lubrication: '윤활',
  fitting: '습합',
  repair: '수리',
  replacement: '부품교체',
  calibration: '교정',
  preventive: '예방정비',
  other: '기타',
  '정기점검': '정기점검',
  '세척': '세척',
  '윤활': '윤활',
  '습합': '습합',
  '수리': '수리',
  '부품교체': '부품교체',
  '교정': '교정',
  '예방정비': '예방정비',
  '기타': '기타'
};

// 유지보전 목록
function MaintenanceList() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadRecords();
    loadStatistics();
  }, [filter]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { maintenance_type: filter } : {};
      const response = await api.get('/maintenance', { params });
      setRecords(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await api.get('/maintenance/statistics');
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
          <h1 className="text-2xl font-bold text-gray-900">유지보전 관리</h1>
          <p className="text-sm text-gray-600 mt-1">금형 유지보전 기록 및 이력 관리</p>
        </div>
        <button
          onClick={() => navigate('/maintenance/new')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus size={18} />
          유지보전 기록
        </button>
      </div>

      {/* 통계 카드 */}
      {statistics && statistics.by_type && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {statistics.by_type.slice(0, 5).map((stat) => {
            const Icon = TYPE_ICONS[stat.maintenance_type] || Wrench;
            return (
              <div key={stat.maintenance_type} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Icon size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">
                      {TYPE_LABELS[stat.maintenance_type] || stat.maintenance_type}
                    </div>
                    <div className="text-xl font-bold text-gray-900">{stat.count}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: 'all', label: '전체' },
          { value: '정기점검', label: '정기점검' },
          { value: '세척', label: '세척' },
          { value: '윤활', label: '윤활' },
          { value: '습합', label: '습합' },
          { value: '수리', label: '수리' },
          { value: '부품교체', label: '부품교체' }
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === value
                ? 'bg-orange-600 text-white'
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
      ) : records.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500">유지보전 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">유형</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">금형코드</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">품번 / 품명</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">작업내용</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">비용</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">수행일</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">담당자</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((item) => {
                const Icon = TYPE_ICONS[item.maintenance_type] || Wrench;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Icon size={16} className="text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {TYPE_LABELS[item.maintenance_type] || item.maintenance_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.mold_code || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{item.part_number || '-'}</div>
                      <div className="text-xs text-gray-500">{item.part_name || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {item.description || item.work_details || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.cost ? `${item.cost.toLocaleString()}원` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.performed_at ? new Date(item.performed_at).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.performed_by_name || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/maintenance/${item.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// 유지보전 상세
function MaintenanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && id !== 'new') {
      loadRecord();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadRecord = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/maintenance/${id}`);
      setRecord(response.data.data);
    } catch (error) {
      console.error('Failed to load record:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">로딩 중...</div>;
  }

  if (id === 'new') {
    return <MaintenanceForm />;
  }

  if (!record) {
    return <div className="p-6 text-center text-gray-500">기록을 찾을 수 없습니다.</div>;
  }

  const Icon = TYPE_ICONS[record.maintenance_type] || Wrench;

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/maintenance')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Icon size={20} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {TYPE_LABELS[record.maintenance_type] || record.maintenance_type}
              </h1>
              <p className="text-sm text-gray-600">
                {record.mold_code} - {record.part_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">금형 정보</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">금형코드</span>
              <span className="font-medium">{record.mold_code || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">품번</span>
              <span className="font-medium">{record.part_number || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">품명</span>
              <span className="font-medium">{record.part_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">현재 타수</span>
              <span className="font-medium">{record.current_shots?.toLocaleString() || '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">작업 정보</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">유지보전 유형</span>
              <span className="font-medium">{TYPE_LABELS[record.maintenance_type] || record.maintenance_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">카테고리</span>
              <span className="font-medium">{record.maintenance_category || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">수행일</span>
              <span className="font-medium">
                {record.performed_at ? new Date(record.performed_at).toLocaleString('ko-KR') : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">담당자</span>
              <span className="font-medium">{record.performed_by_name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">비용</span>
              <span className="font-medium">{record.cost ? `${record.cost.toLocaleString()}원` : '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">작업 내용</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">설명</label>
              <p className="mt-1 text-gray-900">{record.description || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">작업 상세</label>
              <p className="mt-1 text-gray-900">{record.work_details || '-'}</p>
            </div>
            {record.parts_replaced && record.parts_replaced.length > 0 && (
              <div>
                <label className="text-sm text-gray-500">교체 부품</label>
                <ul className="mt-1 list-disc list-inside text-gray-900">
                  {record.parts_replaced.map((part, idx) => (
                    <li key={idx}>{part}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-500">비고</label>
              <p className="mt-1 text-gray-900">{record.notes || '-'}</p>
            </div>
          </div>
        </div>

        {(record.next_maintenance_date || record.next_maintenance_shots) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">다음 유지보전 예정</h2>
            <div className="flex gap-8">
              {record.next_maintenance_date && (
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-orange-600" />
                  <div>
                    <div className="text-sm text-gray-500">예정일</div>
                    <div className="font-medium">{new Date(record.next_maintenance_date).toLocaleDateString('ko-KR')}</div>
                  </div>
                </div>
              )}
              {record.next_maintenance_shots && (
                <div className="flex items-center gap-3">
                  <BarChart3 size={20} className="text-orange-600" />
                  <div>
                    <div className="text-sm text-gray-500">예정 타수</div>
                    <div className="font-medium">{record.next_maintenance_shots.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 유지보전 기록 폼
function MaintenanceForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    mold_id: '',
    maintenance_type: '',
    maintenance_category: '',
    description: '',
    work_details: '',
    cost: '',
    performed_at: new Date().toISOString().split('T')[0],
    next_maintenance_date: '',
    next_maintenance_shots: '',
    notes: ''
  });
  const [molds, setMolds] = useState([]);
  const [types, setTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMolds();
    loadTypes();
  }, []);

  const loadMolds = async () => {
    try {
      const response = await api.get('/molds', { params: { limit: 100 } });
      setMolds(response.data.data.items || response.data.data || []);
    } catch (error) {
      console.error('Failed to load molds:', error);
    }
  };

  const loadTypes = async () => {
    try {
      const response = await api.get('/maintenance/types');
      setTypes(response.data.data || []);
    } catch (error) {
      console.error('Failed to load types:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mold_id || !formData.maintenance_type) {
      alert('금형과 유지보전 유형을 선택해주세요.');
      return;
    }
    
    try {
      setSubmitting(true);
      await api.post('/maintenance', {
        ...formData,
        cost: formData.cost ? parseInt(formData.cost) : null,
        next_maintenance_shots: formData.next_maintenance_shots ? parseInt(formData.next_maintenance_shots) : null
      });
      alert('유지보전 기록이 등록되었습니다.');
      navigate('/maintenance');
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
          onClick={() => navigate('/maintenance')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">유지보전 기록 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">금형 선택 *</label>
              <select
                value={formData.mold_id}
                onChange={(e) => setFormData({ ...formData, mold_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">유지보전 유형 *</label>
              <select
                value={formData.maintenance_type}
                onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="">유형을 선택하세요</option>
                {types.map((type) => (
                  <option key={type.code} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">수행일 *</label>
              <input
                type="date"
                value={formData.performed_at}
                onChange={(e) => setFormData({ ...formData, performed_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비용 (원)</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">작업 설명</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="간단한 작업 설명"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">작업 상세</label>
            <textarea
              value={formData.work_details}
              onChange={(e) => setFormData({ ...formData, work_details: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={3}
              placeholder="상세 작업 내용"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">다음 유지보전 예정일</label>
              <input
                type="date"
                value={formData.next_maintenance_date}
                onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">다음 유지보전 예정 타수</label>
              <input
                type="number"
                value={formData.next_maintenance_shots}
                onChange={(e) => setFormData({ ...formData, next_maintenance_shots: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={2}
              placeholder="추가 메모"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/maintenance')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              <Wrench size={18} />
              {submitting ? '등록 중...' : '기록 등록'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// 메인 컴포넌트
export default function MaintenanceManagement() {
  const { id } = useParams();
  
  if (id) {
    return <MaintenanceDetail />;
  }
  
  return <MaintenanceList />;
}
