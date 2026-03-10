import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * GPS 좌표 자동 수집 훅
 * 모바일 사진 촬영 시 무조건 GPS를 수집하기 위한 공통 훅
 * 
 * @param {Object} options
 * @param {boolean} options.autoStart - 마운트 시 자동 시작 (기본: true)
 * @param {boolean} options.watch - 실시간 추적 여부 (기본: false)
 * @param {number} options.timeout - 타임아웃 ms (기본: 15000)
 * @param {boolean} options.highAccuracy - 높은 정확도 (기본: true)
 * @param {number} options.maxAge - 캐시 허용 시간 ms (기본: 30000)
 * @returns {{ latitude, longitude, accuracy, loading, error, timestamp, refresh, isSupported }}
 */
export default function useGeoLocation({
  autoStart = true,
  watch = false,
  timeout = 15000,
  highAccuracy = true,
  maxAge = 30000
} = {}) {
  const [position, setPosition] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const watchIdRef = useRef(null)

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const geoOptions = {
    enableHighAccuracy: highAccuracy,
    timeout,
    maximumAge: maxAge
  }

  const onSuccess = useCallback((pos) => {
    setPosition({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp
    })
    setLoading(false)
    setError(null)
  }, [])

  const onError = useCallback((err) => {
    let message = 'GPS 위치를 가져올 수 없습니다.'
    switch (err.code) {
      case 1: // PERMISSION_DENIED
        message = 'GPS 권한이 거부되었습니다. 설정에서 위치 권한을 허용해주세요.'
        break
      case 2: // POSITION_UNAVAILABLE
        message = 'GPS 위치를 확인할 수 없습니다. 실외에서 다시 시도해주세요.'
        break
      case 3: // TIMEOUT
        message = 'GPS 응답 시간이 초과되었습니다. 다시 시도합니다.'
        break
    }
    setError({ code: err.code, message })
    setLoading(false)
  }, [])

  const refresh = useCallback(() => {
    if (!isSupported) {
      setError({ code: -1, message: 'GPS가 지원되지 않는 기기입니다.' })
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions)
  }, [isSupported, onSuccess, onError])

  // 자동 시작
  useEffect(() => {
    if (!isSupported || !autoStart) return

    setLoading(true)
    navigator.geolocation.getCurrentPosition(onSuccess, onError, geoOptions)

    // watch 모드
    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, geoOptions)
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [isSupported, autoStart, watch])

  // GPS 데이터를 FormData에 추가하는 헬퍼
  const appendToFormData = useCallback((formData) => {
    if (position.latitude !== null) {
      formData.append('gps_latitude', position.latitude.toString())
      formData.append('gps_longitude', position.longitude.toString())
      if (position.accuracy !== null) {
        formData.append('gps_accuracy', position.accuracy.toString())
      }
    }
    return formData
  }, [position])

  // GPS 객체 반환 (API 전송용)
  const getGpsData = useCallback(() => {
    if (position.latitude === null) return null
    return {
      gps_latitude: position.latitude,
      gps_longitude: position.longitude,
      gps_accuracy: position.accuracy,
      gps_timestamp: position.timestamp
    }
  }, [position])

  return {
    latitude: position.latitude,
    longitude: position.longitude,
    accuracy: position.accuracy,
    timestamp: position.timestamp,
    loading,
    error,
    refresh,
    isSupported,
    appendToFormData,
    getGpsData,
    hasPosition: position.latitude !== null && position.longitude !== null
  }
}
