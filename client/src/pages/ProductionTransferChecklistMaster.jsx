import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Send, CheckCircle, Clock, AlertCircle, FileText, 
  Building2, User, Calendar, Package, Truck, ClipboardList,
  ChevronDown, ChevronUp, Check, Image as ImageIcon, Shield,
  Camera, Upload, Save, Edit2, Plus, Settings, List, X
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api, { moldSpecificationAPI } from '../lib/api';

/**
 * 양산이관 체크리스트 마스터 페이지
 * TransferRequest 스타일의 업무플로 기반 레이아웃
 */
export default function ProductionTransferChecklistMaster() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moldId = searchParams.get('moldId');
  const { user, token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistResults, setChecklistResults] = useState({});
  const [transferRequest, setTransferRequest] = useState(null);
  
  const [expandedSections, setExpandedSections] = useState({
    moldInfo: true,
    category1: true,
    category2: false,
    category3: false,
    category4: false,
    category5: false,
    category6: false,
    category7: false,
    category8: false
  });
  
  const [formData, setFormData] = useState({
    transfer_date: new Date().toISOString().split('T')[0],
    reason: '',
    remarks: '',
    status: 'draft'
  });

  const isDeveloper = ['mold_developer', 'system_admin'].includes(user?.user_type);

  const categories = [
    { key: '1.금형기본정보', label: '1. 금형 기본 정보 확인', icon: Package, color: 'blue', emoji: '📋' },
    { key: '2.도면문서검증', label: '2. 도면/문서 검증', icon: FileText, color: 'purple', emoji: '📄' },
    { key: '3.치수정밀도검사', label: '3. 치수/정밀도 검사', icon: Settings, color: 'cyan', emoji: '📏' },
    { key: '4.성형면외관상태', label: '4. 성형면/외관 상태', icon: ImageIcon, color: 'orange', emoji: '🔍' },
    { key: '5.성능기능점검', label: '5. 성능·기능 점검', icon: Settings, color: 'green', emoji: '⚙️' },
    { key: '6.금형안전성확인', label: '6. 금형 안전성 확인', icon: Shield, color: 'red', emoji: '🛡️' },
    { key: '7.시운전결과', label: '7. 시운전(TRY-OUT) 결과', icon: ClipboardList, color: 'indigo', emoji: '🧪' },
    { key: '8.금형인계물류', label: '8. 금형 인계 및 물류', icon: Truck, color: 'gray', emoji: '🚚' }
  ];

  const progressSteps = [
    { key: 'draft', label: '작성중', icon: Edit2, color: 'gray' },
    { key: 'pending_plant', label: '생산처 승인', icon: Building2, color: 'blue' },
    { key: 'pending_quality', label: '품질팀 승인', icon: CheckCircle, color: 'green' },
    { key: 'pending_final', label: '최종 승인', icon: Shield, color: 'purple' },
    { key: 'approved', label: '승인완료', icon: Check, color: 'emerald' },
    { key: 'transferred', label: '이관완료', icon: Truck, color: 'orange' }
  ];

  useEffect(() => {
    loadData();
  }, [moldId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 금형 정보 로드
      if (moldId) {
        const moldRes = await moldSpecificationAPI.getById(moldId).catch(() => null);
        if (moldRes?.data?.data) {
          setMoldInfo(moldRes.data.data);
        }
      }
      
      // 체크리스트 마스터 항목 로드
      try {
        const response = await api.get('/production-transfer/checklist-master');
        if (response.data.success && response.data.data?.items) {
          setChecklistItems(response.data.data.items);
        } else {
          setChecklistItems(getDefaultChecklistItems());
        }
      } catch {
        setChecklistItems(getDefaultChecklistItems());
      }
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultChecklistItems = () => {
    return [
      // 1. 금형기본정보
      { id: 1, category: '1.금형기본정보', item_code: 'B01', item_name: '금형코드 확인', description: '금형코드가 명판 및 시스템과 일치하는지 확인', is_required: true, requires_attachment: false },
      { id: 2, category: '1.금형기본정보', item_code: 'B02', item_name: 'QR코드 부착 확인', description: 'QR코드가 정상 부착되어 있고 스캔 가능한지 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 3, category: '1.금형기본정보', item_code: 'B03', item_name: '금형 명판 상태', description: '금형 명판이 부착되어 있고 정보가 정확한지 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 4, category: '1.금형기본정보', item_code: 'B04', item_name: '금형사양서 확인', description: '금형사양서가 최신 버전인지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 5, category: '1.금형기본정보', item_code: 'B05', item_name: '캐비티 수량 확인', description: '캐비티 수량이 사양서와 일치하는지 확인', is_required: true, requires_attachment: false },
      { id: 6, category: '1.금형기본정보', item_code: 'B06', item_name: '금형 중량 확인', description: '금형 중량이 사양서와 일치하는지 확인', is_required: true, requires_attachment: false },
      // 2. 도면문서검증
      { id: 7, category: '2.도면문서검증', item_code: 'D01', item_name: '2D 도면 확인', description: '2D 도면이 최신 버전이고 EO 반영 여부 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 8, category: '2.도면문서검증', item_code: 'D02', item_name: '3D 도면 확인', description: '3D 도면 데이터가 최신 버전인지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 9, category: '2.도면문서검증', item_code: 'D03', item_name: 'EO 반영 확인', description: '최신 EO가 반영되었는지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 10, category: '2.도면문서검증', item_code: 'D04', item_name: '성형조건서 확인', description: '성형조건서가 작성되어 있고 최신 버전인지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 11, category: '2.도면문서검증', item_code: 'D05', item_name: '승인 서명 확인', description: '관련 문서에 승인 서명이 완료되었는지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 12, category: '2.도면문서검증', item_code: 'D06', item_name: '변경이력 확인', description: '금형 변경이력이 정확히 기록되어 있는지 확인', is_required: true, requires_attachment: false },
      // 3. 치수정밀도검사
      { id: 13, category: '3.치수정밀도검사', item_code: 'M01', item_name: '주요 치수 측정', description: '주요 치수가 도면 공차 내에 있는지 측정', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 14, category: '3.치수정밀도검사', item_code: 'M02', item_name: '공차 적합성 확인', description: '모든 치수가 허용 공차 범위 내인지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 15, category: '3.치수정밀도검사', item_code: 'M03', item_name: '파팅라인 상태', description: '파팅라인 단차 및 버 상태 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 16, category: '3.치수정밀도검사', item_code: 'M04', item_name: '가스벤트 상태', description: '가스벤트 깊이 및 위치가 적정한지 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 17, category: '3.치수정밀도검사', item_code: 'M05', item_name: '코어/캐비티 정밀도', description: '코어와 캐비티 정밀도가 규격 내인지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 18, category: '3.치수정밀도검사', item_code: 'M06', item_name: '슬라이드 정밀도', description: '슬라이드 동작 정밀도 확인', is_required: true, requires_attachment: false },
      { id: 19, category: '3.치수정밀도검사', item_code: 'M07', item_name: '이젝터 핀 정밀도', description: '이젝터 핀 위치 및 동작 정밀도 확인', is_required: true, requires_attachment: false },
      { id: 20, category: '3.치수정밀도검사', item_code: 'M08', item_name: '냉각채널 정밀도', description: '냉각채널 위치 및 직경 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 21, category: '3.치수정밀도검사', item_code: 'M09', item_name: '게이트 치수 확인', description: '게이트 치수가 설계값과 일치하는지 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 22, category: '3.치수정밀도검사', item_code: 'M10', item_name: '3차원 측정 결과', description: '3차원 측정기 측정 결과 첨부', is_required: true, requires_attachment: true, attachment_type: 'document' },
      // 4. 성형면외관상태
      { id: 23, category: '4.성형면외관상태', item_code: 'A01', item_name: '표면 흠집 확인', description: '성형면에 흠집, 긁힘이 없는지 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 24, category: '4.성형면외관상태', item_code: 'A02', item_name: 'EDM 가공면 상태', description: 'EDM 가공면 품질 상태 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 25, category: '4.성형면외관상태', item_code: 'A03', item_name: '연마면 상태', description: '연마면 광택 및 품질 상태 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 26, category: '4.성형면외관상태', item_code: 'A04', item_name: '오염 상태 확인', description: '성형면 오염, 탄화수지 부착 여부 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 27, category: '4.성형면외관상태', item_code: 'A05', item_name: '냉각채널 청결도', description: '냉각채널 내부 청결 상태 확인', is_required: true, requires_attachment: false },
      { id: 28, category: '4.성형면외관상태', item_code: 'A06', item_name: '러너/게이트 상태', description: '러너 및 게이트 마모 상태 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 29, category: '4.성형면외관상태', item_code: 'A07', item_name: '녹/부식 상태', description: '녹 또는 부식 발생 여부 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 30, category: '4.성형면외관상태', item_code: 'A08', item_name: '텍스처 상태', description: '텍스처(시보) 상태 확인', is_required: false, requires_attachment: true, attachment_type: 'image' },
      // 5. 성능기능점검
      { id: 31, category: '5.성능기능점검', item_code: 'F01', item_name: '냉각수 순환 확인', description: '냉각수 순환이 정상인지 확인', is_required: true, requires_attachment: false },
      { id: 32, category: '5.성능기능점검', item_code: 'F02', item_name: '슬라이드 동작 확인', description: '슬라이드 동작이 원활한지 확인', is_required: true, requires_attachment: false },
      { id: 33, category: '5.성능기능점검', item_code: 'F03', item_name: '이젝터 동작 확인', description: '이젝터 동작이 원활한지 확인', is_required: true, requires_attachment: false },
      { id: 34, category: '5.성능기능점검', item_code: 'F04', item_name: '윤활 상태 확인', description: '각 작동부 윤활 상태 확인', is_required: true, requires_attachment: false },
      { id: 35, category: '5.성능기능점검', item_code: 'F05', item_name: '온도 균일성 확인', description: '금형 온도 분포가 균일한지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 36, category: '5.성능기능점검', item_code: 'F06', item_name: '유압장치 동작', description: '유압장치 동작 및 누유 확인', is_required: true, requires_attachment: false },
      { id: 37, category: '5.성능기능점검', item_code: 'F07', item_name: '히터 동작 확인', description: '히터 단선, 누전 여부 확인', is_required: false, requires_attachment: false },
      { id: 38, category: '5.성능기능점검', item_code: 'F08', item_name: '센서 동작 확인', description: '각종 센서 동작 상태 확인', is_required: true, requires_attachment: false },
      // 6. 금형안전성확인
      { id: 39, category: '6.금형안전성확인', item_code: 'S01', item_name: '클램프 상태 확인', description: '클램프 볼트 체결 상태 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 40, category: '6.금형안전성확인', item_code: 'S02', item_name: '인양고리 상태', description: '인양고리 상태 및 안전성 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 41, category: '6.금형안전성확인', item_code: 'S03', item_name: '센서 배선 상태', description: '센서 배선 정리 및 손상 여부 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 42, category: '6.금형안전성확인', item_code: 'S04', item_name: '안전커버 상태', description: '안전커버 부착 및 상태 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      // 7. 시운전결과
      { id: 43, category: '7.시운전결과', item_code: 'T01', item_name: 'Shot 기록 확인', description: '시운전 Shot 수 및 기록 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 44, category: '7.시운전결과', item_code: 'T02', item_name: '성형조건 기록', description: '최적 성형조건 기록 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 45, category: '7.시운전결과', item_code: 'T03', item_name: 'NG 개선 확인', description: '시운전 중 발생한 NG 개선 여부 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 46, category: '7.시운전결과', item_code: 'T04', item_name: '외관 PASS 확인', description: '제품 외관 품질 PASS 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 47, category: '7.시운전결과', item_code: 'T05', item_name: '치수 PASS 확인', description: '제품 치수 품질 PASS 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 48, category: '7.시운전결과', item_code: 'T06', item_name: '사이클타임 확인', description: '목표 사이클타임 달성 여부 확인', is_required: true, requires_attachment: false },
      { id: 49, category: '7.시운전결과', item_code: 'T07', item_name: '연속 생산성 확인', description: '연속 생산 시 안정성 확인', is_required: true, requires_attachment: false },
      { id: 50, category: '7.시운전결과', item_code: 'T08', item_name: '시운전 보고서', description: '시운전 결과 보고서 첨부', is_required: true, requires_attachment: true, attachment_type: 'document' },
      // 8. 금형인계물류
      { id: 51, category: '8.금형인계물류', item_code: 'L01', item_name: '세척/방청 처리', description: '금형 세척 및 방청 처리 완료 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 52, category: '8.금형인계물류', item_code: 'L02', item_name: '포장 상태 확인', description: '금형 포장 상태 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 53, category: '8.금형인계물류', item_code: 'L03', item_name: 'GPS 위치 기록', description: 'GPS 위치 정보 기록 확인', is_required: true, requires_attachment: false },
      { id: 54, category: '8.금형인계물류', item_code: 'L04', item_name: 'QR 스캔 기록', description: 'QR 스캔을 통한 이관 기록 확인', is_required: true, requires_attachment: false },
      { id: 55, category: '8.금형인계물류', item_code: 'L05', item_name: '인수자 서명', description: '인수자 서명 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 56, category: '8.금형인계물류', item_code: 'L06', item_name: '인계자 서명', description: '인계자 서명 확인', is_required: true, requires_attachment: true, attachment_type: 'image' }
    ];
  };

  const handleChecklistChange = (itemId, field, value) => {
    setChecklistResults(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = async (status = 'pending_plant') => {
    try {
      setSaving(true);
      const data = {
        mold_id: parseInt(moldId),
        mold_spec_id: parseInt(moldId),
        status,
        checklist_results: checklistResults,
        ...formData
      };
      
      const response = await api.post('/production-transfer/requests', data);
      if (response.data.success) {
        alert(status === 'draft' ? '임시저장 되었습니다.' : '양산이관 신청이 제출되었습니다.');
        if (status !== 'draft') {
          navigate(-1);
        }
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const getCompletionRate = () => {
    const total = checklistItems.filter(i => i.is_required).length;
    if (total === 0) return 0;
    const completed = Object.values(checklistResults).filter(r => r?.result === 'pass' || r?.result === 'fail').length;
    return Math.round((completed / total) * 100);
  };

  const groupedItems = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const getCategoryStats = (categoryKey) => {
    const items = groupedItems[categoryKey] || [];
    const total = items.length;
    const checked = items.filter(i => checklistResults[i.id]?.result).length;
    return { total, checked, percent: total > 0 ? Math.round((checked / total) * 100) : 0 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">양산이관 체크리스트</h1>
                <p className="text-sm text-slate-500">
                  {moldInfo ? `${moldInfo.part_number || moldInfo.mold_code} - ${moldInfo.part_name || moldInfo.mold_name}` : '금형 선택 필요'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSubmit('draft')}
                disabled={saving}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} />
                임시저장
              </button>
              <button
                onClick={() => handleSubmit('pending_plant')}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={16} />
                {saving ? '저장 중...' : '제출'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* 진행 상태 바 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">진행 상태</h3>
            <span className="text-sm text-slate-500">완료율: {getCompletionRate()}%</span>
          </div>
          <div className="flex items-center gap-2">
            {progressSteps.map((step, idx) => (
              <React.Fragment key={step.key}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  idx === 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  <step.icon size={16} />
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {idx < progressSteps.length - 1 && (
                  <div className="w-8 h-0.5 bg-slate-200"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 금형 기본 정보 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleSection('moldInfo')}
            className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200"
          >
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-slate-800">금형 기본 정보</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">자동연동</span>
            </div>
            {expandedSections.moldInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {expandedSections.moldInfo && (
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">금형코드</label>
                  <p className="text-sm font-medium text-slate-800">{moldInfo?.mold_code || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">금형명</label>
                  <p className="text-sm font-medium text-slate-800">{moldInfo?.mold_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">품번</label>
                  <p className="text-sm font-medium text-slate-800">{moldInfo?.part_number || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">품명</label>
                  <p className="text-sm font-medium text-slate-800">{moldInfo?.part_name || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">차종</label>
                  <p className="text-sm font-medium text-slate-800">{moldInfo?.car_model || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">캐비티</label>
                  <p className="text-sm font-medium text-slate-800">{moldInfo?.cavity_count || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">재질</label>
                  <p className="text-sm font-medium text-slate-800">{moldInfo?.material || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">중량</label>
                  <p className="text-sm font-medium text-slate-800">{moldInfo?.mold_weight ? `${moldInfo.mold_weight} kg` : '-'}</p>
                </div>
              </div>
              
              {/* 이관 정보 입력 */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="font-medium text-slate-800 mb-4">이관 정보</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">이관 예정일</label>
                    <input
                      type="date"
                      value={formData.transfer_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, transfer_date: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">이관 사유</label>
                    <input
                      type="text"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="이관 사유를 입력하세요"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 체크리스트 카테고리별 섹션 */}
        {categories.map((cat, catIdx) => {
          const sectionKey = `category${catIdx + 1}`;
          const items = groupedItems[cat.key] || [];
          const stats = getCategoryStats(cat.key);
          
          return (
            <div key={cat.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection(sectionKey)}
                className={`w-full px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-gradient-to-r ${
                  cat.color === 'blue' ? 'from-blue-50 to-indigo-50' :
                  cat.color === 'purple' ? 'from-purple-50 to-violet-50' :
                  cat.color === 'cyan' ? 'from-cyan-50 to-teal-50' :
                  cat.color === 'orange' ? 'from-orange-50 to-amber-50' :
                  cat.color === 'green' ? 'from-green-50 to-emerald-50' :
                  cat.color === 'red' ? 'from-red-50 to-rose-50' :
                  cat.color === 'indigo' ? 'from-indigo-50 to-purple-50' :
                  'from-slate-50 to-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="font-semibold text-slate-800">{cat.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    stats.percent === 100 ? 'bg-green-100 text-green-700' :
                    stats.percent > 0 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {stats.checked}/{stats.total}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {stats.percent === 100 && <CheckCircle size={18} className="text-green-500" />}
                  {expandedSections[sectionKey] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>
              
              {expandedSections[sectionKey] && (
                <div className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const result = checklistResults[item.id] || {};
                    return (
                      <div key={item.id} className="px-6 py-4 hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{item.item_code}</span>
                              <span className="font-medium text-slate-800">{item.item_name}</span>
                              {item.is_required && (
                                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">필수</span>
                              )}
                              {item.requires_attachment && (
                                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded flex items-center gap-1">
                                  {item.attachment_type === 'image' ? <Camera size={10} /> : <FileText size={10} />}
                                  {item.attachment_type === 'image' ? '사진' : '문서'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">{item.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* 점검 결과 버튼 */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleChecklistChange(item.id, 'result', 'pass')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                  result.result === 'pass'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-green-100'
                                }`}
                              >
                                적합
                              </button>
                              <button
                                onClick={() => handleChecklistChange(item.id, 'result', 'fail')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                  result.result === 'fail'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-red-100'
                                }`}
                              >
                                부적합
                              </button>
                              <button
                                onClick={() => handleChecklistChange(item.id, 'result', 'na')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                  result.result === 'na'
                                    ? 'bg-slate-500 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                N/A
                              </button>
                            </div>
                            
                            {/* 첨부파일 버튼 */}
                            {item.requires_attachment && (
                              <button className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
                                <Upload size={16} className="text-slate-600" />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* 비고 입력 */}
                        {result.result === 'fail' && (
                          <div className="mt-3">
                            <input
                              type="text"
                              placeholder="부적합 사유를 입력하세요"
                              value={result.remarks || ''}
                              onChange={(e) => handleChecklistChange(item.id, 'remarks', e.target.value)}
                              className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm bg-red-50"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 통계 요약 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <List size={20} />
            체크리스트 요약
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{checklistItems.length}</div>
              <div className="text-sm text-slate-600">전체 항목</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {checklistItems.filter(i => i.is_required).length}
              </div>
              <div className="text-sm text-slate-600">필수 항목</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(checklistResults).filter(r => r?.result === 'pass').length}
              </div>
              <div className="text-sm text-slate-600">적합</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Object.values(checklistResults).filter(r => r?.result === 'fail').length}
              </div>
              <div className="text-sm text-slate-600">부적합</div>
            </div>
          </div>
        </div>

        {/* 비고 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">비고</h3>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
            placeholder="추가 사항이 있으면 입력하세요"
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
          />
        </div>
      </main>
    </div>
  );
}
