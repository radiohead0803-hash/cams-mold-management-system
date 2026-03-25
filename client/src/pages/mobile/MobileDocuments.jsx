import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, RefreshCw, FileText, Download, Camera, Plus,
  File, Image, ClipboardList, MoreHorizontal, Search
} from 'lucide-react';
import api from '../../lib/api';

export default function MobileDocuments() {
  const navigate = useNavigate();
  const { moldId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('전체');
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filterTabs = ['전체', '도면', '시방서', '검사성적서', '기타'];

  useEffect(() => {
    loadDocuments();
  }, [moldId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/mold-documents`, { params: { moldId } });
      const data = response.data?.data || response.data || [];
      setDocuments(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      console.error('문서 로드 실패:', err);
      setError('문서를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const handleDownload = (doc) => {
    const fileUrl = doc.file_url || doc.url || doc.file_path;
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  const getTypeLabel = (type) => {
    const types = {
      drawing: '도면',
      specification: '시방서',
      inspection: '검사성적서',
      '도면': '도면',
      '시방서': '시방서',
      '검사성적서': '검사성적서',
    };
    return types[type] || '기타';
  };

  const getTypeBadgeColor = (type) => {
    const label = getTypeLabel(type);
    switch (label) {
      case '도면': return 'bg-blue-100 text-blue-700';
      case '시방서': return 'bg-purple-100 text-purple-700';
      case '검사성적서': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    const label = getTypeLabel(type);
    switch (label) {
      case '도면': return Image;
      case '시방서': return ClipboardList;
      case '검사성적서': return FileText;
      default: return File;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return '-';
    }
  };

  const filteredDocs = documents.filter(doc => {
    const typeLabel = getTypeLabel(doc.document_type || doc.type);
    const matchesFilter = filter === '전체' || typeLabel === filter;
    const matchesSearch = !searchText ||
      (doc.file_name || doc.name || '').toLowerCase().includes(searchText.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">문서 관리</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* 검색 */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="문서명 검색..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filterTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 text-sm mt-3">문서를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <FileText size={48} className="mx-auto text-red-300 mb-3" />
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              다시 시도
            </button>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileText size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">
              {searchText ? '검색 결과가 없습니다.' : '등록된 문서가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 문서 수 */}
            <p className="text-xs text-gray-500 px-1">총 {filteredDocs.length}건</p>

            {filteredDocs.map((doc, index) => {
              const TypeIcon = getTypeIcon(doc.document_type || doc.type);
              const typeLabel = getTypeLabel(doc.document_type || doc.type);

              return (
                <div key={doc.id || index} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <TypeIcon size={24} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {doc.file_name || doc.name || '문서'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(doc.document_type || doc.type)}`}>
                          {typeLabel}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatFileSize(doc.file_size || doc.size)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(doc.created_at || doc.upload_date)}
                        {doc.uploader_name && ` · ${doc.uploader_name}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 플로팅 액션 버튼 */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-20"
        onClick={() => {/* Upload/Camera action placeholder */}}
      >
        <Camera size={24} />
      </button>
    </div>
  );
}
