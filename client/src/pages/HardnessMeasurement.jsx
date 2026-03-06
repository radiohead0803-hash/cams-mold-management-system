import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Camera, Send, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import api, { moldSpecificationAPI, workflowAPI } from '../lib/api';

// 금형 재질별 경도 기준 (min, max 값 포함)
const HARDNESS_STANDARDS = [
  { id: 1, grade: 'S45C', hardness: 'HRC 10 ~ 18', min: 10, max: 18, characteristics: '-' },
  { id: 2, grade: 'HP1A (HP1)', hardness: 'HRC 10 ~ 18', min: 10, max: 18, characteristics: '-' },
  { id: 3, grade: 'HP4A (HP4)', hardness: 'HRC 28 ~ 32', min: 28, max: 32, characteristics: '-' },
  { id: 4, grade: 'HS-PA', hardness: 'HRC 28 ~ 32', min: 28, max: 32, characteristics: '-' },
  { id: 5, grade: 'HP4MA (HP4M)', hardness: 'HRC 31 ~ 34', min: 31, max: 34, characteristics: '-' },
  { id: 6, grade: 'CENA G', hardness: 'HRC 35 ~ 41', min: 35, max: 41, characteristics: '핫스탬핑 부품에 적용' },
  { id: 7, grade: 'NAK-80', hardness: 'HRC 37 ~ 41', min: 37, max: 41, characteristics: '투명 제품 등 고광택을 중시하는 제품에 적용' },
  { id: 8, grade: 'SKD61', hardness: 'HRC 48 ~ 52', min: 48, max: 52, characteristics: '-' },
  { id: 9, grade: 'P20', hardness: 'HRC 28 ~ 32', min: 28, max: 32, characteristics: '-' },
  { id: 10, grade: 'H13', hardness: 'HRC 48 ~ 52', min: 48, max: 52, characteristics: '-' }
];

// 재질 옵션
const MATERIAL_OPTIONS = [
  'S45C', 'HP1A (HP1)', 'HP4A (HP4)', 'HS-PA', 'HP4MA (HP4M)', 
  'CENA G', 'NAK-80', 'SKD61', 'P20', 'H13'
];

