import { useState, useEffect } from 'react'
import { X, User, Mail, Phone, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../stores/authStore'

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuthStore()
  const [tab, setTab] = useState('info') // 'info' | 'password'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  // 프로필 수정
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // 비밀번호 변경
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setMessage(null)
      setTab('info')
    }
  }, [isOpen, user])

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: '이름을 입력하세요' })
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const res = await api.patch('/company-profile/me', { name: name.trim(), email: email.trim(), phone: phone.trim() })
      if (res.data?.success) {
        // authStore 업데이트
        if (updateUser) {
          updateUser({ name: name.trim(), email: email.trim(), phone: phone.trim() })
        }
        setMessage({ type: 'success', text: '프로필이 수정되었습니다' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || '수정 실패' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPw) { setMessage({ type: 'error', text: '현재 비밀번호를 입력하세요' }); return }
    if (!newPw || newPw.length < 4) { setMessage({ type: 'error', text: '새 비밀번호는 4자 이상이어야 합니다' }); return }
    if (newPw !== confirmPw) { setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다' }); return }

    setLoading(true)
    setMessage(null)
    try {
      const res = await api.post('/company-profile/change-password', {
        current_password: currentPw,
        new_password: newPw
      })
      if (res.data?.success) {
        setMessage({ type: 'success', text: '비밀번호가 변경되었습니다' })
        setCurrentPw('')
        setNewPw('')
        setConfirmPw('')
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error?.message || '비밀번호 변경 실패' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">내 정보 관리</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b">
          <button
            onClick={() => { setTab('info'); setMessage(null) }}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              tab === 'info' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User size={16} className="inline mr-1.5" />
            프로필 수정
          </button>
          <button
            onClick={() => { setTab('password'); setMessage(null) }}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              tab === 'password' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Lock size={16} className="inline mr-1.5" />
            비밀번호 변경
          </button>
        </div>

        {/* 메시지 */}
        {message && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {/* 프로필 수정 탭 */}
        {tab === 'info' && (
          <div className="px-6 py-5 space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-500">아이디: <span className="font-medium text-gray-900">{user?.username}</span></p>
              <p className="text-gray-500">권한: <span className="font-medium text-gray-900">{user?.user_type}</span></p>
              {user?.company_name && <p className="text-gray-500">소속: <span className="font-medium text-gray-900">{user?.company_name}</span></p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="이름"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="이메일"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="010-1234-5678"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile} disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {loading ? '저장 중...' : '프로필 저장'}
            </button>
          </div>
        )}

        {/* 비밀번호 변경 탭 */}
        {tab === 'password' && (
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호 *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showCurrentPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="현재 비밀번호"
                />
                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 * <span className="text-xs text-gray-400">(4자 이상)</span></label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showNewPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="새 비밀번호"
                />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인 *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 ${
                    confirmPw && confirmPw !== newPw ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="새 비밀번호 확인"
                />
              </div>
              {confirmPw && confirmPw !== newPw && (
                <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <button
              onClick={handleChangePassword} disabled={loading || !currentPw || !newPw || newPw !== confirmPw}
              className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
