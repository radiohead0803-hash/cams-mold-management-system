import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Copy, CheckCircle, Clock, FileText, X, GripVertical, Save } from 'lucide-react'

// 12단계 공정 기본값
const DEFAULT_DEVELOPMENT_STAGES = [
  { id: 'drawing_receipt', name: '도면접수', order: 1, defaultDays: 5 },
  { id: 'mold_base_order', name: '몰드베이스 발주', order: 2, defaultDays: 10 },
  { id: 'mold_design', name: '금형설계', order: 3, defaultDays: 25 },
  { id: 'drawing_review', name: '도면검토회', order: 4, defaultDays: 20 },
  { id: 'upper_machining', name: '상형가공', order: 5, defaultDays: 20 },
  { id: 'lower_machining', name: '하형가공', order: 6, defaultDays: 20 },
  { id: 'core_machining', name: '코어가공', order: 7, defaultDays: 14 },
  { id: 'discharge', name: '방전', order: 8, defaultDays: 15 },
  { id: 'surface_finish', name: '격면사상', order: 9, defaultDays: 10 },
  { id: 'mold_assembly', name: '금형조립', order: 10, defaultDays: 5 },
  { id: 'tryout', name: '습합', order: 11, defaultDays: 5 },
  { id: 'initial_to', name: '초도 T/O', order: 12, defaultDays: 5 }
]

