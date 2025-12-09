import { useState, useEffect } from 'react'
import { Wrench, AlertTriangle, CheckCircle, Clock, DollarSign, FileText, X, Search, Plus } from 'lucide-react'
import { format } from 'date-fns'
import api from '../lib/api'

export default function RepairManagement() {
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, requested, approved, in_progress, completed
  const [showModal, setShowModal] = useState(false)
  const [molds, setMolds] = useState([])
  const [searchMold, setSearchMold] = useState('')
  const [selectedMold, setSelectedMold] = useState(null)
  const [formData, setFormData] = useState({
    issue_type: '',
    severity: 'medium',
    issue_description: '',
    estimated_cost: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // 수리요청 목록 조회
  const fetchRepairs = async () => {
    try {
      setLoading(true)
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await api.get('/repair-requests', { params })
      if (response.data.success) {
        setRepairs(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch repairs:', error)
      setRepairs([])
    } finally {
      setLoading(false)
    }
  }

  // 금형 목록 조회
  const fetchMolds = async () => {
    try {
      const response = await api.get('/mold-specifications')
      if (response.data.success) {
        setMolds(response.data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch molds:', error)
    }
  }

  useEffect(() => {
    fetchRepairs()
    fetchMolds()
  }, [filter])

  // 수리요청 생성
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedMold) {
      alert('금형을 선택해주세요.')
      return
    }
    if (!formData.issue_type || !formData.issue_description) {
      alert('불량 유형과 상세 내용을 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      const response = await api.post('/repair-requests', {
        mold_id: selectedMold.mold_id,
        mold_spec_id: selectedMold.id,
        issue_type: formData.issue_type,
        severity: formData.severity,
        issue_description: formData.issue_description,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null
      })

      if (response.data.success) {
        alert('수리요청이 등록되었습니다.')
        setShowModal(false)
        setSelectedMold(null)
        setFormData({ issue_type: '', severity: 'medium', issue_description: '', estimated_cost: '' })
        fetchRepairs()
      }
    } catch (error) {
      console.error('Failed to create repair request:', error)
      alert(error.response?.data?.error?.message || '수리요청 등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 금형 검색 필터
  const filteredMolds = molds.filter(m => 
    m.mold_number?.toLowerCase().includes(searchMold.toLowerCase()) ||
    m.mold_name?.toLowerCase().includes(searchMold.toLowerCase())
  )

  const getSeverityBadge = (severity) => {
    const severityMap = {
      low: { bg: 'bg-blue-100', text: 'text-blue-800', label: '낮음', icon: CheckCircle },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '보통', icon: AlertTriangle },
      high: { bg: 'bg-orange-100', text: 'text-orange-800', label: '높음', icon: AlertTriangle },
      urgent: { bg: 'bg-red-100', text: 'text-red-800', label: '긴급', icon: AlertTriangle }
    }
    const style = severityMap[severity] || severityMap.medium
    const Icon = style.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${style.bg} ${style.text}`}>
        <Icon size={12} />
        {style.label}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const styles = {
      requested: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '요청됨' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', label: '승인됨' },
      in_progress: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: '진행 중' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: '완료' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '반려' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: '취소' }
    }
    const style = styles[status] || styles.requested
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  const getLiabilityLabel = (liability) => {
    const labels = {
      maker: '제작처',
      plant: '생산처',
      natural_wear: '자연마모',
      other: '기타'
    }
    return labels[liability] || '미정'
  }

  const filteredRepairs = repairs.filter(repair => {
    if (filter === 'all') return true
    return repair.status === filter
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">금형 수리 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            NG 처리 및 수리 요청 관리
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          수리 요청
        </button>
      </div>

      {/* 필터 */}
      <div className="card mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('requested')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'requested'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            요청됨
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            승인됨
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'in_progress'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            진행 중
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            완료
          </button>
        </div>
      </div>

      {/* 수리 목록 */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : filteredRepairs.length === 0 ? (
        <div className="card text-center py-12">
          <Wrench className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-500">수리 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRepairs.map((repair) => (
            <div key={repair.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {repair.mold_number || repair.moldNumber} - {repair.mold_name || repair.moldName}
                    </h3>
                    {getSeverityBadge(repair.severity)}
                    {getStatusBadge(repair.status)}
                  </div>
                  <p className="text-sm text-gray-600">{repair.issue_description || repair.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">불량 유형</p>
                  <p className="font-medium">{repair.issue_type || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-600">요청일시</p>
                  <p className="font-medium">
                    {repair.created_at ? format(new Date(repair.created_at), 'yyyy-MM-dd HH:mm') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">귀책</p>
                  <p className="font-medium">{getLiabilityLabel(repair.blame_party || repair.liability)}</p>
                </div>
                <div>
                  <p className="text-gray-600">예상 비용</p>
                  <p className="font-medium text-primary-600">
                    {repair.estimated_cost ? `${Number(repair.estimated_cost).toLocaleString()}원` : '-'}
                  </p>
                </div>
              </div>

              {repair.actual_cost && (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="text-gray-600">실제 비용:</span>
                    <span className="font-medium text-green-600">
                      {Number(repair.actual_cost).toLocaleString()}원
                    </span>
                  </div>
                </div>
              )}

              {repair.status === 'requested' && (
                <div className="mt-4 flex gap-2">
                  <button className="btn-primary flex-1 text-sm">
                    승인
                  </button>
                  <button className="btn-secondary flex-1 text-sm">
                    귀책 협의
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NG 자동 연계 안내 */}
      <div className="mt-6 card bg-yellow-50 border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-medium text-yellow-900 mb-2">NG 자동 연계 프로세스</p>
            <div className="space-y-2 text-yellow-800">
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-20">Minor:</span>
                <span>협력사 자체 조치 → 일상점검 시 기록</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-20">Major:</span>
                <span>수리 요청 필요 → 귀책 협의 → 수리 진행</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold min-w-20">Critical:</span>
                <span>생산 중단 + 본사 즉시 알림 → 긴급 수리</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 수리요청 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">수리 요청 등록</h2>
              <button 
                onClick={() => {
                  setShowModal(false)
                  setSelectedMold(null)
                  setSearchMold('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* 금형 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대상 금형 <span className="text-red-500">*</span>
                </label>
                {selectedMold ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">{selectedMold.mold_number}</p>
                      <p className="text-sm text-blue-700">{selectedMold.mold_name}</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setSelectedMold(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      변경
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={searchMold}
                        onChange={(e) => setSearchMold(e.target.value)}
                        placeholder="금형번호 또는 금형명 검색..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      {filteredMolds.slice(0, 10).map((mold) => (
                        <button
                          key={mold.id}
                          type="button"
                          onClick={() => {
                            setSelectedMold(mold)
                            setSearchMold('')
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <p className="font-medium">{mold.mold_number}</p>
                          <p className="text-sm text-gray-500">{mold.mold_name}</p>
                        </button>
                      ))}
                      {filteredMolds.length === 0 && (
                        <p className="p-3 text-center text-gray-500">검색 결과가 없습니다.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 불량 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  불량 유형 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.issue_type}
                  onChange={(e) => setFormData({ ...formData, issue_type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">선택해주세요</option>
                  <option value="SHORT_SHOT">쇼트샷 (Short Shot)</option>
                  <option value="FLASH">플래시 (Flash)</option>
                  <option value="BURN">번 (Burn)</option>
                  <option value="CRACK">크랙 (Crack)</option>
                  <option value="DEFORMATION">변형 (Deformation)</option>
                  <option value="WEAR">마모 (Wear)</option>
                  <option value="CONTAMINATION">오염 (Contamination)</option>
                  <option value="MALFUNCTION">작동불량 (Malfunction)</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>

              {/* 긴급도 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">긴급도</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'low', label: '낮음', color: 'blue' },
                    { value: 'medium', label: '보통', color: 'yellow' },
                    { value: 'high', label: '높음', color: 'orange' },
                    { value: 'urgent', label: '긴급', color: 'red' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: opt.value })}
                      className={`p-2 rounded-lg border-2 text-sm font-medium transition ${
                        formData.severity === opt.value
                          ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 상세 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상세 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.issue_description}
                  onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                  placeholder="불량 현상, 발생 위치, 재현 조건 등을 상세히 입력해주세요."
                  className="w-full px-4 py-2 border rounded-lg h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* 예상 비용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">예상 비용 (원)</label>
                <input
                  type="number"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  placeholder="예상 수리 비용"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedMold(null)
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={submitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedMold || !formData.issue_type || !formData.issue_description}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {submitting ? '등록 중...' : '수리 요청'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
