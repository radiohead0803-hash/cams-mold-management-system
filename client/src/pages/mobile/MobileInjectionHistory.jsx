import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, History, Calendar, User, FileText, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import api from '../../lib/api'

/**
 * 모바일 사출조건 이력관리 페이지
 */
export default function MobileInjectionHistory() {
  const { moldId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [historyData, setHistoryData] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [filterType, setFilterType] = useState('all') // all, temperature, pressure, speed, metering

  useEffect(() => {
    loadHistoryData()
  }, [moldId])

  const loadHistoryData = async () => {
    try {
      setLoading(true)
      // API 호출 (실제 구현 시 백엔드 API 연동)
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
      case 'temperature': return 'bg-red-100 text-red-700'
      case 'pressure': return 'bg-blue-100 text-blue-700'
      case 'speed': return 'bg-green-100 text-green-700'
      case 'metering': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">승인</span>
      case 'pending': return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">대기</span>
      case 'rejected': return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">반려</span>
      default: return null
    }
  }

  const filteredData = filterType === 'all' 
    ? historyData 
    : historyData.filter(item => item.change_type === filterType)

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
            <h1 className="text-lg font-bold">사출조건 이력관리</h1>
            <p className="text-xs text-rose-100">금형 #{moldId}</p>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter size={16} className="text-gray-400 flex-shrink-0" />
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
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                filterType === filter.value
                  ? 'bg-rose-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* 이력 목록 */}
      <div className="p-4 space-y-3">
        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History size={48} className="mx-auto mb-3 opacity-30" />
            <p>변경 이력이 없습니다</p>
          </div>
        ) : (
          filteredData.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(item.change_type)}`}>
                    {item.change_type_label}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{item.field_name}</p>
                    <p className="text-xs text-gray-500">{item.change_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(item.status)}
                  {expandedId === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {expandedId === item.id && (
                <div className="px-4 pb-4 border-t bg-gray-50">
                  <div className="pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">변경 전</span>
                      <span className="text-sm font-medium text-red-600 line-through">{item.old_value}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">변경 후</span>
                      <span className="text-sm font-medium text-green-600">{item.new_value}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">변경 사유</span>
                      <span className="text-sm text-gray-700">{item.reason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">변경자</span>
                      <span className="text-sm text-gray-700">{item.changed_by}</span>
                    </div>
                    {item.approved_by && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">승인자</span>
                        <span className="text-sm text-gray-700">{item.approved_by}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
