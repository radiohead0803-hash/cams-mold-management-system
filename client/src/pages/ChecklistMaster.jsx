import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Copy, CheckCircle, Clock, FileText } from 'lucide-react'

export default function ChecklistMaster() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  // 임시 데이터
  useEffect(() => {
    // 실제로는 API 호출
    setTemplates([
      {
        id: 1,
        name: '일상점검 체크리스트 v1.0',
        version: '1.0',
        status: 'active',
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
        itemCount: 8,
        deployedTo: [],
        lastModified: '2025-11-18',
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

  const handleCreateNew = () => {
    setEditingTemplate(null)
    setShowModal(true)
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setShowModal(true)
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
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {getStatusBadge(template.status)}
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

      {/* 모달은 추후 구현 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingTemplate ? '템플릿 수정' : '새 템플릿 생성'}
            </h2>
            <p className="text-gray-600 mb-4">템플릿 편집 기능은 추후 구현됩니다.</p>
            <button
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
