/**
 * 모바일 금형 이력 페이지
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, History, Calendar, User, RefreshCw, FileText } from 'lucide-react';
import api from '../../lib/api';

export default function MobileMoldHistory() {
  const navigate = useNavigate();
  const { moldId } = useParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mold, setMold] = useState(null);

  useEffect(() => {
    if (moldId) {
      fetchHistory();
      fetchMold();
    }
  }, [moldId]);

  const fetchMold = async () => {
    try {
      const response = await api.get(`/mold-specifications/${moldId}`);
      if (response.data.success) {
        setMold(response.data.data);
      }
    } catch (error) {
      console.error('금형 정보 조회 오류:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/audit-log/entity/mold_specification/${moldId}`);
      if (response.data.success) {
        setHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('이력 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action) => {
    const labels = {
      'create': '생성',
      'update': '수정',
      'delete': '삭제',
      'status_change': '상태 변경',
      'transfer': '이관',
      'inspection': '점검',
      'repair': '수리',
      'master_update': '마스터 수정'
    };
    return labels[action] || action;
  };

  const getActionColor = (action) => {
    const colors = {
      'create': 'bg-green-100 text-green-800',
      'update': 'bg-blue-100 text-blue-800',
      'delete': 'bg-red-100 text-red-800',
      'status_change': 'bg-yellow-100 text-yellow-800',
      'transfer': 'bg-purple-100 text-purple-800',
      'inspection': 'bg-cyan-100 text-cyan-800',
      'repair': 'bg-orange-100 text-orange-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
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
            <div>
              <h1 className="text-lg font-semibold">금형 이력</h1>
              {mold && (
                <p className="text-xs text-gray-500">{mold.mold_number}</p>
              )}
            </div>
          </div>
          <button onClick={fetchHistory} className="p-2">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* History Timeline */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>이력이 없습니다</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={item.id || index} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getActionColor(item.action)}`}>
                        {getActionLabel(item.action)}
                      </span>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{item.user_name || '시스템'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(item.created_at).toLocaleString('ko-KR')}</span>
                      </div>
                    </div>
                    
                    {/* 변경 내용 표시 */}
                    {item.previous_value && item.new_value && (
                      <div className="mt-3 pt-3 border-t text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-gray-400 mb-1">변경 전</p>
                            <p className="text-gray-600 bg-red-50 p-2 rounded">
                              {typeof item.previous_value === 'string' 
                                ? item.previous_value 
                                : JSON.stringify(item.previous_value, null, 2).substring(0, 100)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">변경 후</p>
                            <p className="text-gray-600 bg-green-50 p-2 rounded">
                              {typeof item.new_value === 'string' 
                                ? item.new_value 
                                : JSON.stringify(item.new_value, null, 2).substring(0, 100)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
