/**
 * 운영 리스크 모니터링 대시보드
 * 점검 미이행, GPS 미수신, 타수 미입력 등 운영 리스크 현황
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertTriangle, Clock, MapPin, Gauge, Camera, 
  CheckSquare, Wrench, RefreshCw, ChevronRight,
  TrendingUp, TrendingDown, Activity
} from 'lucide-react';
import api from '../../lib/api';

const RISK_CONFIG = {
  inspection_overdue: { 
    icon: Clock, 
    color: 'red', 
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    link: '/dashboard/system-admin/risk-monitor/inspection'
  },
  gps_offline: { 
    icon: MapPin, 
    color: 'purple', 
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    link: '/mold-location-map'
  },
  shot_missing: { 
    icon: Gauge, 
    color: 'orange', 
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    link: '/molds'
  },
  photo_missing: { 
    icon: Camera, 
    color: 'yellow', 
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    link: '/checklist/daily'
  },
  approval_pending: { 
    icon: CheckSquare, 
    color: 'teal', 
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    link: '/dashboard/system-admin/approvals'
  },
  repair_pending: { 
    icon: Wrench, 
    color: 'blue', 
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    link: '/repairs'
  }
};

const SEVERITY_CONFIG = {
  high: { label: '높음', color: 'red' },
  medium: { label: '중간', color: 'orange' },
  low: { label: '낮음', color: 'yellow' }
};

export default function RiskMonitorDashboard() {
  const [summary, setSummary] = useState({});
  const [totalRisks, setTotalRisks] = useState(0);
  const [highSeverityCount, setHighSeverityCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchRiskSummary();
    // 30초마다 자동 갱신
    const interval = setInterval(fetchRiskSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRiskSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get('/risk-monitor/summary');
      if (response.data.success) {
        const data = response.data.data;
        setSummary(data.summary || {});
        setTotalRisks(data.totalRisks || 0);
        setHighSeverityCount(data.highSeverityCount || 0);
        setLastUpdated(data.lastUpdated);
      }
    } catch (error) {
      console.error('리스크 요약 조회 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '-';
    return new Date(lastUpdated).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-orange-600" />
            운영 리스크 모니터링
          </h1>
          <p className="text-gray-500 mt-1">미이행 항목 및 운영 리스크를 실시간으로 모니터링합니다</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            마지막 업데이트: {formatLastUpdated()}
          </span>
          <button
            onClick={fetchRiskSummary}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* 전체 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-xl border-2 p-6 ${totalRisks > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 리스크</p>
              <p className={`text-4xl font-bold mt-1 ${totalRisks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {totalRisks}
              </p>
            </div>
            <div className={`p-3 rounded-full ${totalRisks > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <Activity className={`w-8 h-8 ${totalRisks > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            {totalRisks > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="text-red-600">조치가 필요합니다</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span className="text-green-600">정상 운영 중</span>
              </>
            )}
          </div>
        </div>

        <div className={`rounded-xl border-2 p-6 ${highSeverityCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">긴급 리스크</p>
              <p className={`text-4xl font-bold mt-1 ${highSeverityCount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                {highSeverityCount}
              </p>
            </div>
            <div className={`p-3 rounded-full ${highSeverityCount > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <AlertTriangle className={`w-8 h-8 ${highSeverityCount > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            높은 심각도 항목
          </div>
        </div>

        <div className="rounded-xl border-2 p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">모니터링 항목</p>
              <p className="text-4xl font-bold mt-1 text-blue-600">
                {Object.keys(summary).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            실시간 감시 중
          </div>
        </div>
      </div>

      {/* 리스크 항목별 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(summary).map(([key, item]) => {
          const config = RISK_CONFIG[key] || { icon: AlertTriangle, color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
          const severityConfig = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.low;
          const Icon = config.icon;
          const hasRisk = item.count > 0;
          
          return (
            <Link
              key={key}
              to={config.link || '#'}
              className={`block rounded-xl border-2 p-5 transition-all hover:shadow-lg ${
                hasRisk ? `${config.bgColor} ${config.borderColor}` : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasRisk ? `bg-${config.color}-100` : 'bg-gray-100'}`}>
                    <Icon className={`w-6 h-6 ${hasRisk ? `text-${config.color}-600` : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${hasRisk ? 'text-gray-900' : 'text-gray-500'}`}>
                      {item.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className={`text-3xl font-bold ${hasRisk ? `text-${config.color}-600` : 'text-gray-300'}`}>
                    {item.count}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">건</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium bg-${severityConfig.color}-100 text-${severityConfig.color}-700`}>
                  {severityConfig.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 빠른 조치 가이드 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 조치 가이드</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h3 className="font-medium text-red-800 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              점검 미완료 대응
            </h3>
            <ul className="mt-2 text-sm text-red-700 space-y-1">
              <li>• 해당 생산처에 즉시 연락</li>
              <li>• 점검 일정 재조정</li>
              <li>• 지연 사유 확인 및 기록</li>
            </ul>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-medium text-purple-800 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              GPS 미수신 대응
            </h3>
            <ul className="mt-2 text-sm text-purple-700 space-y-1">
              <li>• 금형 위치 직접 확인</li>
              <li>• GPS 장치 상태 점검</li>
              <li>• 배터리 및 통신 상태 확인</li>
            </ul>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-medium text-orange-800 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              타수 미입력 대응
            </h3>
            <ul className="mt-2 text-sm text-orange-700 space-y-1">
              <li>• 생산 현황 확인</li>
              <li>• 타수 입력 독려</li>
              <li>• 자동 집계 시스템 점검</li>
            </ul>
          </div>
          <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
            <h3 className="font-medium text-teal-800 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              승인 지연 대응
            </h3>
            <ul className="mt-2 text-sm text-teal-700 space-y-1">
              <li>• 승인권자에게 리마인더 발송</li>
              <li>• 대리 승인자 지정 검토</li>
              <li>• SLA 기준 재검토</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
