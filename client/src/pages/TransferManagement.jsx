import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { transferAPI } from '../lib/api'
import { ArrowRight, CheckCircle, Clock, XCircle, FileText, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export default function TransferManagement() {
  const navigate = useNavigate()
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, approved, rejected

  useEffect(() => {
    loadTransfers()
  }, [filter])

  const loadTransfers = async () => {
    try {
      setLoading(true)
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await transferAPI.getAll({ ...params, limit: 100 })
      setTransfers(response.data.data.items || [])
    } catch (error) {
      console.error('Failed to load transfers:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '승인 대기' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: '승인 완료' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '반려' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: '진행 중' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: '완료' }
    }
    const style = styles[status] || styles.pending
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />
      case 'rejected':
        return <XCircle className="text-red-600" size={20} />
      case 'pending':
      case 'in_progress':
        return <Clock className="text-yellow-600" size={20} />
      default:
        return <FileText className="text-gray-600" size={20} />
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">이관 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            금형 이관 요청 및 승인 관리
          </p>
        </div>
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
            승인 대기
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            승인 완료
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            반려
          </button>
        </div>
      </div>

      {/* 이관 목록 */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : transfers.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-500">이관 요청이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transfers.map((transfer) => (
            <div key={transfer.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(transfer.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {transfer.mold_number || `이관 #${transfer.id}`}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {transfer.transfer_type === 'plant_to_plant' && '공장 간 이관'}
                      {transfer.transfer_type === 'maker_to_plant' && '제작처 → 생산처'}
                      {transfer.transfer_type === 'plant_to_maker' && '생산처 → 제작처'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(transfer.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">출발지</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {transfer.from_location || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">도착지</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <ArrowRight size={14} className="text-gray-400" />
                    {transfer.to_location || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                <span>
                  요청일: {transfer.requested_at ? format(new Date(transfer.requested_at), 'yyyy-MM-dd HH:mm') : '-'}
                </span>
                {transfer.approved_at && (
                  <span>
                    승인일: {format(new Date(transfer.approved_at), 'yyyy-MM-dd HH:mm')}
                  </span>
                )}
              </div>

              {transfer.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <button className="btn-primary flex-1 text-sm">
                    승인
                  </button>
                  <button className="btn-secondary flex-1 text-sm">
                    반려
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 안내 메시지 */}
      <div className="mt-6 card bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <FileText className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">이관 프로세스 안내</p>
            <ul className="text-blue-800 space-y-1 list-disc list-inside text-xs">
              <li>이관 요청 시 4M 준비 체크리스트 작성 필요</li>
              <li>승인 후 이관 확인 체크리스트 작성</li>
              <li>모든 체크리스트 완료 시 이관 완료 처리</li>
              <li>이관 이력은 금형 상세 페이지에서 확인 가능</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
