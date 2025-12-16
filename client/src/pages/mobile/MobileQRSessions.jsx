/**
 * 모바일 QR 세션 관리 페이지
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, QrCode, Clock, User, MapPin, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import api from '../../lib/api';

export default function MobileQRSessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active'); // active, all

  useEffect(() => {
    fetchSessions();
  }, [filter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = filter === 'active' ? { is_active: true } : {};
      const response = await api.get('/mobile/qr/sessions', { params });
      if (response.data.success) {
        setSessions(response.data.data || []);
      }
    } catch (error) {
      console.error('세션 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const endSession = async (sessionId) => {
    if (!confirm('세션을 종료하시겠습니까?')) return;
    
    try {
      await api.post(`/mobile/qr/session/${sessionId}/end`);
      fetchSessions();
    } catch (error) {
      console.error('세션 종료 오류:', error);
      alert('세션 종료에 실패했습니다.');
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return '만료됨';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
    return `${minutes}분 남음`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">QR 세션</h1>
          </div>
          <button onClick={fetchSessions} className="p-2">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex border-b">
          {[
            { key: 'active', label: '활성 세션' },
            { key: 'all', label: '전체' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition ${
                filter === tab.key 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Session List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>세션이 없습니다</p>
          </div>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {session.is_active ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <span className={`text-sm font-medium ${session.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                    {session.is_active ? '활성' : '종료됨'}
                  </span>
                </div>
                {session.is_active && (
                  <button
                    onClick={() => endSession(session.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    종료
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <QrCode className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{session.mold?.mold_number || session.qr_code}</span>
                </div>
                
                {session.user && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{session.user.name}</span>
                  </div>
                )}
                
                {session.gps_latitude && session.gps_longitude && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{session.gps_latitude.toFixed(4)}, {session.gps_longitude.toFixed(4)}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>시작: {formatTime(session.created_at)}</span>
                  </div>
                  {session.is_active && session.expires_at && (
                    <span className="text-orange-500">{getTimeRemaining(session.expires_at)}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
