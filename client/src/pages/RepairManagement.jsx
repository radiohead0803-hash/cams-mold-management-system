import { useState, useEffect } from 'react'
import { Wrench, AlertTriangle, CheckCircle, Clock, DollarSign, FileText } from 'lucide-react'
import { format } from 'date-fns'

export default function RepairManagement() {
  const [repairs, setRepairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, in_progress, completed

  // 임시 데이터
  useEffect(() => {
    setRepairs([
      {
        id: 1,
        moldNumber: 'M-2024-001',
        moldName: '프론트 범퍼',
        issueType: 'major',
        severity: 'Major',
        description: '코어 핀 파손',
        reportedBy: 'plant1',
        reportedAt: '2025-11-20T10:30:00',
        status: 'pending',
        liability: null,
        estimatedCost: 500000,
        actualCost: null
      },
      {
        id: 2,
        moldNumber: 'M-2024-002',
        moldName: '리어 램프',
        issueType: 'minor',
        severity: 'Minor',
        description: '냉각수 미세 누수',
        reportedBy: 'maker1',
        reportedAt: '2025-11-19T14:20:00',
        status: 'in_progress',
        liability: 'maker',
        estimatedCost: 150000,
        actualCost: null
      },
      {
        id: 3,
        moldNumber: 'M-2024-001',
        moldName: '프론트 범퍼',
        issueType: 'critical',
        severity: 'Critical',
        description: '슬라이드 작동 불량 - 생산 중단',
        reportedBy: 'plant1',
        reportedAt: '2025-11-18T09:15:00',
        status: 'completed',
        liability: 'natural_wear',
        estimatedCost: 1200000,
        actualCost: 1150000
      }
    ])
    setLoading(false)
  }, [])

  const getSeverityBadge = (severity) => {
    const styles = {
      Minor: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
      Major: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle },
      Critical: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle }
    }
    const style = styles[severity] || styles.Minor
    const Icon = style.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${style.bg} ${style.text}`}>
        <Icon size={12} />
        {severity}
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '대기 중' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: '진행 중' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: '완료' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: '취소' }
    }
    const style = styles[status] || styles.pending
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
        <button className="btn-primary flex items-center gap-2">
          <Wrench size={20} />
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
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            대기 중
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
                      {repair.moldNumber} - {repair.moldName}
                    </h3>
                    {getSeverityBadge(repair.severity)}
                    {getStatusBadge(repair.status)}
                  </div>
                  <p className="text-sm text-gray-600">{repair.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">보고자</p>
                  <p className="font-medium">{repair.reportedBy}</p>
                </div>
                <div>
                  <p className="text-gray-600">보고일시</p>
                  <p className="font-medium">
                    {format(new Date(repair.reportedAt), 'yyyy-MM-dd HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">귀책</p>
                  <p className="font-medium">{getLiabilityLabel(repair.liability)}</p>
                </div>
                <div>
                  <p className="text-gray-600">예상 비용</p>
                  <p className="font-medium text-primary-600">
                    {repair.estimatedCost?.toLocaleString()}원
                  </p>
                </div>
              </div>

              {repair.actualCost && (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="text-gray-600">실제 비용:</span>
                    <span className="font-medium text-green-600">
                      {repair.actualCost.toLocaleString()}원
                    </span>
                  </div>
                </div>
              )}

              {repair.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <button className="btn-primary flex-1 text-sm">
                    수리 시작
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
    </div>
  )
}
