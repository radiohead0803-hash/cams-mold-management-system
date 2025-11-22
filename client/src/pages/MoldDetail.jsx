import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { moldAPI, checklistAPI } from '../lib/api'
import { ArrowLeft, Package, MapPin, Activity, Calendar, QrCode, FileText, Image } from 'lucide-react'
import { format } from 'date-fns'

export default function MoldDetail() {
  const { id } = useParams()
  const [mold, setMold] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMoldDetail()
  }, [id])

  const loadMoldDetail = async () => {
    try {
      setLoading(true)
      const moldResponse = await moldAPI.getById(id)
      setMold(moldResponse.data.data)
      
      const historyResponse = await moldAPI.getHistory(id)
      setHistory(historyResponse.data.data || [])
    } catch (error) {
      console.error('Failed to load mold detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-red-100 text-red-800'
    }
    return styles[status] || styles.active
  }

  if (loading) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    )
  }

  if (!mold) {
    return (
      <div className="card text-center py-12">
        <Package className="mx-auto mb-4 text-gray-400" size={48} />
        <p className="text-gray-500">금형을 찾을 수 없습니다.</p>
        <Link to="/molds" className="btn-primary mt-4 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <Link to="/molds" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={16} className="mr-1" />
          목록으로
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{mold.mold_number}</h1>
            <p className="text-gray-600 mt-1">{mold.mold_name || '-'}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusBadge(mold.status)}`}>
            {mold.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 기본 정보 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">금형번호</p>
                <p className="font-medium">{mold.mold_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">금형명</p>
                <p className="font-medium">{mold.mold_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">제품명</p>
                <p className="font-medium">{mold.product_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">현재 위치</p>
                <p className="font-medium flex items-center">
                  <MapPin size={16} className="mr-1 text-gray-400" />
                  {mold.current_location || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">누적 타수</p>
                <p className="font-medium flex items-center">
                  <Activity size={16} className="mr-1 text-gray-400" />
                  {mold.total_shots?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Cavity 수</p>
                <p className="font-medium">{mold.cavity_count || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">재질</p>
                <p className="font-medium">{mold.material || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">중량</p>
                <p className="font-medium">{mold.weight ? `${mold.weight} kg` : '-'}</p>
              </div>
            </div>
          </div>

          {/* 점검 이력 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">최근 점검 이력</h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">점검 이력이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.check_type}</p>
                      <p className="text-xs text-gray-500">
                        {item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd HH:mm') : '-'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* QR 코드 */}
          <div className="card text-center">
            <h3 className="text-sm font-semibold mb-4">QR 코드</h3>
            <div className="bg-gray-100 p-4 rounded-md inline-block">
              <QrCode size={120} className="text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">{mold.qr_code || '-'}</p>
          </div>

          {/* 빠른 작업 */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">빠른 작업</h3>
            <div className="space-y-2">
              <Link
                to={`/checklist/daily?mold=${mold.id}`}
                className="block w-full btn-primary text-center"
              >
                일상점검 시작
              </Link>
              <Link
                to={`/inspection/periodic?mold=${mold.id}`}
                className="block w-full btn-secondary text-center"
              >
                정기점검
              </Link>
              <Link
                to={`/molds/${mold.id}/documents`}
                className="block w-full btn-secondary text-center flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                문서 관리
              </Link>
              <Link
                to={`/molds/${mold.id}/photos`}
                className="block w-full btn-secondary text-center flex items-center justify-center gap-2"
              >
                <Image size={16} />
                사진 갤러리
              </Link>
            </div>
          </div>

          {/* 통계 */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4">통계</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">총 점검 횟수</span>
                <span className="font-medium">{history.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">완료된 점검</span>
                <span className="font-medium">
                  {history.filter(h => h.status === 'completed').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">등록일</span>
                <span className="font-medium">
                  {mold.created_at ? format(new Date(mold.created_at), 'yyyy-MM-dd') : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
