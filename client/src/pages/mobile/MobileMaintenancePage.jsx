import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Wrench, ArrowLeft, Plus, Calendar, Clock, 
  CheckCircle, ChevronRight, Cog, Droplets, Settings
} from 'lucide-react';
import api from '../../lib/api';

// 유지보전 유형 아이콘
const TYPE_ICONS = {
  '정기점검': Calendar,
  '세척': Droplets,
  '윤활': Droplets,
  '습합': Settings,
  '수리': Wrench,
  '부품교체': Cog,
  '교정': Settings,
  '예방정비': CheckCircle,
  '기타': Wrench
};

export default function MobileMaintenancePage() {
  const navigate = useNavigate();
  const { moldId } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    maintenance_type: '',
    description: '',
    work_details: '',
    cost: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [moldId]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const params = moldId ? { mold_id: moldId } : {};
      const response = await api.get('/maintenance', { params: { ...params, limit: 20 } });
      setRecords(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.maintenance_type) {
      alert('유지보전 유형을 선택해주세요.');
      return;
    }
    
    try {
      setSubmitting(true);
      await api.post('/maintenance', {
        mold_id: moldId,
        ...formData,
        cost: formData.cost ? parseInt(formData.cost) : null,
        performed_at: new Date().toISOString()
      });
      alert('등록되었습니다.');
      setShowForm(false);
      setFormData({ maintenance_type: '', description: '', work_details: '', cost: '' });
      loadRecords();
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
          <h1 className="font-semibold text-gray-900">유지보전 기록</h1>
          <p className="text-xs text-gray-500">금형 유지보전 이력</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="p-2 bg-orange-600 text-white rounded-lg"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* 목록 */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-500">유지보전 기록이 없습니다.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg"
            >
              기록 등록
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const Icon = TYPE_ICONS[record.maintenance_type] || Wrench;
              return (
                <div
                  key={record.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Icon size={20} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {record.maintenance_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {record.performed_at ? new Date(record.performed_at).toLocaleDateString('ko-KR') : '-'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {record.description || record.work_details || '-'}
                      </p>
                      {record.cost > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          비용: {record.cost.toLocaleString()}원
                        </p>
                      )}
                    </div>
                    <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 등록 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">유지보전 기록 등록</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500">
                닫기
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">유형 *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['정기점검', '세척', '윤활', '습합', '수리', '부품교체'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, maintenance_type: type })}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        formData.maintenance_type === type
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-white text-gray-700 border-gray-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">작업 설명</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="간단한 설명"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 내용</label>
                <textarea
                  value={formData.work_details}
                  onChange={(e) => setFormData({ ...formData, work_details: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="상세 작업 내용"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비용 (원)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {submitting ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
