/**
 * 금형 위치 관리 모달
 * GPS 기반 현재 위치 업데이트 및 외부 지도 앱 연동
 */
import { useState } from 'react'
import { MapPin, Navigation, ExternalLink, X, Loader2, RefreshCw, Building2 } from 'lucide-react'
import api from '../../lib/api'

export default function MoldLocationModal({ moldId, mold, onClose, onUpdate }) {
  const [updating, setUpdating] = useState(false)
  const [gpsError, setGpsError] = useState(null)
  const [updatedLocation, setUpdatedLocation] = useState(null)

  const currentLocation = updatedLocation || {
    name: mold?.current_location || mold?.location || mold?.last_gps_address || '',
    lat: mold?.last_gps_lat || mold?.base_gps_lat || mold?.current_latitude || mold?.gps_lat || null,
    lng: mold?.last_gps_lng || mold?.base_gps_lng || mold?.current_longitude || mold?.gps_lng || null,
    companyName: mold?.company_name || mold?.plant_name || '',
    address: mold?.address || mold?.company_address || mold?.last_gps_address || '',
  }

  const hasGps = currentLocation.lat && currentLocation.lng

  const handleUpdateLocation = () => {
    setGpsError(null)
    setUpdating(true)

    if (!navigator.geolocation) {
      setGpsError('이 기기에서는 GPS를 사용할 수 없습니다.')
      setUpdating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          await api.patch(`/molds/${moldId}/location`, {
            latitude: latitude,
            longitude: longitude,
            location_name: `GPS 업데이트 (${new Date().toLocaleString('ko-KR')})`,
          })

          const newLocation = {
            ...currentLocation,
            lat: latitude,
            lng: longitude,
            name: `GPS 업데이트 (${new Date().toLocaleString('ko-KR')})`,
          }
          setUpdatedLocation(newLocation)
          if (onUpdate) onUpdate(newLocation)
        } catch (err) {
          console.error('위치 업데이트 실패:', err)
          setGpsError('서버에 위치 정보를 저장하지 못했습니다.')
        } finally {
          setUpdating(false)
        }
      },
      (error) => {
        setUpdating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('위치 권한이 거부되었습니다. 설정에서 허용해주세요.')
            break
          case error.POSITION_UNAVAILABLE:
            setGpsError('위치 정보를 사용할 수 없습니다.')
            break
          case error.TIMEOUT:
            setGpsError('위치 요청 시간이 초과되었습니다.')
            break
          default:
            setGpsError('위치를 가져오는 중 오류가 발생했습니다.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  const openKakaoMap = () => {
    if (!hasGps) return
    window.open(
      `https://map.kakao.com/link/map/${encodeURIComponent(mold?.mold_name || '금형 위치')},${currentLocation.lat},${currentLocation.lng}`,
      '_blank'
    )
  }

  const openNaverMap = () => {
    if (!hasGps) return
    window.open(
      `https://map.naver.com/v5/?c=${currentLocation.lng},${currentLocation.lat},15,0,0,0,dh`,
      '_blank'
    )
  }

  const openGoogleMap = () => {
    if (!hasGps) return
    window.open(
      `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`,
      '_blank'
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex flex-col"
      onClick={onClose}
    >
      <div
        className="bg-white w-full h-full flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <MapPin size={20} />
            <h2 className="font-bold text-lg">금형 위치 관리</h2>
          </div>
          <button onClick={onClose} className="p-1">
            <X size={22} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 금형 정보 요약 */}
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {mold?.mold_code || mold?.qr_code || `MOLD-${moldId}`}
                </p>
                <p className="text-sm text-gray-500">
                  {mold?.part_name || mold?.mold_name || '금형'}
                </p>
              </div>
            </div>
          </div>

          {/* 현재 위치 정보 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-sm text-gray-700">현재 위치 정보</h3>
            </div>
            <div className="p-4 space-y-3">
              {/* 업체명 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 size={16} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">업체명</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentLocation.companyName || '미등록'}
                  </p>
                </div>
              </div>

              {/* 주소 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={16} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">주소 / 위치</p>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentLocation.name || currentLocation.address || '미등록'}
                  </p>
                </div>
              </div>

              {/* GPS 좌표 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Navigation size={16} className="text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">GPS 좌표</p>
                  <p className="text-sm font-medium text-gray-900">
                    {hasGps
                      ? `${Number(currentLocation.lat).toFixed(6)}, ${Number(currentLocation.lng).toFixed(6)}`
                      : '미등록'}
                  </p>
                </div>
              </div>

              {/* 마지막 스캔 */}
              {mold?.last_scanned_at && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <RefreshCw size={16} className="text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">마지막 스캔</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(mold.last_scanned_at).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GPS 업데이트 버튼 */}
          <button
            onClick={handleUpdateLocation}
            disabled={updating}
            className="w-full py-3.5 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:bg-purple-700 disabled:opacity-60 transition-colors"
          >
            {updating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                위치 확인 중...
              </>
            ) : (
              <>
                <Navigation size={18} />
                현재 위치로 업데이트
              </>
            )}
          </button>

          {/* GPS 에러 메시지 */}
          {gpsError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-600">{gpsError}</p>
            </div>
          )}

          {/* 업데이트 성공 메시지 */}
          {updatedLocation && !gpsError && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-sm text-green-700">위치가 성공적으로 업데이트되었습니다.</p>
            </div>
          )}

          {/* 외부 지도 앱 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-sm text-gray-700">지도 앱에서 열기</h3>
            </div>
            <div className="p-3 space-y-2">
              <button
                onClick={openKakaoMap}
                disabled={!hasGps}
                className="w-full p-3 bg-yellow-50 rounded-lg flex items-center justify-between disabled:opacity-40 active:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">K</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">카카오맵</span>
                </div>
                <ExternalLink size={16} className="text-gray-400" />
              </button>

              <button
                onClick={openNaverMap}
                disabled={!hasGps}
                className="w-full p-3 bg-green-50 rounded-lg flex items-center justify-between disabled:opacity-40 active:bg-green-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">N</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">네이버지도</span>
                </div>
                <ExternalLink size={16} className="text-gray-400" />
              </button>

              <button
                onClick={openGoogleMap}
                disabled={!hasGps}
                className="w-full p-3 bg-blue-50 rounded-lg flex items-center justify-between disabled:opacity-40 active:bg-blue-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">G</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">구글지도</span>
                </div>
                <ExternalLink size={16} className="text-gray-400" />
              </button>

              {!hasGps && (
                <p className="text-xs text-gray-400 text-center py-1">
                  GPS 좌표가 없습니다. 먼저 위치를 업데이트해주세요.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 하단 닫기 버튼 */}
        <div className="p-4 border-t flex-shrink-0">
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
