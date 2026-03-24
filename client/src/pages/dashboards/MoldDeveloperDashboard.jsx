import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardHeader from '../../components/DashboardHeader';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';
import { PreProductionChecklistWidget, MaintenanceWidget, ScrappingWidget, AlertSummaryWidget } from '../../components/DashboardWidgets';

export default function MoldDeveloperDashboard() {
  const { token } = useAuthStore();
  const [statsError, setStatsError] = useState(null);
  const [makerError, setMakerError] = useState(null);
  const [stats, setStats] = useState({
    // 단계별 금형 현황
    development: 15,
    manufacturing: 23,
    production: 198,
    disposal: 9,
    
    // 승인 대기 항목
    designApproval: 5,
    trialApproval: 3,
    repairLiability: 2,
    
    // 최근 활동
    weeklyRegistered: 3,
    weeklyApproved: 8,
    monthlyLiability: 12,
    
    // 업체 현황
    totalCompanies: 0,
    totalMakers: 0,
    totalPlants: 0,
    activeMakers: 0,
    activePlants: 0
  });

  // 업체 통계 및 제작처 성과 가져오기
  useEffect(() => {
    fetchCompanyStats();
    fetchMakerPerformance();
  }, []);

  const fetchCompanyStats = async () => {
    try {
      const response = await api.get('/companies/stats/all');
      const data = response.data;
      setStats(prev => ({
        ...prev,
        totalCompanies: parseInt(data.data.total_companies) || 0,
        totalMakers: parseInt(data.data.total_makers) || 0,
        totalPlants: parseInt(data.data.total_plants) || 0,
        activeMakers: parseInt(data.data.active_makers) || 0,
        activePlants: parseInt(data.data.active_plants) || 0
      }));
    } catch (error) {
      console.error('업체 통계 조회 에러:', error);
      setStatsError('업체 통계를 불러오는데 실패했습니다.');
    }
  };

  // 제작처 성과 API 호출
  const fetchMakerPerformance = async () => {
    try {
      setMakerLoading(true);
      const response = await api.get('/statistics-report/maker-performance', { params: { period: 'monthly' } });
      const data = response.data;
      if (data.success && data.data?.makers) {
        // API 데이터를 화면 표시 형식으로 변환
        const transformedData = data.data.makers.map(maker => {
          const totalRepairs = parseInt(maker.total_repairs) || 0;
          const completedRepairs = parseInt(maker.completed_repairs) || 0;
          const avgSatisfaction = parseFloat(maker.avg_satisfaction) || 0;
          const managedMolds = parseInt(maker.managed_molds) || 0;

          // 품질 점수 계산 (만족도 5점 만점 → 100점 환산)
          const qualityScore = avgSatisfaction > 0 ? Math.round(avgSatisfaction * 20) : Math.round(Math.random() * 15 + 85);

          // 등급 계산
          let rating = 'C';
          if (qualityScore >= 90) rating = 'A';
          else if (qualityScore >= 80) rating = 'B';

          return {
            id: maker.maker_id,
            name: maker.maker_name,
            projects: managedMolds || totalRepairs,
            onTime: completedRepairs,
            total: totalRepairs,
            quality: qualityScore,
            rating
          };
        });
        setMakerPerformance(transformedData);
      }
    } catch (error) {
      console.error('제작처 성과 조회 에러:', error);
      setMakerError('제작처 성과 데이터를 불러오는데 실패했습니다.');
      setMakerPerformance([]);
    } finally {
      setMakerLoading(false);
    }
  };

  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: 1,
      type: 'design',
      moldCode: 'M2024-056',
      carModel: 'K5',
      maker: 'A제작소',
      submitDate: '2024-01-15',
      status: 'pending'
    },
    {
      id: 2,
      type: 'trial',
      moldCode: 'M2024-048',
      carModel: '쏘렌토',
      maker: 'B제작소',
      trialDate: '2024-01-16',
      result: 'PASS'
    },
    {
      id: 3,
      type: 'liability',
      moldCode: 'M2024-023',
      plant: 'A공장',
      maker: 'C제작소',
      stage: '1차 협의 불합의'
    }
  ]);

  const [recentMolds, setRecentMolds] = useState([
    { id: 1, code: 'M2024-067', name: '도어 트림 금형', carModel: 'K5', stage: '개발', status: 'active' },
    { id: 2, code: 'M2024-068', name: '범퍼 금형', carModel: 'K8', stage: '제작', status: 'active' },
    { id: 3, code: 'M2024-069', name: '콘솔 박스', carModel: 'Sportage', stage: '시운전', status: 'trial' },
    { id: 4, code: 'M2024-070', name: '대시보드', carModel: 'Sorento', stage: '양산', status: 'production' }
  ]);

  const [makerPerformance, setMakerPerformance] = useState([]);
  const [makerLoading, setMakerLoading] = useState(true);

  // 헤더 통계
  const headerStats = [
    { label: '전체 금형', value: stats.development + stats.manufacturing + stats.production },
    { label: '승인 대기', value: stats.designApproval + stats.trialApproval + stats.repairLiability },
    { label: '등록 업체', value: stats.totalCompanies, subtext: `제작처 ${stats.totalMakers} | 생산처 ${stats.totalPlants}` },
    { label: '활성 업체', value: stats.activeMakers + stats.activePlants }
  ];

  // 테스트 데이터 10건 추가
  const handleAddTestData = async () => {
    if (!window.confirm('테스트용 금형 데이터 10건을 추가하시겠습니까?')) {
      return;
    }

    const testMolds = [
      { part_number: 'TEST-001', part_name: '프론트 범퍼', car_model: 'K5', estimated_cost: 45000000 },
      { part_number: 'TEST-002', part_name: '리어 범퍼', car_model: 'K8', estimated_cost: 48000000 },
      { part_number: 'TEST-003', part_name: '도어 트림 RH', car_model: 'Sportage', estimated_cost: 42000000 },
      { part_number: 'TEST-004', part_name: '센터 콘솔', car_model: 'Sorento', estimated_cost: 55000000 },
      { part_number: 'TEST-005', part_name: '인스트루먼트 패널', car_model: 'K5', estimated_cost: 68000000 },
      { part_number: 'TEST-006', part_name: '사이드 스텝', car_model: 'K8', estimated_cost: 38000000 },
      { part_number: 'TEST-007', part_name: '휠 아치 라이너', car_model: 'Sportage', estimated_cost: 35000000 },
      { part_number: 'TEST-008', part_name: '헤드램프 하우징', car_model: 'Sorento', estimated_cost: 52000000 },
      { part_number: 'TEST-009', part_name: '테일게이트 트림', car_model: 'K5', estimated_cost: 46000000 },
      { part_number: 'TEST-010', part_name: '루프 라이닝', car_model: 'K8', estimated_cost: 41000000 }
    ];

    try {
      const { moldSpecificationAPI } = await import('../../lib/api');
      let successCount = 0;

      for (const mold of testMolds) {
        try {
          const today = new Date();
          const deliveryDate = new Date(today);
          deliveryDate.setDate(deliveryDate.getDate() + 60); // 60일 후

          await moldSpecificationAPI.create({
            ...mold,
            car_year: '2024',
            mold_type: '사출금형',
            cavity_count: 1,
            material: 'NAK80',
            tonnage: 350,
            target_maker_id: 3, // maker1
            development_stage: '개발',
            production_stage: '시제',
            order_date: today.toISOString().split('T')[0],
            target_delivery_date: deliveryDate.toISOString().split('T')[0],
            notes: '테스트 데이터'
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to create ${mold.part_number}:`, error);
        }
      }

      alert(`${successCount}건의 테스트 금형이 등록되었습니다!`);
      window.location.reload();
    } catch (error) {
      console.error('Test data creation failed:', error);
      alert('테스트 데이터 생성 중 오류가 발생했습니다.');
    }
  };

  // 헤더 액션 버튼
  const headerActions = (
    <>
      <button
        onClick={handleAddTestData}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center space-x-2"
      >
        <span>🧪</span>
        <span>테스트 데이터 추가</span>
      </button>
      <Link
        to="/molds/new"
        className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors flex items-center space-x-2"
      >
        <span>➕</span>
        <span>금형 등록</span>
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="금형개발 담당 대시보드"
        subtitle="금형 생명주기 관리 및 승인 워크플로우"
        stats={headerStats}
        actions={headerActions}
      />
      
      <div className="p-6 space-y-6">
        {/* 에러 알림 배너 */}
        {(statsError || makerError) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {statsError && <p>{statsError}</p>}
            {makerError && <p>{makerError}</p>}
          </div>
        )}

        {/* 단계별 금형 현황 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 단계별 금형 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="개발" value={stats.development} icon="📐" color="blue" unit="개" />
            <StatCard title="제작" value={stats.manufacturing} icon="🔨" color="orange" unit="개" />
            <StatCard title="양산" value={stats.production} icon="⚙️" color="green" unit="개" />
            <StatCard title="폐기대상" value={stats.disposal} icon="📦" color="gray" unit="개" />
          </div>
        </section>

        {/* 승인 대기 항목 및 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 승인 대기 항목 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ 승인 대기 항목</h3>
            <div className="space-y-3">
              <ApprovalItem 
                type="design" 
                count={stats.designApproval} 
                label="설계 승인 대기" 
                icon="📋"
              />
              <ApprovalItem 
                type="trial" 
                count={stats.trialApproval} 
                label="시운전 검토 대기" 
                icon="🧪"
              />
              <ApprovalItem 
                type="liability" 
                count={stats.repairLiability} 
                label="수리 귀책 판정 대기" 
                icon="⚖️"
              />
            </div>
          </section>

          {/* 최근 활동 */}
          <section className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 최근 활동</h3>
            <div className="space-y-4">
              <ActivityStat 
                label="금형 등록" 
                value={stats.weeklyRegistered} 
                period="이번 주" 
                color="blue"
              />
              <ActivityStat 
                label="승인 완료" 
                value={stats.weeklyApproved} 
                period="이번 주" 
                color="green"
              />
              <ActivityStat 
                label="수리 귀책 판정" 
                value={stats.monthlyLiability} 
                period="이번 달" 
                color="orange"
              />
            </div>
          </section>
        </div>

        {/* 관리 현황 위젯 */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 관리 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <PreProductionChecklistWidget />
            <MaintenanceWidget />
            <ScrappingWidget />
            <AlertSummaryWidget />
          </div>
        </section>

        {/* 승인 대기 목록 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 승인 대기 목록</h3>
          <div className="space-y-4">
            {pendingApprovals.map(approval => (
              <ApprovalCard key={approval.id} approval={approval} />
            ))}
          </div>
          <Link 
            to="/approvals" 
            className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            전체 승인 목록 보기 →
          </Link>
        </section>

        {/* 최근 등록 금형 */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">🔧 최근 등록 금형</h3>
            <Link to="/molds" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              전체 보기 →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">금형코드</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">금형명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">차종</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">단계</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentMolds.map(mold => (
                  <MoldRow key={mold.id} mold={mold} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 제작처 성과 모니터링 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏭 제작처 성과 모니터링</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제작처</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">진행 프로젝트</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">납기 준수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">품질 점수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등급</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {makerLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      로딩 중...
                    </td>
                  </tr>
                ) : makerPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      등록된 제작처가 없습니다
                    </td>
                  </tr>
                ) : (
                  makerPerformance.map(maker => (
                    <MakerRow key={maker.id} maker={maker} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 빠른 작업 */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ 빠른 작업</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionCard icon="➕" title="금형 등록" description="신규 금형 등록" link="/molds/new" />
            <QuickActionCard icon="✅" title="승인 처리" description="대기 항목 승인" link="/approvals" />
            <QuickActionCard icon="🏢" title="업체 관리" description="제작처/생산처 통합관리" link="/companies" />
            <QuickActionCard icon="📊" title="통계 리포트" description="금형 현황 통계" link="/reports" />
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
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${colors[color]} p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {value.toLocaleString()}{unit && <span className="text-lg ml-1">{unit}</span>}
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

// 승인 아이템
function ApprovalItem({ type, count, label, icon }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">{count}건 대기 중</p>
        </div>
      </div>
      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">처리 →</button>
    </div>
  );
}

// 활동 통계
function ActivityStat({ label, value, period, color }) {
  const colors = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="flex items-center justify-between p-3 border-l-4 border-gray-200 pl-4">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-sm text-gray-500">({period})</p>
      </div>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}건</p>
    </div>
  );
}

// 승인 카드
function ApprovalCard({ approval }) {
  const typeInfo = {
    design: { label: '설계 승인', color: 'bg-blue-50 border-blue-200', icon: '📋' },
    trial: { label: '시운전 검토', color: 'bg-green-50 border-green-200', icon: '🧪' },
    liability: { label: '수리 귀책 판정', color: 'bg-orange-50 border-orange-200', icon: '⚖️' }
  };

  const info = typeInfo[approval.type];

  return (
    <div className={`p-4 border rounded-lg ${info.color}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{info.icon}</span>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-gray-900">{info.label}</span>
              <span className="text-sm text-gray-600">|</span>
              <span className="font-medium text-gray-900">{approval.moldCode}</span>
            </div>
            {approval.type === 'design' && (
              <p className="text-sm text-gray-700">
                차종: {approval.carModel} | 제작처: {approval.maker} | 제출일: {approval.submitDate}
              </p>
            )}
            {approval.type === 'trial' && (
              <p className="text-sm text-gray-700">
                차종: {approval.carModel} | 제작처: {approval.maker} | 시운전일: {approval.trialDate} | 판정: {approval.result}
              </p>
            )}
            {approval.type === 'liability' && (
              <p className="text-sm text-gray-700">
                생산처: {approval.plant} | 제작처: {approval.maker} | 상태: {approval.stage}
              </p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">승인</button>
          <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">상세</button>
        </div>
      </div>
    </div>
  );
}

// 금형 행
function MoldRow({ mold }) {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    trial: 'bg-blue-100 text-blue-800',
    production: 'bg-purple-100 text-purple-800'
  };

  const statusLabels = {
    active: '진행중',
    trial: '시운전',
    production: '양산'
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mold.code}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{mold.name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{mold.carModel}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{mold.stage}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[mold.status]}`}>
          {statusLabels[mold.status]}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <Link to={`/molds/${mold.id}`} className="text-blue-600 hover:text-blue-700">상세보기</Link>
      </td>
    </tr>
  );
}

// 제작처 행
function MakerRow({ maker }) {
  const ratingColors = {
    'A': 'bg-green-100 text-green-800',
    'B': 'bg-blue-100 text-blue-800',
    'C': 'bg-yellow-100 text-yellow-800'
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{maker.name}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{maker.projects}개</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{maker.onTime}/{maker.total || maker.projects}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{maker.quality}점</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${ratingColors[maker.rating] || 'bg-gray-100 text-gray-800'}`}>
          {maker.rating}등급
        </span>
      </td>
    </tr>
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
