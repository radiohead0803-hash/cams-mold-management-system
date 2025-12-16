/**
 * 모바일 프로필 페이지
 * - 사용자 정보
 * - 설정
 * - 로그아웃
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Building2, Mail, Phone, Shield, LogOut, 
  ChevronRight, Bell, Moon, Globe, HelpCircle,
  Settings, Lock, Smartphone, Info
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { MobileHeader, BottomNav } from '../../components/mobile/MobileLayout';

export default function MobileProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserTypeLabel = (type) => {
    const types = {
      system_admin: '시스템 관리자',
      mold_developer: '금형개발 담당',
      maker: '제작처',
      plant: '생산처'
    };
    return types[type] || type || '사용자';
  };

  const menuItems = [
    {
      title: '계정',
      items: [
        { icon: User, label: '프로필 수정', path: '/mobile/profile/edit' },
        { icon: Lock, label: '비밀번호 변경', path: '/mobile/profile/password' },
        { icon: Smartphone, label: '기기 관리', path: '/mobile/profile/devices' }
      ]
    },
    {
      title: '알림',
      items: [
        { icon: Bell, label: '알림 설정', path: '/mobile/settings/notifications' }
      ]
    },
    {
      title: '앱 설정',
      items: [
        { icon: Globe, label: '언어', value: '한국어', path: '/mobile/settings/language' },
        { icon: Moon, label: '다크 모드', value: '시스템 설정', path: '/mobile/settings/theme' }
      ]
    },
    {
      title: '정보',
      items: [
        { icon: HelpCircle, label: '도움말', path: '/mobile/help' },
        { icon: Info, label: '앱 정보', value: 'v1.0.1', path: '/mobile/about' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader title="내 정보" showBack={false} />

      {/* 프로필 카드 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 text-white">
            <h2 className="text-xl font-bold">{user?.name || '사용자'}</h2>
            <p className="text-blue-100 text-sm">{user?.email || ''}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {getUserTypeLabel(user?.user_type)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 회사 정보 */}
      <div className="mx-4 -mt-4 bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">소속</p>
            <p className="font-medium text-gray-900">{user?.company_name || '미등록'}</p>
          </div>
        </div>
      </div>

      {/* 메뉴 섹션 */}
      <div className="px-4 mt-6 space-y-6">
        {menuItems.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h3>
            <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.path && navigate(item.path)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && (
                      <span className="text-sm text-gray-500">{item.value}</span>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 로그아웃 버튼 */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-xl shadow-sm text-red-500"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">로그아웃</span>
        </button>
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">로그아웃</h3>
            <p className="text-sm text-gray-600 mb-6">
              정말 로그아웃 하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
              >
                취소
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
