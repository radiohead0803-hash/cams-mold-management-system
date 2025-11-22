import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { QrCode, Wrench, Camera, CheckCircle, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function MakerMobileDashboard() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const moldCode = searchParams.get('mold') || 'M2024-056';

  const [moldInfo] = useState({
    moldCode: moldCode,
    partName: '도어 트림 LH',
    carModel: 'K5',
    currentStage: '시운전 대기',
    progress: 85,
    dueDate: '2024-01-25',
    qrToken: 'CAMS-M2024056-A3F7'
  });

  const [workActions] = useState([
    {
      id: 'trial',
      title: '시운전 시작',
      icon: <CheckCircle size={24} />,
      color: 'bg-green-500',
      description: '시운전 체크리스트 작성',
      available: true
    },
    {
      id: 'repair',
      title: '수리 작업',
      icon: <Wrench size={24} />,
      color: 'bg-orange-500',
      description: '수리 내역 기록',
      available: true
    },
    {
      id: 'photo',
      title: '사진 촬영',
      icon: <Camera size={24} />,
      color: 'bg-blue-500',
      description: '작업 사진 업로드',
      available: true
    },
    {
      id: 'qr',
      title: 'QR 코드 출력',
      icon: <QrCode size={24} />,
      color: 'bg-purple-500',
      description: 'QR 코드 재발급',
      available: true
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <Link to="/dashboard/maker" className="flex items-center gap-2">
            <ArrowLeft size={20} />
            <span className="text-sm">뒤로</span>
          </Link>
          <div className="text-sm">{user?.company_name || '제작처'}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold mb-1">{moldInfo.moldCode}</div>
          <div className="text-sm text-blue-100">{moldInfo.carModel} | {moldInfo.partName}</div>
        </div>
      </div>

      {/* 금형 정보 카드 */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600">현재 단계</div>
              <div className="text-lg font-semibold text-gray-900">{moldInfo.currentStage}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">진행률</div>
              <div className="text-2xl font-bold text-blue-600">{moldInfo.progress}%</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${moldInfo.progress}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Clock size={16} />
              <span>납기: {moldInfo.dueDate}</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle size={16} />
              <span>정상</span>
            </div>
          </div>
        </div>

        {/* QR 코드 정보 */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-4 mb-4 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <QrCode size={20} className="text-purple-600" />
            <div className="font-semibold text-purple-900">QR 코드 정보</div>
          </div>
          <div className="text-center py-4">
            <div className="text-sm text-purple-600 mb-2">QR 토큰</div>
            <div className="font-mono text-lg font-bold text-purple-900 bg-white rounded px-3 py-2">
              {moldInfo.qrToken}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 btn-secondary text-sm py-2">
              QR 출력
            </button>
            <button className="flex-1 btn-secondary text-sm py-2">
              재발급
            </button>
          </div>
        </div>

        {/* 작업 선택 */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Wrench size={20} />
            작업 선택
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {workActions.map(action => (
              <button
                key={action.id}
                disabled={!action.available}
                className={`${action.color} text-white rounded-lg p-4 shadow-md hover:shadow-lg transition-all ${
                  !action.available ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {action.icon}
                  <div className="font-semibold text-sm">{action.title}</div>
                  <div className="text-xs opacity-90">{action.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 최근 작업 이력 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-900 mb-3">최근 작업 이력</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">조립 완료</div>
                <div className="text-xs text-gray-600">2024-01-18 14:30</div>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">가공 완료</div>
                <div className="text-xs text-gray-600">2024-01-15 16:20</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">설계 승인</div>
                <div className="text-xs text-gray-600">2024-01-10 09:00</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <Link 
          to="/qr-login"
          className="block w-full bg-blue-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          다른 금형 스캔
        </Link>
      </div>
    </div>
  );
}
