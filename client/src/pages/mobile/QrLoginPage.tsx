import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import { QrCode, User, Building2, Users } from 'lucide-react';

export default function QrLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // URL에서 역할 파라미터 가져오기
  const role = searchParams.get('role');

  // 역할별 정보
  const roleInfo = {
    production: {
      title: '생산처 로그인',
      icon: <Building2 className="w-12 h-12 text-blue-600" />,
      color: 'blue',
      defaultUser: 'plant1',
      defaultPass: 'plant123'
    },
    maker: {
      title: '제작처 로그인',
      icon: <Building2 className="w-12 h-12 text-green-600" />,
      color: 'green',
      defaultUser: 'maker1',
      defaultPass: 'maker123'
    },
    hq: {
      title: '본사 로그인',
      icon: <Users className="w-12 h-12 text-purple-600" />,
      color: 'purple',
      defaultUser: 'developer',
      defaultPass: 'dev123'
    }
  };

  const currentRole = role && roleInfo[role] ? roleInfo[role] : {
    title: 'QR 로그인',
    icon: <QrCode className="w-12 h-12 text-slate-600" />,
    color: 'slate',
    defaultUser: '',
    defaultPass: ''
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!username || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/api/v1/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data.data;
        login(user, token);

        // 역할별 대시보드로 리다이렉트
        if (user.role === 'production' || user.role === 'plant') {
          navigate('/mobile/qr-scan');
        } else if (user.role === 'maker') {
          navigate('/mobile/qr-scan');
        } else if (user.role === 'hq' || user.role === 'developer') {
          navigate('/mobile/qr-scan');
        } else {
          navigate('/mobile/qr-scan');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 빠른 로그인 (개발용)
  const handleQuickLogin = async (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    
    try {
      setLoading(true);
      setError('');

      const response = await api.post('/api/v1/auth/login', {
        username: user,
        password: pass
      });

      if (response.data.success) {
        const { token, user: userData } = response.data.data;
        login(userData, token);
        navigate('/mobile/qr-scan');
      }
    } catch (err: any) {
      console.error('Quick login error:', err);
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {currentRole.icon}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {currentRole.title}
          </h1>
          <p className="text-sm text-slate-600">
            금형 관리 시스템에 로그인하세요
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 로그인 폼 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                아이디
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="아이디를 입력하세요"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호를 입력하세요"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : `bg-${currentRole.color}-600 hover:bg-${currentRole.color}-700`
              }`}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        {/* 개발용 빠른 로그인 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-6 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🚀</span>
              <h2 className="font-semibold text-purple-900">빠른 로그인 (개발용)</h2>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleQuickLogin('plant1', 'plant123')}
                disabled={loading}
                className="w-full p-3 bg-white border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-blue-900">생산처 담당자</div>
                    <div className="text-xs text-blue-600">plant1 / 생산공장1</div>
                  </div>
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </button>

              <button
                onClick={() => handleQuickLogin('maker1', 'maker123')}
                disabled={loading}
                className="w-full p-3 bg-white border-2 border-green-300 rounded-lg hover:bg-green-50 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-green-900">제작처 담당자</div>
                    <div className="text-xs text-green-600">maker1 / A제작소</div>
                  </div>
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
              </button>

              <button
                onClick={() => handleQuickLogin('developer', 'dev123')}
                disabled={loading}
                className="w-full p-3 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-purple-900">본사 담당자</div>
                    <div className="text-xs text-purple-600">developer / 본사</div>
                  </div>
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </button>
            </div>

            <div className="mt-4 p-3 bg-purple-200 bg-opacity-50 rounded-lg">
              <p className="text-xs text-purple-800">
                💡 개발 환경에서만 표시됩니다. 프로덕션에서는 숨겨집니다.
              </p>
            </div>
          </div>
        )}

        {/* 역할별 안내 */}
        {role && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              {role === 'production' && '생산처 기능'}
              {role === 'maker' && '제작처 기능'}
              {role === 'hq' && '본사 기능'}
            </h3>
            <ul className="text-xs text-slate-600 space-y-1">
              {role === 'production' && (
                <>
                  <li>• QR 스캔으로 금형 점검</li>
                  <li>• 일상/정기 점검 체크리스트 작성</li>
                  <li>• 수리요청 조회 및 관리</li>
                  <li>• 생산 현황 모니터링</li>
                </>
              )}
              {role === 'maker' && (
                <>
                  <li>• 수리요청 접수 및 처리</li>
                  <li>• 금형 수리 이력 관리</li>
                  <li>• 작업 진행 상황 업데이트</li>
                  <li>• 완료 보고서 작성</li>
                </>
              )}
              {role === 'hq' && (
                <>
                  <li>• 전체 금형 현황 모니터링</li>
                  <li>• 수리요청 통합 관리</li>
                  <li>• 통계 및 리포트 조회</li>
                  <li>• 시스템 설정 관리</li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
