import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, History, Calendar, User, FileText, 
  Wrench, Package, MapPin, AlertTriangle, CheckCircle,
  ChevronDown, Filter, Download, RefreshCw
} from 'lucide-react';
import api from '../lib/api';

// 이력 유형별 아이콘 및 색상
const HISTORY_TYPES = {
  created: { label: '등록', icon: Package, color: 'bg-blue-100 text-blue-600' },
  status_change: { label: '상태변경', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-600' },
  transfer: { label: '이관', icon: MapPin, color: 'bg-purple-100 text-purple-600' },
  repair: { label: '수리', icon: Wrench, color: 'bg-orange-100 text-orange-600' },
  inspection: { label: '점검', icon: CheckCircle, color: 'bg-green-100 text-green-600' },
  maintenance: { label: '유지보전', icon: Wrench, color: 'bg-cyan-100 text-cyan-600' },
  specification: { label: '사양변경', icon: FileText, color: 'bg-indigo-100 text-indigo-600' },
  scrapping: { label: '폐기', icon: AlertTriangle, color: 'bg-red-100 text-red-600' }
};

// 타임라인 아이템
const TimelineItem = ({ item, isLast }) => {
  const typeConfig = HISTORY_TYPES[item.type] || HISTORY_TYPES.created;
  const Icon = typeConfig.icon;

  return (
    <div className="flex gap-4">
      {/* 타임라인 라인 */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeConfig.color}`}>
          <Icon size={18} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-2" />}
      </div>

      {/* 내용 */}
      <div className="flex-1 pb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
              <h4 className="font-medium text-gray-900 mt-2">{item.title}</h4>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>{new Date(item.created_at).toLocaleDateString('ko-KR')}</div>
              <div>{new Date(item.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
          )}
          
          {item.changes && item.changes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">변경 내역</p>
              <div className="space-y-1">
                {item.changes.map((change, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">{change.field}:</span>
                    <span className="text-red-500 line-through">{change.old_value || '-'}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600 font-medium">{change.new_value || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <User size={12} />
            <span>{item.user_name || '시스템'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MoldHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moldId = id || searchParams.get('moldId');
  
  const [mold, setMold] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (moldId) {
      loadData();
    }
  }, [moldId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 금형 정보 로드
      const moldRes = await api.get(`/mold-specifications/${moldId}`).catch(() => null);
      if (moldRes?.data?.data) {
        setMold(moldRes.data.data);
      }

      // 이력 데이터 (실제 API가 없으면 더미 데이터)
      // TODO: 실제 이력 API 연동
      setHistory([
        {
          id: 1,
          type: 'created',
          title: '금형 등록',
          description: '신규 금형이 시스템에 등록되었습니다.',
          user_name: '김개발',
          created_at: '2024-01-15T09:00:00Z'
        },
        {
          id: 2,
          type: 'specification',
          title: '사양 변경',
          description: '금형 사양이 수정되었습니다.',
          changes: [
            { field: '캐비티 수', old_value: '2', new_value: '4' },
            { field: '톤수', old_value: '850T', new_value: '1000T' }
          ],
          user_name: '이설계',
          created_at: '2024-02-20T14:30:00Z'
        },
        {
          id: 3,
          type: 'status_change',
          title: '상태 변경',
          description: '금형 상태가 변경되었습니다.',
          changes: [
            { field: '상태', old_value: '개발', new_value: '양산' }
          ],
          user_name: '박관리',
          created_at: '2024-03-10T10:00:00Z'
        },
        {
          id: 4,
          type: 'transfer',
          title: '금형 이관',
          description: 'A공장에서 B공장으로 이관되었습니다.',
          changes: [
            { field: '위치', old_value: 'A공장', new_value: 'B공장' }
          ],
          user_name: '최이관',
          created_at: '2024-04-05T11:00:00Z'
        },
        {
          id: 5,
          type: 'inspection',
          title: '정기점검 완료',
          description: '2024년 1분기 정기점검이 완료되었습니다.',
          user_name: '정점검',
          created_at: '2024-04-15T16:00:00Z'
        },
        {
          id: 6,
          type: 'repair',
          title: '수리 완료',
          description: '슬라이드 코어 마모 수리가 완료되었습니다.',
          changes: [
            { field: '수리 비용', old_value: '-', new_value: '1,500,000원' }
          ],
          user_name: '한수리',
          created_at: '2024-05-20T09:30:00Z'
        },
        {
          id: 7,
          type: 'maintenance',
          title: '예방 유지보전',
          description: '정기 유지보전 작업이 수행되었습니다.',
          user_name: '오보전',
          created_at: '2024-06-10T14:00:00Z'
        }
      ]);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = filterType === 'all' 
    ? history 
    : history.filter(h => h.type === filterType);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <History className="text-blue-600" size={24} />
              금형 이력
            </h1>
            {mold && (
              <p className="text-sm text-gray-500 mt-1">
                {mold.mold?.mold_code || mold.mold_code} - {mold.part_name || '-'}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw size={16} />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={16} />
            내보내기
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm text-gray-600 mr-2">필터:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              filterType === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {Object.entries(HISTORY_TYPES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                filterType === key 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* 타임라인 */}
      <div className="pl-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="mx-auto mb-4 text-gray-300" size={48} />
            <p>이력이 없습니다.</p>
          </div>
        ) : (
          filteredHistory.map((item, index) => (
            <TimelineItem 
              key={item.id} 
              item={item} 
              isLast={index === filteredHistory.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
