import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, CheckCircle, Shield,
  Save, Send, ChevronRight, ChevronDown, Info, Ruler, Thermometer
} from 'lucide-react';
import api from '../../lib/api';

/**
 * QR 세션 기반 정기 점검 페이지
 * /qr/periodic-inspection/:sessionId
 */
export default function PeriodicInspectionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [mold, setMold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkItems, setCheckItems] = useState([]);
  const [results, setResults] = useState({});
  const [measurements, setMeasurements] = useState({});
  const [remarks, setRemarks] = useState('');
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // 세션 데이터 로드
  useEffect(() => {
    const loadSessionData = async () => {
      setLoading(true);
      setError(null);
      try {
        const sessionRes = await api.get(`/qr/sessions/${sessionId}`);
        const sessionData = sessionRes.data.data || sessionRes.data;
        setSession(sessionData);

        const moldId = sessionData.mold_id;
        if (moldId) {
          const moldRes = await api.get(`/mold-specifications/${moldId}`);
          setMold(moldRes.data.data || moldRes.data);
        }

        const checklistRes = await api.get('/checklist-master', {
          params: { type: 'periodic', mold_id: moldId }
        });
        const items = checklistRes.data.data || checklistRes.data || [];
        setCheckItems(Array.isArray(items) ? items : []);
        if (items.length > 0) {
          setExpandedCategory(items[0]?.id || 0);
        }
      } catch (err) {
        console.error('[PeriodicInspection] Load error:', err);
        setError(err.response?.data?.message || '세션 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) loadSessionData();
  }, [sessionId]);

  const handleResultChange = (itemId, value) => {
    setResults(prev => ({ ...prev, [itemId]: value }));
  };

  const handleMeasurementChange = (itemId, value) => {
    setMeasurements(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await api.post('/inspections/periodic/save', {
        session_id: sessionId,
        mold_id: mold?.id,
        results,
        measurements,
        remarks,
        status: 'draft'
      });
      alert('임시 저장되었습니다.');
    } catch (err) {
      console.error('[PeriodicInspection] Save error:', err);
      alert('저장에 실패했습니다: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('정기 점검을 제출하시겠습니까? 제출 후 수정이 불가합니다.')) return;

    setSubmitting(true);
    try {
      await api.post('/inspections/periodic/submit', {
        session_id: sessionId,
        mold_id: mold?.id,
        results,
        measurements,
        remarks,
        status: 'submitted'
      });
      setSubmitted(true);
    } catch (err) {
      console.error('[PeriodicInspection] Submit error:', err);
      alert('제출에 실패했습니다: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
          <p className="text-gray-600">정기 점검 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-800">오류 발생</h2>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-md w-full text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">정기 점검 완료</h2>
          <p className="text-gray-600">정기 점검이 성공적으로 제출되었습니다.</p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate('/qr/scan')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              QR 스캔으로
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              뒤로 가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            정기 점검
          </h1>
          <p className="text-xs text-gray-500">세션: {sessionId}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {/* 금형 정보 */}
        {mold && (
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <Info className="w-4 h-4" /> 금형 정보
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400">금형코드</span><p className="font-medium">{mold.mold_code || '-'}</p></div>
              <div><span className="text-gray-400">품명</span><p className="font-medium">{mold.part_name || '-'}</p></div>
              <div><span className="text-gray-400">품번</span><p className="font-medium">{mold.part_number || '-'}</p></div>
              <div><span className="text-gray-400">숏수</span><p className="font-medium">{mold.current_shot_count?.toLocaleString() || '0'}</p></div>
            </div>
          </div>
        )}

        {/* 점검 항목 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-orange-50">
            <h2 className="font-semibold text-orange-800">정기 점검 항목</h2>
          </div>

          {checkItems.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>등록된 정기 점검 항목이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y">
              {checkItems.map((category, catIdx) => (
                <div key={category.id || catIdx}>
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === (category.id || catIdx) ? null : (category.id || catIdx))}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <span className="font-medium text-gray-700">
                      {category.icon || ''} {category.name || `카테고리 ${catIdx + 1}`}
                    </span>
                    {expandedCategory === (category.id || catIdx)
                      ? <ChevronDown className="w-4 h-4 text-gray-400" />
                      : <ChevronRight className="w-4 h-4 text-gray-400" />
                    }
                  </button>

                  {expandedCategory === (category.id || catIdx) && (
                    <div className="px-4 pb-3 space-y-2">
                      {(category.items || []).map(item => (
                        <div key={item.id} className="p-2 bg-gray-50 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">
                                {item.name}
                                {item.required && <span className="text-red-500 ml-1">*</span>}
                              </p>
                              {item.description && (
                                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-3">
                              <button
                                onClick={() => handleResultChange(item.id, 'ok')}
                                className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                                  results[item.id] === 'ok'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-500 hover:bg-green-100'
                                }`}
                              >
                                양호
                              </button>
                              <button
                                onClick={() => handleResultChange(item.id, 'ng')}
                                className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                                  results[item.id] === 'ng'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-200 text-gray-500 hover:bg-red-100'
                                }`}
                              >
                                불량
                              </button>
                              <button
                                onClick={() => handleResultChange(item.id, 'na')}
                                className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                                  results[item.id] === 'na'
                                    ? 'bg-gray-500 text-white'
                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                }`}
                              >
                                N/A
                              </button>
                            </div>
                          </div>

                          {/* 측정값 입력 (정기 점검에만) */}
                          {(item.fieldType === 'number' || item.fieldType === 'measurement') && (
                            <div className="flex items-center gap-2 pl-1">
                              <Ruler className="w-3 h-3 text-gray-400" />
                              <input
                                type="number"
                                step="0.01"
                                value={measurements[item.id] || ''}
                                onChange={(e) => handleMeasurementChange(item.id, e.target.value)}
                                placeholder="측정값 입력"
                                className="w-32 px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-orange-500 outline-none"
                              />
                              <span className="text-xs text-gray-400">{item.unit || ''}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 비고 */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">비고</h3>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="특이사항을 입력해주세요..."
            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
            rows={3}
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={handleSave}
            disabled={submitting}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            임시 저장
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            제출
          </button>
        </div>
      </div>
    </div>
  );
}
