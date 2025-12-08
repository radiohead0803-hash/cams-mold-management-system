import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Send, CheckCircle, Clock, AlertCircle, Upload, Calendar } from 'lucide-react';
import { moldSpecificationAPI } from '../lib/api';

// 12단계 공정 정의
const DEVELOPMENT_STAGES = [
  { id: 'drawing_receipt', name: '도면접수', order: 1 },
  { id: 'mold_base_order', name: '몰드베이스 발주', order: 2 },
  { id: 'mold_design', name: '금형설계', order: 3 },
  { id: 'drawing_review', name: '도면검토회', order: 4 },
  { id: 'upper_machining', name: '상형가공', order: 5 },
  { id: 'lower_machining', name: '하형가공', order: 6 },
  { id: 'core_machining', name: '코어가공', order: 7 },
  { id: 'discharge', name: '방전', order: 8 },
  { id: 'surface_finish', name: '격면사상', order: 9 },
  { id: 'mold_assembly', name: '금형조립', order: 10 },
  { id: 'tryout', name: '습합', order: 11 },
  { id: 'initial_to', name: '초도 T/O', order: 12 }
];

// 상태 옵션
const STATUS_OPTIONS = [
  { value: 'pending', label: '대기', color: 'bg-gray-100 text-gray-700' },
  { value: 'in_progress', label: '진행중', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'completed', label: '완료', color: 'bg-green-100 text-green-700' },
  { value: 'delayed', label: '지연', color: 'bg-red-100 text-red-700' }
];

