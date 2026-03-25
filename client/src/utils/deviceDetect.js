/**
 * 모바일 디바이스 감지 유틸리티
 *
 * Chrome "데스크톱 사이트" 모드, iPadOS 등
 * UA가 변경되는 상황에서도 정확히 감지
 */

/**
 * 모바일 디바이스 여부 판별 (다중 신호 기반)
 *
 * 감지 우선순위:
 * 1. User-Agent 문자열 (기본)
 * 2. 터치 지원 + 물리적 화면 크기 (Chrome 데스크톱 모드 대응)
 * 3. CSS 미디어 쿼리 pointer: coarse (터치 전용 디바이스)
 * 4. navigator.userAgentData (Chrome 90+ Client Hints API)
 */
export function isMobileDevice() {
  // 1. 기본 UA 체크 (대부분의 모바일 브라우저에서 동작)
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
  if (mobileUA) return true

  // 2. Client Hints API (Chrome 90+) — "데스크톱 사이트" 모드에서도 정확함
  if (navigator.userAgentData?.mobile) return true

  // 3. 터치 지원 + 물리적 화면 크기 확인
  //    Chrome "데스크톱 사이트" 모드에서 UA는 바뀌지만 터치/화면은 그대로
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const smallScreen = window.screen.width <= 768 || window.screen.height <= 768

  if (hasTouch && smallScreen) return true

  // 4. CSS 미디어 쿼리 — pointer: coarse는 터치 전용 디바이스
  //    마우스 없이 터치만 있는 디바이스를 정확히 식별
  if (hasTouch && window.matchMedia?.('(pointer: coarse)').matches) {
    // 터치 전용 + 화면 크기가 일반 데스크톱보다 작은 경우
    const screenSize = Math.min(window.screen.width, window.screen.height)
    if (screenSize <= 1024) return true
  }

  return false
}

export default isMobileDevice
