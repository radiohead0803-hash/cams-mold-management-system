import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, ArrowLeft, TrendingUp, Package, Wrench, 
  Calendar, FileCheck, Trash2, Users, Factory,
  ChevronDown, Download, RefreshCw
} from 'lucide-react';
import api from '../lib/api';

// CSV 다운로드 유틸리티
const downloadCSV = (data, filename) => {
  const BOM = '\uFEFF';
  const csv = BOM + data;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// 데이터를 CSV 형식으로 변환
const convertToCSV = (headers, rows) => {
  const headerRow = headers.join(',');
  const dataRows = rows.map(row => row.map(cell => `"${cell || ''}"`).join(','));
  return [headerRow, ...dataRows].join('\n');
};

// PDF 다운로드 (HTML to Print)
const downloadPDF = (title, content) => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; }
        h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: 600; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .stat-card { display: inline-block; width: 23%; margin: 1%; padding: 20px; 
                     border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
        .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      ${content}
      <div class="footer">
        <p>CAMS 금형관리 시스템 - ${new Date().toLocaleDateString('ko-KR')} 생성</p>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
};

// 간단한 바 차트 컴포넌트
const SimpleBarChart = ({ data, labelKey, valueKey, color = 'blue' }) => {
  const maxValue = Math.max(...data.map(d => parseInt(d[valueKey]) || 0), 1);
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="w-24 text-sm text-gray-600 truncate">{item[labelKey]}</div>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${colorClasses[color]} transition-all duration-500`}
              style={{ width: `${(parseInt(item[valueKey]) / maxValue) * 100}%` }}
            />
          </div>
          <div className="w-16 text-sm font-semibold text-gray-900 text-right">
            {parseInt(item[valueKey]).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

// 통계 카드 컴포넌트
const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value?.toLocaleString() || 0}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% 전월 대비
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  
  // 통계 데이터
  const [moldStats, setMoldStats] = useState(null);
  const [maintenanceStats, setMaintenanceStats] = useState(null);
  const [scrappingStats, setScrappingStats] = useState(null);
  const [checklistStats, setChecklistStats] = useState(null);

  useEffect(() => {
    loadAllStats();
  }, [year, month]);

  const loadAllStats = async () => {
    try {
      setLoading(true);
      
      // 병렬로 통계 데이터 로드
      const [moldRes, maintenanceRes, scrappingRes, checklistRes] = await Promise.all([
        api.get('/statistics/molds', { params: { year } }).catch(() => ({ data: { data: {} } })),
        api.get('/maintenance/statistics', { params: { year } }).catch(() => ({ data: { data: {} } })),
        api.get('/scrapping/statistics', { params: { year } }).catch(() => ({ data: { data: {} } })),
        api.get('/statistics/checklists', { params: { year } }).catch(() => ({ data: { data: {} } }))
      ]);

      // 금형 통계
      const moldData = moldRes.data.data;
      setMoldStats({
        total: moldData.total || 0,
        active: moldData.active || 0,
        development: moldData.development || 0,
        manufacturing: moldData.manufacturing || 0,
        scrapped: moldData.scrapped || 0,
        byCarModel: moldData.by_car_model || [],
        byMaker: moldData.by_maker || []
      });

      setMaintenanceStats(maintenanceRes.data.data);
      setScrappingStats(scrappingRes.data.data);

      // 체크리스트 통계
      const checklistData = checklistRes.data.data;
      setChecklistStats({
        total: checklistData.total || 0,
        draft: checklistData.draft || 0,
        submitted: checklistData.submitted || 0,
        approved: checklistData.approved || 0,
        rejected: checklistData.rejected || 0,
        completionRate: checklistData.completion_rate || 0
      });

    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 리포트 다운로드 핸들러
  const handleDownloadReport = () => {
    const today = new Date().toISOString().split('T')[0];
    
    if (activeTab === 'overview' || activeTab === 'molds') {
      // 금형 통계 CSV
      const headers = ['구분', '값'];
      const rows = [
        ['전체 금형', moldStats?.total || 0],
        ['양산 중', moldStats?.active || 0],
        ['개발 중', moldStats?.development || 0],
        ['제작 중', moldStats?.manufacturing || 0],
        ['폐기', moldStats?.scrapped || 0],
        [''],
        ['차종별 금형'],
        ...(moldStats?.byCarModel || []).map(item => [item.name, item.count]),
        [''],
        ['제작처별 금형'],
        ...(moldStats?.byMaker || []).map(item => [item.name, item.count])
      ];
      const csv = convertToCSV(headers, rows);
      downloadCSV(csv, `금형통계_${year}년_${today}.csv`);
    } else if (activeTab === 'maintenance') {
      // 유지보전 통계 CSV
      const headers = ['유형', '건수', '비용'];
      const rows = (maintenanceStats?.by_type || []).map(item => [
        item.maintenance_type,
        item.count,
        item.total_cost || 0
      ]);
      const csv = convertToCSV(headers, rows);
      downloadCSV(csv, `유지보전통계_${year}년_${today}.csv`);
    } else if (activeTab === 'checklists') {
      // 체크리스트 통계 CSV
      const headers = ['상태', '건수'];
      const rows = [
        ['전체', checklistStats?.total || 0],
        ['작성중', checklistStats?.draft || 0],
        ['제출됨', checklistStats?.submitted || 0],
        ['승인됨', checklistStats?.approved || 0],
        ['반려됨', checklistStats?.rejected || 0],
        ['완료율', `${checklistStats?.completionRate || 0}%`]
      ];
      const csv = convertToCSV(headers, rows);
      downloadCSV(csv, `체크리스트통계_${year}년_${today}.csv`);
    }
    
    alert('리포트가 다운로드되었습니다.');
  };

  // PDF 리포트 다운로드
  const handleDownloadPDF = () => {
    const title = `CAMS 금형관리 시스템 - ${year}년 ${activeTab === 'overview' ? '전체 현황' : activeTab === 'molds' ? '금형 통계' : activeTab === 'maintenance' ? '유지보전 통계' : '체크리스트 통계'} 리포트`;
    
    let content = `<h1>${title}</h1>`;
    
    if (activeTab === 'overview' || activeTab === 'molds') {
      content += `
        <h2>금형 현황</h2>
        <div>
          <div class="stat-card">
            <div class="stat-value">${moldStats?.total || 0}</div>
            <div class="stat-label">전체 금형</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${moldStats?.byStatus?.production || 0}</div>
            <div class="stat-label">양산 중</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${moldStats?.byStatus?.maintenance || 0}</div>
            <div class="stat-label">정비 중</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${moldStats?.byStatus?.retired || 0}</div>
            <div class="stat-label">폐기</div>
          </div>
        </div>
        <h2>상태별 현황</h2>
        <table>
          <tr><th>상태</th><th>수량</th></tr>
          <tr><td>계획</td><td>${moldStats?.byStatus?.planning || 0}</td></tr>
          <tr><td>설계</td><td>${moldStats?.byStatus?.design || 0}</td></tr>
          <tr><td>제작</td><td>${moldStats?.byStatus?.manufacturing || 0}</td></tr>
          <tr><td>시운전</td><td>${moldStats?.byStatus?.trial || 0}</td></tr>
          <tr><td>양산</td><td>${moldStats?.byStatus?.production || 0}</td></tr>
          <tr><td>정비</td><td>${moldStats?.byStatus?.maintenance || 0}</td></tr>
          <tr><td>폐기</td><td>${moldStats?.byStatus?.retired || 0}</td></tr>
        </table>
      `;
    }
    
    if (activeTab === 'overview' || activeTab === 'maintenance') {
      content += `
        <h2>유지보전 현황</h2>
        <div>
          <div class="stat-card">
            <div class="stat-value">${maintenanceStats?.total || 0}</div>
            <div class="stat-label">전체</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${maintenanceStats?.completed || 0}</div>
            <div class="stat-label">완료</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${maintenanceStats?.pending || 0}</div>
            <div class="stat-label">대기</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${maintenanceStats?.completionRate || 0}%</div>
            <div class="stat-label">완료율</div>
          </div>
        </div>
      `;
    }
    
    if (activeTab === 'overview' || activeTab === 'checklists') {
      content += `
        <h2>체크리스트 현황</h2>
        <div>
          <div class="stat-card">
            <div class="stat-value">${checklistStats?.total || 0}</div>
            <div class="stat-label">전체</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${checklistStats?.approved || 0}</div>
            <div class="stat-label">승인</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${checklistStats?.submitted || 0}</div>
            <div class="stat-label">제출</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${checklistStats?.completionRate || 0}%</div>
            <div class="stat-label">완료율</div>
          </div>
        </div>
      `;
    }
    
    downloadPDF(title, content);
  };

  const tabs = [
    { id: 'overview', label: '전체 현황', icon: BarChart3 },
    { id: 'molds', label: '금형 통계', icon: Package },
    { id: 'maintenance', label: '유지보전', icon: Wrench },
    { id: 'checklists', label: '체크리스트', icon: FileCheck }
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">통계 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">통계 리포트</h1>
            <p className="text-sm text-gray-600 mt-1">금형 관리 현황 및 통계 분석</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 연도 선택 */}
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {[2023, 2024, 2025].map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <button
            onClick={loadAllStats}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw size={18} />
            새로고침
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={18} />
            CSV
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            PDF
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 전체 현황 탭 */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="전체 금형" value={moldStats?.total} icon={Package} color="blue" />
            <StatCard title="양산 중" value={moldStats?.active} icon={Factory} color="green" trend={5} />
            <StatCard title="유지보전" value={maintenanceStats?.by_type?.reduce((sum, t) => sum + parseInt(t.count), 0) || 0} icon={Wrench} color="orange" />
            <StatCard title="폐기 요청" value={scrappingStats?.by_status?.reduce((sum, s) => sum + parseInt(s.count), 0) || 0} icon={Trash2} color="red" />
            <StatCard title="체크리스트" value={checklistStats?.total} icon={FileCheck} color="purple" />
          </div>

          {/* 차트 영역 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 차종별 금형 현황 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">차종별 금형 현황</h3>
              <SimpleBarChart 
                data={moldStats?.byCarModel || []} 
                labelKey="name" 
                valueKey="count" 
                color="blue" 
              />
            </div>

            {/* 제작처별 금형 현황 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">제작처별 금형 현황</h3>
              <SimpleBarChart 
                data={moldStats?.byMaker || []} 
                labelKey="name" 
                valueKey="count" 
                color="green" 
              />
            </div>

            {/* 유지보전 유형별 현황 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">유지보전 유형별 현황</h3>
              {maintenanceStats?.by_type?.length > 0 ? (
                <SimpleBarChart 
                  data={maintenanceStats.by_type} 
                  labelKey="maintenance_type" 
                  valueKey="count" 
                  color="orange" 
                />
              ) : (
                <div className="text-center py-8 text-gray-500">데이터 없음</div>
              )}
            </div>

            {/* 월별 유지보전 추이 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 유지보전 추이</h3>
              {maintenanceStats?.by_month?.length > 0 ? (
                <SimpleBarChart 
                  data={maintenanceStats.by_month.map(m => ({ ...m, month: `${m.month}월` }))} 
                  labelKey="month" 
                  valueKey="count" 
                  color="purple" 
                />
              ) : (
                <div className="text-center py-8 text-gray-500">데이터 없음</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 금형 통계 탭 */}
      {activeTab === 'molds' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="전체 금형" value={moldStats?.total} icon={Package} color="blue" />
            <StatCard title="개발 중" value={moldStats?.development} icon={TrendingUp} color="orange" />
            <StatCard title="양산 중" value={moldStats?.active} icon={Factory} color="green" />
            <StatCard title="폐기" value={moldStats?.scrapped} icon={Trash2} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">차종별 금형 분포</h3>
              <SimpleBarChart 
                data={moldStats?.byCarModel || []} 
                labelKey="name" 
                valueKey="count" 
                color="blue" 
              />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">제작처별 금형 분포</h3>
              <SimpleBarChart 
                data={moldStats?.byMaker || []} 
                labelKey="name" 
                valueKey="count" 
                color="green" 
              />
            </div>
          </div>
        </div>
      )}

      {/* 유지보전 탭 */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {maintenanceStats?.by_type?.slice(0, 4).map((type, index) => (
              <StatCard 
                key={type.maintenance_type}
                title={type.maintenance_type} 
                value={parseInt(type.count)} 
                subtitle={type.total_cost > 0 ? `${(type.total_cost / 10000).toFixed(0)}만원` : undefined}
                icon={Wrench} 
                color={['blue', 'green', 'orange', 'purple'][index % 4]} 
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">유형별 유지보전 현황</h3>
              {maintenanceStats?.by_type?.length > 0 ? (
                <SimpleBarChart 
                  data={maintenanceStats.by_type} 
                  labelKey="maintenance_type" 
                  valueKey="count" 
                  color="orange" 
                />
              ) : (
                <div className="text-center py-8 text-gray-500">데이터 없음</div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">월별 유지보전 추이</h3>
              {maintenanceStats?.by_month?.length > 0 ? (
                <SimpleBarChart 
                  data={maintenanceStats.by_month.map(m => ({ ...m, month: `${m.month}월` }))} 
                  labelKey="month" 
                  valueKey="count" 
                  color="blue" 
                />
              ) : (
                <div className="text-center py-8 text-gray-500">데이터 없음</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 체크리스트 탭 */}
      {activeTab === 'checklists' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard title="전체" value={checklistStats?.total} icon={FileCheck} color="blue" />
            <StatCard title="작성중" value={checklistStats?.draft} icon={Calendar} color="orange" />
            <StatCard title="제출됨" value={checklistStats?.submitted} icon={TrendingUp} color="purple" />
            <StatCard title="승인됨" value={checklistStats?.approved} icon={FileCheck} color="green" />
            <StatCard title="반려됨" value={checklistStats?.rejected} icon={Trash2} color="red" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">체크리스트 완료율</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${checklistStats?.completionRate || 0}%` }}
                />
              </div>
              <span className="text-2xl font-bold text-gray-900">{checklistStats?.completionRate || 0}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
