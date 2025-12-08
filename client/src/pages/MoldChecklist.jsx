import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, Upload, Save, Send, Image as ImageIcon } from 'lucide-react';
import { moldSpecificationAPI } from '../lib/api';

// 9개 카테고리 체크리스트 정의
const CHECKLIST_CATEGORIES = [
  {
    id: 'material',
    title: 'Ⅰ. 원재료 (Material)',
    items: [
      { id: 1, name: '수축률', type: 'text', linkedField: 'shrinkage_rate' },
      { id: 2, name: '소재 (MS SPEC)', type: 'text', linkedField: 'material' },
      { id: 3, name: '공급 업체', type: 'text' }
    ]
  },
  {
    id: 'mold',
    title: 'Ⅱ. 금형 (Mold)',
    items: [
      { id: 1, name: '금형 발주 품번·품목 아이템 사양 일치', type: 'check', options: ['확인', '미확인'] },
      { id: 2, name: '양산차 조건 제작 사양 반영', type: 'check', options: ['유', '무'] },
      { id: 3, name: '수축률', type: 'text', linkedField: 'shrinkage_rate' },
      { id: 4, name: '금형 중량', type: 'text', linkedField: 'weight', suffix: 'ton' },
      { id: 5, name: '범퍼 히트파팅 적용', type: 'check', options: ['적용', '미적용', '사양 상이'] },
      { id: 6, name: '캐비티 재질', type: 'select', options: ['NAK80', 'S45C', 'SKD61'], linkedField: 'cavity_material' },
      { id: 7, name: '코어 재질', type: 'select', options: ['NAK80', 'S45C', 'SKD61'], linkedField: 'core_material' },
      { id: 8, name: '캐비티 수', type: 'checkbox', options: ['1', '2', '3', '4', '5', '6'], linkedField: 'cavity_count' },
      { id: 9, name: '게이트 형식', type: 'check', options: ['오픈', '밸브'] },
      { id: 10, name: '게이트 수', type: 'checkbox', options: ['1', '2', '3', '4', '5', '6'] },
      { id: 11, name: '게이트 위치 적정성', type: 'check', options: ['반영', '미반영'] },
      { id: 12, name: '게이트 사이즈 확인', type: 'check', options: ['확인', '미확인'] },
      { id: 13, name: '게이트 컷팅 형상 적정성', type: 'check', options: ['캐비티', '오버랩'] },
      { id: 14, name: '이젝핀', type: 'check', options: ['원형', '사각', '취출 불량 여부'] },
      { id: 15, name: '노즐·게이트 금형 각인', type: 'check', options: ['반영', '미반영'] },
      { id: 16, name: '냉각라인 위치·스케일 20mm 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 17, name: '온도센서 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 18, name: '온도센서 수(캐비티/코어)', type: 'text' },
      { id: 19, name: '금형 스페어 리스트 접수(소급부 아이템)', type: 'date', checkOptions: ['반영', '미반영'] },
      { id: 20, name: '금형 인자표 초도 T/O일정 접수', type: 'date', checkOptions: ['반영', '미반영'] },
      { id: 21, name: '금형 정보 접수(사이즈·톤수·캐비티 수·형체력)', type: 'date', checkOptions: ['반영', '미반영'] },
      { id: 22, name: '금형 정보 전산 등록', type: 'date', checkOptions: ['완료', '미완료'] },
      { id: 23, name: '금형 외관 도색 상태', type: 'date', checkOptions: ['양호', '불량'] },
      { id: 24, name: '금형 명판 부착', type: 'date', checkOptions: ['부착', '미부착'] },
      { id: 25, name: '금형 캘린더 및 재질 각인', type: 'date', checkOptions: ['반영', '미반영'] },
      { id: 26, name: '파팅 구조 적정성(찍힘/손상/버 발생 가능)', type: 'check', options: ['양호', '불량'] },
      { id: 27, name: '내구성 확인(측면 습합 등 금형 크랙 여부)', type: 'check', options: ['양호', '불량'] },
      { id: 28, name: '소프트 게이트 적용', type: 'check', options: ['적용', '미적용'] },
      { id: 29, name: '콜드 슬러그 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 30, name: '기타 특이사항 1', type: 'text' },
      { id: 31, name: '기타 특이사항 2', type: 'text' },
      { id: 32, name: '기타 특이사항 3', type: 'text' },
      { id: 33, name: '기타 특이사항 4', type: 'text' },
      { id: 34, name: '기타 특이사항 5', type: 'text' }
    ]
  },
  {
    id: 'gas_vent',
    title: 'Ⅲ. 가스 빼기 (Gas Vent)',
    items: [
      { id: 1, name: '가스 빼기 금형 전반 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 2, name: '가스 빼기 2/100 또는 3/100 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 3, name: '가스 빼기 피치간 거리 30mm 간격 유지', type: 'check', options: ['반영', '미반영'] },
      { id: 4, name: '가스 빼기 폭 7mm 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 5, name: '가스 빼기 위치 적절성', type: 'check', options: ['반영', '미반영'] },
      { id: 6, name: '가스 발생 예상 구간 추가 벤트 여부', type: 'check', options: ['반영', '미반영'] }
    ]
  },
  {
    id: 'moldflow',
    title: 'Ⅳ. 성형 해석 (Moldflow 등)',
    items: [
      { id: 1, name: '중 대물류 및 도금 아이템 성형 해석 실행', type: 'date', checkOptions: ['실행', '미실행'] },
      { id: 2, name: '성형성 확인(미성형 발생부 확인)', type: 'check', options: ['확인', '미확인'] },
      { id: 3, name: '변형발생 구조 확인(제품두께/날반구조 확인)', type: 'check', options: ['반영', '미반영'] },
      { id: 4, name: '웰드라인 위치 확인', type: 'check', options: ['확인', '미확인'] },
      { id: 5, name: '웰드라인 구조 형상 삭제 검토', type: 'check', options: ['반영', '미반영'] },
      { id: 6, name: '가스 발생 부위 확인', type: 'check', options: ['확인', '미확인'] }
    ]
  },
  {
    id: 'sink_mark',
    title: 'Ⅴ. 싱크마크 (Sink Mark)',
    items: [
      { id: 1, name: '전체 리브 0.6t 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 2, name: '싱크 발생 구조(제품 두께 편차)', type: 'check', options: ['반영', '미반영'] },
      { id: 3, name: '예각 부위 구조 확인(제품 살빼기 반영)', type: 'check', options: ['반영', '미반영'] }
    ]
  },
  {
    id: 'ejection',
    title: 'Ⅵ. 취출 (Ejection)',
    items: [
      { id: 1, name: '제품 취출 구조(범퍼 하단 매칭부)', type: 'check', options: ['반영', '미반영'] },
      { id: 2, name: '제품 취출구조(범퍼 밀어치)', type: 'check', options: ['반영', '미반영'] },
      { id: 3, name: '언더컷 구조 확인', type: 'check', options: ['반영', '미반영'] },
      { id: 4, name: '빼기 구배 3~5도', type: 'check', options: ['반영', '미반영'] },
      { id: 5, name: '제품 취출 구조(보스 구배)', type: 'check', options: ['반영', '미반영'] },
      { id: 6, name: '제품 취출 구조(도그하우스 취출)', type: 'check', options: ['반영', '미반영'] },
      { id: 7, name: '제품 취출 언더컷 위치 및 영보 확인', type: 'check', options: ['반영', '미반영'] }
    ]
  },
  {
    id: 'mic',
    title: 'Ⅶ. MIC 제품 (MICA 스펙클 등)',
    items: [
      { id: 1, name: 'MIC 사양 게이트 형상 반영(고객사 제안 게이트)', type: 'check', options: ['반영', '미반영'] },
      { id: 2, name: '성형해석 통한 제품 두께 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 3, name: '웰드라인 확인 및 도장 사양', type: 'check', options: ['반영', '미반영'] },
      { id: 4, name: 'A,B면 외관 플레이크 확인', type: 'check', options: ['반영', '미반영'] }
    ]
  },
  {
    id: 'coating',
    title: 'Ⅷ. 도금 (Coating)',
    items: [
      { id: 1, name: '게이트 위치/개수 최적화(ABS:250mm·PC+ABS:200m)', type: 'check', options: ['반영', '미반영'] },
      { id: 2, name: '수축률', type: 'text', suffix: '/1000' },
      { id: 3, name: '보스 조립부 엣지 1R 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 4, name: '보스 십자리브 R값 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 5, name: '보스 내경(M4=3.6, M5=4.6 등)', type: 'check', options: ['반영', '미반영'] },
      { id: 6, name: '액고임 방지구조', type: 'check', options: ['반영', '미반영'] },
      { id: 7, name: '제품 두께 3.0t', type: 'check', options: ['반영', '미반영'] },
      { id: 8, name: '도금성확보를 위한 제품각도 적절성', type: 'check', options: ['반영', '미반영'] },
      { id: 9, name: '차폐막 형상 도면 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 10, name: '차폐막 컷팅 외곽 미노출', type: 'check', options: ['반영', '미반영'] },
      { id: 11, name: '게이트 컷팅 외곽 미노출', type: 'check', options: ['반영', '미반영'] },
      { id: 12, name: 'TPO와 도금 스크류 조립홀 금형 도면 이원화', type: 'check', options: ['반영', '미반영'] }
    ]
  },
  {
    id: 'rear_back_beam',
    title: 'Ⅸ. 리어 백빔 (Rear Back Beam)',
    items: [
      { id: 1, name: '리어 백빔 금형구배 5도 이상', type: 'check', options: ['반영', '미반영'] },
      { id: 2, name: '리어 백빔 제품 끝단부 두께 5.0t 이상', type: 'check', options: ['반영', '미반영'] },
      { id: 3, name: '후가공 홀 각인 금형 반영', type: 'check', options: ['반영', '미반영'] },
      { id: 4, name: '후가공 홀 판: 탭 타입', type: 'check', options: ['반영', '미반영'] },
      { id: 5, name: '가이드핀 용접부 음각형상', type: 'check', options: ['반영', '미반영'] },
      { id: 6, name: '가이드핀 위치 및 유동', type: 'check', options: ['반영', '미반영'] }
    ]
  }
];

export default function MoldChecklist() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const moldId = searchParams.get('moldId');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [moldInfo, setMoldInfo] = useState(null);
  const [checklistData, setChecklistData] = useState({});
  const [categoryEnabled, setCategoryEnabled] = useState({});
  const [approvalStatus, setApprovalStatus] = useState('draft');
  
  // 통계 - 점검대상 카테고리만 계산
  const [stats, setStats] = useState({ total: 81, completed: 0, progress: 0 });

  // 점검대상 카테고리 변경 시 통계 업데이트
  useEffect(() => {
    updateStats();
  }, [categoryEnabled, checklistData]);

  useEffect(() => {
    initializeChecklist();
    if (moldId) {
      loadMoldData();
    } else {
      setLoading(false);
    }
  }, [moldId]);

  const initializeChecklist = () => {
    const initialData = {};
    const initialEnabled = {};
    
    CHECKLIST_CATEGORIES.forEach(category => {
      initialEnabled[category.id] = true;
      category.items.forEach(item => {
        initialData[`${category.id}_${item.id}`] = {
          value: '',
          checked: false,
          remarks: ''
        };
      });
    });
    
    setChecklistData(initialData);
    setCategoryEnabled(initialEnabled);
  };

  const loadMoldData = async () => {
    try {
      setLoading(true);
      const response = await moldSpecificationAPI.getById(moldId);
      if (response.data?.data) {
        setMoldInfo(response.data.data);
        // 금형 정보와 연동된 필드 자동 채우기
        prefillLinkedFields(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load mold data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prefillLinkedFields = (mold) => {
    const updates = {};
    
    CHECKLIST_CATEGORIES.forEach(category => {
      category.items.forEach(item => {
        if (item.linkedField && mold[item.linkedField]) {
          updates[`${category.id}_${item.id}`] = {
            value: mold[item.linkedField],
            checked: false,
            remarks: ''
          };
        }
      });
    });
    
    setChecklistData(prev => ({ ...prev, ...updates }));
  };

  const handleItemChange = (categoryId, itemId, field, value) => {
    const key = `${categoryId}_${itemId}`;
    setChecklistData(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
    
    // 통계 업데이트
    updateStats();
  };

  const updateStats = () => {
    // 점검대상으로 체크된 카테고리의 항목만 계산
    let total = 0;
    let completed = 0;
    
    CHECKLIST_CATEGORIES.forEach(category => {
      if (categoryEnabled[category.id]) {
        total += category.items.length;
        category.items.forEach(item => {
          const key = `${category.id}_${item.id}`;
          const data = checklistData[key];
          if (data && (data.checked || data.value)) {
            completed++;
          }
        });
      }
    });
    
    setStats({
      total,
      completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // API 호출
      alert('저장되었습니다.');
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setSaving(true);
      setApprovalStatus('pending');
      alert('점검완료 및 승인요청이 제출되었습니다.');
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderInputField = (category, item) => {
    const key = `${category.id}_${item.id}`;
    const data = checklistData[key] || { value: '', checked: false, remarks: '' };

    switch (item.type) {
      case 'text':
        return (
          <div className="space-y-1">
            <input
              type="text"
              value={data.value}
              onChange={(e) => handleItemChange(category.id, item.id, 'value', e.target.value)}
              placeholder={item.linkedField ? '금형정보 연동' : '점검 내용 입력'}
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
          </div>
        );
      
      case 'check':
        return (
          <div className="space-y-1">
            <div className="flex gap-3">
              {item.options?.map(opt => (
                <label key={opt} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={data.value === opt}
                    onChange={() => handleItemChange(category.id, item.id, 'value', data.value === opt ? '' : opt)}
                    className="rounded"
                  />
                  {opt}
                </label>
              ))}
            </div>
            <input
              type="text"
              value={data.remarks}
              onChange={(e) => handleItemChange(category.id, item.id, 'remarks', e.target.value)}
              placeholder="점검 내용 입력"
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
          </div>
        );
      
      case 'select':
        return (
          <div className="space-y-1">
            <select
              value={data.value}
              onChange={(e) => handleItemChange(category.id, item.id, 'value', e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm"
            >
              <option value="">재질 선택</option>
              {item.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <input
              type="text"
              value={data.remarks}
              onChange={(e) => handleItemChange(category.id, item.id, 'remarks', e.target.value)}
              placeholder="점검 내용 입력"
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-1">
            <div className="flex gap-3 flex-wrap">
              {item.options?.map(opt => {
                const valueStr = String(data.value || '');
                const valueArr = valueStr ? valueStr.split(',') : [];
                return (
                  <label key={opt} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={valueArr.includes(opt)}
                      onChange={(e) => {
                        const current = valueStr ? valueStr.split(',').filter(v => v) : [];
                        const updated = e.target.checked 
                          ? [...current, opt]
                          : current.filter(v => v !== opt);
                        handleItemChange(category.id, item.id, 'value', updated.join(','));
                      }}
                      className="rounded"
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
            <input
              type="text"
              value={data.remarks}
              onChange={(e) => handleItemChange(category.id, item.id, 'remarks', e.target.value)}
              placeholder="점검 내용 입력"
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
          </div>
        );
      
      case 'date':
        return (
          <div className="space-y-1">
            <input
              type="date"
              value={data.value}
              onChange={(e) => handleItemChange(category.id, item.id, 'value', e.target.value)}
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
            {item.checkOptions && (
              <div className="flex gap-3">
                {item.checkOptions.map(opt => (
                  <label key={opt} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={data.remarks === opt}
                      onChange={() => handleItemChange(category.id, item.id, 'remarks', data.remarks === opt ? '' : opt)}
                      className="rounded"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">금형 체크리스트</h1>
                <p className="text-sm text-gray-500">
                  {moldInfo?.mold?.mold_code || `M-${moldId}`} - {moldInfo?.part_name || '금형'}
                </p>
              </div>
            </div>
            
            {/* 통계 */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-gray-500">총 점검항목</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">완료</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">진행률</p>
                <p className="text-2xl font-bold text-green-600">{stats.progress}%</p>
              </div>
              
              {approvalStatus === 'pending' && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <Clock size={14} /> 승인대기
                </span>
              )}
              
              <button
                onClick={handleSubmitForApproval}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Send size={16} />
                점검완료 및 승인요청
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
            <h2 className="text-lg font-semibold">금형 체크리스트</h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 좌측: 금형 정보 */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">차종</label>
                    <input
                      type="text"
                      value={moldInfo?.car_model || ''}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div></div>
                  
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">PART NUMBER</label>
                    <input
                      type="text"
                      value={moldInfo?.part_number || ''}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">PART NAME</label>
                    <input
                      type="text"
                      value={moldInfo?.part_name || ''}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">작성일</label>
                    <input
                      type="text"
                      value={new Date().toLocaleDateString('ko-KR')}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">작성자</label>
                    <input
                      type="text"
                      value="점검자"
                      readOnly
                      className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">양산처</label>
                    <input
                      type="text"
                      value={moldInfo?.plantCompany?.company_name || ''}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">제작처</label>
                    <input
                      type="text"
                      value={moldInfo?.makerCompany?.company_name || ''}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">양산 사출기</label>
                    <input
                      type="text"
                      value={moldInfo?.tonnage ? `${moldInfo.tonnage}ton` : '- ton'}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">형체력</label>
                    <input
                      type="text"
                      value={moldInfo?.tonnage ? `${moldInfo.tonnage}ton` : ''}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">EO CUT</label>
                    <input
                      type="text"
                      value={moldInfo?.order_date || ''}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-24 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded">초도 T/O 일정</label>
                    <input
                      type="text"
                      value={moldInfo?.target_delivery_date || ''}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 text-sm bg-gray-50"
                    />
                  </div>
                </div>
              </div>
              
              {/* 우측: 부품 이미지 */}
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50">
                <p className="text-sm text-gray-500 mb-2">부품 그림</p>
                {moldInfo?.part_images?.[0] ? (
                  <img src={moldInfo.part_images[0]} alt="부품" className="max-h-40 object-contain" />
                ) : (
                  <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-sm">제품 이미지</span>
                  </div>
                )}
                <button className="mt-3 px-4 py-2 bg-blue-100 text-blue-700 rounded text-sm flex items-center gap-1 hover:bg-blue-200">
                  <Upload size={14} /> 이미지 업로드
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 체크리스트 카테고리 */}
        {CHECKLIST_CATEGORIES.map((category) => (
          <div key={category.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-900 to-blue-800 text-white px-6 py-3 flex items-center justify-between">
              <h3 className="font-semibold">{category.title}</h3>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={categoryEnabled[category.id]}
                  onChange={(e) => setCategoryEnabled(prev => ({ ...prev, [category.id]: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">점검대상</span>
              </label>
            </div>
            
            {/* 점검대상이 체크된 경우에만 테이블 표시 */}
            {categoryEnabled[category.id] ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-12">No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">점검 항목</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 w-64">규격/사양</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 w-16">확인</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {category.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-blue-600 font-medium">{item.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.linkedField ? (
                              <span className="text-blue-600 underline cursor-pointer">{item.name}</span>
                            ) : (
                              item.name
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {renderInputField(category, item)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={checklistData[`${category.id}_${item.id}`]?.checked || false}
                              onChange={(e) => handleItemChange(category.id, item.id, 'checked', e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* 관련 자료 첨부 */}
                <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
                  <span className="text-sm text-gray-600">관련 자료 첨부</span>
                  <button className="px-4 py-2 bg-gray-700 text-white rounded text-sm flex items-center gap-1 hover:bg-gray-800">
                    <Upload size={14} /> 파일 첨부
                  </button>
                </div>
              </>
            ) : (
              <div className="px-6 py-8 text-center text-gray-400">
                <p className="text-sm">점검대상에서 제외되었습니다.</p>
                <p className="text-xs mt-1">점검대상을 체크하면 항목이 표시됩니다.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
