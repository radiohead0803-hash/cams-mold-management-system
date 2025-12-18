import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Settings, ChevronDown, Upload, Eye, 
  CheckCircle, MapPin, TrendingUp, User, AlertTriangle,
  Thermometer, Gauge, Clock, Box, Wrench, FileText,
  ClipboardCheck, Calendar, Activity, Camera, Shield, X, History, Printer, Star,
  Building, ClipboardList, DollarSign
} from 'lucide-react';
import { moldSpecificationAPI, moldAPI, moldImageAPI, getImageUrl } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import NaverMoldLocationMap from '../components/NaverMoldLocationMap';

export default function MoldDetailNew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // QR 스캔으로 접속했는지 확인
  const isQRAccess = searchParams.get('qr') === 'true';
  
  const [mold, setMold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [locationClickCount, setLocationClickCount] = useState(0);
  const [locationClickTimer, setLocationClickTimer] = useState(null);
  const [moldLocationPopup, setMoldLocationPopup] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(null); // 'mold' | 'product' | null
  const [moldImages, setMoldImages] = useState({ mold: null, product: null });
  const [isFavorite, setIsFavorite] = useState(false);

  // 즐겨찾기 로드
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('moldFavorites') || '[]');
    setIsFavorite(favorites.includes(id));
  }, [id]);

  // 즐겨찾기 토글
  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('moldFavorites') || '[]');
    let newFavorites;
    if (isFavorite) {
      newFavorites = favorites.filter(fav => fav !== id);
    } else {
      newFavorites = [...favorites, id];
    }
    localStorage.setItem('moldFavorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  // 드롭다운 메뉴 정의 (계층형 구조 지원) - 연한 색상
  const menuItems = {
    moldInfo: { 
      label: '금형정보', 
      color: 'bg-purple-400',
      hoverColor: 'hover:bg-purple-500',
      items: [
        { 
          label: '금형개발', 
          subItems: ['개발계획', '금형체크리스트', '금형육성', '경도측정'] 
        },
        '금형사양',
        '변경이력 현황표'
      ]
    },
    injection: { 
      label: '사출정보', 
      color: 'bg-rose-400',
      hoverColor: 'hover:bg-rose-500',
      items: ['사출조건 관리', '이력관리', '변경관리 통계']
    },
    repair: { 
      label: '금형수리', 
      color: 'bg-amber-400',
      hoverColor: 'hover:bg-amber-500',
      items: ['수리요청', '금형수리 현황표', '금형수리 진행현황']
    },
    inspection: { 
      label: '금형점검', 
      color: 'bg-emerald-400',
      hoverColor: 'hover:bg-emerald-500',
      items: ['일상점검', '정기점검', '승인']
    },
    transfer: { 
      label: '금형이관', 
      color: 'bg-sky-400',
      hoverColor: 'hover:bg-sky-500',
      items: ['이관현황']
    },
    maintenance: { 
      label: '유지보전', 
      color: 'bg-orange-400',
      hoverColor: 'hover:bg-orange-500',
      items: ['유지보전 기록', '유지보전 등록']
    },
    scrapping: { 
      label: '폐기관리', 
      color: 'bg-red-400',
      hoverColor: 'hover:bg-red-500',
      items: ['폐기 요청', '폐기 현황']
    },
    history: { 
      label: '변경이력', 
      color: 'bg-gray-400',
      hoverColor: 'hover:bg-gray-500',
      items: ['전체 이력', '사양 변경', '상태 변경']
    }
  };

  useEffect(() => {
    loadMoldData();
  }, [id]);

  const loadMoldData = async () => {
    try {
      setLoading(true);
      let moldData = null;

      // 1. mold_specifications에서 먼저 시도
      try {
        const response = await moldSpecificationAPI.getById(id);
        if (response.data?.data) {
          moldData = response.data.data;
        }
      } catch (err) {
        console.log('Not found in mold_specifications, trying molds table...');
      }

      // 2. mold_specifications에서 못 찾으면 molds 테이블에서 시도
      if (!moldData) {
        try {
          const moldResponse = await moldAPI.getById(id);
          if (moldResponse.data?.data) {
            moldData = moldResponse.data.data;
          }
        } catch (err2) {
          console.log('Not found in molds table either');
        }
      }

      if (moldData) {
        setMold(moldData);
      } else {
        console.error('Mold not found in any table');
      }
    } catch (err) {
      console.error('Failed to load mold:', err);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 유형에 따른 표시 항목 결정
  const getVisibleSections = () => {
    const userType = user?.user_type || 'plant';
    
    if (isQRAccess) {
      // QR 스캔 접속: 현장 작업자용 간소화 뷰
      return ['status', 'quickActions', 'alerts'];
    }
    
    switch (userType) {
      case 'system_admin':
      case 'mold_developer':
        // 본사: 모든 정보 표시
        return ['images', 'status', 'alerts', 'quickActions', 'injection', 'specs', 'repair'];
      case 'maker':
        // 제작처: 제작 관련 정보
        return ['images', 'status', 'specs', 'repair'];
      case 'plant':
        // 생산처: 생산 관련 정보
        return ['images', 'status', 'alerts', 'quickActions', 'injection'];
      default:
        return ['status', 'quickActions'];
    }
  };

  const visibleSections = getVisibleSections();

  // 이미지 로드
  const loadMoldImages = useCallback(async () => {
    try {
      const response = await moldImageAPI.getAll({ mold_spec_id: id });
      if (response.data.success) {
        const images = response.data.data;
        const moldImg = images.find(img => img.image_type === 'mold' && img.is_primary);
        const productImg = images.find(img => img.image_type === 'product' && img.is_primary);
        setMoldImages({
          mold: moldImg?.image_url || mold?.mold_image_url,
          product: productImg?.image_url || mold?.product_image_url
        });
      }
    } catch (error) {
      console.error('Failed to load images:', error);
      // 기존 이미지 URL 사용
      setMoldImages({
        mold: mold?.mold_image_url,
        product: mold?.product_image_url
      });
    }
  }, [id, mold]);

  useEffect(() => {
    if (mold) {
      loadMoldImages();
    }
  }, [mold, loadMoldImages]);

  // 이미지 업로드 핸들러 (파일 선택)
  const handleImageUpload = async (e, imageType) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadImageFile(file, imageType);
    e.target.value = ''; // 파일 입력 초기화
  };

  // 공통 이미지 업로드 함수
  const uploadImageFile = async (file, imageType) => {
    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 체크
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WEBP만 허용)');
      return;
    }

    setUploadingImage(imageType);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('mold_spec_id', id);
      formData.append('image_type', imageType);
      formData.append('is_primary', 'true');

      const response = await moldImageAPI.upload(formData);
      
      if (response.data.success) {
        // 이미지 새로고침
        await loadMoldImages();
        alert('이미지가 업로드되었습니다.');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('이미지 업로드에 실패했습니다: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setUploadingImage(null);
    }
  };

  // 클립보드 붙여넣기 핸들러 (Ctrl+V로 캡쳐 이미지 업로드)
  const handlePaste = useCallback(async (e, imageType) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // 파일명이 없으면 생성
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const newFile = new File([file], `capture_${timestamp}.png`, { type: file.type });
          await uploadImageFile(newFile, imageType);
        }
        break;
      }
    }
  }, [id, loadMoldImages]);

  // 드래그 앤 드롭 핸들러
  const handleDrop = useCallback(async (e, imageType) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await uploadImageFile(file, imageType);
      } else {
        alert('이미지 파일만 업로드할 수 있습니다.');
      }
    }
  }, [id, loadMoldImages]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 위치 클릭 핸들러 (더블클릭 시 상세 정보 표시)
  const handleLocationClick = useCallback(() => {
    if (locationClickTimer) {
      // 더블클릭: 상세 정보 팝업 표시
      clearTimeout(locationClickTimer);
      setLocationClickTimer(null);
      setLocationClickCount(0);
      setMoldLocationPopup({
        id: mold?.id,
        moldCode: mold?.mold_code || `MOLD-${id}`,
        moldName: mold?.part_name || mold?.mold_name,
        plantName: mold?.plant_company_name || mold?.current_location || 'A구역-01',
        lat: mold?.gps_lat || 37.5665,
        lng: mold?.gps_lng || 126.978,
        status: mold?.status || 'normal',
        currentShots: mold?.current_shots || 0,
        maxShots: mold?.max_shots || 100000
      });
    } else {
      // 첫 번째 클릭: 지도 표시
      setShowLocationMap(true);
      const timer = setTimeout(() => {
        setLocationClickTimer(null);
        setLocationClickCount(0);
      }, 300);
      setLocationClickTimer(timer);
      setLocationClickCount(1);
    }
  }, [locationClickTimer, mold, id]);

  // 지도에서 마커 더블클릭 시 금형 정보 팝업 열기
  const handleMoldDoubleClick = useCallback((moldData) => {
    setMoldLocationPopup(moldData);
  }, []);

  // 금형 정보 인쇄
  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>금형 정보 - ${mold?.mold_code || ''}</title>
        <style>
          body { font-family: 'Malgun Gothic', sans-serif; padding: 30px; }
          h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 25px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: 600; width: 30%; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .status { padding: 4px 12px; border-radius: 20px; font-size: 12px; }
          .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 11px; }
          @media print { body { padding: 15px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>금형 상세 정보</h1>
          <span class="status" style="background: #dbeafe; color: #1d4ed8;">${mold?.status || '-'}</span>
        </div>
        
        <h2>기본 정보</h2>
        <table>
          <tr><th>금형코드</th><td>${mold?.mold_code || '-'}</td></tr>
          <tr><th>품번</th><td>${mold?.part_number || '-'}</td></tr>
          <tr><th>품명</th><td>${mold?.part_name || '-'}</td></tr>
          <tr><th>차종</th><td>${mold?.car_model || '-'}</td></tr>
          <tr><th>제작처</th><td>${mold?.maker_company_name || '-'}</td></tr>
          <tr><th>생산처</th><td>${mold?.plant_company_name || '-'}</td></tr>
        </table>
        
        <h2>금형 사양</h2>
        <table>
          <tr><th>캐비티</th><td>${mold?.cavity || '-'}</td></tr>
          <tr><th>톤수</th><td>${mold?.tonnage || '-'}</td></tr>
          <tr><th>금형 크기</th><td>${mold?.mold_size || '-'}</td></tr>
          <tr><th>재질</th><td>${mold?.material || '-'}</td></tr>
        </table>
        
        <h2>생산 정보</h2>
        <table>
          <tr><th>현재 타수</th><td>${(mold?.current_shots || 0).toLocaleString()}</td></tr>
          <tr><th>보증 타수</th><td>${(mold?.guaranteed_shots || 0).toLocaleString()}</td></tr>
          <tr><th>사이클 타임</th><td>${mold?.cycle_time || '-'} 초</td></tr>
        </table>
        
        <div class="footer">
          <p>CAMS 금형관리 시스템 - ${new Date().toLocaleDateString('ko-KR')} 인쇄</p>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  // 현재 금형의 위치 데이터
  const currentMoldLocation = mold ? [{
    id: mold.id || parseInt(id),
    moldCode: mold.mold_code || `MOLD-${id}`,
    moldName: mold.part_name || mold.mold_name,
    plantName: mold.plant_company_name || mold.current_location || 'A구역-01',
    lat: mold.gps_lat || 37.5665,
    lng: mold.gps_lng || 126.978,
    status: mold.status === 'active' ? 'normal' : mold.status || 'normal'
  }] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!mold) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
          <p className="text-gray-600 mb-4">금형 정보를 찾을 수 없습니다.</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const moldCode = mold.mold_code || mold.part_number || `M-${id}`;
  const moldName = mold.mold_name || mold.part_name || '금형';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 pb-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back & Title */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Settings className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">{moldCode}</h1>
                  <p className="text-sm text-gray-500">{moldName}</p>
                </div>
              </div>
            </div>

            {/* Center: Menu Dropdowns */}
            {!isQRAccess && (
              <div className="hidden lg:flex items-center gap-1">
                {Object.entries(menuItems).map(([key, menu]) => (
                  <div key={key} className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === key ? null : key)}
                      className={`px-2.5 py-1.5 rounded-full text-xs font-medium text-white flex items-center gap-0.5 tracking-tight whitespace-nowrap ${menu.color}`}
                    >
                      <span className="tracking-tight">{menu.label}</span>
                      <ChevronDown size={12} />
                    </button>
                    {activeMenu === key && (
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border py-2 min-w-[180px] z-50">
                        {menu.items.map((item, idx) => (
                          typeof item === 'object' ? (
                            // 계층형 메뉴 (하위 항목 있음)
                            <div key={idx} className="group relative">
                              <button
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-between"
                              >
                                {item.label}
                                <ChevronDown size={12} className="transform -rotate-90" />
                              </button>
                              {/* 하위 메뉴 */}
                              <div className="hidden group-hover:block absolute left-full top-0 ml-1 bg-white rounded-lg shadow-lg border py-2 min-w-[140px]">
                                {item.subItems.map((subItem, subIdx) => (
                                  <button
                                    key={subIdx}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 text-gray-600"
                                    onClick={() => {
                                      setActiveMenu(null);
                                      // 체크리스트 마스터 연동
                                      if (subItem === '금형체크리스트') {
                                        navigate(`/checklist/master?moldId=${id}`);
                                      } else if (subItem === '개발계획') {
                                        navigate(`/mold-development/plan?moldId=${id}`);
                                      } else if (subItem === '금형육성') {
                                        navigate(`/mold-development/nurturing?moldId=${id}`);
                                      } else if (subItem === '경도측정') {
                                        navigate(`/mold-development/hardness?moldId=${id}`);
                                      }
                                    }}
                                  >
                                    {subItem}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            // 일반 메뉴
                            <button
                              key={idx}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                              onClick={() => {
                                setActiveMenu(null);
                                // 금형사양 페이지 이동
                                if (item === '금형사양') {
                                  navigate(`/mold-specification/${id}`);
                                } else if (item === '일상점검') {
                                  navigate(`/checklist/daily?mold=${id}`);
                                } else if (item === '정기점검') {
                                  navigate(`/inspection/periodic?mold=${id}`);
                                } else if (item === '승인') {
                                  navigate(`/inspection-approval?moldId=${id}`);
                                } else if (item === '사출조건 관리') {
                                  navigate(`/injection-condition?moldId=${id}`);
                                } else if (item === '이력관리') {
                                  navigate(`/injection-history?moldId=${id}`);
                                } else if (item === '변경관리 통계') {
                                  navigate(`/injection-stats?moldId=${id}`);
                                } 
                                // 금형수리 메뉴
                                else if (item === '수리요청') {
                                  navigate(`/repair-request-form?moldId=${id}`);
                                } else if (item === '금형수리 현황표') {
                                  navigate(`/hq/repair-requests?moldId=${id}&view=status`);
                                } else if (item === '금형수리 진행현황') {
                                  navigate(`/hq/repair-requests?moldId=${id}&view=progress`);
                                }
                                // 금형이관 메뉴
                                else if (item === '이관요청') {
                                  navigate(`/transfers/new?moldId=${id}`);
                                } else if (item === '이관현황') {
                                  navigate(`/transfers?moldId=${id}`);
                                } else if (item === '이관 체크리스트') {
                                  navigate(`/transfers?moldId=${id}&view=checklist`);
                                }
                              }}
                            >
                              {item}
                            </button>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Right: User Info & Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleFavorite}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              >
                <Star 
                  size={20} 
                  className={isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} 
                />
              </button>
              <button 
                onClick={handlePrint}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="인쇄"
              >
                <Printer size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <User size={20} className="text-gray-600" />
              </button>
              <span className="text-sm text-gray-600 hidden sm:block">
                {isQRAccess ? 'QR 접속' : user?.name || '사용자'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 금형 이미지 섹션 */}
        {visibleSections.includes('images') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 금형 이미지 */}
            <div 
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
              onPaste={(e) => handlePaste(e, 'mold')}
              onDrop={(e) => handleDrop(e, 'mold')}
              onDragOver={handleDragOver}
              tabIndex={0}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="text-purple-600" size={20} />
                  <h3 className="font-semibold text-gray-800">금형 이미지</h3>
                </div>
                <span className="text-xs text-gray-400">Ctrl+V 또는 드래그</span>
              </div>
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative cursor-pointer hover:bg-gray-150 transition-colors">
                {moldImages.mold || mold.mold_image_url ? (
                  <img 
                    src={getImageUrl(moldImages.mold || mold.mold_image_url)} 
                    alt="금형" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <Camera size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">이미지 없음</p>
                    <p className="text-xs mt-1 text-gray-300">클릭하여 선택, Ctrl+V로 붙여넣기, 또는 드래그</p>
                  </div>
                )}
                {uploadingImage === 'mold' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">업로드 중...</p>
                    </div>
                  </div>
                )}
              </div>
              <label className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
                <Upload size={16} />
                이미지 업로드
                <Eye size={16} className="ml-4 opacity-70" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(e, 'mold')}
                  disabled={uploadingImage !== null}
                />
              </label>
            </div>

            {/* 제품 이미지 */}
            <div 
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
              onPaste={(e) => handlePaste(e, 'product')}
              onDrop={(e) => handleDrop(e, 'product')}
              onDragOver={handleDragOver}
              tabIndex={0}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="text-blue-600" size={20} />
                  <h3 className="font-semibold text-gray-800">제품 이미지</h3>
                </div>
                <span className="text-xs text-gray-400">Ctrl+V 또는 드래그</span>
              </div>
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center relative cursor-pointer hover:bg-blue-100/50 transition-colors">
                {moldImages.product || mold.part_images?.url || mold.product_image_url ? (
                  <img 
                    src={getImageUrl(moldImages.product || mold.part_images?.url || mold.product_image_url)} 
                    alt="제품" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <Box size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">제품 이미지</p>
                    <p className="text-xs mt-1 text-gray-300">클릭하여 선택, Ctrl+V로 붙여넣기, 또는 드래그</p>
                  </div>
                )}
                {uploadingImage === 'product' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">업로드 중...</p>
                    </div>
                  </div>
                )}
              </div>
              <label className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer">
                <Upload size={16} />
                이미지 업로드
                <Eye size={16} className="ml-4 opacity-70" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => handleImageUpload(e, 'product')}
                  disabled={uploadingImage !== null}
                />
              </label>
            </div>
          </div>
        )}

        {/* 현재 상태 섹션 */}
        {visibleSections.includes('status') && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 현재 상태 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={18} />
                </div>
                <span className="text-sm text-gray-500">현재 상태</span>
              </div>
              <p className="text-lg font-bold text-green-600">
                {mold.status === 'active' ? '사용중' : 
                 mold.status === 'draft' ? '초안' :
                 mold.status === 'planning' ? '계획중' :
                 mold.status === 'in_production' ? '생산중' :
                 mold.status || '대기'}
              </p>
            </div>

            {/* 위치 - 클릭 시 지도 표시, 더블클릭 시 상세 정보 */}
            <div 
              className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md hover:bg-purple-50 transition-all"
              onClick={handleLocationClick}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <MapPin className="text-purple-600" size={18} />
                </div>
                <span className="text-sm text-gray-500">위치</span>
                <span className="text-xs text-purple-400 ml-auto">클릭: 지도 / 더블클릭: 상세</span>
              </div>
              <p className="text-lg font-bold text-purple-600">
                {mold.current_location || mold.location || 'A구역-01'}
              </p>
            </div>

            {/* 보수 진행률 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-yellow-600" size={18} />
                </div>
                <span className="text-sm text-gray-500">보수 진행률</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-green-400 rounded-full" style={{ width: '95%' }}></div>
                </div>
                <span className="text-sm font-bold text-gray-700">95%</span>
              </div>
            </div>

            {/* 담당자 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="text-blue-600" size={18} />
                </div>
                <span className="text-sm text-gray-500">담당자</span>
              </div>
              <p className="text-lg font-bold text-blue-600">
                {mold.manager_name || '김철수'}
              </p>
            </div>
          </div>
        )}

        {/* 알림 & 바로가기 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 금형관리 알림 */}
          {visibleSections.includes('alerts') && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                <h3 className="font-semibold text-gray-800">금형관리 알림</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="text-red-500" size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">샷수 임계치 도달</p>
                    <p className="text-xs text-red-600">현재 샷수가 95.2%에 도달했습니다. 교체를 고려하세요.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Thermometer className="text-orange-500" size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-800">작동 온도 주의</p>
                    <p className="text-xs text-orange-600">금형 온도가 설정값보다 5% 높습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 금형점검 바로가기 */}
          {visibleSections.includes('quickActions') && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <ClipboardCheck className="text-green-600" size={20} />
                <h3 className="font-semibold text-gray-800">금형점검 바로가기</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                {/* 바로가기 버튼 */}
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => navigate(`/checklist/daily?moldId=${id}`)}
                    className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-shadow text-center"
                  >
                    <CheckCircle className="mx-auto mb-1 text-green-600" size={20} />
                    <span className="text-xs font-medium text-gray-700">일상점검</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/inspection/periodic?moldId=${id}`)}
                    className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-shadow text-center"
                  >
                    <Calendar className="mx-auto mb-1 text-blue-600" size={20} />
                    <span className="text-xs font-medium text-gray-700">정기점검</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/repairs/new?moldId=${id}`)}
                    className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl hover:shadow-md transition-shadow text-center"
                  >
                    <Wrench className="mx-auto mb-1 text-yellow-600" size={20} />
                    <span className="text-xs font-medium text-gray-700">수리요청</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/scrapping?moldId=${id}`)}
                    className="p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl hover:shadow-md transition-shadow text-center"
                  >
                    <AlertTriangle className="mx-auto mb-1 text-red-600" size={20} />
                    <span className="text-xs font-medium text-gray-700">폐기요청</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/mold-history/${id}`)}
                    className="p-3 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl hover:shadow-md transition-shadow text-center"
                  >
                    <History className="mx-auto mb-1 text-gray-600" size={20} />
                    <span className="text-xs font-medium text-gray-700">변경이력</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/mobile/mold/${id}/transfer`)}
                    className="p-3 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl hover:shadow-md transition-shadow text-center"
                  >
                    <MapPin className="mx-auto mb-1 text-purple-600" size={20} />
                    <span className="text-xs font-medium text-gray-700">이관관리</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/maintenance?moldId=${id}`)}
                    className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl hover:shadow-md transition-shadow text-center"
                  >
                    <Settings className="mx-auto mb-1 text-orange-600" size={20} />
                    <span className="text-xs font-medium text-gray-700">유지보전</span>
                  </button>
                </div>
                {/* QR 코드 - 스캔 시 모바일 페이지로 이동 */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-4 flex flex-col items-center justify-center">
                  <p className="text-xs text-gray-500 mb-2 font-medium">금형 QR 코드</p>
                  {(() => {
                    // QR 코드: MOLD-{id} 형식
                    const qrCode = mold?.qr_code || `MOLD-${mold?.id || id}`;
                    // 모바일 URL로 QR 생성 (네이버 등 외부 앱에서 스캔 시 바로 접속)
                    const mobileUrl = `https://spirited-liberation-production-1a4d.up.railway.app/m/qr/${qrCode}`;
                    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(mobileUrl)}`;
                    return (
                      <>
                        <img 
                          src={qrImageUrl}
                          alt="QR Code"
                          className="w-24 h-24 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.open(mobileUrl, '_blank')}
                          title="클릭하여 모바일 페이지 열기"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-24 h-24 bg-gray-200 rounded-lg items-center justify-center hidden">
                          <span className="text-xs text-gray-400">QR 오류</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                          {qrCode}
                        </p>
                        <p className="text-xs text-blue-500 mt-1">스캔 시 모바일 페이지 이동</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 사출조건 관리 */}
        {visibleSections.includes('injection') && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="text-red-500" size={20} />
                <h3 className="font-semibold text-gray-800">사출조건 관리</h3>
              </div>
              <button className="px-3 py-1 bg-red-500 text-white text-sm rounded-full hover:bg-red-600 transition-colors">
                상세보기
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">사출온도</p>
                <p className="text-xl font-bold text-red-600">{mold.plant_info?.injection_temp || mold.injection_temp || '-'}°C</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">사출압력</p>
                <p className="text-xl font-bold text-orange-600">{mold.plant_info?.injection_pressure || mold.injection_pressure || '-'} MPa</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">사출속도</p>
                <p className="text-xl font-bold text-blue-600">{mold.plant_info?.injection_speed || mold.injection_speed || '-'} mm/s</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">사이클타임</p>
                <p className="text-xl font-bold text-green-600">{mold.plant_info?.cycle_time || mold.cycle_time || '-'} sec</p>
              </div>
            </div>
          </div>
        )}

        {/* 금형사양 */}
        {visibleSections.includes('specs') && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="text-green-600" size={20} />
                <h3 className="font-semibold text-gray-800">금형사양</h3>
              </div>
              <button className="px-3 py-1 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 transition-colors">
                상세보기
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">재질</p>
                <p className="text-lg font-bold text-gray-700">{mold.maker_info?.material || mold.material || '-'}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">중량</p>
                <p className="text-lg font-bold text-gray-700">{mold.maker_info?.weight || mold.weight || '-'}kg</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">치수</p>
                <p className="text-lg font-bold text-gray-700">{mold.maker_info?.dimensions || mold.dimensions || '-'}mm</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">캐비티</p>
                <p className="text-lg font-bold text-gray-700">{mold.maker_info?.cavity_count || mold.cavity_count || mold.cavity || '-'}개</p>
              </div>
            </div>
          </div>
        )}

        {/* 금형수리 진행현황 */}
        {visibleSections.includes('repair') && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="text-orange-500" size={20} />
                <h3 className="font-semibold text-gray-800">금형수리 진행현황</h3>
              </div>
              <button 
                onClick={() => navigate(`/repair-request-form?moldId=${id}`)}
                className="px-3 py-1 bg-orange-500 text-white text-sm rounded-full hover:bg-orange-600 transition-colors"
              >
                상세보기
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                {/* 워크플로우 스텝 - 수리요청 페이지와 동일 */}
                {[
                  { label: '요청접수', status: 'completed', icon: FileText },
                  { label: '수리처선정', status: 'completed', icon: Building },
                  { label: '수리진행', status: 'current', icon: Wrench },
                  { label: '체크리스트', status: 'pending', icon: ClipboardList },
                  { label: '생산처검수', status: 'pending', icon: Box },
                  { label: '귀책처리', status: 'pending', icon: DollarSign },
                  { label: '완료', status: 'pending', icon: CheckCircle }
                ].map((step, idx, arr) => (
                  <div key={idx} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-100' :
                        step.status === 'current' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        <step.icon className={`${
                          step.status === 'completed' ? 'text-green-600' :
                          step.status === 'current' ? 'text-blue-600' :
                          'text-gray-400'
                        }`} size={20} />
                      </div>
                      <span className={`text-xs mt-2 ${
                        step.status === 'completed' ? 'text-green-600 font-medium' :
                        step.status === 'current' ? 'text-blue-600 font-medium' :
                        'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className={`w-16 h-0.5 mx-2 ${
                        step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 위치 지도 모달 */}
        {showLocationMap && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLocationMap(false)}>
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin size={24} />
                  <div>
                    <h2 className="text-lg font-bold">금형 위치</h2>
                    <p className="text-purple-100 text-sm">{mold?.mold_code || `MOLD-${id}`} - {mold?.part_name || '금형'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLocationMap(false)}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 지도 */}
              <div className="h-[500px]">
                <NaverMoldLocationMap 
                  locations={currentMoldLocation}
                  selectedMoldId={mold?.id || parseInt(id)}
                  onMoldDoubleClick={handleMoldDoubleClick}
                />
              </div>

              {/* 위치 정보 */}
              <div className="p-4 bg-gray-50 border-t">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">현재 위치</p>
                    <p className="font-semibold text-gray-900">{mold?.current_location || mold?.location || 'A구역-01'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">생산처</p>
                    <p className="font-semibold text-gray-900">{mold?.plant_company_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">GPS 좌표</p>
                    <p className="font-semibold text-gray-900">
                      {mold?.gps_lat ? `${mold.gps_lat.toFixed(4)}, ${mold.gps_lng?.toFixed(4)}` : '미등록'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 금형 위치 상세 정보 팝업 */}
        {moldLocationPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setMoldLocationPopup(null)}>
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{moldLocationPopup.moldCode}</h2>
                    <p className="text-blue-100 text-sm mt-1">{moldLocationPopup.moldName || '금형'}</p>
                  </div>
                  <button 
                    onClick={() => setMoldLocationPopup(null)}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* 본문 */}
              <div className="p-6 space-y-4">
                {/* 상태 배지 */}
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    moldLocationPopup.status === 'ng' ? 'bg-red-100 text-red-700' :
                    moldLocationPopup.status === 'moved' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    상태: {moldLocationPopup.status === 'ng' ? 'NG' : moldLocationPopup.status === 'moved' ? '이탈' : '정상'}
                  </span>
                </div>

                {/* 정보 그리드 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">현재 위치</p>
                    <p className="font-semibold text-gray-900">{moldLocationPopup.plantName || '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">GPS 좌표</p>
                    <p className="font-semibold text-gray-900">
                      {moldLocationPopup.lat?.toFixed(4)}, {moldLocationPopup.lng?.toFixed(4)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">현재 샷수</p>
                    <p className="font-semibold text-gray-900">{moldLocationPopup.currentShots?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500 text-xs mb-1">최대 샷수</p>
                    <p className="font-semibold text-gray-900">{moldLocationPopup.maxShots?.toLocaleString() || 100000}</p>
                  </div>
                </div>

                {/* 샷수 진행률 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">샷수 진행률</span>
                    <span className="font-semibold">
                      {((moldLocationPopup.currentShots / moldLocationPopup.maxShots) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${Math.min((moldLocationPopup.currentShots / moldLocationPopup.maxShots) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      navigate(`/molds/specifications/${moldLocationPopup.id}`);
                      setMoldLocationPopup(null);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    상세 보기
                  </button>
                  <button
                    onClick={() => setMoldLocationPopup(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
