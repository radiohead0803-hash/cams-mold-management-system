/**
 * 금형 위치 조회 모달 (전체화면)
 * - 검색으로 금형 찾기
 * - 최근 GPS 로그 표시
 * - 내 주변 금형 (브라우저 GPS)
 * - 외부 지도 앱 연동 (카카오/네이버/구글)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  X, Search, MapPin, Navigation, ExternalLink, Loader2,
  Package, RefreshCw, Crosshair, Clock, ChevronRight, AlertCircle
} from 'lucide-react'
import api from '../../lib/api'

// ─── 지도 앱 열기 헬퍼 ───
function openKakaoMap(lat, lng, name) {
  window.open(
    `https://map.kakao.com/link/map/${encodeURIComponent(name || '금형 위치')},${lat},${lng}`,
    '_blank'
  )
}
function openNaverMap(lat, lng) {
  window.open(
    `https://map.naver.com/v5/?c=${lng},${lat},15,0,0,0,dh`,
    '_blank'
  )
}
function openGoogleMap(lat, lng) {
  window.open(
    `https://www.google.com/maps?q=${lat},${lng}`,
    '_blank'
  )
}

// ─── 거리 계산 (Haversine) ───
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

// ─── 상태 뱃지 ───
const statusLabels = {
  active: '양산',
  in_use: '사용중',
  inactive: '비활성',
  maintenance: '정비',
  repair: '수리',
  developing: '개발',
  scrapped: '폐기',
  storage: '보관',
}
const statusColors = {
  active: 'bg-green-100 text-green-700',
  in_use: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  maintenance: 'bg-yellow-100 text-yellow-700',
  repair: 'bg-red-100 text-red-700',
  developing: 'bg-blue-100 text-blue-700',
  scrapped: 'bg-gray-200 text-gray-500',
  storage: 'bg-purple-100 text-purple-700',
}

// ─── 지도 버튼 그룹 ───
function MapButtons({ lat, lng, name }) {
  if (!lat || !lng) return null
  return (
    <div className="flex gap-1.5 mt-2">
      <button
        onClick={(e) => { e.stopPropagation(); openKakaoMap(lat, lng, name) }}
        className="flex-1 py-1.5 bg-yellow-50 rounded-lg text-xs font-medium text-yellow-700 flex items-center justify-center gap-1 active:bg-yellow-100"
      >
        <span className="w-4 h-4 bg-yellow-400 rounded text-white text-[9px] font-bold flex items-center justify-center">K</span>
        카카오
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); openNaverMap(lat, lng) }}
        className="flex-1 py-1.5 bg-green-50 rounded-lg text-xs font-medium text-green-700 flex items-center justify-center gap-1 active:bg-green-100"
      >
        <span className="w-4 h-4 bg-green-500 rounded text-white text-[9px] font-bold flex items-center justify-center">N</span>
        네이버
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); openGoogleMap(lat, lng) }}
        className="flex-1 py-1.5 bg-blue-50 rounded-lg text-xs font-medium text-blue-700 flex items-center justify-center gap-1 active:bg-blue-100"
      >
        <span className="w-4 h-4 bg-blue-500 rounded text-white text-[9px] font-bold flex items-center justify-center">G</span>
        구글
      </button>
    </div>
  )
}

// ─── 금형 카드 ───
function MoldCard({ mold, distance }) {
  const lat = mold.last_gps_lat || mold.base_gps_lat || mold.gps_latitude || mold.current_latitude || null
  const lng = mold.last_gps_lng || mold.base_gps_lng || mold.gps_longitude || mold.current_longitude || null
  const hasGps = lat && lng
  const status = mold.status || 'inactive'
  const location = mold.current_location || mold.location_name || mold.company_name || ''

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3.5 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm text-blue-600 truncate">
              {mold.mold_code || `#${mold.id}`}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
              {statusLabels[status] || status}
            </span>
          </div>
          <p className="text-xs text-gray-600 truncate">
            {mold.mold_name || mold.part_name || '-'}
          </p>
        </div>
        {distance != null && (
          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
            {formatDistance(distance)}
          </span>
        )}
      </div>

      {/* 위치 정보 */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <MapPin size={12} className="flex-shrink-0" />
        <span className="truncate">
          {hasGps
            ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`
            : '위치 미등록'}
          {location ? ` · ${location}` : ''}
        </span>
      </div>

      {/* 지도 버튼 */}
      {hasGps && <MapButtons lat={lat} lng={lng} name={mold.mold_name || mold.mold_code} />}

      {!hasGps && (
        <p className="text-[11px] text-gray-400 text-center py-1">
          GPS 좌표가 등록되지 않았습니다
        </p>
      )}
    </div>
  )
}

// ─── 메인 컴포넌트 ───
export default function MoldLocationLookup({ onClose }) {
  const [query, setQuery] = useState('')
  const [molds, setMolds] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // 내 주변 금형
  const [nearbyMolds, setNearbyMolds] = useState([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError] = useState(null)
  const [myPosition, setMyPosition] = useState(null)

  // 최근 GPS 로그
  const [recentLogs, setRecentLogs] = useState([])
  const [recentLoading, setRecentLoading] = useState(true)

  const searchInputRef = useRef(null)
  const debounceRef = useRef(null)

  // 최근 GPS 로그 불러오기
  useEffect(() => {
    fetchRecentLogs()
  }, [])

  // 포커스
  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 300)
  }, [])

  const fetchRecentLogs = async () => {
    try {
      setRecentLoading(true)
      const res = await api.get('/gps/recent', { params: { limit: 10 } })
      if (res.data.success) {
        setRecentLogs(res.data.data || [])
      }
    } catch (err) {
      console.error('최근 GPS 로그 조회 실패:', err)
    } finally {
      setRecentLoading(false)
    }
  }

  // 검색
  const searchMolds = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 1) {
      setMolds([])
      setSearched(false)
      return
    }
    try {
      setLoading(true)
      setSearched(true)
      const res = await api.get('/molds', {
        params: { limit: 20, search: searchQuery.trim() }
      })
      if (res.data.success) {
        const result = res.data.data
        setMolds(Array.isArray(result) ? result : result?.items || [])
      }
    } catch (err) {
      console.error('금형 검색 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearchChange = (e) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchMolds(val), 400)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    searchMolds(query)
  }

  // 내 주변 금형 찾기
  const findNearby = useCallback(async () => {
    setNearbyError(null)
    setNearbyLoading(true)

    if (!navigator.geolocation) {
      setNearbyError('이 기기에서는 GPS를 사용할 수 없습니다.')
      setNearbyLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setMyPosition({ lat: latitude, lng: longitude })

        try {
          // 위치 정보가 있는 금형 전체 조회
          const res = await api.get('/molds', {
            params: { limit: 100 }
          })
          if (res.data.success) {
            const all = res.data.data?.items || res.data.data || []
            // GPS 좌표가 있는 금형만 필터 + 거리 계산
            const withDistance = all
              .filter(m => (m.last_gps_lat || m.base_gps_lat) && (m.last_gps_lng || m.base_gps_lng))
              .map(m => {
                const lat = m.last_gps_lat || m.base_gps_lat
                const lng = m.last_gps_lng || m.base_gps_lng
                return {
                  ...m,
                  _distance: calcDistance(latitude, longitude, lat, lng)
                }
              })
              .sort((a, b) => a._distance - b._distance)
              .slice(0, 20)

            setNearbyMolds(withDistance)
          }
        } catch (err) {
          console.error('주변 금형 조회 실패:', err)
          setNearbyError('금형 목록을 불러오지 못했습니다.')
        } finally {
          setNearbyLoading(false)
        }
      },
      (error) => {
        setNearbyLoading(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setNearbyError('위치 권한이 거부되었습니다. 설정에서 허용해주세요.')
            break
          case error.POSITION_UNAVAILABLE:
            setNearbyError('위치 정보를 사용할 수 없습니다.')
            break
          case error.TIMEOUT:
            setNearbyError('위치 요청 시간이 초과되었습니다.')
            break
          default:
            setNearbyError('위치를 가져오는 중 오류가 발생했습니다.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col" onClick={onClose}>
      <div
        className="bg-gray-50 w-full h-full flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 헤더 ─── */}
        <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <MapPin size={20} />
            <h2 className="font-bold text-lg">금형 위치 조회</h2>
          </div>
          <button onClick={onClose} className="p-1 active:bg-white/20 rounded-lg">
            <X size={22} />
          </button>
        </div>

        {/* ─── 검색바 ─── */}
        <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-200 flex-shrink-0">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder="금형 코드 또는 이름으로 검색..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setMolds([]); setSearched(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X size={16} />
              </button>
            )}
          </form>
        </div>

        {/* ─── 컨텐츠 ─── */}
        <div className="flex-1 overflow-y-auto">
          {/* 검색 결과 */}
          {searched && (
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Search size={14} />
                검색 결과 {!loading && `(${molds.length}건)`}
              </h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-indigo-500" />
                </div>
              ) : molds.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">검색 결과가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {molds.map(m => <MoldCard key={m.id} mold={m} />)}
                </div>
              )}
            </div>
          )}

          {/* 내 주변 금형 버튼 + 결과 */}
          {!searched && (
            <>
              <div className="px-4 pt-4">
                <button
                  onClick={findNearby}
                  disabled={nearbyLoading}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {nearbyLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      위치 확인 중...
                    </>
                  ) : (
                    <>
                      <Crosshair size={18} />
                      현재 위치 주변 금형 찾기
                    </>
                  )}
                </button>

                {nearbyError && (
                  <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{nearbyError}</p>
                  </div>
                )}

                {myPosition && !nearbyLoading && (
                  <p className="text-xs text-gray-400 text-center mt-1.5">
                    내 위치: {myPosition.lat.toFixed(5)}, {myPosition.lng.toFixed(5)}
                  </p>
                )}
              </div>

              {/* 주변 금형 결과 */}
              {nearbyMolds.length > 0 && (
                <div className="px-4 pt-3 pb-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Navigation size={14} />
                    내 주변 금형 ({nearbyMolds.length}건)
                  </h3>
                  <div className="space-y-2.5">
                    {nearbyMolds.map(m => (
                      <MoldCard key={m.id} mold={m} distance={m._distance} />
                    ))}
                  </div>
                </div>
              )}

              {nearbyMolds.length === 0 && myPosition && !nearbyLoading && (
                <div className="px-4 pt-4 text-center text-gray-400">
                  <MapPin size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">GPS 좌표가 등록된 금형이 없습니다</p>
                </div>
              )}

              {/* 최근 GPS 로그 */}
              <div className="px-4 pt-5 pb-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Clock size={14} />
                  최근 스캔 기록
                </h3>
                {recentLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  </div>
                ) : recentLogs.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <Clock size={24} className="mx-auto mb-1.5 opacity-40" />
                    <p className="text-xs">최근 GPS 기록이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentLogs.map((log, idx) => {
                      const lat = log.latitude || log.gps_latitude
                      const lng = log.longitude || log.gps_longitude
                      const hasGps = lat && lng
                      return (
                        <div
                          key={log.id || idx}
                          className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3"
                        >
                          <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin size={16} className="text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {log.mold_code || log.mold_name || `금형 #${log.mold_id || '?'}`}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {log.event_type || 'scan'}
                              {log.location_name ? ` · ${log.location_name}` : ''}
                              {log.created_at ? ` · ${new Date(log.created_at).toLocaleString('ko-KR')}` : ''}
                            </p>
                          </div>
                          {hasGps && (
                            <button
                              onClick={() => openGoogleMap(lat, lng)}
                              className="p-2 text-indigo-500 active:bg-indigo-50 rounded-lg flex-shrink-0"
                            >
                              <ExternalLink size={16} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ─── 하단 닫기 ─── */}
        <div className="p-4 border-t bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