export default function HardnessMeasurement() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const moldId = searchParams.get('moldId');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  
  // 금형 재질
  const [cavityMaterial, setCavityMaterial] = useState('');
  const [coreMaterial, setCoreMaterial] = useState('');
  
  // 측정 데이터
  const [cavityMeasurements, setCavityMeasurements] = useState(['', '', '']);
  const [coreMeasurements, setCoreMeasurements] = useState(['', '', '']);
  
  // 이미지
  const [nameplateImage, setNameplateImage] = useState(null);
  const [cavityImage, setCavityImage] = useState(null);
  const [coreImage, setCoreImage] = useState(null);
  
  // 측정 이력
  const [measurementHistory, setMeasurementHistory] = useState([]);
  
  // 승인 관련 상태
  const [approvalStatus, setApprovalStatus] = useState('draft'); // draft, pending, approved, rejected
  const [approvalRequestDate, setApprovalRequestDate] = useState(null);
  const [approver, setApprover] = useState('');
  const [approvalDate, setApprovalDate] = useState(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [showApproverModal, setShowApproverModal] = useState(false);
  const [approverKeyword, setApproverKeyword] = useState('');
  const [approverResults, setApproverResults] = useState([]);
  const [selectedApprover, setSelectedApprover] = useState(null);

  useEffect(() => {
    if (moldId) {
      loadMoldData();
    } else {
      setLoading(false);
    }
  }, [moldId]);

  const loadMoldData = async () => {
    try {
      setLoading(true);
      const response = await moldSpecificationAPI.getById(moldId);
      if (response.data?.data) {
        const data = response.data.data;
        setMoldInfo(data);
        setCavityMaterial(data.cavity_material || '');
        setCoreMaterial(data.core_material || '');
      }
    } catch (error) {
      console.error('Failed to load mold data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 평균값 계산
  const calculateAverage = (measurements) => {
    const validValues = measurements.filter(v => v !== '' && !isNaN(parseFloat(v)));
    if (validValues.length === 0) return null;
    const sum = validValues.reduce((acc, val) => acc + parseFloat(val), 0);
    return (sum / validValues.length).toFixed(1);
  };

  const cavityAverage = calculateAverage(cavityMeasurements);
  const coreAverage = calculateAverage(coreMeasurements);

  // 재질별 경도 기준 가져오기
  const getHardnessStandard = (material) => {
    return HARDNESS_STANDARDS.find(s => s.grade === material);
  };

  // NG 판정 함수
  const checkNG = (material, average) => {
    if (!material || !average) return null;
    const standard = getHardnessStandard(material);
    if (!standard) return null;
    
    const value = parseFloat(average);
    if (value < standard.min) return { status: 'NG', reason: `기준 미달 (최소 ${standard.min} HRC)` };
    if (value > standard.max) return { status: 'NG', reason: `기준 초과 (최대 ${standard.max} HRC)` };
    return { status: 'OK', reason: `기준 범위 내 (${standard.min}~${standard.max} HRC)` };
  };

  const cavityNGResult = checkNG(cavityMaterial, cavityAverage);
  const coreNGResult = checkNG(coreMaterial, coreAverage);

  // 승인 요청
  const handleSearchApprover = async () => {
    if (!approverKeyword.trim()) return;
    try {
      const res = await workflowAPI.searchDevelopers({ name: approverKeyword });
      if (res.data?.success) setApproverResults(res.data.data || []);
    } catch (err) {
      console.error('담당자 검색 실패:', err);
    }
  };

  const handleRequestApproval = async () => {
    if (!cavityAverage && !coreAverage) {
      alert('측정값을 먼저 입력해주세요.');
      return;
    }
    if (!selectedApprover) {
      setShowApproverModal(true);
      return;
    }
    setApprovalStatus('pending');
    setApprovalRequestDate(new Date().toISOString());
    setApprover(selectedApprover.name);
    // 알림 발송
    try {
      await workflowAPI.searchDevelopers({ name: '' }); // warm-up
      await api.post('/workflow/notifications/send', {
        recipient_id: selectedApprover.id,
        notification_type: 'hardness_approval',
        message: `경도측정 승인요청이 등록되었습니다. (금형: ${moldInfo?.part_name || moldId})`
      });
    } catch (e) { console.error('알림 발송 실패:', e); }
    alert(`${selectedApprover.name}님께 승인 요청이 완료되었습니다.`);
  };

  // 승인 처리
  const handleApprove = () => {
    setApprovalStatus('approved');
    setApprovalDate(new Date().toISOString());
    setApprover(selectedApprover?.name || '관리자');
    alert('승인 처리되었습니다.');
  };

  // 반려 처리
  const handleReject = () => {
    const comment = prompt('반려 사유를 입력해주세요:');
    if (comment) {
      setApprovalStatus('rejected');
      setApprovalDate(new Date().toISOString());
      setApprover(selectedApprover?.name || '관리자');
      setApprovalComment(comment);
      alert('반려 처리되었습니다.');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // API 호출하여 저장
      const measurementData = {
        moldId,
        cavityMaterial,
        coreMaterial,
        cavityMeasurements,
        coreMeasurements,
        cavityAverage,
        coreAverage,
        measuredAt: new Date().toISOString(),
        measuredBy: 'admin'
      };
      
      // 이력에 추가
      setMeasurementHistory(prev => [measurementData, ...prev]);
      
      alert('저장되었습니다.');
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (type, event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('mold_id', moldId || '');
      fd.append('inspection_type', 'hardness');
      fd.append('category', type);
      const res = await api.post('/inspection-photos/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data.success ? res.data.data.file_url : URL.createObjectURL(file);
      if (type === 'nameplate') setNameplateImage(url);
      else if (type === 'cavity') setCavityImage(url);
      else if (type === 'core') setCoreImage(url);
    } catch (error) {
      console.error('사진 업로드 실패:', error);
      // 폴백: 로컬 미리보기
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'nameplate') setNameplateImage(reader.result);
        else if (type === 'cavity') setCavityImage(reader.result);
        else if (type === 'core') setCoreImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">경도측정</h1>
                <p className="text-sm text-gray-500">
                  {moldInfo?.mold?.mold_code || `M-${moldId}`} - {moldInfo?.part_name || '금형'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 승인 상태 배지 */}
              {approvalStatus === 'draft' && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm flex items-center gap-1">
                  <Clock size={14} /> 작성중
                </span>
              )}
              {approvalStatus === 'pending' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm flex items-center gap-1">
                  <AlertTriangle size={14} /> 승인대기
                </span>
              )}
              {approvalStatus === 'approved' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                  <CheckCircle size={14} /> 승인완료
                </span>
              )}
              {approvalStatus === 'rejected' && (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-1">
                  <XCircle size={14} /> 반려
                </span>
              )}

              {/* 버튼들 */}
              {approvalStatus === 'draft' && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Save size={16} />
                    저장
                  </button>
                  <button
                    onClick={handleRequestApproval}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Send size={16} />
                    승인요청
                  </button>
                </>
              )}
              {approvalStatus === 'pending' && (
                <>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    승인
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <XCircle size={16} />
                    반려
                  </button>
                </>
              )}
              {(approvalStatus === 'approved' || approvalStatus === 'rejected') && (
                <button
                  onClick={() => setApprovalStatus('draft')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  재작성
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* 승인 정보 */}
        {(approvalStatus !== 'draft') && (
          <div className={`rounded-xl shadow-sm border overflow-hidden ${
            approvalStatus === 'approved' ? 'bg-green-50 border-green-200' :
            approvalStatus === 'rejected' ? 'bg-red-50 border-red-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {approvalStatus === 'pending' && (
                    <>
                      <AlertTriangle className="text-yellow-600" size={24} />
                      <div>
                        <p className="font-semibold text-yellow-800">승인 대기중</p>
                        <p className="text-sm text-yellow-600">
                          요청일시: {approvalRequestDate ? new Date(approvalRequestDate).toLocaleString('ko-KR') : '-'}
                        </p>
                      </div>
                    </>
                  )}
                  {approvalStatus === 'approved' && (
                    <>
                      <CheckCircle className="text-green-600" size={24} />
                      <div>
                        <p className="font-semibold text-green-800">승인 완료</p>
                        <p className="text-sm text-green-600">
                          승인자: {approver} | 승인일시: {approvalDate ? new Date(approvalDate).toLocaleString('ko-KR') : '-'}
                        </p>
                      </div>
                    </>
                  )}
                  {approvalStatus === 'rejected' && (
                    <>
                      <XCircle className="text-red-600" size={24} />
                      <div>
                        <p className="font-semibold text-red-800">반려됨</p>
                        <p className="text-sm text-red-600">
                          반려자: {approver} | 반려일시: {approvalDate ? new Date(approvalDate).toLocaleString('ko-KR') : '-'}
                        </p>
                        {approvalComment && (
                          <p className="text-sm text-red-700 mt-1">사유: {approvalComment}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3">
            <h2 className="font-semibold flex items-center gap-2">
              📋 기본 정보
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">품번</label>
                <input
                  type="text"
                  value={moldInfo?.part_number || '-'}
                  readOnly
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">품명</label>
                <input
                  type="text"
                  value={moldInfo?.part_name || '-'}
                  readOnly
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">MS SPEC</label>
                <input
                  type="text"
                  value={moldInfo?.material || '-'}
                  readOnly
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">금형 타입</label>
                <input
                  type="text"
                  value={moldInfo?.mold_type || '사출금형'}
                  readOnly
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">금형 번호</label>
                <input
                  type="text"
                  value={moldInfo?.mold?.mold_code || `M-${moldId}`}
                  readOnly
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-100 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">금형명</label>
                <input
                  type="text"
                  value={moldInfo?.part_name || '-'}
                  readOnly
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">캐비티 수</label>
                <input
                  type="text"
                  value={moldInfo?.cavity_count ? `${moldInfo.cavity_count}개` : '-'}
                  readOnly
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">적용 톤수</label>
                <input
                  type="text"
                  value={moldInfo?.tonnage ? `${moldInfo.tonnage}톤` : '-'}
                  readOnly
                  className="w-full border rounded px-3 py-2 text-sm bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 금형 재질 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3">
            <h2 className="font-semibold flex items-center gap-2">
              🔧 금형 재질
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50/30">
                <label className="block text-sm font-medium text-blue-700 mb-2">상측 (Cavity)</label>
                <select
                  value={cavityMaterial}
                  onChange={(e) => setCavityMaterial(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">선택하세요</option>
                  {MATERIAL_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              
              <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50/30">
                <label className="block text-sm font-medium text-orange-700 mb-2">하측 (Core)</label>
                <select
                  value={coreMaterial}
                  onChange={(e) => setCoreMaterial(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">선택하세요</option>
                  {MATERIAL_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 금형 재질별 경도 기준 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3">
            <h2 className="font-semibold flex items-center gap-2">
              📊 금형 재질별 경도 기준
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 w-16">No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">강종</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">경도 (HRC, 로크웰)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">특성</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {HARDNESS_STANDARDS.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{String(item.id).padStart(2, '0')}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.grade}</td>
                    <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">{item.hardness}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.characteristics}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 명판 사진 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-3">
            <h2 className="font-semibold flex items-center gap-2">
              🏷️ 명판 사진
            </h2>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-lg h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 mb-4">
                {nameplateImage ? (
                  <img src={nameplateImage} alt="명판" className="max-h-full object-contain" />
                ) : (
                  <span className="text-gray-400">명판 사진을 업로드하세요</span>
                )}
              </div>
              <label className="px-6 py-2 bg-gray-800 text-white rounded-lg cursor-pointer hover:bg-gray-900 flex items-center gap-2">
                <Upload size={16} />
                명판 사진 업로드
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload('nameplate', e)}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* 상측 (Cavity) 측정 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3">
            <h2 className="font-semibold flex items-center gap-2">
              🔵 상측 (Cavity) 측정
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* 금형 사진 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">금형 사진</label>
                <div className="h-48 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center bg-blue-50/30 mb-3">
                  {cavityImage ? (
                    <img src={cavityImage} alt="Cavity" className="max-h-full object-contain" />
                  ) : (
                    <span className="text-blue-400">금형 사진을 업로드하세요</span>
                  )}
                </div>
                <label className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Camera size={16} />
                  사진 업로드
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('cavity', e)}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* 측정값 입력 */}
              <div className="space-y-3">
                {[1, 2, 3].map((num, idx) => (
                  <div key={num}>
                    <label className="block text-sm text-gray-600 mb-1">측정 #{num}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={cavityMeasurements[idx]}
                      onChange={(e) => {
                        const newValues = [...cavityMeasurements];
                        newValues[idx] = e.target.value;
                        setCavityMeasurements(newValues);
                      }}
                      placeholder="HRC 값 입력"
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                ))}
                
                <div className="pt-3 border-t">
                  <label className="block text-sm text-gray-600 mb-1">평균값</label>
                  <div className="text-2xl font-bold text-blue-600">
                    {cavityAverage ? `${cavityAverage} HRC` : '- HRC'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하측 (Core) 측정 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3">
            <h2 className="font-semibold flex items-center gap-2">
              🟠 하측 (Core) 측정
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* 금형 사진 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">금형 사진</label>
                <div className="h-48 border-2 border-dashed border-orange-300 rounded-lg flex items-center justify-center bg-orange-50/30 mb-3">
                  {coreImage ? (
                    <img src={coreImage} alt="Core" className="max-h-full object-contain" />
                  ) : (
                    <span className="text-orange-400">금형 사진을 업로드하세요</span>
                  )}
                </div>
                <label className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg cursor-pointer hover:bg-orange-600 flex items-center justify-center gap-2">
                  <Camera size={16} />
                  사진 업로드
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('core', e)}
                    className="hidden"
                  />
                </label>
              </div>
              
              {/* 측정값 입력 */}
              <div className="space-y-3">
                {[1, 2, 3].map((num, idx) => (
                  <div key={num}>
                    <label className="block text-sm text-gray-600 mb-1">측정 #{num}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={coreMeasurements[idx]}
                      onChange={(e) => {
                        const newValues = [...coreMeasurements];
                        newValues[idx] = e.target.value;
                        setCoreMeasurements(newValues);
                      }}
                      placeholder="HRC 값 입력"
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>
                ))}
                
                <div className="pt-3 border-t">
                  <label className="block text-sm text-gray-600 mb-1">평균값</label>
                  <div className="text-2xl font-bold text-orange-600">
                    {coreAverage ? `${coreAverage} HRC` : '- HRC'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 측정 결과 요약 및 NG 판정 */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-700">
            <h2 className="font-semibold text-white flex items-center gap-2">
              📈 측정 결과 요약 및 NG 판정
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Cavity 결과 */}
              <div className={`rounded-lg p-4 ${
                cavityNGResult?.status === 'NG' ? 'bg-red-900/50 border-2 border-red-500' : 
                cavityNGResult?.status === 'OK' ? 'bg-green-900/50 border-2 border-green-500' : 
                'bg-blue-900/50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-blue-300 text-sm">상측 (Cavity) - {cavityMaterial || '재질 미선택'}</h3>
                  {cavityNGResult && (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      cavityNGResult.status === 'OK' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {cavityNGResult.status}
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-white">
                  {cavityAverage ? `${cavityAverage} HRC` : '- HRC'}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  측정값: {cavityMeasurements.filter(v => v).join(', ') || '-'}
                </p>
                {cavityNGResult && (
                  <p className={`text-xs mt-2 ${cavityNGResult.status === 'OK' ? 'text-green-400' : 'text-red-400'}`}>
                    {cavityNGResult.reason}
                  </p>
                )}
                {cavityMaterial && getHardnessStandard(cavityMaterial) && (
                  <p className="text-xs text-gray-500 mt-1">
                    기준: {getHardnessStandard(cavityMaterial).hardness}
                  </p>
                )}
              </div>
              
              {/* Core 결과 */}
              <div className={`rounded-lg p-4 ${
                coreNGResult?.status === 'NG' ? 'bg-red-900/50 border-2 border-red-500' : 
                coreNGResult?.status === 'OK' ? 'bg-green-900/50 border-2 border-green-500' : 
                'bg-orange-900/50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-orange-300 text-sm">하측 (Core) - {coreMaterial || '재질 미선택'}</h3>
                  {coreNGResult && (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      coreNGResult.status === 'OK' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {coreNGResult.status}
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-white">
                  {coreAverage ? `${coreAverage} HRC` : '- HRC'}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  측정값: {coreMeasurements.filter(v => v).join(', ') || '-'}
                </p>
                {coreNGResult && (
                  <p className={`text-xs mt-2 ${coreNGResult.status === 'OK' ? 'text-green-400' : 'text-red-400'}`}>
                    {coreNGResult.reason}
                  </p>
                )}
                {coreMaterial && getHardnessStandard(coreMaterial) && (
                  <p className="text-xs text-gray-500 mt-1">
                    기준: {getHardnessStandard(coreMaterial).hardness}
                  </p>
                )}
              </div>
            </div>

            {/* 종합 판정 */}
            {(cavityNGResult || coreNGResult) && (
              <div className={`mt-4 p-4 rounded-lg text-center ${
                (cavityNGResult?.status === 'NG' || coreNGResult?.status === 'NG') 
                  ? 'bg-red-600' 
                  : 'bg-green-600'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {(cavityNGResult?.status === 'NG' || coreNGResult?.status === 'NG') ? (
                    <>
                      <XCircle className="text-white" size={24} />
                      <span className="text-xl font-bold text-white">종합 판정: NG</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="text-white" size={24} />
                      <span className="text-xl font-bold text-white">종합 판정: OK</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 측정 이력 */}
        {measurementHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3">
              <h2 className="font-semibold flex items-center gap-2">
                📜 측정 이력
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">측정일시</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Cavity 재질</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Cavity 평균</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Core 재질</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Core 평균</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">측정자</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {measurementHistory.map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(record.measuredAt).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{record.cavityMaterial || '-'}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-blue-600">
                        {record.cavityAverage ? `${record.cavityAverage} HRC` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{record.coreMaterial || '-'}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-orange-600">
                        {record.coreAverage ? `${record.coreAverage} HRC` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{record.measuredBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 승인자 선택 표시 */}
        {selectedApprover && approvalStatus === 'draft' && (
          <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-blue-600" />
              <span className="text-sm text-blue-800">
                승인자: <strong>{selectedApprover.name}</strong> ({selectedApprover.email || ''})
              </span>
            </div>
            <button onClick={() => setSelectedApprover(null)} className="text-blue-400 hover:text-blue-600">
              <XCircle size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 승인자 검색 모달 */}
      {showApproverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[70vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold">승인자(금형개발 담당자) 선택</h3>
              <button onClick={() => setShowApproverModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={18} /></button>
            </div>
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="이름으로 검색"
                  value={approverKeyword}
                  onChange={(e) => setApproverKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchApprover()}
                />
                <button onClick={handleSearchApprover} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">검색</button>
              </div>
              <div className="space-y-2">
                {approverResults.length === 0 && approverKeyword && (
                  <p className="text-xs text-gray-500 text-center py-4">검색 결과가 없습니다.</p>
                )}
                {approverResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedApprover(u);
                      setShowApproverModal(false);
                      setApproverKeyword('');
                      setApproverResults([]);
                    }}
                    className="w-full text-left p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-300 transition"
                  >
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.email} {u.company_name && `| ${u.company_name}`}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