export default function ChecklistMaster() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editingStages, setEditingStages] = useState([])
  const [editingCategories, setEditingCategories] = useState([])
  const [templateForm, setTemplateForm] = useState({
    name: '',
    version: '1.0',
    type: 'daily',
    deployedTo: []
  })

  // 금형체크리스트 기본 카테고리
  const DEFAULT_MOLD_CHECKLIST_CATEGORIES = [
    { id: 'material', name: 'Ⅰ. 원재료 (Material)', itemCount: 3 },
    { id: 'mold', name: 'Ⅱ. 금형 (Mold)', itemCount: 34 },
    { id: 'gas_vent', name: 'Ⅲ. 가스 빼기 (Gas Vent)', itemCount: 6 },
    { id: 'moldflow', name: 'Ⅳ. 성형 해석 (Moldflow 등)', itemCount: 6 },
    { id: 'sink_mark', name: 'Ⅴ. 싱크마크 (Sink Mark)', itemCount: 3 },
    { id: 'ejection', name: 'Ⅵ. 취출 (Ejection)', itemCount: 7 },
    { id: 'mic', name: 'Ⅶ. MIC 제품 (MICA 스펙클 등)', itemCount: 4 },
    { id: 'coating', name: 'Ⅷ. 도금 (Coating)', itemCount: 12 },
    { id: 'rear_back_beam', name: 'Ⅸ. 리어 백빔 (Rear Back Beam)', itemCount: 6 }
  ]

  // 임시 데이터
  useEffect(() => {
    // 실제로는 API 호출
    setTemplates([
      {
        id: 1,
        name: '일상점검 체크리스트 v1.0',
        version: '1.0',
        status: 'active',
        type: 'daily',
        itemCount: 6,
        deployedTo: ['제작처', '생산처'],
        lastModified: '2025-11-20',
        createdBy: 'admin'
      },
      {
        id: 2,
        name: '정기점검 체크리스트 v2.1',
        version: '2.1',
        status: 'active',
        type: 'periodic',
        itemCount: 12,
        deployedTo: ['생산처'],
        lastModified: '2025-11-15',
        createdBy: 'hq_manager'
      },
      {
        id: 3,
        name: '이관 체크리스트 v1.5',
        version: '1.5',
        status: 'draft',
        type: 'transfer',
        itemCount: 8,
        deployedTo: [],
        lastModified: '2025-11-18',
        createdBy: 'admin'
      },
      {
        id: 4,
        name: '개발계획 템플릿 v1.0',
        version: '1.0',
        status: 'active',
        type: 'development',
        itemCount: 12,
        deployedTo: ['제작처'],
        lastModified: '2025-12-08',
        createdBy: 'admin',
        stages: [
          '도면접수', '몰드베이스 발주', '금형설계', '도면검토회',
          '상형가공', '하형가공', '코어가공', '방전',
          '겉면사상', '금형조립', '습합', '초도 T/O'
        ]
      },
      {
        id: 5,
        name: '금형체크리스트 v1.0',
        version: '1.0',
        status: 'active',
        type: 'mold_checklist',
        itemCount: 81,
        deployedTo: ['제작처', '생산처'],
        lastModified: '2025-12-08',
        createdBy: 'admin',
        categories: [
          { id: 'material', name: 'Ⅰ. 원재료 (Material)', itemCount: 3 },
          { id: 'mold', name: 'Ⅱ. 금형 (Mold)', itemCount: 34 },
          { id: 'gas_vent', name: 'Ⅲ. 가스 빼기 (Gas Vent)', itemCount: 6 },
          { id: 'moldflow', name: 'Ⅳ. 성형 해석 (Moldflow 등)', itemCount: 6 },
          { id: 'sink_mark', name: 'Ⅴ. 싱크마크 (Sink Mark)', itemCount: 3 },
          { id: 'ejection', name: 'Ⅵ. 취출 (Ejection)', itemCount: 7 },
          { id: 'mic', name: 'Ⅶ. MIC 제품 (MICA 스펙클 등)', itemCount: 4 },
          { id: 'coating', name: 'Ⅷ. 도금 (Coating)', itemCount: 12 },
          { id: 'rear_back_beam', name: 'Ⅸ. 리어 백빔 (Rear Back Beam)', itemCount: 6 }
        ]
      },
      {
        id: 6,
        name: '금형육성 체크리스트 v1.0',
        version: '1.0',
        status: 'draft',
        type: 'nurturing',
        itemCount: 10,
        deployedTo: [],
        lastModified: '2025-12-08',
        createdBy: 'admin'
      },
      {
        id: 7,
        name: '경도측정 기록표 v1.0',
        version: '1.0',
        status: 'active',
        type: 'hardness',
        itemCount: 5,
        deployedTo: ['제작처'],
        lastModified: '2025-12-08',
        createdBy: 'admin'
      }
    ])
    setLoading(false)
  }, [])

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: '활성', icon: CheckCircle },
      draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '초안', icon: Clock },
      archived: { bg: 'bg-gray-100', text: 'text-gray-800', label: '보관', icon: FileText }
    }
    const style = styles[status] || styles.draft
    const Icon = style.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${style.bg} ${style.text}`}>
        <Icon size={12} />
        {style.label}
      </span>
    )
  }

  const getTypeBadge = (type) => {
    const types = {
      daily: { label: '일상점검', color: 'bg-blue-100 text-blue-700' },
      periodic: { label: '정기점검', color: 'bg-purple-100 text-purple-700' },
      transfer: { label: '이관', color: 'bg-cyan-100 text-cyan-700' },
      development: { label: '개발계획', color: 'bg-orange-100 text-orange-700' },
      mold_checklist: { label: '금형체크', color: 'bg-green-100 text-green-700' },
      nurturing: { label: '금형육성', color: 'bg-pink-100 text-pink-700' },
      hardness: { label: '경도측정', color: 'bg-red-100 text-red-700' }
    }
    const typeInfo = types[type] || { label: type, color: 'bg-gray-100 text-gray-700' }
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    )
  }

  const handleCreateNew = () => {
    setEditingTemplate(null)
    setTemplateForm({
      name: '',
      version: '1.0',
      type: 'daily',
      deployedTo: []
    })
    setEditingStages([])
    setShowModal(true)
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      version: template.version,
      type: template.type,
      deployedTo: template.deployedTo || []
    })
    // 개발계획 템플릿인 경우 단계 로드
    if (template.type === 'development') {
      setEditingStages(template.stages ? 
        template.stages.map((name, idx) => ({
          id: `stage_${idx}`,
          name,
          order: idx + 1,
          defaultDays: DEFAULT_DEVELOPMENT_STAGES[idx]?.defaultDays || 5
        })) : 
        [...DEFAULT_DEVELOPMENT_STAGES]
      )
      setEditingCategories([])
    } else if (template.type === 'mold_checklist') {
      // 금형체크리스트인 경우 카테고리 로드
      setEditingCategories(template.categories || [...DEFAULT_MOLD_CHECKLIST_CATEGORIES])
      setEditingStages([])
    } else {
      setEditingStages([])
      setEditingCategories([])
    }
    setShowModal(true)
  }

  const handleStageChange = (index, field, value) => {
    setEditingStages(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleAddStage = () => {
    setEditingStages(prev => [
      ...prev,
      { id: `stage_${Date.now()}`, name: '새 단계', order: prev.length + 1, defaultDays: 5 }
    ])
  }

  const handleRemoveStage = (index) => {
    setEditingStages(prev => prev.filter((_, i) => i !== index))
  }

  // 금형체크리스트 카테고리 핸들러
  const handleCategoryChange = (index, field, value) => {
    setEditingCategories(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleAddCategory = () => {
    setEditingCategories(prev => [
      ...prev,
      { id: `cat_${Date.now()}`, name: '새 카테고리', itemCount: 0 }
    ])
  }

  const handleRemoveCategory = (index) => {
    setEditingCategories(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveTemplate = () => {
    // 타입에 따라 itemCount 계산
    let itemCount = 0
    if (templateForm.type === 'development') {
      itemCount = editingStages.length
    } else if (templateForm.type === 'mold_checklist') {
      itemCount = editingCategories.reduce((sum, cat) => sum + (cat.itemCount || 0), 0)
    }

    if (editingTemplate) {
      // 수정
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { 
              ...t, 
              ...templateForm,
              stages: templateForm.type === 'development' ? editingStages.map(s => s.name) : undefined,
              categories: templateForm.type === 'mold_checklist' ? editingCategories : undefined,
              itemCount: itemCount || t.itemCount,
              lastModified: new Date().toISOString().split('T')[0]
            } 
          : t
      ))
    } else {
      // 새로 생성
      const newTemplate = {
        id: Date.now(),
        ...templateForm,
        status: 'draft',
        stages: templateForm.type === 'development' ? editingStages.map(s => s.name) : undefined,
        categories: templateForm.type === 'mold_checklist' ? editingCategories : undefined,
        itemCount: itemCount || 0,
        lastModified: new Date().toISOString().split('T')[0],
        createdBy: 'admin'
      }
      setTemplates(prev => [...prev, newTemplate])
    }
    setShowModal(false)
    alert('저장되었습니다.')
  }

  const handleDuplicate = (template) => {
    const newTemplate = {
      ...template,
      id: Date.now(),
      name: `${template.name} (복사본)`,
      version: '1.0',
      status: 'draft',
      deployedTo: []
    }
    setTemplates([...templates, newTemplate])
  }

  const handleDelete = (templateId) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setTemplates(templates.filter(t => t.id !== templateId))
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">체크리스트 마스터 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            체크리스트 템플릿 생성, 수정 및 배포 관리
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          새 템플릿 생성
        </button>
      </div>

      {/* 템플릿 목록 */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {getStatusBadge(template.status)}
                    {getTypeBadge(template.type)}
                  </div>
                  <p className="text-sm text-gray-600">버전 {template.version}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">점검 항목</p>
                  <p className="font-medium">{template.itemCount}개</p>
                </div>
                <div>
                  <p className="text-gray-600">배포 대상</p>
                  <p className="font-medium">
                    {template.deployedTo.length > 0
                      ? template.deployedTo.join(', ')
                      : '미배포'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">최종 수정</p>
                  <p className="font-medium">{template.lastModified}</p>
                </div>
                <div>
                  <p className="text-gray-600">작성자</p>
                  <p className="font-medium">{template.createdBy}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => handleEdit(template)}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1"
                >
                  <Edit size={16} />
                  수정
                </button>
                <button
                  onClick={() => handleDuplicate(template)}
                  className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1"
                >
                  <Copy size={16} />
                  복제
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="px-3 btn-secondary text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="mt-6 card bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">체크리스트 마스터 관리 안내</p>
            <ul className="text-blue-800 space-y-1 list-disc list-inside text-xs">
              <li>템플릿 생성 후 점검 항목을 추가하세요</li>
              <li>버전 관리를 통해 변경 이력을 추적합니다</li>
              <li>활성화된 템플릿만 협력사에 배포됩니다</li>
              <li>배포 후에는 자동으로 현장 앱에 반영됩니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 템플릿 편집 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTemplate ? '템플릿 수정' : '새 템플릿 생성'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">템플릿 이름</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="템플릿 이름 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">버전</label>
                  <input
                    type="text"
                    value={templateForm.version}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, version: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => {
                      setTemplateForm(prev => ({ ...prev, type: e.target.value }))
                      if (e.target.value === 'development') {
                        setEditingStages([...DEFAULT_DEVELOPMENT_STAGES])
                        setEditingCategories([])
                      } else if (e.target.value === 'mold_checklist') {
                        setEditingCategories([...DEFAULT_MOLD_CHECKLIST_CATEGORIES])
                        setEditingStages([])
                      } else {
                        setEditingStages([])
                        setEditingCategories([])
                      }
                    }}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="daily">일상점검</option>
                    <option value="periodic">정기점검</option>
                    <option value="transfer">이관</option>
                    <option value="development">개발계획</option>
                    <option value="mold_checklist">금형체크</option>
                    <option value="nurturing">금형육성</option>
                    <option value="hardness">경도측정</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">배포 대상</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={templateForm.deployedTo.includes('제작처')}
                        onChange={(e) => {
                          setTemplateForm(prev => ({
                            ...prev,
                            deployedTo: e.target.checked 
                              ? [...prev.deployedTo, '제작처']
                              : prev.deployedTo.filter(d => d !== '제작처')
                          }))
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">제작처</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={templateForm.deployedTo.includes('생산처')}
                        onChange={(e) => {
                          setTemplateForm(prev => ({
                            ...prev,
                            deployedTo: e.target.checked 
                              ? [...prev.deployedTo, '생산처']
                              : prev.deployedTo.filter(d => d !== '생산처')
                          }))
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">생산처</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 개발계획 단계 편집 */}
              {(templateForm.type === 'development' || editingStages.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">개발 단계 관리 (12단계)</h3>
                    <button
                      onClick={handleAddStage}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm flex items-center gap-1 hover:bg-blue-200"
                    >
                      <Plus size={14} /> 단계 추가
                    </button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-12">순서</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">단계명</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-32">기본 소요일</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 w-16">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {editingStages.map((stage, index) => (
                          <tr key={stage.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2 text-gray-400">
                                <GripVertical size={16} />
                                <span className="text-sm font-medium">{index + 1}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={stage.name}
                                onChange={(e) => handleStageChange(index, 'name', e.target.value)}
                                className="w-full border rounded px-2 py-1 text-sm"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={stage.defaultDays}
                                  onChange={(e) => handleStageChange(index, 'defaultDays', parseInt(e.target.value) || 0)}
                                  className="w-20 border rounded px-2 py-1 text-sm text-center"
                                />
                                <span className="text-sm text-gray-500">일</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => handleRemoveStage(index)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    * 단계를 드래그하여 순서를 변경할 수 있습니다. 기본 소요일은 개발계획 생성 시 자동으로 적용됩니다.
                  </p>
                </div>
              )}

              {/* 금형체크리스트 카테고리 편집 */}
              {(templateForm.type === 'mold_checklist' || editingCategories.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">체크리스트 카테고리 관리 (9개 카테고리, 81개 항목)</h3>
                    <button
                      onClick={handleAddCategory}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1 hover:bg-green-200"
                    >
                      <Plus size={14} /> 카테고리 추가
                    </button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-12">순서</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">카테고리명</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-32">항목 수</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 w-16">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {editingCategories.map((category, index) => (
                          <tr key={category.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2 text-gray-400">
                                <GripVertical size={16} />
                                <span className="text-sm font-medium">{index + 1}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                value={category.name}
                                onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                                className="w-full border rounded px-2 py-1 text-sm"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={category.itemCount}
                                  onChange={(e) => handleCategoryChange(index, 'itemCount', parseInt(e.target.value) || 0)}
                                  className="w-20 border rounded px-2 py-1 text-sm text-center"
                                />
                                <span className="text-sm text-gray-500">개</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => handleRemoveCategory(index)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">총 항목 수: {editingCategories.reduce((sum, cat) => sum + (cat.itemCount || 0), 0)}개</p>
                    <p className="text-xs text-blue-600 mt-1">* 각 카테고리의 세부 항목은 금형체크리스트 페이지에서 관리됩니다.</p>
                  </div>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Save size={16} />
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
