/**
 * 모바일 알림 설정 페이지
 * - 푸시 알림 권한 관리
 * - 알림 유형별 설정
 * - PWA 설치 안내
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, BellOff, Smartphone, Download, Check, X,
  AlertTriangle, Wrench, ClipboardCheck, Truck, Calendar,
  ChevronRight, Info
} from 'lucide-react';
import { MobileHeader } from '../../components/mobile/MobileLayout';
import { 
  registerServiceWorker, 
  requestNotificationPermission,
  isPWAInstalled,
  canInstall,
  promptInstall
} from '../../utils/pwaUtils';

export default function MobileNotificationSettings() {
  const navigate = useNavigate();
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [swRegistration, setSwRegistration] = useState(null);
  const [isPWA, setIsPWA] = useState(false);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [settings, setSettings] = useState({
    inspection_reminder: true,
    repair_update: true,
    transfer_status: true,
    maintenance_alert: true,
    shot_warning: true,
    system_notice: true
  });

  useEffect(() => {
    // 초기 상태 확인
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    setIsPWA(isPWAInstalled());
    setCanInstallPWA(canInstall());

    // 서비스 워커 등록
    registerServiceWorker().then(reg => {
      setSwRegistration(reg);
    });

    // 저장된 설정 불러오기
    const savedSettings = localStorage.getItem('notification_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
  };

  const handleInstallPWA = async () => {
    const installed = await promptInstall();
    if (installed) {
      setIsPWA(true);
      setCanInstallPWA(false);
    }
  };

  const handleToggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem('notification_settings', JSON.stringify(newSettings));
  };

  const notificationTypes = [
    { 
      key: 'inspection_reminder', 
      icon: ClipboardCheck, 
      label: '점검 알림', 
      description: '일상/정기 점검 예정 알림',
      color: 'text-green-500'
    },
    { 
      key: 'repair_update', 
      icon: Wrench, 
      label: '수리 현황', 
      description: '수리 요청 상태 변경 알림',
      color: 'text-orange-500'
    },
    { 
      key: 'transfer_status', 
      icon: Truck, 
      label: '이관 알림', 
      description: '금형 이관 승인/완료 알림',
      color: 'text-blue-500'
    },
    { 
      key: 'maintenance_alert', 
      icon: Calendar, 
      label: '유지보전 알림', 
      description: '유지보전 일정 알림',
      color: 'text-purple-500'
    },
    { 
      key: 'shot_warning', 
      icon: AlertTriangle, 
      label: '타수 경고', 
      description: '목표 타수 임계치 도달 알림',
      color: 'text-red-500'
    },
    { 
      key: 'system_notice', 
      icon: Info, 
      label: '시스템 공지', 
      description: '시스템 업데이트 및 공지사항',
      color: 'text-gray-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <MobileHeader title="알림 설정" />

      <div className="px-4 py-4 space-y-4">
        {/* 푸시 알림 권한 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">푸시 알림</h3>
          </div>
          
          <div className="p-4">
            {notificationPermission === 'granted' ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800">알림 허용됨</p>
                  <p className="text-xs text-green-600">푸시 알림을 받을 수 있습니다</p>
                </div>
                <Check className="w-5 h-5 text-green-600" />
              </div>
            ) : notificationPermission === 'denied' ? (
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <BellOff className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-red-800">알림 차단됨</p>
                  <p className="text-xs text-red-600">브라우저 설정에서 알림을 허용해주세요</p>
                </div>
                <X className="w-5 h-5 text-red-600" />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Bell className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">알림 권한 필요</p>
                    <p className="text-xs text-gray-500">푸시 알림을 받으려면 권한을 허용해주세요</p>
                  </div>
                </div>
                <button
                  onClick={handleRequestPermission}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium"
                >
                  알림 허용하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PWA 설치 */}
        {!isPWA && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">앱 설치</h3>
            </div>
            
            <div className="p-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-blue-800">홈 화면에 추가</p>
                  <p className="text-xs text-blue-600">앱처럼 빠르게 접근할 수 있습니다</p>
                </div>
              </div>
              
              {canInstallPWA ? (
                <button
                  onClick={handleInstallPWA}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  앱 설치하기
                </button>
              ) : (
                <div className="text-sm text-gray-500 text-center">
                  <p>브라우저 메뉴에서 "홈 화면에 추가"를 선택하세요</p>
                  <p className="text-xs mt-1">(Safari: 공유 버튼 → 홈 화면에 추가)</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 알림 유형별 설정 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">알림 유형</h3>
            <p className="text-xs text-gray-500 mt-1">받고 싶은 알림을 선택하세요</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {notificationTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => handleToggleSetting(type.key)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <type.icon className={`w-5 h-5 ${type.color}`} />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{type.label}</p>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </div>
                <div className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  settings[type.key] ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings[type.key] ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 테스트 알림 */}
        {notificationPermission === 'granted' && (
          <button
            onClick={() => {
              new Notification('CAMS 테스트 알림', {
                body: '알림이 정상적으로 작동합니다!',
                icon: '/icons/icon-192x192.png'
              });
            }}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium"
          >
            테스트 알림 보내기
          </button>
        )}
      </div>
    </div>
  );
}
