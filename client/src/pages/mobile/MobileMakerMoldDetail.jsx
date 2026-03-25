/**
 * 모바일 제작처 금형 상세 페이지
 * 제작처(Maker) 관점에서 금형 상세 정보 조회
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Wrench, ClipboardCheck, Truck, RefreshCw,
  Box, Calendar, User, MapPin, FileText, Image,
  ChevronRight, AlertTriangle, CheckCircle, Clock, Info
} from 'lucide-react';
import api from '../../lib/api';

export default function MobileMakerMoldDetail() {
  const { moldId } = useParams();
  const navigate = useNavigate();
  const [mold, setMold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    if (moldId) {
      fetchMoldDetail();
    }
  }, [moldId]);

  const fetchMoldDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/molds/${moldId}`);
      if (response.data.success) {
        setMold(response.data.data);
      } else {
        setError('금형 정보를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('금형 상세 조회 오류:', err);
      setError('금형 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: '가동중', icon: CheckCircle },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-700', label: '비가동', icon: Clock },
      maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '정비중', icon: Wrench },
      repair: { bg: 'bg-red-100', text: 'text-red-700', label: '수리중', icon: AlertTriangle },
      scrapped: { bg: 'bg-gray-200', text: 'text-gray-500', label: '폐기', icon: Info },
    };
    return configs[status] || configs.inactive;
  };

  const sections = [
    { key: 'basic', label: '기본정보', icon: Info },
    { key: 'spec', label: '사양', icon: Box },
    { key: 'repair', label: '수리이력', icon: Wrench },
    { key: 'files', label: '첨부파일', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-500 text-sm">금형 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center px-4 py-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold ml-2">금형 상세</h1>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchMoldDetail}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!mold) return null;

  const statusConfig = getStatusConfig(mold.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold ml-2">금형 상세</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Mold Header Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1">금형번호</p>
              <h2 className="text-xl font-bold text-gray-900">
                {mold.mold_number || mold.mold_id || '-'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {mold.mold_name || mold.part_name || '-'}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </span>
          </div>
          {mold.current_repair_status && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 text-sm">
                <Wrench className="w-4 h-4" />
                <span>현재 수리 상태: {mold.current_repair_status}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate(`/mobile/repair-request?moldId=${moldId}`)}
            className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center gap-2 active:bg-gray-50"
          >
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs text-gray-700 font-medium">수리접수</span>
          </button>
          <button
            onClick={() => navigate(`/mobile/mold/${moldId}/history`)}
            className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center gap-2 active:bg-gray-50"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-700 font-medium">진행현황</span>
          </button>
          <button
            onClick={() => navigate(`/mobile/mold/${moldId}/checklist`)}
            className="bg-white rounded-xl shadow-sm p-3 flex flex-col items-center gap-2 active:bg-gray-50"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-gray-700 font-medium">출하체크리스트</span>
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sections.map((section) => {
            const SectionIcon = section.icon;
            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === section.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 shadow-sm'
                }`}
              >
                <SectionIcon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Section Content */}
        {activeSection === 'basic' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">기본정보</h3>
            <div className="space-y-3">
              {[
                { label: '금형번호', value: mold.mold_number || '-', icon: Box },
                { label: '금형명', value: mold.mold_name || mold.part_name || '-', icon: FileText },
                { label: '차종', value: mold.car_model || '-', icon: Info },
                { label: '위치', value: mold.location || mold.current_location || '-', icon: MapPin },
                { label: '담당자', value: mold.manager || mold.person_in_charge || '-', icon: User },
                { label: '제작일', value: mold.manufacture_date || mold.created_at?.split('T')[0] || '-', icon: Calendar },
              ].map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <ItemIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-500 w-20 shrink-0">{item.label}</span>
                    <span className="text-sm text-gray-900 flex-1">{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSection === 'spec' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">사양</h3>
            <div className="space-y-3">
              {[
                { label: '캐비티', value: mold.cavity || '-' },
                { label: '재질', value: mold.material || mold.steel_type || '-' },
                { label: '중량', value: mold.weight ? `${mold.weight} kg` : '-' },
                { label: '크기', value: mold.size || (mold.width && mold.height ? `${mold.width} x ${mold.height} x ${mold.length || '-'}` : '-') },
                { label: '사출기', value: mold.machine || mold.injection_machine || '-' },
                { label: '보증타수', value: mold.guaranteed_shots ? `${Number(mold.guaranteed_shots).toLocaleString()} 타` : '-' },
                { label: '현재타수', value: mold.current_shots ? `${Number(mold.current_shots).toLocaleString()} 타` : '-' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500 w-24 shrink-0">{item.label}</span>
                  <span className="text-sm text-gray-900 flex-1">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'repair' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">수리이력</h3>
            {mold.repair_history && mold.repair_history.length > 0 ? (
              <div className="space-y-3">
                {mold.repair_history.map((repair, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {repair.title || repair.repair_type || `수리 #${idx + 1}`}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        repair.status === 'completed' ? 'bg-green-100 text-green-700' :
                        repair.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {repair.status === 'completed' ? '완료' :
                         repair.status === 'in_progress' ? '진행중' : '대기'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {repair.start_date || repair.created_at?.split('T')[0] || '-'}
                      {repair.end_date ? ` ~ ${repair.end_date}` : ''}
                    </p>
                    {repair.description && (
                      <p className="text-xs text-gray-600 mt-1">{repair.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">수리 이력이 없습니다</p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'files' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">첨부파일</h3>
            {mold.attachments && mold.attachments.length > 0 ? (
              <div className="space-y-2">
                {mold.attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {file.file_type?.startsWith('image') ? (
                      <Image className="w-5 h-5 text-blue-500 shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {file.file_name || file.original_name || `파일 ${idx + 1}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {file.uploaded_at?.split('T')[0] || '-'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">첨부파일이 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