export default function MoldDevelopmentPlan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const moldId = searchParams.get('moldId');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // 제작사양
  const [specData, setSpecData] = useState({
    car_model: '',
    maker_name: '',
    to_date: '',
    production_days: 0,
    shrinkage_rate: '',
    start_check: false,
    mass_production_check: false,
    cavity_material: '',
    core_material: '',
    part_weight: '',
    part_image: null
  });
  
  // 추진계획 (12단계)
  const [planData, setPlanData] = useState(
    DEVELOPMENT_STAGES.map(stage => ({
      stage_id: stage.id,
      stage_name: stage.name,
      start_date: '',
      end_date: '',
      status: 'pending',
      remarks: '',
      days_diff: 0
    }))
  );
  
  // 승인 상태
  const [approvalStatus, setApprovalStatus] = useState('draft'); // draft, pending, approved, rejected

  useEffect(() => {
    if (moldId) {
      loadMoldData();
    }
  }, [moldId]);

  const loadMoldData = async () => {
    try {
      setLoading(true);
      const response = await moldSpecificationAPI.getById(moldId);
      if (response.data?.data) {
        const data = response.data.data;
        setMoldInfo(data);
        
        // 제작사양 초기화
        setSpecData({
          car_model: data.car_model || '',
          maker_name: data.makerCompany?.company_name || '',
          to_date: data.target_delivery_date || '',
          production_days: calculateDays(data.order_date, data.target_delivery_date),
          shrinkage_rate: data.shrinkage_rate || '',
          start_check: data.mold_spec_type === '시작금형',
          mass_production_check: data.mold_spec_type === '양산금형',
          cavity_material: data.material || '',
          core_material: data.core_material || '',
          part_weight: data.part_weight || '',
          part_image: data.part_images?.[0] || null
        });
        
        // 기존 계획 데이터가 있으면 로드
        if (data.development_plan) {
          setPlanData(data.development_plan);
        }
        
        setApprovalStatus(data.plan_approval_status || 'draft');
      }
    } catch (error) {
      console.error('Failed to load mold data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateDaysDiff = (endDate) => {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSpecChange = (field, value) => {
    setSpecData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlanChange = (index, field, value) => {
    setPlanData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // 일정 차이 자동 계산
      if (field === 'end_date') {
        updated[index].days_diff = calculateDaysDiff(value);
      }
      
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // API 호출하여 저장
      // await moldSpecificationAPI.updateDevelopmentPlan(moldId, { specData, planData });
      alert('저장되었습니다.');
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setSaving(true);
      setApprovalStatus('pending');
      // await moldSpecificationAPI.submitPlanForApproval(moldId);
      alert('승인 요청이 제출되었습니다.');
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option?.color || 'bg-gray-100 text-gray-700';
  };

  const getStageIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'in_progress':
        return <Clock className="text-yellow-500" size={24} />;
      case 'delayed':
        return <AlertCircle className="text-red-500" size={24} />;
      default:
        return <div className="w-6 h-6 rounded-full border-2 border-gray-300" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">개발계획</h1>
                <p className="text-sm text-gray-500">
                  {moldInfo?.mold?.mold_code || `M-${moldId}`} - {moldInfo?.part_name || '금형'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {approvalStatus === 'pending' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <Clock size={14} /> 승인대기
                </span>
              )}
              {approvalStatus === 'approved' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <CheckCircle size={14} /> 승인완료
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save size={16} />
                저장 및 승인요청
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 제작사양 및 추진일정 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">▣ 제작사양 및 추진일정</h2>
              <span className="text-sm text-gray-500">Creative Auto Module System</span>
            </div>
          </div>

          <div className="p-6">
            {/* 제작사양 */}
            <div className="mb-8">
              <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="text-blue-600">▶</span> 제작사양
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Row 1 */}
                <div className="flex items-center gap-2">
                  <label className="w-16 text-sm font-medium text-gray-600 bg-blue-50 px-2 py-2 rounded">차종</label>
                  <input
                    type="text"
                    value={specData.car_model}
                    onChange={(e) => handleSpecChange('car_model', e.target.value)}
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-sm font-medium text-gray-600 bg-blue-50 px-2 py-2 rounded">제작처</label>
                  <input
                    type="text"
                    value={specData.maker_name}
                    onChange={(e) => handleSpecChange('maker_name', e.target.value)}
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm font-medium text-gray-600 bg-blue-50 px-2 py-2 rounded">T/O일정</label>
                  <input
                    type="date"
                    value={specData.to_date}
                    onChange={(e) => handleSpecChange('to_date', e.target.value)}
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">시작</span>
                    <input
                      type="checkbox"
                      checked={specData.start_check}
                      onChange={(e) => handleSpecChange('start_check', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">양산</span>
                    <input
                      type="checkbox"
                      checked={specData.mass_production_check}
                      onChange={(e) => handleSpecChange('mass_production_check', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </label>
                </div>

                {/* Row 2 */}
                <div className="flex items-center gap-2">
                  <label className="w-16 text-sm font-medium text-gray-600 bg-blue-50 px-2 py-2 rounded">형번</label>
                  <input
                    type="text"
                    value={moldInfo?.part_number || ''}
                    readOnly
                    className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                  />
                </div>
                <div className="col-span-2"></div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-sm font-medium text-gray-600 bg-blue-50 px-2 py-2 rounded">제작일정</label>
                  <div className="flex-1 border rounded px-3 py-2 text-sm bg-yellow-50 text-center font-bold">
                    D+{specData.production_days || 0}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-sm font-medium text-gray-600 bg-blue-50 px-2 py-2 rounded">수축률</label>
                  <input
                    type="text"
                    value={specData.shrinkage_rate}
                    onChange={(e) => handleSpecChange('shrinkage_rate', e.target.value)}
                    placeholder="6/1000"
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  />
                </div>

                {/* Row 3 */}
                <div className="flex items-center gap-2 col-span-2">
                  <label className="w-16 text-sm font-medium text-gray-600 bg-blue-50 px-2 py-2 rounded">품명</label>
                  <input
                    type="text"
                    value={moldInfo?.part_name || ''}
                    readOnly
                    className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-sm font-medium text-gray-600 bg-blue-50 px-2 py-2 rounded text-xs">상형 (캐비티)</label>
                  <select
                    value={specData.cavity_material}
                    onChange={(e) => handleSpecChange('cavity_material', e.target.value)}
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  >
                    <option value="">재질 선택</option>
                    <option value="NAK80">NAK80</option>
                    <option value="S45C">S45C</option>
                    <option value="SKD61">SKD61</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 row-span-2">
                  <label className="w-24 text-sm font-medium text-gray-600 bg-blue-50 px-2 py-2 rounded">부품중량(g)</label>
                  <div className="flex-1 flex flex-col gap-2">
                    <input
                      type="text"
                      value={specData.part_weight}
                      onChange={(e) => handleSpecChange('part_weight', e.target.value)}
                      placeholder="중량"
                      className="border rounded px-3 py-2 text-sm"
                    />
                    <button className="px-3 py-2 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200 flex items-center gap-1">
                      <Upload size={14} /> 이미지 업로드
                    </button>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="flex items-center gap-2 col-span-2">
                  <label className="w-16 text-sm font-medium text-gray-600 bg-blue-50 px-2 py-2 rounded">원재료</label>
                  <input
                    type="text"
                    value={moldInfo?.material || ''}
                    readOnly
                    className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-sm font-medium text-gray-600 bg-blue-50 px-2 py-2 rounded text-xs">하형 (코어)</label>
                  <select
                    value={specData.core_material}
                    onChange={(e) => handleSpecChange('core_material', e.target.value)}
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  >
                    <option value="">재질 선택</option>
                    <option value="NAK80">NAK80</option>
                    <option value="S45C">S45C</option>
                    <option value="SKD61">SKD61</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 12단계 진행 상태 아이콘 */}
            <div className="mb-8 overflow-x-auto">
              <div className="flex items-center justify-between min-w-[900px] px-4">
                {DEVELOPMENT_STAGES.map((stage, index) => {
                  const stageData = planData[index];
                  return (
                    <div key={stage.id} className="flex flex-col items-center">
                      <div className="relative">
                        {getStageIcon(stageData?.status)}
                        {index < DEVELOPMENT_STAGES.length - 1 && (
                          <div className="absolute top-3 left-8 w-12 h-0.5 bg-gray-300" />
                        )}
                      </div>
                      <span className="text-xs text-gray-600 mt-2 text-center w-16">{stage.name}</span>
                      <span className={`text-xs mt-1 ${stageData?.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                        {stageData?.status === 'completed' ? '완료' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 추진계획 테이블 */}
            <div>
              <h3 className="text-md font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="text-blue-600">▶</span> 추진계획
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-4 py-3 text-sm font-medium text-gray-700 w-28">구분</th>
                      <th className="border px-4 py-3 text-sm font-medium text-gray-700" colSpan={2}>제작일정</th>
                      <th className="border px-4 py-3 text-sm font-medium text-gray-700 w-24">상태</th>
                      <th className="border px-4 py-3 text-sm font-medium text-gray-700">비고</th>
                      <th className="border px-4 py-3 text-sm font-medium text-gray-700 w-20">일정</th>
                    </tr>
                    <tr className="bg-gray-50">
                      <th className="border px-4 py-2 text-xs text-gray-500"></th>
                      <th className="border px-4 py-2 text-xs text-gray-500">시작일</th>
                      <th className="border px-4 py-2 text-xs text-gray-500">종료일</th>
                      <th className="border px-4 py-2 text-xs text-gray-500"></th>
                      <th className="border px-4 py-2 text-xs text-gray-500"></th>
                      <th className="border px-4 py-2 text-xs text-gray-500"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {planData.map((plan, index) => (
                      <tr key={plan.stage_id} className="hover:bg-gray-50">
                        <td className="border px-4 py-3 text-sm font-medium text-blue-600 underline cursor-pointer">
                          {plan.stage_name}
                        </td>
                        <td className="border px-2 py-2">
                          <input
                            type="date"
                            value={plan.start_date}
                            onChange={(e) => handlePlanChange(index, 'start_date', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="border px-2 py-2">
                          <input
                            type="date"
                            value={plan.end_date}
                            onChange={(e) => handlePlanChange(index, 'end_date', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="border px-2 py-2">
                          <select
                            value={plan.status}
                            onChange={(e) => handlePlanChange(index, 'status', e.target.value)}
                            className={`w-full rounded px-2 py-1 text-sm font-medium ${getStatusColor(plan.status)}`}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="border px-2 py-2">
                          <input
                            type="text"
                            value={plan.remarks}
                            onChange={(e) => handlePlanChange(index, 'remarks', e.target.value)}
                            placeholder="비고"
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="border px-4 py-3 text-center">
                          <span className={`text-sm font-bold ${plan.days_diff >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            D{plan.days_diff >= 0 ? '+' : ''}{plan.days_diff || '00'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 승인 대기 알림 */}
        {approvalStatus === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
            <div>
              <h4 className="font-semibold text-yellow-800">승인 대기 중</h4>
              <p className="text-sm text-yellow-700">개발진행 계획이 제출되었습니다. 관리자의 승인을 기다리고 있습니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
