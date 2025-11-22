import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { QrCode, ClipboardCheck, TrendingUp, Wrench, Camera, AlertTriangle, ArrowLeft, MapPin } from 'lucide-react';

export default function PlantMobileDashboard() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const moldCode = searchParams.get('mold') || 'M2024-023';

  const [moldInfo] = useState({
    moldCode: moldCode,
    partName: '범퍼 커버',
    carModel: '쏘렌토',
    currentShots: 456789,
    maxShots: 1000000,
    lastCheckDate: '2024-01-18',
    nextCheckDate: '2024-01-19',
    location: 'A공장',
    status: 'production'
  });

  const shotsPercentage = (moldInfo.currentShots / moldInfo.maxShots * 100).toFixed(1);

  const [workActions] = useState([
    {
      id: 'daily-check',
      title: '일상점검',
      icon: <ClipboardCheck size={24} />,
      color: 'bg-green-500',
      description: '10개 카테고리 점검',
      badge: '필수',
      available: true
    },
    {
      id: 'production',
      title: '생산수량 입력',
      icon: <TrendingUp size={24} />,
      color: 'bg-blue-500',
      description: '금일 생산수량 기록',
      badge: '필수',
      available: true
    },
    {
      id: 'periodic',
      title: '정기점검',
      icon: <ClipboardCheck size={24} />,
      color: 'bg-purple-500',
      description: '월간 정기점검',
      badge: null,
      available: false
    },
    {
      id: 'repair',
      title: '수리 요청',
      icon: <Wrench size={24} />,
      color: 'bg-orange-500',
      description: '불량 발견 시 요청',
      badge: null,
      available: true
    },
    {
      id: 'photo',
      title: '사진 촬영',
      icon: <Camera size={24} />,
      color: 'bg-indigo-500',
      description: '점검 사진 업로드',
      badge: null,
      available: true
    },
    {
      id: 'transfer',
      title: '이관 요청',
      icon: <MapPin size={24} />,
      color: 'bg-pink-500',
      description: '금형 이동 요청',
      badge: null,
      available: true
    }
  ]);

  const [alerts] = useState([
    {
      type: 'warning',
      message: '일상점검 예정 (오늘)',
      time: '1시간 전'
    },
    {
      type: 'info',
      message: '타수 45만 도달',
      time: '3시간 전'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <Link to="/dashboard/plant" className="flex items-center gap-2">
            <ArrowLeft size={20} />
            <span className="text-sm">뒤로</span>
          </Link>
          <div className="text-sm">{user?.company_name || '생산처'}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold mb-1">{moldInfo.moldCode}</div>
          <div className="text-sm text-green-100">{moldInfo.carModel} | {moldInfo.partName}</div>
        </div>
      </div>

      {/* 금형 정보 카드 */}
      <div className="p-4">
        {/* 타수 정보 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600">현재 타수</div>
              <div className="text-2xl font-bold text-gray-900">
                {moldInfo.currentShots.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">최대 타수</div>
              <div className="text-lg font-semibold text-gray-700">
                {moldInfo.maxShots.toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all ${
                shotsPercentage >= 90 ? 'bg-red-500' :
                shotsPercentage >= 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${shotsPercentage}%` }}
            ></div>
          </div>
          <div className="text-center text-sm font-medium">
            <span className={
              shotsPercentage >= 90 ? 'text-red-600' :
              shotsPercentage >= 70 ? 'text-yellow-600' :
              'text-green-600'
            }>
              {shotsPercentage}% 사용
            </span>
          </div>
        </div>

        {/* 점검 일정 */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-4 mb-4 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardCheck size={20} className="text-blue-600" />
            <div className="font-semibold text-blue-900">점검 일정</div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">마지막 점검</span>
              <span className="font-medium text-blue-900">{moldInfo.lastCheckDate}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">다음 점검</span>
              <span className="font-medium text-blue-900">{moldInfo.nextCheckDate}</span>
            </div>
          </div>
        </div>

        {/* 알림 */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle size={18} />
              알림
            </h3>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg ${
                    alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="text-sm font-medium">{alert.message}</div>
                    <div className="text-xs text-gray-500">{alert.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 작업 선택 */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <QrCode size={20} />
            작업 선택
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {workActions.map(action => (
              <button
                key={action.id}
                disabled={!action.available}
                className={`${action.color} text-white rounded-lg p-4 shadow-md hover:shadow-lg transition-all relative ${
                  !action.available ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                }`}
              >
                {action.badge && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {action.badge}
                  </div>
                )}
                <div className="flex flex-col items-center gap-2">
                  {action.icon}
                  <div className="font-semibold text-sm">{action.title}</div>
                  <div className="text-xs opacity-90">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* GPS 위치 정보 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={18} className="text-green-600" />
            <div className="font-semibold text-gray-900">위치 정보</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">현재 위치</div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="font-medium text-gray-900">{moldInfo.location}</div>
            </div>
          </div>
        </div>

        {/* 최근 작업 이력 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-900 mb-3">최근 작업 이력</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">일상점검 완료</div>
                <div className="text-xs text-gray-600">2024-01-18 09:00 | 정상</div>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">생산수량 입력</div>
                <div className="text-xs text-gray-600">2024-01-17 17:30 | 1,234개</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">일상점검 완료</div>
                <div className="text-xs text-gray-600">2024-01-17 09:00 | 정상</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <Link 
          to="/qr-login"
          className="block w-full bg-green-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          다른 금형 스캔
        </Link>
      </div>
    </div>
  );
}
