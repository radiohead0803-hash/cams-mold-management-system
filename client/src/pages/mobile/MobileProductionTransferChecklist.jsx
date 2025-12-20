import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Send, Camera, CheckCircle, Clock, AlertCircle, FileText, 
  Package, Truck, ClipboardList, ChevronDown, ChevronUp, Check, 
  Wifi, WifiOff, Shield, Upload, Image as ImageIcon, X, Save,
  Settings, List, Eye, Trash2
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { moldSpecificationAPI } from '../../lib/api';
import api from '../../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * 모바일 양산이관 체크리스트 페이지
 * - 웹 버전과 동일한 52개 체크리스트 항목
 * - 모바일 최적화 레이아웃
 * - 카메라 촬영/갤러리 선택 지원
 * - 문서 첨부 지원
 */
export default function MobileProductionTransferChecklist() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moldId = searchParams.get('moldId');
  const requestId = searchParams.get('requestId');
  const { user, token } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [checklistItems, setChecklistItems] = useState([]);
  const [checklistResults, setChecklistResults] = useState({});
  const [attachments, setAttachments] = useState({});
  const [online, setOnline] = useState(navigator.onLine);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [currentUploadItemId, setCurrentUploadItemId] = useState(null);
  const [uploadType, setUploadType] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [expandedSections, setExpandedSections] = useState({
    moldInfo: true,
    category1: false,
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

  const categories = [
    { key: '1.금형기본정보', label: '1. 금형 기본 정보 확인', emoji: '📋', color: 'blue' },
    { key: '2.도면문서검증', label: '2. 도면/문서 검증', emoji: '📄', color: 'purple' },
    { key: '3.치수정밀도검사', label: '3. 치수/정밀도 검사', emoji: '📏', color: 'cyan' },
    { key: '4.성형면외관상태', label: '4. 성형면/외관 상태', emoji: '🔍', color: 'orange' },
    { key: '5.성능기능점검', label: '5. 성능·기능 점검', emoji: '⚙️', color: 'green' },
    { key: '6.금형안전성확인', label: '6. 금형 안전성 확인', emoji: '🛡️', color: 'red' },
    { key: '7.시운전결과', label: '7. 시운전(TRY-OUT) 결과', emoji: '🧪', color: 'indigo' },
    { key: '8.금형인계물류', label: '8. 금형 인계 및 물류', emoji: '🚚', color: 'gray' }
  ];

  const progressSteps = [
    { key: 'draft', label: '작성중', color: 'gray' },
    { key: 'pending_plant', label: '생산처', color: 'blue' },
    { key: 'pending_quality', label: '품질팀', color: 'green' },
    { key: 'pending_final', label: '최종', color: 'purple' },
    { key: 'approved', label: '승인', color: 'emerald' },
    { key: 'transferred', label: '완료', color: 'orange' }
  ];

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [moldId, requestId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (moldId) {
        const moldRes = await moldSpecificationAPI.getById(moldId).catch(() => null);
        if (moldRes?.data?.data) {
          setMoldInfo(moldRes.data.data);
        }
      }
      
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

      if (requestId) {
        try {
          const reqRes = await api.get(`/production-transfer/requests/${requestId}`);
          if (reqRes.data.success && reqRes.data.data) {
            const req = reqRes.data.data;
            setFormData(prev => ({
              ...prev,
              transfer_date: req.transfer_date || prev.transfer_date,
              reason: req.reason || '',
              remarks: req.remarks || '',
              status: req.status || 'draft'
            }));
            if (req.checklist_results) {
              setChecklistResults(req.checklist_results);
            }
            if (req.attachments) {
              setAttachments(req.attachments);
            }
          }
        } catch (err) {
          console.error('Failed to load request:', err);
        }
      }
      
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultChecklistItems = () => {
    return [
      { id: 1, category: '1.금형기본정보', item_code: 'B01', item_name: '금형코드 확인', description: '금형코드가 명판 및 시스템과 일치하는지 확인', is_required: true, requires_attachment: false },
      { id: 2, category: '1.금형기본정보', item_code: 'B02', item_name: 'QR코드 부착 확인', description: 'QR코드가 정상 부착되어 있고 스캔 가능한지 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 3, category: '1.금형기본정보', item_code: 'B03', item_name: '금형 명판 상태', description: '금형 명판이 부착되어 있고 정보가 정확한지 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 4, category: '1.금형기본정보', item_code: 'B04', item_name: '금형사양서 확인', description: '금형사양서가 최신 버전인지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 5, category: '1.금형기본정보', item_code: 'B05', item_name: '캐비티 수량 확인', description: '캐비티 수량이 사양서와 일치하는지 확인', is_required: true, requires_attachment: false },
      { id: 6, category: '1.금형기본정보', item_code: 'B06', item_name: '금형 중량 확인', description: '금형 중량이 사양서와 일치하는지 확인', is_required: true, requires_attachment: false },
      { id: 7, category: '2.도면문서검증', item_code: 'D01', item_name: '2D 도면 확인', description: '2D 도면이 최신 버전이고 EO 반영 여부 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 8, category: '2.도면문서검증', item_code: 'D02', item_name: '3D 도면 확인', description: '3D 도면 데이터가 최신 버전인지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 9, category: '2.도면문서검증', item_code: 'D03', item_name: 'EO 반영 확인', description: '최신 EO가 반영되었는지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 10, category: '2.도면문서검증', item_code: 'D04', item_name: '성형조건서 확인', description: '성형조건서가 작성되어 있고 최신 버전인지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 11, category: '2.도면문서검증', item_code: 'D05', item_name: '승인 서명 확인', description: '관련 문서에 승인 서명이 완료되었는지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 12, category: '2.도면문서검증', item_code: 'D06', item_name: '변경이력 확인', description: '금형 변경이력이 정확히 기록되어 있는지 확인', is_required: true, requires_attachment: false },
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
      { id: 23, category: '4.성형면외관상태', item_code: 'A01', item_name: '표면 흠집 확인', description: '성형면에 흠집, 긁힘이 없는지 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 24, category: '4.성형면외관상태', item_code: 'A02', item_name: 'EDM 가공면 상태', description: 'EDM 가공면 품질 상태 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 25, category: '4.성형면외관상태', item_code: 'A03', item_name: '연마면 상태', description: '연마면 광택 및 품질 상태 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 26, category: '4.성형면외관상태', item_code: 'A04', item_name: '오염 상태 확인', description: '성형면 오염, 탄화수지 부착 여부 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 27, category: '4.성형면외관상태', item_code: 'A05', item_name: '냉각채널 청결도', description: '냉각채널 내부 청결 상태 확인', is_required: true, requires_attachment: false },
      { id: 28, category: '4.성형면외관상태', item_code: 'A06', item_name: '러너/게이트 상태', description: '러너 및 게이트 마모 상태 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 29, category: '4.성형면외관상태', item_code: 'A07', item_name: '녹/부식 상태', description: '녹 또는 부식 발생 여부 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 30, category: '4.성형면외관상태', item_code: 'A08', item_name: '텍스처 상태', description: '텍스처(시보) 상태 확인', is_required: false, requires_attachment: true, attachment_type: 'image' },
      { id: 31, category: '5.성능기능점검', item_code: 'F01', item_name: '냉각수 순환 확인', description: '냉각수 순환이 정상인지 확인', is_required: true, requires_attachment: false },
      { id: 32, category: '5.성능기능점검', item_code: 'F02', item_name: '슬라이드 동작 확인', description: '슬라이드 동작이 원활한지 확인', is_required: true, requires_attachment: false },
      { id: 33, category: '5.성능기능점검', item_code: 'F03', item_name: '이젝터 동작 확인', description: '이젝터 동작이 원활한지 확인', is_required: true, requires_attachment: false },
      { id: 34, category: '5.성능기능점검', item_code: 'F04', item_name: '윤활 상태 확인', description: '각 작동부 윤활 상태 확인', is_required: true, requires_attachment: false },
      { id: 35, category: '5.성능기능점검', item_code: 'F05', item_name: '온도 균일성 확인', description: '금형 온도 분포가 균일한지 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 36, category: '5.성능기능점검', item_code: 'F06', item_name: '유압장치 동작', description: '유압장치 동작 및 누유 확인', is_required: true, requires_attachment: false },
      { id: 37, category: '5.성능기능점검', item_code: 'F07', item_name: '히터 동작 확인', description: '히터 단선, 누전 여부 확인', is_required: false, requires_attachment: false },
      { id: 38, category: '5.성능기능점검', item_code: 'F08', item_name: '센서 동작 확인', description: '각종 센서 동작 상태 확인', is_required: true, requires_attachment: false },
      { id: 39, category: '6.금형안전성확인', item_code: 'S01', item_name: '클램프 상태 확인', description: '클램프 볼트 체결 상태 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 40, category: '6.금형안전성확인', item_code: 'S02', item_name: '인양고리 상태', description: '인양고리 상태 및 안전성 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 41, category: '6.금형안전성확인', item_code: 'S03', item_name: '센서 배선 상태', description: '센서 배선 정리 및 손상 여부 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 42, category: '6.금형안전성확인', item_code: 'S04', item_name: '안전커버 상태', description: '안전커버 부착 및 상태 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 43, category: '7.시운전결과', item_code: 'T01', item_name: 'Shot 기록 확인', description: '시운전 Shot 수 및 기록 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 44, category: '7.시운전결과', item_code: 'T02', item_name: '성형조건 기록', description: '최적 성형조건 기록 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 45, category: '7.시운전결과', item_code: 'T03', item_name: 'NG 개선 확인', description: '시운전 중 발생한 NG 개선 여부 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 46, category: '7.시운전결과', item_code: 'T04', item_name: '외관 PASS 확인', description: '제품 외관 품질 PASS 확인', is_required: true, requires_attachment: true, attachment_type: 'image' },
      { id: 47, category: '7.시운전결과', item_code: 'T05', item_name: '치수 PASS 확인', description: '제품 치수 품질 PASS 확인', is_required: true, requires_attachment: true, attachment_type: 'document' },
      { id: 48, category: '7.시운전결과', item_code: 'T06', item_name: '사이클타임 확인', description: '목표 사이클타임 달성 여부 확인', is_required: true, requires_attachment: false },
      { id: 49, category: '7.시운전결과', item_code: 'T07', item_name: '연속 생산성 확인', description: '연속 생산 시 안정성 확인', is_required: true, requires_attachment: false },
      { id: 50, category: '7.시운전결과', item_code: 'T08', item_name: '시운전 보고서', description: '시운전 결과 보고서 첨부', is_required: true, requires_attachment: true, attachment_type: 'document' },
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

  const openAttachmentModal = (itemId, type) => {
    setCurrentUploadItemId(itemId);
    setUploadType(type);
    setShowAttachmentModal(true);
  };

  const handleCameraCapture = () => {
    setShowAttachmentModal(false);
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleGallerySelect = () => {
    setShowAttachmentModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };

  const handleDocumentSelect = () => {
    setShowAttachmentModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadItemId) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('item_id', currentUploadItemId);
      formData.append('mold_id', moldId);
      formData.append('request_id', requestId || '');
      formData.append('upload_type', uploadType || 'image');

      const response = await api.post('/production-transfer/attachments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const attachment = response.data.data;
        setAttachments(prev => ({
          ...prev,
          [currentUploadItemId]: [...(prev[currentUploadItemId] || []), attachment]
        }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      const reader = new FileReader();
      reader.onload = (e) => {
        const localAttachment = {
          id: Date.now(),
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          preview_url: e.target.result,
          is_local: true
        };
        setAttachments(prev => ({
          ...prev,
          [currentUploadItemId]: [...(prev[currentUploadItemId] || []), localAttachment]
        }));
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
    setCurrentUploadItemId(null);
    setUploadType(null);
  };

  const removeAttachment = (itemId, attachmentId) => {
    setAttachments(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || []).filter(a => a.id !== attachmentId)
    }));
  };

  const handleSubmit = async (status = 'pending_plant') => {
    try {
      setSaving(true);
      const data = {
        mold_id: parseInt(moldId),
        mold_spec_id: parseInt(moldId),
        status,
        checklist_results: checklistResults,
        attachments,
        ...formData
      };
      
      const endpoint = requestId 
        ? `/production-transfer/requests/${requestId}`
        : '/production-transfer/requests';
      
      const response = requestId
        ? await api.put(endpoint, data)
        : await api.post(endpoint, data);
      
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
    const requiredItems = checklistItems.filter(i => i.is_required);
    const total = requiredItems.length;
    if (total === 0) return 0;
    const completed = requiredItems.filter(i => checklistResults[i.id]?.result).length;
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

  const getCurrentStepIndex = () => {
    const statusMap = { draft: 0, pending_plant: 1, pending_quality: 2, pending_final: 3, approved: 4, transferred: 5 };
    return statusMap[formData.status] || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Truck size={20} />
                <h1 className="text-lg font-bold">양산이관 체크리스트</h1>
              </div>
              <p className="text-xs text-purple-200">
                {moldInfo?.part_number || moldInfo?.mold_code || 'P-XXXX'} - {moldInfo?.part_name || moldInfo?.mold_name || '금형명'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {online ? <Wifi size={16} className="text-green-300" /> : <WifiOff size={16} className="text-red-300" />}
          </div>
        </div>
      </div>

      {/* 진행 상태 */}
      <div className="bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">진행 상태</span>
          <span className="text-xs text-purple-600 font-medium">완료율: {getCompletionRate()}%</span>
        </div>
        <div className="flex items-center gap-1">
          {progressSteps.map((step, index) => {
            const currentIdx = getCurrentStepIndex();
            const isActive = index === currentIdx;
            const isCompleted = index < currentIdx;
            return (
              <React.Fragment key={step.key}>
                <div className={`flex-1 h-2 rounded-full ${
                  isCompleted ? 'bg-green-500' : isActive ? 'bg-purple-500' : 'bg-gray-200'
                }`} />
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          {progressSteps.map((step, index) => {
            const currentIdx = getCurrentStepIndex();
            const isActive = index === currentIdx;
            return (
              <span key={step.key} className={`text-[9px] ${isActive ? 'text-purple-600 font-medium' : 'text-gray-400'}`}>
                {step.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* 금형 기본 정보 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('moldInfo')}
            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50"
          >
            <div className="flex items-center gap-2">
              <Package className="text-blue-600" size={18} />
              <span className="font-semibold text-gray-800 text-sm">금형 기본 정보</span>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">자동연동</span>
            </div>
            {expandedSections.moldInfo ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {expandedSections.moldInfo && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-500">금형코드</p>
                  <p className="text-xs font-medium">{moldInfo?.mold_code || '-'}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-500">금형명</p>
                  <p className="text-xs font-medium">{moldInfo?.mold_name || '-'}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-500">품번</p>
                  <p className="text-xs font-medium">{moldInfo?.part_number || '-'}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-500">품명</p>
                  <p className="text-xs font-medium">{moldInfo?.part_name || '-'}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-500">차종</p>
                  <p className="text-xs font-medium">{moldInfo?.car_model || '-'}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-[10px] text-gray-500">캐비티</p>
                  <p className="text-xs font-medium">{moldInfo?.cavity_count || '-'}</p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-100">
                <h4 className="text-xs font-medium text-gray-700 mb-2">이관 정보</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">이관 예정일</label>
                    <input
                      type="date"
                      value={formData.transfer_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, transfer_date: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">이관 사유</label>
                    <input
                      type="text"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="이관 사유를 입력하세요"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
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
            <div key={cat.key} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection(sectionKey)}
                className={`w-full px-4 py-3 flex items-center justify-between ${
                  cat.color === 'blue' ? 'bg-gradient-to-r from-blue-50 to-indigo-50' :
                  cat.color === 'purple' ? 'bg-gradient-to-r from-purple-50 to-violet-50' :
                  cat.color === 'cyan' ? 'bg-gradient-to-r from-cyan-50 to-teal-50' :
                  cat.color === 'orange' ? 'bg-gradient-to-r from-orange-50 to-amber-50' :
                  cat.color === 'green' ? 'bg-gradient-to-r from-green-50 to-emerald-50' :
                  cat.color === 'red' ? 'bg-gradient-to-r from-red-50 to-rose-50' :
                  cat.color === 'indigo' ? 'bg-gradient-to-r from-indigo-50 to-purple-50' :
                  'bg-gradient-to-r from-gray-50 to-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{cat.emoji}</span>
                  <span className="font-semibold text-gray-800 text-sm">{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    stats.percent === 100 ? 'bg-green-100 text-green-700' :
                    stats.percent > 0 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {stats.checked}/{stats.total}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {stats.percent === 100 && <CheckCircle size={16} className="text-green-500" />}
                  {expandedSections[sectionKey] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>
              
              {expandedSections[sectionKey] && (
                <div className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const result = checklistResults[item.id] || {};
                    const itemAttachments = attachments[item.id] || [];
                    
                    return (
                      <div key={item.id} className="p-4">
                        {/* 항목 정보 */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded">{item.item_code}</span>
                              <span className="font-medium text-gray-800 text-sm">{item.item_name}</span>
                              {item.is_required && (
                                <span className="text-[9px] px-1 py-0.5 bg-red-100 text-red-600 rounded">필수</span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500">{item.description}</p>
                          </div>
                        </div>
                        
                        {/* 점검 결과 버튼 */}
                        <div className="flex gap-1.5 mb-2">
                          <button
                            onClick={() => handleChecklistChange(item.id, 'result', 'pass')}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                              result.result === 'pass'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            ✓ 적합
                          </button>
                          <button
                            onClick={() => handleChecklistChange(item.id, 'result', 'fail')}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                              result.result === 'fail'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            ✗ 부적합
                          </button>
                          <button
                            onClick={() => handleChecklistChange(item.id, 'result', 'na')}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${
                              result.result === 'na'
                                ? 'bg-gray-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            N/A
                          </button>
                        </div>
                        
                        {/* 첨부파일 영역 */}
                        {item.requires_attachment && (
                          <div className="mt-2">
                            <div className="flex items-center gap-2 mb-2">
                              <button
                                onClick={() => openAttachmentModal(item.id, item.attachment_type)}
                                className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
                                  item.attachment_type === 'image'
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                    : 'bg-green-50 text-green-600 border border-green-200'
                                }`}
                              >
                                {item.attachment_type === 'image' ? (
                                  <>
                                    <Camera size={14} />
                                    사진 첨부
                                  </>
                                ) : (
                                  <>
                                    <FileText size={14} />
                                    문서 첨부
                                  </>
                                )}
                              </button>
                            </div>
                            
                            {/* 첨부된 파일 목록 */}
                            {itemAttachments.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {itemAttachments.map((att) => (
                                  <div key={att.id} className="relative">
                                    {att.file_type?.startsWith('image') ? (
                                      <div className="relative">
                                        <img
                                          src={att.preview_url || att.file_url}
                                          alt={att.file_name}
                                          className="w-16 h-16 object-cover rounded-lg border"
                                          onClick={() => setPreviewImage(att.preview_url || att.file_url)}
                                        />
                                        <button
                                          onClick={() => removeAttachment(item.id, att.id)}
                                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="relative flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                                        <FileText size={14} className="text-gray-600" />
                                        <span className="text-[10px] text-gray-700 max-w-[80px] truncate">{att.file_name}</span>
                                        <button
                                          onClick={() => removeAttachment(item.id, att.id)}
                                          className="ml-1 text-red-500"
                                        >
                                          <X size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* 부적합 사유 입력 */}
                        {result.result === 'fail' && (
                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="부적합 사유를 입력하세요"
                              value={result.remarks || ''}
                              onChange={(e) => handleChecklistChange(item.id, 'remarks', e.target.value)}
                              className="w-full border border-red-200 rounded-lg px-3 py-2 text-xs bg-red-50"
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

        {/* 비고 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-2">비고</h3>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
            placeholder="추가 사항이 있으면 입력하세요"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* 통계 요약 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
            <List size={16} />
            체크리스트 요약
          </h3>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{checklistItems.length}</div>
              <div className="text-[10px] text-gray-600">전체</div>
            </div>
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <div className="text-lg font-bold text-red-600">
                {checklistItems.filter(i => i.is_required).length}
              </div>
              <div className="text-[10px] text-gray-600">필수</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {Object.values(checklistResults).filter(r => r?.result === 'pass').length}
              </div>
              <div className="text-[10px] text-gray-600">적합</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {Object.values(checklistResults).filter(r => r?.result === 'fail').length}
              </div>
              <div className="text-[10px] text-gray-600">부적합</div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-2 z-40">
        <button
          onClick={() => handleSubmit('draft')}
          disabled={saving}
          className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save size={18} />
          임시저장
        </button>
        <button
          onClick={() => handleSubmit('pending_plant')}
          disabled={saving}
          className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send size={18} />
          {saving ? '저장 중...' : '제출'}
        </button>
      </div>

      {/* 첨부파일 선택 모달 */}
      {showAttachmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowAttachmentModal(false)}>
          <div className="bg-white w-full rounded-t-2xl p-4 pb-8" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-4">첨부파일 선택</h3>
            <div className="space-y-2">
              {uploadType === 'image' && (
                <>
                  <button
                    onClick={handleCameraCapture}
                    className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <Camera size={20} />
                    카메라로 촬영
                  </button>
                  <button
                    onClick={handleGallerySelect}
                    className="w-full py-3 bg-purple-50 text-purple-600 rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <ImageIcon size={20} />
                    갤러리에서 선택
                  </button>
                </>
              )}
              {uploadType === 'document' && (
                <button
                  onClick={handleDocumentSelect}
                  className="w-full py-3 bg-green-50 text-green-600 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <FileText size={20} />
                  문서 파일 선택
                </button>
              )}
              <button
                onClick={() => setShowAttachmentModal(false)}
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 미리보기 모달 */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setPreviewImage(null)}>
            <X size={28} />
          </button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}
