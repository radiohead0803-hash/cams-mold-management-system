import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Search, Filter, Eye, FileText, BarChart3, TrendingUp, CheckCircle, Clock, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';

export default function MoldMaster() {
  const { user } = useAuthStore();
  const [molds, setMolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [makerFilter, setMakerFilter] = useState('all');
  const [selectedMold, setSelectedMold] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // table, detail
  const [showStats, setShowStats] = useState(true);
  const [expandedStats, setExpandedStats] = useState({
    production: false,
    repair: false
  });

  useEffect(() => {
    loadMolds();
  }, []);

  const loadMolds = async () => {
    try {
      setLoading(true);
      // TODO: API 연동
      // 임시 데이터
      const mockData = [
        {
          id: 1,
          // 본사 입력 (mold_specifications)
          hq_data: {
            part_number: 'P-2024-001',
            part_name: '프론트 범퍼',
            car_model: 'K5',
            car_year: '2024',
            mold_type: '사출금형',
            cavity_count: 1,
            material: 'NAK80',
            tonnage: 350,
            development_stage: '개발',
            production_stage: '시제',
            order_date: '2024-01-10',
            target_delivery_date: '2024-03-10',
            estimated_cost: 45000000,
            target_maker: 'A제작소',
            notes: '본사 입력 정보'
          },
          // 제작처 입력 (maker_specifications)
          maker_data: {
            design_completion_date: '2024-02-15',
            manufacturing_start_date: '2024-02-20',
            trial_run_date: '2024-03-05',
            actual_delivery_date: null,
            production_progress: 75,
            current_stage: '조립',
            technical_notes: '제작 진행 중',
            quality_check: '합격',
            maker_notes: '제작처 추가 정보'
          },
          // 생산처 입력 (plant_molds)
          plant_data: {
            installation_date: '2024-03-12',
            first_production_date: '2024-03-15',
            total_shots: 125000,
            last_maintenance_date: '2024-11-01',
            next_maintenance_date: '2024-12-01',
            current_location: 'A공장 3라인',
            plant_notes: '생산처 운영 정보',
            daily_check_count: 45,
            periodic_check_count: 3
          },
          mold_code: 'M-2024-001',
          qr_token: 'CAMS-M2024001-ABCD',
          status: 'production',
          image_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=200&h=200&fit=crop',
          // 수리 이력
          repair_data: {
            total_repairs: 3,
            last_repair_date: '2024-10-15',
            pending_repairs: 0,
            total_repair_cost: 2500000
          }
        },
        {
          id: 2,
          hq_data: {
            part_number: 'P-2024-002',
            part_name: '도어 트림 LH',
            car_model: 'K8',
            car_year: '2024',
            mold_type: '사출금형',
            cavity_count: 2,
            material: 'P20',
            tonnage: 420,
            development_stage: '개발',
            production_stage: '시제',
            order_date: '2024-01-12',
            target_delivery_date: '2024-03-15',
            estimated_cost: 48000000,
            target_maker: 'A제작소',
            notes: '본사 입력 정보'
          },
          maker_data: {
            design_completion_date: '2024-02-18',
            manufacturing_start_date: '2024-02-25',
            trial_run_date: null,
            actual_delivery_date: null,
            production_progress: 60,
            current_stage: '가공',
            technical_notes: '가공 진행 중',
            quality_check: '진행중',
            maker_notes: '제작처 추가 정보'
          },
          plant_data: null,
          mold_code: 'M-2024-002',
          qr_token: 'CAMS-M2024002-EFGH',
          status: 'manufacturing',
          image_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&h=200&fit=crop',
          // 수리 이력
          repair_data: {
            total_repairs: 1,
            last_repair_date: '2024-09-20',
            pending_repairs: 1,
            total_repair_cost: 800000
          }
        }
      ];
      setMolds(mockData);
    } catch (error) {
      console.error('Failed to load molds:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMolds = molds.filter(mold => {
    const matchesSearch = 
      mold.mold_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.hq_data?.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.hq_data?.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mold.hq_data?.car_model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || mold.status === statusFilter;
    const matchesStage = stageFilter === 'all' || mold.hq_data?.development_stage === stageFilter;
    const matchesMaker = makerFilter === 'all' || mold.hq_data?.target_maker === makerFilter;
    
    return matchesSearch && matchesStatus && matchesStage && matchesMaker;
  });

  // 통계 계산
  const calculateStats = () => {
    const total = molds.length;
    const byStatus = {
      planning: molds.filter(m => m.status === 'planning').length,
      design: molds.filter(m => m.status === 'design').length,
      manufacturing: molds.filter(m => m.status === 'manufacturing').length,
      trial: molds.filter(m => m.status === 'trial').length,
      production: molds.filter(m => m.status === 'production').length
    };
    
    const avgProgress = molds.reduce((sum, m) => sum + (m.maker_data?.production_progress || 0), 0) / total || 0;
    const totalShots = molds.reduce((sum, m) => sum + (m.plant_data?.total_shots || 0), 0);
    const inProduction = molds.filter(m => m.plant_data !== null).length;
    const totalDailyChecks = molds.reduce((sum, m) => sum + (m.plant_data?.daily_check_count || 0), 0);
    const totalPeriodicChecks = molds.reduce((sum, m) => sum + (m.plant_data?.periodic_check_count || 0), 0);
    
    // 정비 예정 금형 (7일 이내)
    const maintenanceDue = molds.filter(m => {
      if (!m.plant_data?.next_maintenance_date) return false;
      const today = new Date();
      const nextDate = new Date(m.plant_data.next_maintenance_date);
      const daysLeft = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft <= 7;
    }).length;
    
    // 수리 관련 통계
    const totalRepairs = molds.reduce((sum, m) => sum + (m.repair_data?.total_repairs || 0), 0);
    const pendingRepairs = molds.reduce((sum, m) => sum + (m.repair_data?.pending_repairs || 0), 0);
    const totalRepairCost = molds.reduce((sum, m) => sum + (m.repair_data?.total_repair_cost || 0), 0);
    
    return {
      total,
      byStatus,
      avgProgress: Math.round(avgProgress),
      totalShots,
      inProduction,
      totalDailyChecks,
      totalPeriodicChecks,
      maintenanceDue,
      totalRepairs,
      pendingRepairs,
      totalRepairCost
    };
  };

  const stats = calculateStats();

  const getStatusBadge = (status) => {
    const styles = {
      planning: 'bg-gray-100 text-gray-800',
      design: 'bg-blue-100 text-blue-800',
      manufacturing: 'bg-orange-100 text-orange-800',
      trial: 'bg-purple-100 text-purple-800',
      production: 'bg-green-100 text-green-800'
    };
    return styles[status] || styles.planning;
  };

  const getStatusLabel = (status) => {
    const labels = {
      planning: '계획',
      design: '설계',
      manufacturing: '제작',
      trial: '시운전',
      production: '양산'
    };
    return labels[status] || status;
  };

  const viewDetail = (mold) => {
    setSelectedMold(mold);
    setViewMode('detail');
  };

  const backToTable = () => {
    setViewMode('table');
    setSelectedMold(null);
  };

  if (viewMode === 'detail' && selectedMold) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">금형관리 마스터 - 상세보기</h1>
            <p className="text-sm text-gray-600 mt-1">{selectedMold.mold_code} - {selectedMold.hq_data.part_name}</p>
          </div>
          <button
            onClick={backToTable}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            테이블로 돌아가기
          </button>
        </div>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="mr-2" size={20} />
              기본 정보
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">금형코드</p>
                <p className="font-medium">{selectedMold.mold_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">QR 토큰</p>
                <p className="font-medium font-mono text-sm">{selectedMold.qr_token}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">상태</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedMold.status)}`}>
                  {getStatusLabel(selectedMold.status)}
                </span>
              </div>
            </div>
          </div>

          {/* 본사 입력 정보 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 bg-blue-50 -m-6 p-4 rounded-t-lg">
              🏢 본사 입력 정보 (mold_specifications)
            </h2>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600">부품번호</p>
                <p className="font-medium">{selectedMold.hq_data.part_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">부품명</p>
                <p className="font-medium">{selectedMold.hq_data.part_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">차종</p>
                <p className="font-medium">{selectedMold.hq_data.car_model} ({selectedMold.hq_data.car_year})</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">금형타입</p>
                <p className="font-medium">{selectedMold.hq_data.mold_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cavity / 재질</p>
                <p className="font-medium">{selectedMold.hq_data.cavity_count} / {selectedMold.hq_data.material}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">톤수</p>
                <p className="font-medium">{selectedMold.hq_data.tonnage}T</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">개발단계 / 생산단계</p>
                <p className="font-medium">{selectedMold.hq_data.development_stage} / {selectedMold.hq_data.production_stage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">발주일</p>
                <p className="font-medium">{selectedMold.hq_data.order_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">목표납기일</p>
                <p className="font-medium">{selectedMold.hq_data.target_delivery_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">예상비용</p>
                <p className="font-medium">{selectedMold.hq_data.estimated_cost?.toLocaleString()}원</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">목표제작처</p>
                <p className="font-medium">{selectedMold.hq_data.target_maker}</p>
              </div>
              <div className="col-span-3">
                <p className="text-sm text-gray-600">비고</p>
                <p className="font-medium">{selectedMold.hq_data.notes || '-'}</p>
              </div>
            </div>
          </div>

          {/* 제작처 입력 정보 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 bg-orange-50 -m-6 p-4 rounded-t-lg">
              🏭 제작처 입력 정보 (maker_specifications)
            </h2>
            {selectedMold.maker_data ? (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">설계완료일</p>
                  <p className="font-medium">{selectedMold.maker_data.design_completion_date || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">제작시작일</p>
                  <p className="font-medium">{selectedMold.maker_data.manufacturing_start_date || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">시운전일</p>
                  <p className="font-medium">{selectedMold.maker_data.trial_run_date || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">실제납품일</p>
                  <p className="font-medium">{selectedMold.maker_data.actual_delivery_date || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">제작진행률</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${selectedMold.maker_data.production_progress}%` }}
                      />
                    </div>
                    <span className="font-medium">{selectedMold.maker_data.production_progress}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">현재단계</p>
                  <p className="font-medium">{selectedMold.maker_data.current_stage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">품질검사</p>
                  <p className="font-medium">{selectedMold.maker_data.quality_check}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">기술노트</p>
                  <p className="font-medium">{selectedMold.maker_data.technical_notes || '-'}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-gray-600">제작처 비고</p>
                  <p className="font-medium">{selectedMold.maker_data.maker_notes || '-'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">제작처 정보가 없습니다.</p>
            )}
          </div>

          {/* 생산처 입력 정보 */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 bg-green-50 -m-6 p-4 rounded-t-lg">
              🏭 생산처 입력 정보 (plant_molds)
            </h2>
            {selectedMold.plant_data ? (
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">설치일</p>
                  <p className="font-medium">{selectedMold.plant_data.installation_date || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">첫 생산일</p>
                  <p className="font-medium">{selectedMold.plant_data.first_production_date || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">누적 타수</p>
                  <p className="font-medium text-lg text-blue-600">{selectedMold.plant_data.total_shots?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">최근 정비일</p>
                  <p className="font-medium">{selectedMold.plant_data.last_maintenance_date || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">다음 정비일</p>
                  <p className="font-medium">{selectedMold.plant_data.next_maintenance_date || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">현재 위치</p>
                  <p className="font-medium">{selectedMold.plant_data.current_location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">일상점검 횟수</p>
                  <p className="font-medium">{selectedMold.plant_data.daily_check_count}회</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">정기점검 횟수</p>
                  <p className="font-medium">{selectedMold.plant_data.periodic_check_count}회</p>
                </div>
                <div className="col-span-3">
                  <p className="text-sm text-gray-600">생산처 비고</p>
                  <p className="font-medium">{selectedMold.plant_data.plant_notes || '-'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">생산처 정보가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">금형관리 마스터</h1>
          <p className="text-sm text-gray-600 mt-1">
            본사, 제작처, 생산처의 모든 금형 정보를 통합 조회합니다.
          </p>
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <BarChart3 size={18} />
          <span>{showStats ? '통계 숨기기' : '통계 보기'}</span>
        </button>
      </div>

      {/* 통계 */}
      {showStats && (
        <div className="space-y-3 mb-6">
          {/* 주요 통계 (항상 표시) */}
          <div className="grid grid-cols-5 gap-4">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">전체 금형</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
                </div>
                <FileText className="text-blue-600" size={32} />
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">제작 중</p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">{stats.byStatus.manufacturing}</p>
                </div>
                <TrendingUp className="text-orange-600" size={32} />
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">양산 중</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{stats.byStatus.production}</p>
                </div>
                <CheckCircle className="text-green-600" size={32} />
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">평균 진행률</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">{stats.avgProgress}%</p>
                </div>
                <Clock className="text-purple-600" size={32} />
              </div>
            </div>
            
            <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600 font-medium">누적 타수</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-1">{stats.totalShots.toLocaleString()}</p>
                </div>
                <BarChart3 className="text-indigo-600" size={32} />
              </div>
            </div>
          </div>
          
          {/* 생산처 관련 통계 (드롭다운) */}
          <div className="card">
            <button
              onClick={() => setExpandedStats(prev => ({ ...prev, production: !prev.production }))}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-teal-600" size={20} />
                <span className="font-semibold text-gray-900">생산처 관리 통계</span>
                <span className="text-sm text-gray-500">
                  (생산 {stats.inProduction}건 · 정비예정 {stats.maintenanceDue}건)
                </span>
              </div>
              {expandedStats.production ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedStats.production && (
              <div className="grid grid-cols-4 gap-4 p-4 pt-0">
                <div className="card bg-gradient-to-br from-teal-50 to-teal-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-teal-600 font-medium">생산 중인 금형</p>
                      <p className="text-3xl font-bold text-teal-900 mt-1">{stats.inProduction}</p>
                    </div>
                    <CheckCircle className="text-teal-600" size={28} />
                  </div>
                </div>
                
                <div className="card bg-gradient-to-br from-cyan-50 to-cyan-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-600 font-medium">총 일상점검</p>
                      <p className="text-3xl font-bold text-cyan-900 mt-1">{stats.totalDailyChecks}</p>
                      <p className="text-xs text-cyan-700 mt-1">회</p>
                    </div>
                    <FileText className="text-cyan-600" size={28} />
                  </div>
                </div>
                
                <div className="card bg-gradient-to-br from-sky-50 to-sky-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-sky-600 font-medium">총 정기점검</p>
                      <p className="text-3xl font-bold text-sky-900 mt-1">{stats.totalPeriodicChecks}</p>
                      <p className="text-xs text-sky-700 mt-1">회</p>
                    </div>
                    <CheckCircle className="text-sky-600" size={28} />
                  </div>
                </div>
                
                <div className="card bg-gradient-to-br from-red-50 to-red-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">정비 예정</p>
                      <p className="text-3xl font-bold text-red-900 mt-1">{stats.maintenanceDue}</p>
                      <p className="text-xs text-red-700 mt-1">7일 이내</p>
                    </div>
                    <Clock className="text-red-600" size={28} />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 수리 관련 통계 (드롭다운) */}
          <div className="card">
            <button
              onClick={() => setExpandedStats(prev => ({ ...prev, repair: !prev.repair }))}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="text-amber-600" size={20} />
                <span className="font-semibold text-gray-900">수리 이력 통계</span>
                <span className="text-sm text-gray-500">
                  (총 {stats.totalRepairs}건 · 대기 {stats.pendingRepairs}건)
                </span>
              </div>
              {expandedStats.repair ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedStats.repair && (
              <div className="grid grid-cols-3 gap-4 p-4 pt-0">
                <div className="card bg-gradient-to-br from-amber-50 to-amber-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-600 font-medium">총 수리 이력</p>
                      <p className="text-3xl font-bold text-amber-900 mt-1">{stats.totalRepairs}</p>
                      <p className="text-xs text-amber-700 mt-1">건</p>
                    </div>
                    <TrendingUp className="text-amber-600" size={28} />
                  </div>
                </div>
                
                <div className="card bg-gradient-to-br from-rose-50 to-rose-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-rose-600 font-medium">수리 대기 중</p>
                      <p className="text-3xl font-bold text-rose-900 mt-1">{stats.pendingRepairs}</p>
                      <p className="text-xs text-rose-700 mt-1">건</p>
                    </div>
                    <Clock className="text-rose-600" size={28} />
                  </div>
                </div>
                
                <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-medium">총 수리 비용</p>
                      <p className="text-2xl font-bold text-yellow-900 mt-1">{(stats.totalRepairCost / 10000).toFixed(0)}만원</p>
                    </div>
                    <BarChart3 className="text-yellow-600" size={28} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input flex-1"
            >
              <option value="all">전체 상태</option>
              <option value="planning">계획</option>
              <option value="design">설계</option>
              <option value="manufacturing">제작</option>
              <option value="trial">시운전</option>
              <option value="production">양산</option>
            </select>
          </div>
          
          <div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">전체 단계</option>
              <option value="개발">개발</option>
              <option value="양산">양산</option>
            </select>
          </div>
          
          <div>
            <select
              value={makerFilter}
              onChange={(e) => setMakerFilter(e.target.value)}
              className="input w-full"
            >
              <option value="all">전체 제작처</option>
              <option value="A제작소">A제작소</option>
              <option value="B제작소">B제작소</option>
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : filteredMolds.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">금형이 없습니다.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-max w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이미지</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">금형코드</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">부품정보</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">차종</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제작처</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">생산타수</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">위치</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수리이력</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">일상점검</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">정기점검</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">다음정비</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMolds.map((mold) => (
                  <tr key={mold.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {mold.image_url ? (
                        <img
                          src={mold.image_url}
                          alt={mold.hq_data.part_name}
                          className="w-16 h-16 object-cover rounded border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                          <ImageIcon size={24} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mold.mold_code}</div>
                      <div className="text-xs text-gray-500">{mold.qr_token}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{mold.hq_data.part_name}</div>
                      <div className="text-xs text-gray-500">{mold.hq_data.part_number}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{mold.hq_data.car_model}</div>
                      <div className="text-xs text-gray-500">{mold.hq_data.car_year}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(mold.status)}`}>
                        {getStatusLabel(mold.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mold.hq_data.target_maker}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {mold.plant_data ? (
                        <div className="text-sm font-medium text-blue-600">
                          {mold.plant_data.total_shots?.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {mold.plant_data?.current_location ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{mold.plant_data.current_location}</div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            생산처
                          </span>
                        </div>
                      ) : mold.maker_data ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{mold.hq_data.target_maker}</div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            제작처
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900">본사</div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            본사
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {mold.repair_data ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {mold.repair_data.total_repairs}건
                          </div>
                          {mold.repair_data.pending_repairs > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              대기 {mold.repair_data.pending_repairs}
                            </span>
                          )}
                          {mold.repair_data.last_repair_date && (
                            <div className="text-xs text-gray-500 mt-1">
                              최근: {mold.repair_data.last_repair_date}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {mold.plant_data ? (
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{mold.plant_data.daily_check_count}</span>
                          <span className="text-gray-500 text-xs ml-1">회</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {mold.plant_data ? (
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">{mold.plant_data.periodic_check_count}</span>
                          <span className="text-gray-500 text-xs ml-1">회</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {mold.plant_data?.next_maintenance_date ? (
                        <div className="text-sm">
                          <div className="text-gray-900">{mold.plant_data.next_maintenance_date}</div>
                          {(() => {
                            const today = new Date();
                            const nextDate = new Date(mold.plant_data.next_maintenance_date);
                            const daysLeft = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
                            if (daysLeft < 0) {
                              return <span className="text-xs text-red-600">지연 {Math.abs(daysLeft)}일</span>;
                            } else if (daysLeft <= 7) {
                              return <span className="text-xs text-orange-600">D-{daysLeft}</span>;
                            } else {
                              return <span className="text-xs text-gray-500">D-{daysLeft}</span>;
                            }
                          })()}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => viewDetail(mold)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                      >
                        <Eye size={16} />
                        <span>상세</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                총 <span className="font-semibold text-gray-900">{filteredMolds.length}</span>건의 금형이 조회되었습니다.
              </p>
              <p className="text-xs text-gray-500 flex items-center">
                <span className="mr-1">👉</span>
                좌우로 스크롤하여 추가 정보를 확인하세요
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
