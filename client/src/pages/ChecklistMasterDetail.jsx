import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit3, Send, CheckCircle, Rocket, Copy, RefreshCw,
  FileText, Clock, Check, X, Camera
} from 'lucide-react';
import { checklistMasterAPI } from '../lib/api';

export default function ChecklistMasterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(null);
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [versionRes, cyclesRes] = await Promise.all([
        checklistMasterAPI.getVersionById(id),
        checklistMasterAPI.getCycles()
      ]);
      
      setVersion(versionRes.data?.data);
      setCycles(cyclesRes.data?.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusAction = async (action) => {
    try {
      if (action === 'submit-review') {
        await checklistMasterAPI.submitForReview(id);
      } else if (action === 'approve') {
        await checklistMasterAPI.approve(id);
      } else if (action === 'deploy') {
        await checklistMasterAPI.deploy(id);
      } else if (action === 'clone') {
        await checklistMasterAPI.clone(id);
        navigate('/pre-production-checklist');
        return;
      }
      loadData();
    } catch (error) {
      console.error('Action failed:', error);
      alert('작업에 실패했습니다.');
    }
  };

  const statusConfig = {
    draft: { label: '초안', color: 'bg-gray-100 text-gray-800', icon: Edit3 },
    review: { label: '검토중', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    approved: { label: '승인됨', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    deployed: { label: '배포됨', color: 'bg-green-100 text-green-800', icon: Rocket }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!version) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">마스터 버전을 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/pre-production-checklist')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const config = statusConfig[version.status] || statusConfig.draft;
  const StatusIcon = config.icon;

  // 항목을 카테고리별로 그룹화
  const groupedItems = (version.itemMaps || []).reduce((acc, map) => {
    const category = map.item?.major_category || '기타';
    if (!acc[category]) acc[category] = [];
    acc[category].push(map);
    return acc;
  }, {});

  // 주기별 항목 매핑 생성
  const cycleItemMap = {};
  (version.cycleMaps || []).forEach(cm => {
    const key = `${cm.item_id}-${cm.cycle_code_id}`;
    cycleItemMap[key] = cm.is_enabled;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/pre-production-checklist')}
                className="p-2 mr-4 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-gray-900">{version.name}</h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                    <StatusIcon className="w-4 h-4 mr-1" />
                    {config.label}
                  </span>
                  {version.is_current_deployed && (
                    <span className="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
                      현재 적용
                    </span>
                  )}
                </div>
                <p className="text-gray-500 mt-1">{version.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {version.status === 'draft' && (
                <>
                  <button
                    onClick={() => navigate(`/checklist-master/${id}/edit`)}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    편집
                  </button>
                  <button
                    onClick={() => handleStatusAction('submit-review')}
                    className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    검토 요청
                  </button>
                </>
              )}
              
              {version.status === 'review' && (
                <button
                  onClick={() => handleStatusAction('approve')}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  승인
                </button>
              )}
              
              {version.status === 'approved' && (
                <button
                  onClick={() => handleStatusAction('deploy')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  배포
                </button>
              )}
              
              <button
                onClick={() => handleStatusAction('clone')}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Copy className="w-4 h-4 mr-2" />
                복제
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">버전</p>
              <p className="font-medium">v{version.version}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">생성자</p>
              <p className="font-medium">{version.creator?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">생성일</p>
              <p className="font-medium">
                {version.created_at ? new Date(version.created_at).toLocaleDateString('ko-KR') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">배포일</p>
              <p className="font-medium">
                {version.deployed_at ? new Date(version.deployed_at).toLocaleDateString('ko-KR') : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* 항목-주기 매핑 매트릭스 */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">항목-주기 매핑</h2>
            <p className="text-sm text-gray-500 mt-1">각 점검항목이 어떤 주기에 적용되는지 확인합니다.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">카테고리</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">항목명</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">사진</th>
                  {cycles.map(cycle => (
                    <th key={cycle.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      {cycle.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(groupedItems).map(([category, categoryItems]) => (
                  categoryItems.map((map, idx) => (
                    <tr key={map.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 sticky left-0 bg-white">
                        {idx === 0 ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {category}
                          </span>
                        ) : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{map.item?.item_name}</td>
                      <td className="px-4 py-3 text-center">
                        {map.item?.required_photo ? (
                          <Camera className="w-4 h-4 text-orange-500 mx-auto" />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      {cycles.map(cycle => {
                        const isEnabled = cycleItemMap[`${map.item_id}-${cycle.id}`];
                        return (
                          <td key={cycle.id} className="px-4 py-3 text-center">
                            {isEnabled ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 포함된 항목 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              포함된 점검항목 ({version.itemMaps?.length || 0}개)
            </h2>
          </div>
          
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">항목명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">점검내용</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">점검방법</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">사진필수</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(version.itemMaps || []).map((map, idx) => (
                <tr key={map.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {map.item?.major_category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{map.item?.item_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {map.item?.description || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {map.item?.check_method || '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {map.item?.required_photo ? (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">필수</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
