import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import DashboardHeader from '../../components/DashboardHeader';
import { MaintenanceWidget, AlertSummaryWidget } from '../../components/DashboardWidgets';

export default function MakerDashboard() {
  const { user } = useAuthStore();
  
  const [stats] = useState({
    // 제작 단계별 현황
    design: 3,
    machining: 5,
    assembly: 2,
    trialWaiting: 2,
    
    // 수리 현황
    repairNew: 2,
    repairInProgress: 3,
    repairLiability: 1,
    
    // 금주 일정
    trialScheduled: 3,
    deliveryScheduled: 2,
    
    // 완료 현황
    weekCompleted: 8
  });

  const [projects, setProjects] = useState([
    {
      id: 1,
      moldCode: 'M2024-056',
      partName: '도어 트림 LH',
      carModel: 'K5',
      stage: '가공',
      progress: 65,
      dueDate: '2024-01-25',
      status: 'on_track'
    },
    {
      id: 2,
      moldCode: 'M2024-058',
      partName: '범퍼 금형',
      carModel: 'K8',
      stage: '조립',
      progress: 85,
      dueDate: '2024-01-22',
      status: 'on_track'
    },
    {
      id: 3,
      moldCode: 'M2024-060',
      partName: '콘솔 박스',
      carModel: 'Sportage',
      stage: '설계',
      progress: 40,
      dueDate: '2024-02-01',
      status: 'delayed'
    }
  ]);

  const [repairRequests, setRepairRequests] = useState([
    {
      id: 1,
      moldCode: 'M2024-023',
      priority: 'urgent',
      requestFrom: 'A공장',
      requestDate: '2024-01-16',
      symptom: '성형면 손상',
      status: 'new'
    },
    {
      id: 2,
      moldCode: 'M2024-015',
      priority: 'normal',
      requestFrom: 'B공장',
      requestDate: '2024-01-15',
      symptom: '이젝터 핀 파손',
      status: 'in_progress'
    }
  ]);

  const [qrCodes, setQrCodes] = useState([
    {
      id: 1,
      moldCode: 'M2024-056',
      partName: '도어 트림 LH',
      qrToken: 'CAMS-M2024056-A3F7',
      attached: false,
      printedDate: null
    },
    {
      id: 2,
      moldCode: 'M2024-058',
      partName: '범퍼 금형',
      qrToken: 'CAMS-M2024058-B4E2',
      attached: true,
      printedDate: '2024-01-10'
    }
  ]);

  // 헤더 통계
  const headerStats = [
    { label: '진행 중', value: stats.design + stats.machining + stats.assembly },
    { label: '수리 대기', value: stats.repairNew + stats.repairInProgress },
    { label: '이번 주 완료', value: stats.weekCompleted }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="금형제작처 대시보드"
        subtitle={`${user?.company_name || '제작처'} - 금형 제작 및 수리 관리`}
        stats={headerStats}
      />
      
      <div className="p-6 space-y-6">
        {/* 제작 단계별 현황 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔨 제작 단계별 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="설계 중" value={stats.design} icon="�" color="blue" unit="개" />
            <StatCard title="가공 중" value={stats.machining} icon="⚙️" color="orange" unit="개" />
            <StatCard title="조립 중" value={stats.assembly} icon="🔩" color="purple" unit="개" />
            <StatCard title="시운전 대기" value={stats.trialWaiting} icon="🧪" color="green" unit="개" />
          </div>
        </section>

        {/* 관리 현황 위젯 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 관리 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MaintenanceWidget />
            <AlertSummaryWidget />
          </div>
        </section>

        {/* 제작 프로젝트 및 수리 현황 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 진행 중인 프로젝트 */}
          <section className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📋 진행 중인 프로젝트</h3>
              <Link to="/molds" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                전체 보기 →
              </Link>
            </div>
            <div className="space-y-4">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>

          {/* 수리 요청 현황 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 수리 요청 현황</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">신규 요청</p>
                <p className="text-2xl font-bold text-red-600">{stats.repairNew}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">진행 중</p>
                <p className="text-2xl font-bold text-blue-600">{stats.repairInProgress}</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">귀책 협의</p>
                <p className="text-2xl font-bold text-orange-600">{stats.repairLiability}</p>
              </div>
            </div>
            <div className="space-y-3">
              {repairRequests.map(repair => (
                <RepairCard key={repair.id} repair={repair} />
              ))}
            </div>
          </section>
        </div>

        {/* QR 코드 관리 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 QR 코드 관리</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrCodes.map(qr => (
              <QRCodeCard key={qr.id} qrCode={qr} />
            ))}
          </div>
        </section>

        {/* 금주 일정 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">� 금주 일정</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">🧪</span>
                <h4 className="font-semibold text-gray-900">시운전 예정</h4>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {stats.trialScheduled}건
                </span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">M2024-056</p>
                    <p className="text-sm text-gray-600">K5 도어 트림</p>
                  </div>
                  <span className="text-sm text-gray-500">01/18 (목)</span>
                </li>
                <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">M2024-058</p>
                    <p className="text-sm text-gray-600">K8 범퍼</p>
                  </div>
                  <span className="text-sm text-gray-500">01/19 (금)</span>
                </li>
              </ul>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">📦</span>
                <h4 className="font-semibold text-gray-900">납품 예정</h4>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {stats.deliveryScheduled}건
                </span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">M2024-048</p>
                    <p className="text-sm text-gray-600">Sportage 콘솔</p>
                  </div>
                  <span className="text-sm text-gray-500">01/20 (토)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 빠른 작업 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ 빠른 작업</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionCard icon="📋" title="제작전 체크리스트" description="81개 항목 점검" link="/pre-production-checklist" />
            <QuickActionCard icon="🔧" title="수리 작업 관리" description="수리 진행 현황" link="/maker/repair-requests" />
            <QuickActionCard icon="📦" title="금형 현황" description="금형 목록 조회" link="/molds" />
            <QuickActionCard icon="🔔" title="알림 확인" description="알림 목록" link="/alerts" />
          </div>
        </section>
      </div>
    </div>
  );
}

// 통계 카드
function StatCard({ title, value, icon, color, unit = '' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${colors[color]} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {value}{unit && <span className="text-lg ml-1">{unit}</span>}
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

// 프로젝트 카드
function ProjectCard({ project }) {
  const statusColors = {
    on_track: 'bg-green-100 text-green-800',
    delayed: 'bg-red-100 text-red-800',
    at_risk: 'bg-yellow-100 text-yellow-800'
  };

  const statusLabels = {
    on_track: '정상',
    delayed: '지연',
    at_risk: '주의'
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">{project.moldCode}</p>
          <p className="text-sm text-gray-600">{project.partName} | {project.carModel}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">{project.stage}</span>
          <span className="font-medium text-gray-900">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">납기: {project.dueDate}</span>
        <Link to={`/mold-detail/${project.id}`} className="text-blue-600 hover:text-blue-700 font-medium">
          상세보기 →
        </Link>
      </div>
    </div>
  );
}

// 수리 카드
function RepairCard({ repair }) {
  const priorityColors = {
    urgent: 'bg-red-50 border-red-200',
    normal: 'bg-blue-50 border-blue-200'
  };

  const priorityIcons = {
    urgent: '🔴',
    normal: '🔵'
  };

  const statusLabels = {
    new: '신규',
    in_progress: '진행중',
    liability: '귀책협의'
  };

  return (
    <div className={`border rounded-lg p-3 ${priorityColors[repair.priority]}`}>
      <div className="flex items-start space-x-2">
        <span className="text-xl">{priorityIcons[repair.priority]}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-900">{repair.moldCode}</p>
            <span className="text-xs text-gray-500">{statusLabels[repair.status]}</span>
          </div>
          <p className="text-sm text-gray-700 mb-1">요청처: {repair.requestFrom}</p>
          <p className="text-sm text-gray-600">증상: {repair.symptom}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{repair.requestDate}</span>
            <Link to="/maker/repair-requests" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              수리 시작 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// QR 코드 카드
function QRCodeCard({ qrCode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900">{qrCode.moldCode}</p>
          <p className="text-sm text-gray-600">{qrCode.partName}</p>
        </div>
        {qrCode.attached ? (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            ✅ 부착완료
          </span>
        ) : (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
            ⏳ 대기중
          </span>
        )}
      </div>
      <div className="bg-gray-100 rounded p-3 mb-3 text-center">
        <div className="text-4xl mb-2">📱</div>
        <p className="text-xs font-mono text-gray-600">{qrCode.qrToken}</p>
      </div>
      <div className="flex space-x-2">
        <Link 
          to={`/mold-detail/${qrCode.id}`}
          className="flex-1 py-2 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 text-center"
        >
          상세보기
        </Link>
        <Link 
          to="/qr-sessions"
          className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 text-center"
        >
          QR 세션
        </Link>
      </div>
    </div>
  );
}

// 빠른 작업 카드
function QuickActionCard({ icon, title, description, link }) {
  return (
    <Link 
      to={link}
      className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300"
    >
      <div className="text-center">
        <div className="text-4xl mb-3">{icon}</div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
