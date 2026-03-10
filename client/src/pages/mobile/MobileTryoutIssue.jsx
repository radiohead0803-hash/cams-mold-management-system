import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Camera,
  Save,
  X,
  ChevronRight,
  AlertCircle,
  Wrench,
  Paperclip,
  FileText,
  Image,
  Trash2
} from 'lucide-react';
import api from '../../lib/api';
import useGeoLocation from '../../hooks/useGeoLocation';

const MobileTryoutIssue = () => {
  const { moldId } = useParams();
  const gps = useGeoLocation({ autoStart: true, highAccuracy: true });
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [moldInfo, setMoldInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    tryout_number: 1,
    tryout_date: new Date().toISOString().split('T')[0],
    issue_category: 'appearance',
    issue_title: '',
    issue_description: '',
    issue_location: '',
    severity: 'medium'
  });
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const categories = [
    { value: 'dimension', label: '치수', icon: '📏' },
    { value: 'appearance', label: '외관', icon: '👁️' },
    { value: 'function', label: '기능', icon: '⚙️' },
    { value: 'cycle', label: '사이클', icon: '⏱️' },
    { value: 'quality', label: '품질', icon: '✅' },
    { value: 'other', label: '기타', icon: '📋' }
  ];

  const severities = [
    { value: 'critical', label: '치명', color: 'bg-red-500' },
    { value: 'major', label: '중대', color: 'bg-orange-500' },
    { value: 'medium', label: '보통', color: 'bg-yellow-500' },
    { value: 'minor', label: '경미', color: 'bg-green-500' }
  ];

  const statusColors = {
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    deferred: 'bg-yellow-100 text-yellow-700',
    not_applicable: 'bg-gray-100 text-gray-500'
  };

  const statusLabels = {
    pending: '대기',
    in_progress: '진행중',
    resolved: '해결',
    deferred: '보류',
    not_applicable: '해당없음'
  };

  useEffect(() => {
    fetchData();
  }, [moldId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 금형 정보 조회
      const moldRes = await api.get(`/molds/${moldId}`);
      if (moldRes.data.success) {
        setMoldInfo(moldRes.data.data);
      }

      // T/O 문제점 조회
      const issuesRes = await api.get(`/tryout-issues/mold/${moldId}`);
      if (issuesRes.data.success) {
        setIssues(issuesRes.data.data.issues);
        setStats(issuesRes.data.data.stats);
      }
    } catch (error) {
      console.error('데이터 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (gps.latitude !== null) {
          formData.append('gps_latitude', String(gps.latitude));
          formData.append('gps_longitude', String(gps.longitude));
          if (gps.accuracy !== null) formData.append('gps_accuracy', String(gps.accuracy));
        }
        formData.append('source_page', 'MobileTryoutIssue');

        const response = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.success) {
          const fileType = file.type.startsWith('image/') ? 'image' : 'document';
          setAttachments(prev => [...prev, {
            type: fileType,
            url: response.data.url,
            filename: file.name,
            uploaded_at: new Date().toISOString()
          }]);
        }
      }
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.issue_title.trim()) {
      alert('문제점 제목을 입력해주세요.');
      return;
    }

    try {
      const response = await api.post('/tryout-issues', {
        ...formData,
        mold_id: moldId,
        attachments: attachments
      });

      if (response.data.success) {
        alert('T/O 문제점이 등록되었습니다.');
        setShowForm(false);
        setFormData({
          tryout_number: formData.tryout_number,
          tryout_date: new Date().toISOString().split('T')[0],
          issue_category: 'appearance',
          issue_title: '',
          issue_description: '',
          issue_location: '',
          severity: 'medium'
        });
        setAttachments([]);
        fetchData();
      }
    } catch (error) {
      console.error('등록 오류:', error);
      alert('등록 중 오류가 발생했습니다.');
    }
  };

  const handleImprovement = async (issueId, action) => {
    try {
      const response = await api.post(`/tryout-issues/${issueId}/improvement`, {
        improvement_action: action,
        improvement_status: 'resolved'
      });

      if (response.data.success) {
        alert('개선 조치가 등록되었습니다.');
        fetchData();
        setSelectedIssue(null);
      }
    } catch (error) {
      console.error('개선 등록 오류:', error);
      alert('개선 등록 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white shadow sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                <ArrowLeft size={20} />
              </button>
              <div className="ml-2">
                <h1 className="text-lg font-bold">T/O 문제점 관리</h1>
                {moldInfo && (
                  <p className="text-xs text-gray-500">{moldInfo.mold_name || moldInfo.mold_code}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              <Plus size={16} className="mr-1" />
              등록
            </button>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-gray-900">{stats.total || 0}</div>
            <div className="text-xs text-gray-500">전체</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-yellow-600">{stats.pending || 0}</div>
            <div className="text-xs text-gray-500">대기</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-blue-600">{stats.in_progress || 0}</div>
            <div className="text-xs text-gray-500">진행중</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
            <div className="text-xl font-bold text-green-600">{stats.resolved || 0}</div>
            <div className="text-xs text-gray-500">해결</div>
          </div>
        </div>

        {stats.transfer_pending > 0 && (
          <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center">
            <AlertTriangle size={18} className="text-orange-500 mr-2" />
            <span className="text-sm text-orange-700">
              양산이관 전 확인 필요: {stats.transfer_pending}건
            </span>
          </div>
        )}
      </div>

      {/* 문제점 목록 */}
      <div className="px-4">
        {issues.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">등록된 T/O 문제점이 없습니다.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              문제점 등록하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map(issue => (
              <div 
                key={issue.id} 
                className="bg-white rounded-lg shadow-sm overflow-hidden"
                onClick={() => setSelectedIssue(issue)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                          {issue.issue_code}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[issue.improvement_status]}`}>
                          {statusLabels[issue.improvement_status]}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${
                          severities.find(s => s.value === issue.severity)?.color || 'bg-gray-400'
                        }`}></span>
                      </div>
                      <h3 className="font-medium text-gray-900">{issue.issue_title}</h3>
                      <div className="mt-1 flex items-center text-xs text-gray-500 space-x-3">
                        <span>{categories.find(c => c.value === issue.issue_category)?.icon} {categories.find(c => c.value === issue.issue_category)?.label}</span>
                        <span>T/O {issue.tryout_number}차</span>
                        <span>{issue.tryout_date}</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </div>
                
                {issue.improvement_status === 'pending' && (
                  <div className="px-4 py-2 bg-gray-50 border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const action = prompt('개선 조치 내용을 입력하세요:');
                        if (action) handleImprovement(issue.id, action);
                      }}
                      className="flex items-center text-sm text-blue-600"
                    >
                      <Wrench size={14} className="mr-1" />
                      개선 조치 등록
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 등록 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-3 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">T/O 문제점 등록</h2>
              <button onClick={() => setShowForm(false)} className="p-2">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">T/O 차수</label>
                  <select
                    name="tryout_number"
                    value={formData.tryout_number}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {[1,2,3,4,5].map(n => (
                      <option key={n} value={n}>{n}차</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">T/O 일자</label>
                  <input
                    type="date"
                    name="tryout_date"
                    value={formData.tryout_date}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">문제 카테고리</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, issue_category: cat.value }))}
                      className={`p-3 rounded-lg border text-center ${
                        formData.issue_category === cat.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <span className="text-xl">{cat.icon}</span>
                      <div className="text-xs mt-1">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  문제점 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="issue_title"
                  value={formData.issue_title}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="예: 파팅라인 버 발생"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
                <textarea
                  name="issue_description"
                  value={formData.issue_description}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="문제점에 대한 상세 설명"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">발생 위치</label>
                <input
                  type="text"
                  name="issue_location"
                  value={formData.issue_location}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="예: 좌측 상단 코너"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">심각도</label>
                <div className="grid grid-cols-4 gap-2">
                  {severities.map(sev => (
                    <button
                      key={sev.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, severity: sev.value }))}
                      className={`p-2 rounded-lg border text-center ${
                        formData.severity === sev.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <span className={`inline-block w-3 h-3 rounded-full ${sev.color}`}></span>
                      <div className="text-xs mt-1">{sev.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 첨부파일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Paperclip size={16} className="inline mr-1" />
                  첨부파일 (사진/문서)
                </label>
                
                {/* 업로드 버튼 */}
                <div className="flex space-x-2 mb-3 flex-wrap gap-y-2">
                  <label className="flex-1 min-w-[120px] flex items-center justify-center px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Camera size={20} className="text-blue-500 mr-2" />
                    <span className="text-sm text-blue-600">카메라 촬영</span>
                  </label>
                  <label className="flex-1 min-w-[120px] flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <Image size={20} className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">갤러리 선택</span>
                  </label>
                  <label className="flex-1 min-w-[120px] flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.hwp"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <FileText size={20} className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">문서 추가</span>
                  </label>
                </div>

                {uploading && (
                  <div className="flex items-center justify-center py-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    업로드 중...
                  </div>
                )}

                {/* 첨부파일 목록 */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center flex-1 min-w-0">
                          {file.type === 'image' ? (
                            <Image size={16} className="text-blue-500 mr-2 flex-shrink-0" />
                          ) : (
                            <FileText size={16} className="text-green-500 mr-2 flex-shrink-0" />
                          )}
                          <span className="text-sm text-gray-700 truncate">{file.filename}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center disabled:bg-gray-400"
              >
                <Save size={18} className="mr-2" />
                등록하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 상세 보기 모달 */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-3 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">{selectedIssue.issue_code}</h2>
              <button onClick={() => setSelectedIssue(null)} className="p-2">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <span className={`text-sm px-3 py-1 rounded-full ${statusColors[selectedIssue.improvement_status]}`}>
                  {statusLabels[selectedIssue.improvement_status]}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-semibold">{selectedIssue.issue_title}</h3>
                <div className="mt-1 text-sm text-gray-500">
                  {categories.find(c => c.value === selectedIssue.issue_category)?.icon}{' '}
                  {categories.find(c => c.value === selectedIssue.issue_category)?.label} | 
                  T/O {selectedIssue.tryout_number}차 | {selectedIssue.tryout_date}
                </div>
              </div>

              {selectedIssue.issue_description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">상세 설명</label>
                  <p className="mt-1 text-gray-900">{selectedIssue.issue_description}</p>
                </div>
              )}

              {selectedIssue.issue_location && (
                <div>
                  <label className="text-sm font-medium text-gray-500">발생 위치</label>
                  <p className="mt-1 text-gray-900">{selectedIssue.issue_location}</p>
                </div>
              )}

              {selectedIssue.improvement_action && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <label className="text-sm font-medium text-green-700">개선 조치</label>
                  <p className="mt-1 text-green-900">{selectedIssue.improvement_action}</p>
                  {selectedIssue.improvement_date && (
                    <p className="mt-1 text-xs text-green-600">
                      개선일: {selectedIssue.improvement_date}
                    </p>
                  )}
                </div>
              )}

              {selectedIssue.improvement_status === 'pending' && (
                <button
                  onClick={() => {
                    const action = prompt('개선 조치 내용을 입력하세요:');
                    if (action) handleImprovement(selectedIssue.id, action);
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center"
                >
                  <Wrench size={18} className="mr-2" />
                  개선 조치 등록
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileTryoutIssue;
