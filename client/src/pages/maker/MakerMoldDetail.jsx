import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Edit3, Package, Calendar, User, 
  CheckCircle, Clock, AlertTriangle, FileText, Image
} from 'lucide-react';
import { makerSpecificationAPI } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function MakerMoldDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mold, setMold] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (id) loadMoldDetail();
  }, [id]);

  const loadMoldDetail = async () => {
    try {
      setLoading(true);
      const response = await makerSpecificationAPI.getById(id);
      if (response?.data?.data) {
        setMold(response.data.data);
        setFormData(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load mold detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await makerSpecificationAPI.update(id, {
        production_progress: formData.production_progress,
        current_stage: formData.current_stage,
        status: formData.status,
        notes: formData.notes,
        actual_material: formData.actual_material,
        actual_cavity_count: formData.actual_cavity_count,
        core_material: formData.core_material,
        cavity_material: formData.cavity_material,
        cooling_type: formData.cooling_type,
        ejection_type: formData.ejection_type,
        hot_runner: formData.hot_runner,
        slide_count: formData.slide_count,
        lifter_count: formData.lifter_count,
        cycle_time: formData.cycle_time,
        max_shots: formData.max_shots
      });
      setMold(formData);
      setIsEditing(false);
      alert('저장되었습니다.');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!mold) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">금형 정보를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/dashboard/maker')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const spec = mold.specification || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard/maker')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {mold.part_number || spec.part_number || '금형 상세'}
                </h1>
                <p className="text-sm text-gray-500">
                  {mold.part_name || spec.part_name || '-'} | {mold.car_model || spec.car_model || '-'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setFormData(mold);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  편집
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 기본 정보 (읽기 전용 - 본사 연동) */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            기본 정보 (본사 연동)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem label="품번" value={mold.part_number || spec.part_number} />
            <InfoItem label="품명" value={mold.part_name || spec.part_name} />
            <InfoItem label="차종" value={mold.car_model || spec.car_model} />
            <InfoItem label="금형유형" value={mold.mold_type || spec.mold_type} />
            <InfoItem label="캐비티" value={mold.cavity_count || spec.cavity_count} />
            <InfoItem label="재질" value={mold.material || spec.material} />
            <InfoItem label="톤수" value={spec.tonnage ? `${spec.tonnage}T` : '-'} />
            <InfoItem label="발주일" value={spec.order_date ? new Date(spec.order_date).toLocaleDateString('ko-KR') : '-'} />
            <InfoItem label="납기" value={spec.target_delivery_date ? new Date(spec.target_delivery_date).toLocaleDateString('ko-KR') : '-'} />
            <InfoItem label="진행단계" value={mold.development_stage || spec.development_stage} />
            <InfoItem label="제작사양" value={mold.mold_spec_type || spec.mold_spec_type} />
          </div>
        </section>

        {/* 제작 진행 현황 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-600" />
            제작 진행 현황
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">현재 단계</label>
              {isEditing ? (
                <select
                  value={formData.current_stage || ''}
                  onChange={(e) => handleChange('current_stage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  <option value="설계">설계</option>
                  <option value="가공">가공</option>
                  <option value="조립">조립</option>
                  <option value="시운전대기">시운전대기</option>
                  <option value="시운전">시운전</option>
                  <option value="완료">완료</option>
                </select>
              ) : (
                <p className="text-gray-900 font-medium">{mold.current_stage || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">진행률</label>
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.production_progress || 0}
                    onChange={(e) => handleChange('production_progress', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12">{formData.production_progress || 0}%</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${mold.production_progress || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{mold.production_progress || 0}%</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              {isEditing ? (
                <select
                  value={formData.status || ''}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  <option value="pending">대기</option>
                  <option value="in_progress">진행중</option>
                  <option value="completed">완료</option>
                </select>
              ) : (
                <StatusBadge status={mold.status} />
              )}
            </div>
          </div>
        </section>

        {/* 제작처 입력 정보 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-purple-600" />
            제작처 입력 정보
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <EditableField
              label="실제 재질"
              value={formData.actual_material}
              onChange={(v) => handleChange('actual_material', v)}
              isEditing={isEditing}
            />
            <EditableField
              label="실제 캐비티"
              value={formData.actual_cavity_count}
              onChange={(v) => handleChange('actual_cavity_count', v)}
              isEditing={isEditing}
              type="number"
            />
            <EditableField
              label="코어 재질"
              value={formData.core_material}
              onChange={(v) => handleChange('core_material', v)}
              isEditing={isEditing}
            />
            <EditableField
              label="캐비티 재질"
              value={formData.cavity_material}
              onChange={(v) => handleChange('cavity_material', v)}
              isEditing={isEditing}
            />
            <EditableField
              label="냉각 방식"
              value={formData.cooling_type}
              onChange={(v) => handleChange('cooling_type', v)}
              isEditing={isEditing}
            />
            <EditableField
              label="이젝션 방식"
              value={formData.ejection_type}
              onChange={(v) => handleChange('ejection_type', v)}
              isEditing={isEditing}
            />
            <EditableField
              label="슬라이드 수"
              value={formData.slide_count}
              onChange={(v) => handleChange('slide_count', v)}
              isEditing={isEditing}
              type="number"
            />
            <EditableField
              label="리프터 수"
              value={formData.lifter_count}
              onChange={(v) => handleChange('lifter_count', v)}
              isEditing={isEditing}
              type="number"
            />
            <EditableField
              label="사이클타임 (초)"
              value={formData.cycle_time}
              onChange={(v) => handleChange('cycle_time', v)}
              isEditing={isEditing}
              type="number"
            />
            <EditableField
              label="최대타수"
              value={formData.max_shots}
              onChange={(v) => handleChange('max_shots', v)}
              isEditing={isEditing}
              type="number"
            />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">핫런너</label>
              {isEditing ? (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hot_runner || false}
                    onChange={(e) => handleChange('hot_runner', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">핫런너 적용</span>
                </label>
              ) : (
                <p className="text-gray-900">{mold.hot_runner ? '적용' : '미적용'}</p>
              )}
            </div>
          </div>
        </section>

        {/* 비고 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">비고</h2>
          {isEditing ? (
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="비고 사항을 입력하세요..."
            />
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{mold.notes || '비고 없음'}</p>
          )}
        </section>
      </div>
    </div>
  );
}

// 정보 표시 컴포넌트
function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value || '-'}</p>
    </div>
  );
}

// 편집 가능한 필드
function EditableField({ label, value, onChange, isEditing, type = 'text' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {isEditing ? (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value) || null : e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <p className="text-gray-900">{value || '-'}</p>
      )}
    </div>
  );
}

// 상태 배지
function StatusBadge({ status }) {
  const statusConfig = {
    pending: { label: '대기', className: 'bg-yellow-100 text-yellow-800' },
    in_progress: { label: '진행중', className: 'bg-blue-100 text-blue-800' },
    completed: { label: '완료', className: 'bg-green-100 text-green-800' }
  };

  const config = statusConfig[status] || { label: status || '-', className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
