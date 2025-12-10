import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Save, Send, Thermometer, Gauge, Timer, 
  Settings, AlertCircle, CheckCircle, Clock, History,
  ChevronDown, ChevronUp, Info, User, Calendar, FileText, Edit3
} from 'lucide-react'
import { injectionConditionAPI, moldSpecificationAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

/**
 * PC 사출조건 관리 페이지
 * - 제작처/생산처: 등록 및 수정
 * - 개발담당자: 승인/반려
 */
export default function InjectionCondition() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const moldId = searchParams.get('moldId')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [moldInfo, setMoldInfo] = useState(null)
  const [condition, setCondition] = useState(null)
  const [formData, setFormData] = useState({})
  const [expandedSections, setExpandedSections] = useState({
    speed: true,
    position: true,
    pressure: true,
    time: true,
    metering_speed: false,
    metering_position: false,
    metering_pressure: false,
    full_pressure: false,
    barrel: false,
    hr: false,
    valve_gate: false,
    chiller: true,
    other: false
  })
  const [changeReason, setChangeReason] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const isDeveloper = ['mold_developer', 'system_admin'].includes(user?.user_type)
  const canEdit = !isDeveloper || condition?.status === 'draft'

  useEffect(() => {
    if (moldId) {
      loadData()
    }
  }, [moldId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 금형 기본정보 조회
      const moldResponse = await moldSpecificationAPI.getById(moldId).catch(() => null)
      if (moldResponse?.data?.data) {
        setMoldInfo(moldResponse.data.data)
      }

      // 사출조건 조회
      const conditionResponse = await injectionConditionAPI.get({ 
        mold_spec_id: moldId, 
        include_history: 'true' 
      }).catch(() => null)
      
      if (conditionResponse?.data?.data) {
        setCondition(conditionResponse.data.data)
        setFormData(conditionResponse.data.data)
      } else {
        // 새 등록 시 금형정보 자동 연결
        setFormData({
          mold_spec_id: moldId,
          mold_code: moldResponse?.data?.data?.mold_code || '',
          mold_name: moldResponse?.data?.data?.mold_name || '',
          part_name: moldResponse?.data?.data?.part_name || '',
          material: moldResponse?.data?.data?.material || ''
        })
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (submitForApproval = false) => {
    try {
      setSaving(true)
      
      const dataToSave = {
        ...formData,
        mold_spec_id: moldId,
        change_reason: changeReason
      }

      if (condition?.id) {
        // 수정
        await injectionConditionAPI.update(condition.id, dataToSave)
        alert(submitForApproval 
          ? '사출조건이 수정되었습니다. 개발담당자 승인을 기다려주세요.'
          : '사출조건이 저장되었습니다.')
      } else {
        // 신규 등록
        await injectionConditionAPI.create(dataToSave)
        alert('사출조건이 등록되었습니다. 개발담당자 승인을 기다려주세요.')
      }

      loadData()
      setChangeReason('')
    } catch (error) {
      console.error('Save error:', error)
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (action) => {
    const rejectionReason = action === 'reject' 
      ? prompt('반려 사유를 입력하세요:')
      : null

    if (action === 'reject' && !rejectionReason) {
      return
    }

    try {
      setSaving(true)
      await injectionConditionAPI.approve(condition.id, { 
        action, 
        rejection_reason: rejectionReason 
      })
      alert(action === 'approve' ? '승인되었습니다.' : '반려되었습니다.')
      loadData()
    } catch (error) {
      console.error('Approve error:', error)
      alert('처리에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
          <CheckCircle size={14} /> 승인됨
        </span>
      case 'pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
          <Clock size={14} /> 승인대기
        </span>
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium flex items-center gap-1">
          <AlertCircle size={14} /> 반려됨
        </span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
          임시저장
        </span>
    }
  }

  const InputField = ({ label, field, unit, type = 'number', step = '0.1' }) => (
    <div className="flex items-center gap-2">
      <label className="w-32 text-sm text-gray-600 flex-shrink-0">{label}</label>
      <div className="flex-1 flex items-center gap-1">
        <input
          type={type}
          step={step}
          value={formData[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          disabled={!canEdit}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 disabled:bg-gray-100"
        />
        {unit && <span className="text-sm text-gray-500 w-12">{unit}</span>}
      </div>
    </div>
  )

  const SectionHeader = ({ icon: Icon, title, section, color }) => (
    <button
      onClick={() => toggleSection(section)}
      className={`w-full flex items-center justify-between p-4 ${color} rounded-t-xl`}
    >
      <div className="flex items-center gap-2 text-white font-semibold">
        <Icon size={20} />
        {title}
      </div>
      {expandedSections[section] ? <ChevronUp className="text-white" /> : <ChevronDown className="text-white" />}
    </button>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">사출조건 관리</h1>
                <p className="text-sm text-gray-500">
                  {moldInfo?.mold_code || `금형 #${moldId}`} - {moldInfo?.mold_name || ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {condition && getStatusBadge(condition.status)}
              
              {condition?.status === 'pending' && isDeveloper && (
                <>
                  <button
                    onClick={() => handleApprove('reject')}
                    disabled={saving}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    반려
                  </button>
                  <button
                    onClick={() => handleApprove('approve')}
                    disabled={saving}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    승인
                  </button>
                </>
              )}
              
              {canEdit && (
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50"
                >
                  <Send size={18} />
                  {condition?.id ? '수정 및 승인요청' : '등록 및 승인요청'}
                </button>
              )}

              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg ${showHistory ? 'bg-rose-100 text-rose-600' : 'hover:bg-gray-100'}`}
              >
                <History size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 폼 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 작성/수정/승인 정보 */}
            {condition && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center gap-2">
                  <FileText size={20} />
                  <span className="font-semibold">작성/수정/승인 정보</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 작성 정보 */}
                    <div className="border-l-4 border-blue-400 pl-4 py-2">
                      <div className="flex items-center gap-2 text-blue-600 mb-2">
                        <Edit3 size={16} />
                        <span className="font-medium">작성</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span>{condition.registered_by_name || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span>
                            {condition.registered_at 
                              ? new Date(condition.registered_at).toLocaleDateString('ko-KR') 
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 수정 정보 */}
                    <div className="border-l-4 border-yellow-400 pl-4 py-2">
                      <div className="flex items-center gap-2 text-yellow-600 mb-2">
                        <Edit3 size={16} />
                        <span className="font-medium">최종 수정</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span>{condition.updated_by_name || condition.registered_by_name || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span>
                            {condition.updated_at 
                              ? new Date(condition.updated_at).toLocaleDateString('ko-KR') 
                              : '-'}
                          </span>
                        </div>
                        {condition.version > 1 && (
                          <div className="text-xs text-gray-500">버전: v{condition.version}</div>
                        )}
                      </div>
                    </div>

                    {/* 승인 정보 */}
                    <div className={`border-l-4 pl-4 py-2 ${
                      condition.status === 'approved' ? 'border-green-400' :
                      condition.status === 'rejected' ? 'border-red-400' :
                      condition.status === 'pending' ? 'border-yellow-400' :
                      'border-gray-300'
                    }`}>
                      <div className={`flex items-center gap-2 mb-2 ${
                        condition.status === 'approved' ? 'text-green-600' :
                        condition.status === 'rejected' ? 'text-red-600' :
                        condition.status === 'pending' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {condition.status === 'approved' && <CheckCircle size={16} />}
                        {condition.status === 'rejected' && <AlertCircle size={16} />}
                        {condition.status === 'pending' && <Clock size={16} />}
                        {!condition.status && <Clock size={16} />}
                        <span className="font-medium">
                          {condition.status === 'approved' ? '승인' :
                           condition.status === 'rejected' ? '반려' :
                           condition.status === 'pending' ? '승인 대기' :
                           '미등록'}
                        </span>
                      </div>
                      {condition.status === 'approved' && (
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            <span>{condition.approved_by_name || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span>
                              {condition.approved_at 
                                ? new Date(condition.approved_at).toLocaleDateString('ko-KR') 
                                : '-'}
                            </span>
                          </div>
                        </div>
                      )}
                      {condition.status === 'rejected' && (
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            <span>{condition.approved_by_name || '-'}</span>
                          </div>
                          {condition.rejection_reason && (
                            <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                              <span className="font-medium">반려 사유: </span>
                              {condition.rejection_reason}
                            </div>
                          )}
                        </div>
                      )}
                      {condition.status === 'pending' && (
                        <p className="text-sm text-gray-500">개발담당자 승인 대기 중</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 금형 기본정보 (자동 연결) */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-100 border-b flex items-center gap-2">
                <Info size={20} className="text-gray-600" />
                <span className="font-semibold text-gray-700">금형 기본정보 (자동 연결)</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">금형코드</label>
                  <p className="font-medium">{formData.mold_code || moldInfo?.mold_code || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">금형명</label>
                  <p className="font-medium">{formData.mold_name || moldInfo?.mold_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">품명</label>
                  <p className="font-medium">{formData.part_name || moldInfo?.part_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">재질</label>
                  <p className="font-medium">{formData.material || moldInfo?.material || '-'}</p>
                </div>
              </div>
            </div>

            {/* 속도 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Gauge} title="속도" section="speed" color="bg-blue-500" />
              {expandedSections.speed && (
                <div className="p-4 grid grid-cols-5 gap-3">
                  <InputField label="1차" field="speed_1" unit="" />
                  <InputField label="2차" field="speed_2" unit="" />
                  <InputField label="3차" field="speed_3" unit="" />
                  <InputField label="4차" field="speed_4" unit="" />
                  <InputField label="냉" field="speed_cooling" unit="" />
                </div>
              )}
            </div>

            {/* 위치 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Settings} title="위치" section="position" color="bg-green-500" />
              {expandedSections.position && (
                <div className="p-4 grid grid-cols-4 gap-3">
                  <InputField label="PV" field="position_pv" unit="" />
                  <InputField label="#" field="position_1" unit="" />
                  <InputField label="43" field="position_2" unit="" />
                  <InputField label="21" field="position_3" unit="" />
                </div>
              )}
            </div>

            {/* 압력 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Gauge} title="압력" section="pressure" color="bg-red-500" />
              {expandedSections.pressure && (
                <div className="p-4 grid grid-cols-4 gap-3">
                  <InputField label="1차" field="pressure_1" unit="" />
                  <InputField label="2차" field="pressure_2" unit="" />
                  <InputField label="3차" field="pressure_3" unit="" />
                  <InputField label="4차" field="pressure_4" unit="" />
                </div>
              )}
            </div>

            {/* 시간 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Timer} title="시간" section="time" color="bg-purple-500" />
              {expandedSections.time && (
                <div className="p-4 grid grid-cols-5 gap-3">
                  <InputField label="사출" field="time_injection" unit="sec" step="0.01" />
                  <InputField label="보압" field="time_holding" unit="sec" step="0.01" />
                  <InputField label="보3" field="time_holding_3" unit="sec" step="0.01" />
                  <InputField label="보4" field="time_holding_4" unit="sec" step="0.01" />
                  <InputField label="냉각" field="time_cooling" unit="sec" step="0.01" />
                </div>
              )}
            </div>

            {/* 계량 속도 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Gauge} title="계량 속도" section="metering_speed" color="bg-cyan-500" />
              {expandedSections.metering_speed && (
                <div className="p-4 grid grid-cols-4 gap-3">
                  <InputField label="VP" field="metering_speed_vp" unit="" />
                  <InputField label="계1" field="metering_speed_1" unit="" />
                  <InputField label="계2" field="metering_speed_2" unit="" />
                  <InputField label="계3" field="metering_speed_3" unit="" />
                </div>
              )}
            </div>

            {/* 계량 위치 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Settings} title="계량 위치" section="metering_position" color="bg-lime-500" />
              {expandedSections.metering_position && (
                <div className="p-4 grid grid-cols-2 gap-3">
                  <InputField label="1" field="metering_position_1" unit="" />
                  <InputField label="2" field="metering_position_2" unit="" />
                </div>
              )}
            </div>

            {/* 계량 압력 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Gauge} title="계량 압력" section="metering_pressure" color="bg-amber-500" />
              {expandedSections.metering_pressure && (
                <div className="p-4 grid grid-cols-3 gap-3">
                  <InputField label="계2" field="metering_pressure_2" unit="" />
                  <InputField label="3" field="metering_pressure_3" unit="" />
                  <InputField label="4" field="metering_pressure_4" unit="" />
                </div>
              )}
            </div>

            {/* 만압 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Gauge} title="만압" section="full_pressure" color="bg-rose-500" />
              {expandedSections.full_pressure && (
                <div className="p-4 grid grid-cols-7 gap-3">
                  <InputField label="1차" field="full_pressure_1" unit="" />
                  <InputField label="2차" field="full_pressure_2" unit="" />
                  <InputField label="3차" field="full_pressure_3" unit="" />
                  <InputField label="4차" field="full_pressure_4" unit="" />
                  <InputField label="1H" field="full_pressure_1h" unit="" />
                  <InputField label="2H" field="full_pressure_2h" unit="" />
                  <InputField label="3H" field="full_pressure_3h" unit="" />
                </div>
              )}
            </div>

            {/* BARREL */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Thermometer} title="BARREL" section="barrel" color="bg-orange-500" />
              {expandedSections.barrel && (
                <div className="p-4 grid grid-cols-9 gap-2">
                  <InputField label="1" field="barrel_temp_1" unit="°C" />
                  <InputField label="2" field="barrel_temp_2" unit="°C" />
                  <InputField label="3" field="barrel_temp_3" unit="°C" />
                  <InputField label="4" field="barrel_temp_4" unit="°C" />
                  <InputField label="5" field="barrel_temp_5" unit="°C" />
                  <InputField label="6" field="barrel_temp_6" unit="°C" />
                  <InputField label="7" field="barrel_temp_7" unit="°C" />
                  <InputField label="8" field="barrel_temp_8" unit="°C" />
                  <InputField label="9" field="barrel_temp_9" unit="°C" />
                </div>
              )}
            </div>

            {/* H/R */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Thermometer} title="H/R" section="hr" color="bg-violet-500" />
              {expandedSections.hr && (
                <div className="p-4 grid grid-cols-4 gap-3">
                  <InputField label="1" field="hr_temp_1" unit="°C" />
                  <InputField label="2" field="hr_temp_2" unit="°C" />
                  <InputField label="3" field="hr_temp_3" unit="°C" />
                  <InputField label="4" field="hr_temp_4" unit="°C" />
                </div>
              )}
            </div>

            {/* 밸브게이트 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Settings} title="밸브게이트" section="valve_gate" color="bg-slate-500" />
              {expandedSections.valve_gate && (
                <div className="p-4 grid grid-cols-2 gap-3">
                  <InputField label="가동" field="valve_gate_moving" unit="" />
                  <InputField label="고정" field="valve_gate_fixed" unit="" />
                </div>
              )}
            </div>

            {/* 칠러온도 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Thermometer} title="칠러온도" section="chiller" color="bg-sky-500" />
              {expandedSections.chiller && (
                <div className="p-4 grid grid-cols-3 gap-3">
                  <InputField label="메인" field="chiller_temp_main" unit="°C" />
                  <InputField label="가동" field="chiller_temp_moving" unit="°C" />
                  <InputField label="고정" field="chiller_temp_fixed" unit="°C" />
                </div>
              )}
            </div>

            {/* 기타 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <SectionHeader icon={Settings} title="기타" section="other" color="bg-gray-500" />
              {expandedSections.other && (
                <div className="p-4 space-y-3">
                  <InputField label="사이클타임" field="cycle_time" unit="sec" step="0.01" />
                  <div className="pt-3">
                    <label className="text-sm text-gray-600 block mb-2">비고</label>
                    <textarea
                      value={formData.remarks || ''}
                      onChange={(e) => handleChange('remarks', e.target.value)}
                      disabled={!canEdit}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 변경 사유 (수정 시) */}
            {condition?.id && canEdit && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">변경 사유</label>
                <textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="변경 사유를 입력하세요..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}
          </div>

          {/* 사이드바 - 이력 */}
          {showHistory && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm sticky top-24">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <History size={18} />
                    변경 이력
                  </h3>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {condition?.history?.length > 0 ? (
                    <div className="divide-y">
                      {condition.history.map((item, idx) => (
                        <div key={idx} className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-800">{item.field_label}</span>
                            {item.status === 'approved' && <CheckCircle size={14} className="text-green-500" />}
                            {item.status === 'pending' && <Clock size={14} className="text-yellow-500" />}
                            {item.status === 'rejected' && <AlertCircle size={14} className="text-red-500" />}
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="line-through text-red-500">{item.old_value}</span>
                            {' → '}
                            <span className="text-green-600 font-medium">{item.new_value}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {item.changed_by_name} · {new Date(item.changed_at).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      <History size={32} className="mx-auto mb-2 opacity-50" />
                      <p>변경 이력이 없습니다</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
