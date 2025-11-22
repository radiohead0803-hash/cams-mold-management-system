import { useEffect, useState } from 'react'
import { alertAPI } from '../lib/api'
import { Bell, AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { format } from 'date-fns'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    loadAlerts()
  }, [filter])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const params = filter === 'unread' ? { is_read: false } : filter === 'read' ? { is_read: true } : {}
      const response = await alertAPI.getAll({ ...params, limit: 100 })
      setAlerts(response.data.data.items || [])
    } catch (error) {
      console.error('Failed to load alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (alertId) => {
    try {
      await alertAPI.markAsRead(alertId)
      loadAlerts()
    } catch (error) {
      console.error('Failed to mark alert as read:', error)
    }
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'shot_milestone':
        return <AlertCircle className="text-yellow-600" size={20} />
      case 'inspection_due':
        return <Bell className="text-orange-600" size={20} />
      case 'inspection_overdue':
        return <AlertCircle className="text-red-600" size={20} />
      case 'transfer_request':
        return <Info className="text-blue-600" size={20} />
      default:
        return <Bell className="text-gray-600" size={20} />
    }
  }

  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    }
    return styles[priority] || styles.medium
  }

  const getAlertTypeLabel = (type) => {
    const labels = {
      shot_milestone: 'Shot 마일스톤',
      inspection_due: '점검 예정',
      inspection_overdue: '점검 지연',
      transfer_request: '이관 요청',
      issue_reported: '이슈 발생'
    }
    return labels[type] || type
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">알림</h1>
        <p className="text-sm text-gray-600 mt-1">
          전체 {alerts.length}개의 알림
        </p>
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
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            읽지 않음
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'read'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            읽음
          </button>
        </div>
      </div>

      {/* 알림 목록 */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-500">알림이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`card ${
                !alert.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getAlertIcon(alert.alert_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {alert.title}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityBadge(alert.priority)}`}>
                          {alert.priority}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                          {getAlertTypeLabel(alert.alert_type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                    
                    {!alert.is_read && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                        title="읽음으로 표시"
                      >
                        <CheckCircle size={20} className="text-gray-400 hover:text-green-600" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {alert.created_at ? format(new Date(alert.created_at), 'yyyy-MM-dd HH:mm') : '-'}
                    </span>
                    {alert.is_read && alert.read_at && (
                      <span className="flex items-center gap-1">
                        <CheckCircle size={14} className="text-green-600" />
                        읽음: {format(new Date(alert.read_at), 'yyyy-MM-dd HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
