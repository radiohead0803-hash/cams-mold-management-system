import { useState, useEffect, useCallback } from 'react'
import { Lock, User, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

/**
 * 모바일 인라인 재로그인 모달
 * - 401 에러 발생 시 현재 페이지 위에 오버레이로 표시
 * - 재로그인 성공 시 모달만 닫고 페이지 유지 (새로고침 없음)
 * - window 이벤트 'cams:auth-expired' 수신
 */
export default function MobileReLoginModal() {
  const [visible, setVisible] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, user } = useAuthStore()

  // 이전 사용자 정보 pre-fill
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username)
    }
  }, [user])

  // 401 이벤트 수신
  const handleAuthExpired = useCallback((e) => {
    console.log('[MobileReLoginModal] Auth expired on:', e.detail?.path)
    setVisible(true)
    setError('')
    setPassword('')
  }, [])

  useEffect(() => {
    window.addEventListener('cams:auth-expired', handleAuthExpired)
    return () => window.removeEventListener('cams:auth-expired', handleAuthExpired)
  }, [handleAuthExpired])

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await login(username.trim(), password.trim())
      if (result.success) {
        setVisible(false)
        setPassword('')
        setError('')
        // 페이지 이동 없이 현재 상태 유지 — 필요한 경우 데이터 재로드
        window.dispatchEvent(new CustomEvent('cams:auth-restored'))
      } else {
        setError(result.error || '로그인에 실패했습니다.')
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    setPassword('')
    setError('')
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleDismiss} />
      
      {/* 모달 */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 animate-slide-up">
        {/* 닫기 버튼 */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 bg-orange-100 rounded-full flex items-center justify-center">
            <Lock size={28} className="text-orange-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">세션이 만료되었습니다</h3>
          <p className="text-sm text-gray-500 mt-1">
            다시 로그인하면 현재 작업을 계속할 수 있습니다
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">아이디</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder="아이디 입력"
                autoComplete="username"
                autoFocus={!username}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder="비밀번호 입력"
                autoComplete="current-password"
                autoFocus={!!username}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-base"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                로그인 중...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                다시 로그인
              </>
            )}
          </button>
        </form>

        {/* 하단 안내 */}
        <p className="text-xs text-gray-400 text-center mt-4">
          로그인 후 현재 페이지가 유지됩니다
        </p>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
