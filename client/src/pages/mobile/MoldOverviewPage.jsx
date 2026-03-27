import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Box, ClipboardCheck, Shield,
  Wrench, ChevronRight, MapPin, Factory, Hash, Calendar, Activity
} from 'lucide-react';
import api from '../../lib/api';

/**
 * 모바일 금형 개요 페이지 (레거시 호환)
 * /mobile/molds/:moldId
 * 기본 금형 정보, 점검 버튼, 수리 요청 버튼
 */
export default function MoldOverviewPage() {
  const { moldId } = useParams();
  const navigate = useNavigate();

  const [mold, setMold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMold = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/mold-specifications/${moldId}`);
        setMold(response.data.data || response.data);
      } catch (err) {
        console.error('[MoldOverview] Load error:', err);
        setError(err.response?.data?.message || '금형 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (moldId) loadMold();
  }, [moldId]);

  // 상태 배지 색상
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': case '양산중': return 'bg-green-100 text-green-700';
      case 'inactive': case '비가동': return 'bg-gray-100 text-gray-600';
      case 'repair': case '수리중': return 'bg-yellow-100 text-yellow-700';
      case 'scrapped': case '폐기': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return '양산중';
      case 'inactive': return '비가동';
      case 'repair': return '수리중';
      case 'scrapped': return '폐기';
      default: return status || '-';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">금형 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border p-6 max-w-sm w-full text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-800">오류 발생</h2>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!mold) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border p-6 max-w-sm w-full text-center space-y-4">
          <Box className="w-12 h-12 text-gray-300 mx-auto" />
          <h2 className="text-lg font-bold text-gray-800">금형을 찾을 수 없습니다</h2>
          <p className="text-gray-500 text-sm">요청한 금형 정보가 존재하지 않습니다.</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-800 truncate">
            {mold.part_name || mold.mold_code || '금형 상세'}
          </h1>
          <p className="text-xs text-gray-500 truncate">{mold.mold_code || ''}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(mold.status)}`}>
          {getStatusLabel(mold.status)}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* 금형 기본 정보 */}
        <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Box className="w-4 h-4 text-blue-600" />
            금형 정보
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <Hash className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">금형코드</p>
                <p className="font-medium text-gray-800">{mold.mold_code || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Hash className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">품번</p>
                <p className="font-medium text-gray-800">{mold.part_number || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Factory className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">생산처</p>
                <p className="font-medium text-gray-800">{mold.plant_name || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">보관위치</p>
                <p className="font-medium text-gray-800">{mold.storage_location || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">누적 숏수</p>
                <p className="font-medium text-gray-800">{mold.current_shot_count?.toLocaleString() || '0'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">보증 숏수</p>
                <p className="font-medium text-gray-800">{mold.guaranteed_shot_count?.toLocaleString() || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">제작일</p>
                <p className="font-medium text-gray-800">
                  {mold.manufacture_date ? new Date(mold.manufacture_date).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Factory className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">제작처</p>
                <p className="font-medium text-gray-800">{mold.maker_name || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 작업 버튼 */}
        <div className="space-y-2">
          <h2 className="font-semibold text-gray-800 px-1">작업</h2>

          {/* 일상 점검 */}
          <button
            onClick={() => navigate(`/mobile/molds/${moldId}/check/daily`)}
            className="w-full bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-3 hover:bg-blue-50 active:bg-blue-100 transition"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">일상 점검</p>
              <p className="text-xs text-gray-500">일일 금형 상태 점검</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* 정기 점검 */}
          <button
            onClick={() => navigate(`/mobile/molds/${moldId}/check/periodic`)}
            className="w-full bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-3 hover:bg-orange-50 active:bg-orange-100 transition"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">정기 점검</p>
              <p className="text-xs text-gray-500">주기별 정밀 점검</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* 수리 요청 */}
          <button
            onClick={() => navigate(`/mobile/molds/${moldId}/repair/requests`)}
            className="w-full bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-3 hover:bg-red-50 active:bg-red-100 transition"
          >
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">수리 요청</p>
              <p className="text-xs text-gray-500">금형 수리 요청 및 내역</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* 금형 상세 */}
          <button
            onClick={() => navigate(`/mobile/mold/${moldId}`)}
            className="w-full bg-white rounded-2xl shadow-sm border p-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Box className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">금형 상세</p>
              <p className="text-xs text-gray-500">상세 정보, 이력, 문서 보기</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
