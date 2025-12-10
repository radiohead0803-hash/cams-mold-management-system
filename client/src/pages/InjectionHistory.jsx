import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, History, Calendar, User, FileText, ChevronDown, ChevronUp, Filter, Download, Search } from 'lucide-react'
import api from '../lib/api'

/**
 * PC 사출조건 이력관리 페이지
 */
export default function InjectionHistory() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const moldId = searchParams.get('moldId')
  
  const [loading, setLoading] = useState(true)
  const [historyData, setHistoryData] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => {
    if (moldId) {
      loadHistoryData()
    }
  }, [moldId])

  const loadHistoryData = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/mold-specifications/${moldId}/injection-history`).catch(() => null)
      if (response?.data?.data) {
        setHistoryData(response.data.data)
      } else {
        // 샘플 데이터
        setHistoryData([
          {
            id: 1,
            change_date: '2024-12-09',
            change_type: 'temperature',
            change_type_label: '온도 변경',
            field_name: '노즐 온도',
            old_value: '220°C',
            new_value: '225°C',
            reason: '성형 품질 개선',
            changed_by: '김철수',
            approved_by: '이영희',
            status: 'approved'
          },
          {
            id: 2,
            change_date: '2024-12-08',
            change_type: 'pressure',
            change_type_label: '압력 변경',
            field_name: '보압',
            old_value: '45 MPa',
            new_value: '48 MPa',
            reason: '수축 방지',
            changed_by: '박민수',
            approved_by: '김철수',
            status: 'approved'
          },
          {
            id: 3,
            change_date: '2024-12-07',
            change_type: 'speed',
            change_type_label: '속도 변경',
            field_name: '사출 속도 1단',
            old_value: '35%',
            new_value: '40%',
            reason: '충진 불량 개선',
            changed_by: '이영희',
            approved_by: null,
            status: 'pending'
          },
          {
            id: 4,
            change_date: '2024-12-05',
            change_type: 'metering',
            change_type_label: '계량 변경',
            field_name: '계량값',
            old_value: '85mm',
            new_value: '88mm',
            reason: '중량 조정',
            changed_by: '김철수',
            approved_by: '이영희',
            status: 'approved'
          },
          {
            id: 5,
            change_date: '2024-12-03',
            change_type: 'temperature',
            change_type_label: '온도 변경',
            field_name: '실린더 온도 1존',
            old_value: '195°C',
            new_value: '200°C',
            reason: '용융 상태 개선',
            changed_by: '박민수',
            approved_by: '김철수',
            status: 'approved'
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'temperature': return 'bg-red-100 text-red-700 border-red-200'
      case 'pressure': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'speed': return 'bg-green-100 text-green-700 border-green-200'
      case 'metering': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">승인</span>
      case 'pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full font-medium">대기</span>
      case 'rejected': return <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full font-medium">반려</span>
      default: return null
    }
  }

  const filteredData = historyData
    .filter(item => filterType === 'all' || item.change_type === filterType)
    .filter(item => 
      searchTerm === '' || 
      item.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.changed_by.toLowerCase().includes(searchTerm.toLowerCase())
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
                <h1 className="text-2xl font-bold text-gray-800">사출조건 이력관리</h1>
                <p className="text-sm text-gray-500">금형 #{moldId} - 변경 이력 조회</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors">
              <Download size={18} />
              엑셀 다운로드
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 필터 영역 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* 검색 */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="항목명, 변경자 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>

            {/* 유형 필터 */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              {[
                { value: 'all', label: '전체' },
                { value: 'temperature', label: '온도' },
                { value: 'pressure', label: '압력' },
                { value: 'speed', label: '속도' },
                { value: 'metering', label: '계량' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setFilterType(filter.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === filter.value
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* 날짜 범위 */}
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* 이력 테이블 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">날짜</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">유형</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">항목</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">변경 전</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">변경 후</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">사유</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">변경자</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <History size={48} className="mx-auto mb-3 opacity-30" />
                    <p>변경 이력이 없습니다</p>
                  </td>
                </tr>
              ) : (
                filteredData.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">{item.change_date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(item.change_type)}`}>
                        {item.change_type_label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{item.field_name}</td>
                    <td className="px-6 py-4 text-sm text-red-600 line-through">{item.old_value}</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-medium">{item.new_value}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.reason}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{item.changed_by}</div>
                      {item.approved_by && (
                        <div className="text-xs text-gray-400">승인: {item.approved_by}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">총 변경</p>
            <p className="text-2xl font-bold text-gray-800">{historyData.length}건</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">승인</p>
            <p className="text-2xl font-bold text-green-600">{historyData.filter(h => h.status === 'approved').length}건</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">대기</p>
            <p className="text-2xl font-bold text-yellow-600">{historyData.filter(h => h.status === 'pending').length}건</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">반려</p>
            <p className="text-2xl font-bold text-red-600">{historyData.filter(h => h.status === 'rejected').length}건</p>
          </div>
        </div>
      </div>
    </div>
  )
}
