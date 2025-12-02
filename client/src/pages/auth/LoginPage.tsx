// client/src/pages/auth/LoginPage.tsx
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, loading, error, restore } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 새로고침 후에도 로그인 유지
  useEffect(() => {
    restore();
  }, [restore]);

  // 이미 로그인돼 있으면 바로 대시보드로
  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(username, password);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      navigate(getDashboardPath(currentUser.role), { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md bg-slate-950/80 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-sky-500/20">
        {/* 로고 / 타이틀 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 mb-3">
            <span className="text-sky-400 font-semibold tracking-widest">
              CAMS
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-white">금형관리 시스템</h1>
          <p className="text-slate-400 text-sm mt-1">
            QR + GPS 기반 금형 생애주기 통합 관리
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              아이디
            </label>
            <input
              className="w-full rounded-2xl bg-slate-900/60 border border-slate-700 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="예: plant_user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              className="w-full rounded-2xl bg-slate-900/60 border border-slate-700 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-500/40 rounded-2xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-600 text-white text-sm font-medium py-2.5 transition-all shadow-lg shadow-sky-500/40"
          >
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <p className="mt-6 text-[11px] text-slate-500 text-center">
          시스템 관리자에게 발급받은 계정으로 로그인하세요.
        </p>
      </div>
    </div>
  );
}

function getDashboardPath(role: string) {
  switch (role) {
    case 'system_admin':
      return '/admin';
    case 'mold_developer':
      return '/developer';
    case 'maker':
      return '/maker';
    case 'plant':
      return '/plant';
    default:
      return '/admin';
  }
}
