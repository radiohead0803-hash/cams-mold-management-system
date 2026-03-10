import { useEffect, useCallback } from 'react'

/**
 * 모바일 재로그인 후 자동 데이터 재로드 훅
 * MobileReLoginModal에서 재로그인 성공 시 발행하는 'cams:auth-restored' 이벤트를 수신
 * @param {Function} onRestore - 재로그인 후 실행할 콜백 (데이터 재로드 등)
 */
export default function useAuthRestore(onRestore) {
  const handler = useCallback(() => {
    if (typeof onRestore === 'function') {
      onRestore()
    }
  }, [onRestore])

  useEffect(() => {
    window.addEventListener('cams:auth-restored', handler)
    return () => window.removeEventListener('cams:auth-restored', handler)
  }, [handler])
}
