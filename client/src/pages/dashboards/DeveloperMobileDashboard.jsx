import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { QrCode, ClipboardCheck, TrendingUp, FileText, CheckCircle, Clock, AlertTriangle, ArrowLeft, MapPin, Users } from 'lucide-react';

export default function DeveloperMobileDashboard() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const moldCode = searchParams.get('mold') || 'M2024-056';

  const [moldInfo] = useState({
    moldCode: moldCode,
    partName: '도어 트림 LH',
    carModel: 'K5',
    developmentStage: '시운전',
    productionStage: '시제',
    progress: 75,
    dueDate: '2024-01-25',
    maker: 'A제작소',
    plant: '생산공장1',
    status: 'on_track'
  });

  const [lifecycle] = useState([
    { stage: '기획', status: 'completed', date: '2024-01-05', progress: 100 },
    { stage: '설계', status: 'completed', date: '2024-01-10', progress: 100 },
    { stage: '제작', status: 'completed', date: '2024-01-15', progress: 100 },
    { stage: '시운전', status: 'in_progress', date: '진행중', progress: 75 },
    { stage: '양산', status: 'pending', date: '예정', progress: 0 }
  ]);

  const [workActions] = useState([
    {
      id: 'approve',
      title: '승인 처리',
      icon: <CheckCircle size={24} />,
      color: 'bg-green-500',
      description: '시운전 결과 승인',
      badge: '대기 중',
      available: true
    },
    {
      id: 'review',
      title: '검토 요청',
      icon: <FileText size={24} />,
      color: 'bg-blue-500',
      description: '제작처 검토 요청',
      badge: null,
      available: true
    },
    {
      id: 'transfer',
      title: '이관 승인',
      icon: <MapPin size={24} />,
      color: 'bg-purple-500',
      description: '생산처 이관 승인',
      badge: null,
      available: true
    },
    {
      id: 'maker',
      title: '제작처 관리',
      icon: <Users size={24} />,
      color: 'bg-orange-500',
      description: '제작처 성과 확인',
      badge: null,
      available: true
    },
    {
      id: 'schedule',
      title: '일정 관리',
      icon: <Clock size={24} />,
      color: 'bg-indigo-500',
      description: '개발 일정 조정',
      badge: null,
      available: true
    },
    {
      id: 'qr',
      title: 'QR 코드',
      icon: <QrCode size={24} />,
      color: 'bg-pink-500',
      description: 'QR 코드 확인',
      badge: null,
      available: true
    }
  ]);

  const [recentActivities] = useState([
    {
      type: 'approval',
      message: '시운전 결과 승인 대기',
      moldCode: 'M2024-056',
      time: '30분 전',
      priority: 'high'
    },
    {
      type: 'review',
      message: '설계 검토 완료',
      moldCode: 'M2024-078',
      time: '2시간 전',
      priority: 'normal'
    },
    {
      type: 'transfer',
      message: '생산처 이관 승인',
      moldCode: 'M2024-034',
      time: '5시간 전',
      priority: 'normal'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <Link to="/dashboard/developer" className="flex items-center gap-2">
            <ArrowLeft size={20} />
            <span className="text-sm">뒤로</span>
          </Link>
          <div className="text-sm">금형개발 담당</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold mb-1">{moldInfo.moldCode}</div>
          <div className="text-sm text-indigo-100">{moldInfo.carModel} | {moldInfo.partName}</div>
        </div>
      </div>

      {/* 금형 정보 카드 */}
      <div className="p-4">
        {/* 개발 현황 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm text-gray-600">개발 단계</div>
              <div className="text-lg font-semibold text-gray-900">{moldInfo.developmentStage}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">진행률</div>
              <div className="text-2xl font-bold text-indigo-600">{moldInfo.progress}%</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div 
              className="bg-indigo-600 h-3 rounded-full transition-all"
              style={{ width: `${moldInfo.progress}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Clock size={16} />
              <span>납기: {moldInfo.dueDate}</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle size={16} />
              <span>정상 진행</span>
            </div>
          </div>
        </div>

        {/* 생명주기 단계 */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-4 mb-4 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={20} className="text-blue-600" />
            <div className="font-semibold text-blue-900">개발 생명주기</div>
          </div>
          <div className="space-y-2">
            {lifecycle.map((stage, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  stage.status === 'completed' ? 'bg-green-500 text-white' :
                  stage.status === 'in_progress' ? 'bg-blue-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {stage.status === 'completed' ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${
                      stage.status === 'in_progress' ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      {stage.stage}
                    </span>
                    <span className="text-xs text-gray-600">{stage.date}</span>
                  </div>
                  {stage.status === 'in_progress' && (
                    <div className="mt-1 w-full bg-blue-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${stage.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 협력사 정보 */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={18} />
            협력사 정보
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">제작처</span>
              <span className="font-medium text-gray-900">{moldInfo.maker}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">생산처</span>
              <span className="font-medium text-gray-900">{moldInfo.plant}</span>
            </div>
          </div>
        </div>

        {/* 최근 활동 */}
        {recentActivities.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle size={18} />
              최근 활동
            </h3>
            <div className="space-y-2">
              {recentActivities.map((activity, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg ${
                    activity.priority === 'high' ? 'bg-red-50 border border-red-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="text-sm font-medium">{activity.message}</div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                  <div className="text-xs text-gray-600">{activity.moldCode}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 작업 선택 */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ClipboardCheck size={20} />
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

        {/* 개발 이력 */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="font-semibold text-gray-900 mb-3">개발 이력</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">시운전 진행 중</div>
                <div className="text-xs text-gray-600">2024-01-18 | A제작소</div>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">제작 완료</div>
                <div className="text-xs text-gray-600">2024-01-15 | A제작소</div>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-3 border-b">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">설계 승인</div>
                <div className="text-xs text-gray-600">2024-01-10 | 본사</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">기획 완료</div>
                <div className="text-xs text-gray-600">2024-01-05 | 본사</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <Link 
          to="/qr-login"
          className="block w-full bg-indigo-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          다른 금형 스캔
        </Link>
      </div>
    </div>
  );
}
