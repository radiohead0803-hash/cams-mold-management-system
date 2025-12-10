import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Clock, MapPin, User, Factory, 
  RefreshCw, Search, Filter, ChevronRight,
  CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import api from '../lib/api';

export default function QRSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, expired
  const [stats, setStats] = useState({ total: 0, active: 0, today: 0 });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/qr/sessions', { 
        params: { limit: 100 } 
      });
      const data = response.data.data || response.data || [];
      setSessions(Array.isArray(data) ? data : []);
      
      // 통계 계산
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const activeCount = data.filter(s => s.is_active && new Date(s.expires_at) > now).length;
      const todayCount = data.filter(s => new Date(s.created_at) >= todayStart).length;
      
      setStats({
        total: data.length,
        active: activeCount,
        today: todayCount
      });
    } catch (err) {
      console.error('Failed to load QR sessions:', err);
      setError('QR 세션 목록을 불러오는데 실패했습니다.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 세션 목록
  const filteredSessions = sessions.filter(session => {
    const now = new Date();
    const isActive = session.is_active && new Date(session.expires_at) > now;
    
    // 상태 필터
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'expired' && isActive) return false;
    
    // 검색어 필터
    if (searchTerm) {
      const keyword = searchTerm.toLowerCase();
      const moldCode = session.mold?.mold_code?.toLowerCase() || '';
      const moldName = session.mold?.mold_name?.toLowerCase() || '';
      const userName = session.user?.name?.toLowerCase() || '';
      return moldCode.includes(keyword) || moldName.includes(keyword) || userName.includes(keyword);
    }
    
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    if (!session.is_active) {
      return { label: '종료됨', color: 'gray', icon: XCircle };
    }
    if (expiresAt < now) {
      return { label: '만료됨', color: 'red', icon: AlertTriangle };
    }
    
    // 남은 시간 계산
    const remainingMs = expiresAt - now;
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (remainingHours < 1) {
      return { label: `${remainingMinutes}분 남음`, color: 'yellow', icon: Clock };
    }
    return { label: `${remainingHours}시간 ${remainingMinutes}분`, color: 'green', icon: CheckCircle };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">QR 세션 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="w-7 h-7 text-purple-600" />
              QR 스캔 세션
            </h1>
            <p className="text-gray-500 mt-1">금형 QR 스캔 이력 및 활성 세션 관리</p>
          </div>
          <button
            onClick={loadSessions}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">오늘 스캔</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.today}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <QrCode className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">활성 세션</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">전체 세션</p>
              <p className="text-3xl font-bold text-gray-700 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="금형코드, 금형명, 사용자명 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">전체 상태</option>
              <option value="active">활성 세션</option>
              <option value="expired">만료/종료</option>
            </select>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 세션 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center">
            <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? '검색 조건에 맞는 세션이 없습니다.' 
                : 'QR 스캔 세션이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredSessions.map((session) => {
              const status = getSessionStatus(session);
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={session.id}
                  className="p-4 hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => session.mold?.id && navigate(`/molds/specifications/${session.mold.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* 상태 아이콘 */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        status.color === 'green' ? 'bg-green-100' :
                        status.color === 'yellow' ? 'bg-yellow-100' :
                        status.color === 'red' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <StatusIcon className={`w-5 h-5 ${
                          status.color === 'green' ? 'text-green-600' :
                          status.color === 'yellow' ? 'text-yellow-600' :
                          status.color === 'red' ? 'text-red-600' : 'text-gray-500'
                        }`} />
                      </div>
                      
                      {/* 금형 정보 */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">
                            {session.mold?.mold_code || session.qr_code || '-'}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            status.color === 'green' ? 'bg-green-100 text-green-700' :
                            status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                            status.color === 'red' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {session.mold?.mold_name || '금형'}
                        </p>
                      </div>
                    </div>
                    
                    {/* 세션 정보 */}
                    <div className="flex items-center gap-6 text-sm">
                      {/* 사용자 */}
                      <div className="flex items-center gap-1 text-gray-500">
                        <User className="w-4 h-4" />
                        <span>{session.user?.name || '미확인'}</span>
                      </div>
                      
                      {/* GPS */}
                      {session.gps_latitude && session.gps_longitude && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>위치 기록됨</span>
                        </div>
                      )}
                      
                      {/* 시간 */}
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(session.created_at)}</span>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
