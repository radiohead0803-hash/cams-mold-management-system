import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Calendar, PieChart } from 'lucide-react'
import api from '../../lib/api'

/**
 * 모바일 사출조건 변경관리 통계 페이지
 */
export default function MobileInjectionStats() {
  const { moldId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [statsData, setStatsData] = useState(null)
  const [period, setPeriod] = useState('month') // week, month, quarter, year

  useEffect(() => {
    loadStatsData()
  }, [moldId, period])

  const loadStatsData = async () => {
    try {
      setLoading(true)
      // API 호출 (실제 구현 시 백엔드 API 연동)
      const response = await api.get(`/mold-specifications/${moldId}/injection-stats?period=${period}`).catch(() => null)
      if (response?.data?.data) {
        setStatsData(response.data.data)
      } else {
        // 샘플 데이터
        setStatsData({
          summary: {
            total_changes: 24,
            approved: 20,
            pending: 3,
            rejected: 1,
            approval_rate: 83.3
          },
          by_type: [
            { type: 'temperature', label: '온도', count: 8, percentage: 33.3 },
            { type: 'pressure', label: '압력', count: 7, percentage: 29.2 },
            { type: 'speed', label: '속도', count: 5, percentage: 20.8 },
            { type: 'metering', label: '계량', count: 4, percentage: 16.7 }
          ],
          by_month: [
            { month: '10월', count: 5 },
            { month: '11월', count: 8 },
            { month: '12월', count: 11 }
          ],
          top_changers: [
            { name: '김철수', count: 10 },
            { name: '이영희', count: 8 },
            { name: '박민수', count: 6 }
          ],
          recent_trend: {
            direction: 'up',
            percentage: 15.5,
            message: '전월 대비 변경 건수 증가'
          }
        })
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'temperature': return 'bg-red-500'
      case 'pressure': return 'bg-blue-500'
      case 'speed': return 'bg-green-500'
      case 'metering': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="mr-3">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold">변경관리 통계</h1>
            <p className="text-xs text-rose-100">금형 #{moldId}</p>
          </div>
        </div>
      </div>

      {/* 기간 선택 */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          {[
            { value: 'week', label: '주간' },
            { value: 'month', label: '월간' },
            { value: 'quarter', label: '분기' },
            { value: 'year', label: '연간' }
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                period === p.value
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 요약 카드 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={18} className="text-rose-500" />
              <span className="text-sm text-gray-500">총 변경</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{statsData?.summary?.total_changes || 0}</p>
            <p className="text-xs text-gray-400">건</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <PieChart size={18} className="text-green-500" />
              <span className="text-sm text-gray-500">승인율</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{statsData?.summary?.approval_rate || 0}%</p>
            <p className="text-xs text-gray-400">{statsData?.summary?.approved || 0}건 승인</p>
          </div>
        </div>

        {/* 트렌드 */}
        {statsData?.recent_trend && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statsData.recent_trend.direction === 'up' ? (
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingUp size={20} className="text-red-500" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingDown size={20} className="text-green-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-800">{statsData.recent_trend.message}</p>
                  <p className={`text-sm ${statsData.recent_trend.direction === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                    {statsData.recent_trend.direction === 'up' ? '+' : '-'}{statsData.recent_trend.percentage}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 유형별 통계 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">유형별 변경 현황</h3>
          <div className="space-y-3">
            {statsData?.by_type?.map(item => (
              <div key={item.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium">{item.count}건 ({item.percentage}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getTypeColor(item.type)} rounded-full transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 월별 추이 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">월별 변경 추이</h3>
          <div className="flex items-end justify-between h-32 gap-2">
            {statsData?.by_month?.map((item, idx) => {
              const maxCount = Math.max(...statsData.by_month.map(m => m.count))
              const height = (item.count / maxCount) * 100
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-rose-400 rounded-t transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <p className="text-xs text-gray-500 mt-2">{item.month}</p>
                  <p className="text-xs font-medium">{item.count}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 변경자 순위 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">변경자 순위</h3>
          <div className="space-y-3">
            {statsData?.top_changers?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                    idx === 1 ? 'bg-gray-300 text-gray-700' :
                    idx === 2 ? 'bg-orange-300 text-orange-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="font-medium text-gray-800">{item.count}건</span>
              </div>
            ))}
          </div>
        </div>

        {/* 상태별 현황 */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">상태별 현황</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{statsData?.summary?.approved || 0}</p>
              <p className="text-xs text-green-700">승인</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{statsData?.summary?.pending || 0}</p>
              <p className="text-xs text-yellow-700">대기</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{statsData?.summary?.rejected || 0}</p>
              <p className="text-xs text-red-700">반려</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
