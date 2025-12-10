import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Calendar, PieChart, Download, Users } from 'lucide-react'
import { injectionConditionAPI } from '../lib/api'

/**
 * PC 사출조건 변경관리 통계 페이지
 */
export default function InjectionStats() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const moldId = searchParams.get('moldId')
  
  const [loading, setLoading] = useState(true)
  const [statsData, setStatsData] = useState(null)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    if (moldId) {
      loadStatsData()
    }
  }, [moldId, period])

  const loadStatsData = async () => {
    try {
      setLoading(true)
      const response = await injectionConditionAPI.getStats({ mold_spec_id: moldId, period }).catch(() => null)
      if (response?.data?.data && response.data.data.summary?.total_changes > 0) {
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
            { month: '7월', count: 3 },
            { month: '8월', count: 4 },
            { month: '9월', count: 6 },
            { month: '10월', count: 5 },
            { month: '11월', count: 8 },
            { month: '12월', count: 11 }
          ],
          top_changers: [
            { name: '김철수', count: 10, department: '생산1팀' },
            { name: '이영희', count: 8, department: '품질팀' },
            { name: '박민수', count: 6, department: '생산2팀' }
          ],
          recent_trend: {
            direction: 'up',
            percentage: 15.5,
            message: '전월 대비 변경 건수 증가'
          },
          avg_approval_time: '2.3일'
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

  const getTypeBgColor = (type) => {
    switch (type) {
      case 'temperature': return 'bg-red-100 text-red-700'
      case 'pressure': return 'bg-blue-100 text-blue-700'
      case 'speed': return 'bg-green-100 text-green-700'
      case 'metering': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">변경관리 통계</h1>
                <p className="text-sm text-gray-500">금형 #{moldId} - 사출조건 변경 분석</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 기간 선택 */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                {[
                  { value: 'week', label: '주간' },
                  { value: 'month', label: '월간' },
                  { value: 'quarter', label: '분기' },
                  { value: 'year', label: '연간' }
                ].map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      period === p.value
                        ? 'bg-white text-rose-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors">
                <Download size={18} />
                리포트 다운로드
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <BarChart3 size={24} className="text-rose-600" />
              </div>
              <span className="text-sm text-gray-500">총 변경</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{statsData?.summary?.total_changes || 0}</p>
            <p className="text-sm text-gray-400 mt-1">건</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <PieChart size={24} className="text-green-600" />
              </div>
              <span className="text-sm text-gray-500">승인율</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{statsData?.summary?.approval_rate || 0}%</p>
            <p className="text-sm text-gray-400 mt-1">{statsData?.summary?.approved || 0}건 승인</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Calendar size={24} className="text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">평균 승인시간</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{statsData?.avg_approval_time || '-'}</p>
            <p className="text-sm text-gray-400 mt-1">소요</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">대기 중</span>
            </div>
            <p className="text-3xl font-bold text-orange-600">{statsData?.summary?.pending || 0}</p>
            <p className="text-sm text-gray-400 mt-1">건</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            {statsData?.recent_trend && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    statsData.recent_trend.direction === 'up' ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {statsData.recent_trend.direction === 'up' ? (
                      <TrendingUp size={24} className="text-red-600" />
                    ) : (
                      <TrendingDown size={24} className="text-green-600" />
                    )}
                  </div>
                  <span className="text-sm text-gray-500">추세</span>
                </div>
                <p className={`text-3xl font-bold ${
                  statsData.recent_trend.direction === 'up' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {statsData.recent_trend.direction === 'up' ? '+' : '-'}{statsData.recent_trend.percentage}%
                </p>
                <p className="text-sm text-gray-400 mt-1">전월 대비</p>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* 유형별 통계 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">유형별 변경 현황</h3>
            <div className="space-y-4">
              {statsData?.by_type?.map(item => (
                <div key={item.type}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={`px-2 py-1 rounded ${getTypeBgColor(item.type)}`}>{item.label}</span>
                    <span className="font-medium text-gray-700">{item.count}건 ({item.percentage}%)</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getTypeColor(item.type)} rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 파이 차트 시각화 */}
            <div className="mt-6 flex justify-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {statsData?.by_type?.reduce((acc, item, idx) => {
                    const offset = acc.offset
                    const dashArray = `${item.percentage} ${100 - item.percentage}`
                    acc.elements.push(
                      <circle
                        key={item.type}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={idx === 0 ? '#ef4444' : idx === 1 ? '#3b82f6' : idx === 2 ? '#22c55e' : '#a855f7'}
                        strokeWidth="20"
                        strokeDasharray={dashArray}
                        strokeDashoffset={-offset}
                      />
                    )
                    acc.offset += item.percentage
                    return acc
                  }, { elements: [], offset: 0 }).elements}
                </svg>
              </div>
            </div>
          </div>

          {/* 월별 추이 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">월별 변경 추이</h3>
            <div className="flex items-end justify-between h-48 gap-3">
              {statsData?.by_month?.map((item, idx) => {
                const maxCount = Math.max(...statsData.by_month.map(m => m.count))
                const height = (item.count / maxCount) * 100
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <span className="text-sm font-medium text-gray-700 mb-2">{item.count}</span>
                    <div 
                      className="w-full bg-gradient-to-t from-rose-500 to-pink-400 rounded-t-lg transition-all hover:from-rose-600 hover:to-pink-500"
                      style={{ height: `${height}%` }}
                    />
                    <p className="text-xs text-gray-500 mt-2">{item.month}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 변경자 순위 & 상태별 현황 */}
          <div className="space-y-6">
            {/* 변경자 순위 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">변경자 순위</h3>
              <div className="space-y-3">
                {statsData?.top_changers?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                        idx === 1 ? 'bg-gray-300 text-gray-700' :
                        idx === 2 ? 'bg-orange-300 text-orange-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.department}</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-700">{item.count}건</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 상태별 현황 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">상태별 현황</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-600">{statsData?.summary?.approved || 0}</p>
                  <p className="text-sm text-green-700 mt-1">승인</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-yellow-600">{statsData?.summary?.pending || 0}</p>
                  <p className="text-sm text-yellow-700 mt-1">대기</p>
                </div>
                <div className="p-4 bg-red-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-red-600">{statsData?.summary?.rejected || 0}</p>
                  <p className="text-sm text-red-700 mt-1">반려</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
