import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { moldSpecificationAPI } from '../lib/api'
import { Package, Search, Filter, Edit, Image as ImageIcon } from 'lucide-react'

export default function MoldList() {
  const [molds, setMolds] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMolds, setSelectedMolds] = useState([])
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [sortKey, setSortKey] = useState('') // '', 'mold_code', 'part_number', 'status'
  const [sortDirection, setSortDirection] = useState('asc') // 'asc' | 'desc'

  useEffect(() => {
    loadMolds()
  }, [])

  const loadMolds = async () => {
    try {
      setLoading(true)
      const response = await moldSpecificationAPI.getAll({ limit: 100 })

      // API 응답 데이터를 화면 표시 형식으로 변환
      const specifications = response.data.data.items || []

      const transformedMolds = specifications.map(spec => {
        // part_images JSONB에서 첫 번째 이미지 URL 추출
        let imageUrl = null;
        if (spec.part_images) {
          if (typeof spec.part_images === 'string') {
            try {
              const parsed = JSON.parse(spec.part_images);
              imageUrl = parsed?.url || null;
            } catch (e) {
              console.error('Failed to parse part_images:', e);
            }
          } else if (spec.part_images?.url) {
            imageUrl = spec.part_images.url;
          }
        }

        // 대소문자 구분 확인 (makerCompany vs MakerCompany)
        const makerCompany = spec.makerCompany || spec.MakerCompany;
        const plantCompany = spec.plantCompany || spec.PlantCompany;

        return {
          id: spec.id,
          mold_code: spec.mold?.mold_code || spec.Mold?.mold_code || 'N/A',
          part_number: spec.part_number,
          part_name: spec.part_name,
          car_model: spec.car_model,
          car_year: spec.car_year,
          mold_type: spec.mold_type,
          cavity_count: spec.cavity_count,
          material: spec.material,
          tonnage: spec.tonnage,
          status: spec.status || 'draft',
          location: plantCompany?.company_name || '본사',
          maker_company: makerCompany?.company_name || '-',
          plant_company: plantCompany?.company_name || '-',
          development_stage: spec.development_stage || '-',
          production_stage: spec.production_stage || '-',
          order_date: spec.order_date,
          target_delivery_date: spec.target_delivery_date,
          estimated_cost: spec.estimated_cost,
          notes: spec.notes,
          image_url: imageUrl
        };
      })
      
      setMolds(transformedMolds)
    } catch (error) {
      console.error('Failed to load molds:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMolds = molds.filter(mold => {
    const matchesSearch = 
      mold.mold_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.car_model?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || mold.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // 정렬 적용
  const sortedMolds = [...filteredMolds].sort((a, b) => {
    if (!sortKey) return 0

    const aVal = (a[sortKey] || '').toString().toLowerCase()
    const bVal = (b[sortKey] || '').toString().toLowerCase()

    if (aVal === bVal) return 0
    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : 1
    }
    return aVal > bVal ? -1 : 1
  })

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      planning: 'bg-gray-100 text-gray-800',
      design: 'bg-blue-100 text-blue-800',
      manufacturing: 'bg-orange-100 text-orange-800',
      trial: 'bg-purple-100 text-purple-800',
      production: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-red-100 text-red-800'
    }
    return styles[status] || styles.planning
  }

  // 선택 관련 함수
  const toggleSelectMold = (moldId) => {
    setSelectedMolds(prev => 
      prev.includes(moldId) 
        ? prev.filter(id => id !== moldId)
        : [...prev, moldId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedMolds.length === filteredMolds.length) {
      setSelectedMolds([])
    } else {
      setSelectedMolds(filteredMolds.map(m => m.id))
    }
  }

  const handleBulkEdit = () => {
    if (selectedMolds.length === 0) {
      alert('편집할 금형을 선택해주세요.')
      return
    }
    // TODO: 일괄 편집 모달 또는 페이지로 이동
    alert(`${selectedMolds.length}개의 금형을 일괄 편집합니다.`)
  }

  const cancelBulkEdit = () => {
    setBulkEditMode(false)
    setSelectedMolds([])
  }

  const getStatusLabel = (status) => {
    const labels = {
      planning: '계획',
      design: '설계',
      manufacturing: '제작',
      trial: '시운전',
      production: '양산',
      maintenance: '정비',
      retired: '폐기'
    }
    return labels[status] || status
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">개발금형 목록</h1>
          <p className="text-sm text-gray-600 mt-1">
            전체 {molds.length}개의 금형
            {bulkEditMode && selectedMolds.length > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedMolds.length}개 선택됨)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {bulkEditMode ? (
            <>
              <button
                onClick={handleBulkEdit}
                disabled={selectedMolds.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Edit size={18} />
                <span>선택 항목 편집 ({selectedMolds.length})</span>
              </button>
              <button
                onClick={cancelBulkEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setBulkEditMode(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center space-x-2"
              >
                <Edit size={18} />
                <span>일괄 편집</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="금형코드, 부품번호, 부품명, 차종으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-40"
            >
              <option value="all">전체 상태</option>
              <option value="planning">계획</option>
              <option value="design">설계</option>
              <option value="manufacturing">제작</option>
              <option value="trial">시운전</option>
              <option value="production">양산</option>
              <option value="maintenance">정비</option>
              <option value="retired">폐기</option>
            </select>
          </div>
        </div>
      </div>

      {/* 금형 목록 - 테이블 */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : filteredMolds.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-500">금형이 없습니다.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div
            className={`overflow-x-auto ${
              filteredMolds.length > 10 ? 'max-h-[560px] overflow-y-auto' : ''
            }`}
          >
            <table className="min-w-max w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {bulkEditMode && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedMolds.length === filteredMolds.length && filteredMolds.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이미지
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('mold_code')}
                  >
                    금형코드
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('part_number')}
                  >
                    부품번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    부품명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    차종
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금형타입
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('status')}
                  >
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제작처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생산처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    개발단계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생산단계
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cavity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    재질
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    톤수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedMolds.map((mold) => (
                  <tr key={mold.id} className={`hover:bg-gray-50 transition-colors ${selectedMolds.includes(mold.id) ? 'bg-blue-50' : ''}`}>
                    {bulkEditMode && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedMolds.includes(mold.id)}
                          onChange={() => toggleSelectMold(mold.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {mold.image_url ? (
                        <img
                          src={mold.image_url}
                          alt={mold.part_name}
                          className="w-12 h-12 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                          <ImageIcon size={20} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mold.mold_code || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.part_number || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.part_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.car_model || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.mold_type || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(mold.status)}`}>
                        {getStatusLabel(mold.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.maker_company || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.plant_company || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.development_stage || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.production_stage || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.cavity_count || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.material || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.tonnage ? `${mold.tonnage}T` : '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/molds/specifications/${mold.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        상세보기
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                총 <span className="font-semibold text-gray-900">{filteredMolds.length}</span>건의 금형
              </p>
              <p className="text-xs text-gray-500 flex items-center">
                <span className="mr-1">👉</span>
                좌우로 스크롤하여 추가 정보를 확인하세요
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
