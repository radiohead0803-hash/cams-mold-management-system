import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Wrench, ArrowLeft, Plus, Calendar, Clock, X,
  CheckCircle, ChevronRight, Cog, Droplets, Settings, Save
} from 'lucide-react';
import api from '../../lib/api';
// draftStorage 불필요 - 서버 API로 저장 통합

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
  const [saveMessage, setSaveMessage] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [types, setTypes] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadRecords();
    loadStatistics();
    loadTypes();
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

  const loadStatistics = async () => {
    try {
      const response = await api.get('/maintenance/statistics');
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
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

  const loadDetail = async (id) => {
    try {
      setDetailLoading(true);
      const response = await api.get(`/maintenance/${id}`);
      setSelectedRecord(response.data.data);
    } catch (error) {
      console.error('Failed to load detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    setSaveMessage(null);
    try {
      await api.post('/maintenance', {
        mold_id: moldId,
        ...formData,
        status: 'draft',
        cost: formData.cost ? parseInt(formData.cost) : null,
        performed_at: new Date().toISOString()
      });
      setSaveMessage({ type: 'success', text: '임시저장이 완료되었습니다.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Draft save failed:', error);
      setSaveMessage({ type: 'error', text: '임시저장에 실패했습니다.' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setSubmitting(false);
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
      loadStatistics();
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

      {/* 통계 카드 */}
      {statistics && statistics.by_type && statistics.by_type.length > 0 && (
        <div className="px-4 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {statistics.by_type.slice(0, 6).map((stat) => {
              const Icon = TYPE_ICONS[stat.maintenance_type] || Wrench;
              return (
                <div key={stat.maintenance_type} className="flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 px-3 py-2.5 min-w-[100px]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Icon size={16} className="text-orange-600" />
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 whitespace-nowrap">{stat.maintenance_type}</div>
                      <div className="text-lg font-bold text-gray-900">{stat.count}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50 cursor-pointer"
                  onClick={() => loadDetail(record.id)}
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

      {/* 상세 보기 모달 */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">유지보전 상세</h2>
              <button onClick={() => setSelectedRecord(null)} className="p-1 rounded-full hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {detailLoading ? (
              <div className="text-center py-12 text-gray-500">로딩 중...</div>
            ) : (
              <div className="p-6 space-y-5">
                {/* 유형 헤더 */}
                <div className="flex items-center gap-3">
                  {(() => { const Icon = TYPE_ICONS[selectedRecord.maintenance_type] || Wrench; return (
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                      <Icon size={24} className="text-orange-600" />
                    </div>
                  ); })()}
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">{selectedRecord.maintenance_type}</div>
                    <div className="text-sm text-gray-500">
                      {selectedRecord.mold_code ? `${selectedRecord.mold_code}` : ''}{selectedRecord.part_name ? ` - ${selectedRecord.part_name}` : ''}
                    </div>
                  </div>
                </div>

                {/* 금형 정보 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">금형 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">금형코드</span>
                      <span className="font-medium text-gray-900">{selectedRecord.mold_code || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">품번</span>
                      <span className="font-medium text-gray-900">{selectedRecord.part_number || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">품명</span>
                      <span className="font-medium text-gray-900">{selectedRecord.part_name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">현재 타수</span>
                      <span className="font-medium text-gray-900">{selectedRecord.current_shots?.toLocaleString() || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* 작업 정보 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">작업 정보</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">유지보전 유형</span>
                      <span className="font-medium text-gray-900">{selectedRecord.maintenance_type || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">카테고리</span>
                      <span className="font-medium text-gray-900">{selectedRecord.maintenance_category || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">수행일</span>
                      <span className="font-medium text-gray-900">
                        {selectedRecord.performed_at ? new Date(selectedRecord.performed_at).toLocaleString('ko-KR') : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">담당자</span>
                      <span className="font-medium text-gray-900">{selectedRecord.performed_by_name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">비용</span>
                      <span className="font-medium text-gray-900">{selectedRecord.cost ? `${selectedRecord.cost.toLocaleString()}원` : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* 작업 내용 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">작업 내용</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">설명</div>
                      <p className="text-gray-900">{selectedRecord.description || '-'}</p>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">작업 상세</div>
                      <p className="text-gray-900">{selectedRecord.work_details || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                  {(types.length > 0 ? types : ['정기점검', '세척', '윤활', '습합', '수리', '부품교체']).map((type) => (
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

              {saveMessage && (
                <div className={`p-2.5 rounded-lg text-xs font-medium ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{saveMessage.text}</div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={submitting}
                  className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={16} />
                  임시저장
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {submitting ? '등록 중...' : '등록하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
