import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, Upload, Download, Trash2, Eye, Plus, Filter } from 'lucide-react'
import { format } from 'date-fns'
import api from '../lib/api'

export default function MoldDocuments() {
  const { id } = useParams()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ document_type: '', document_name: '', version: '1.0' })
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    loadDocuments()
  }, [id])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/files', { params: { entity_type: 'mold_document', entity_id: id } })
      if (res.data.success) {
        setDocuments(res.data.data || [])
      }
    } catch (error) {
      console.error('문서 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const documentTypes = {
    all: { label: '전체', icon: FileText, color: 'text-gray-600' },
    drawing: { label: '도면', icon: FileText, color: 'text-blue-600' },
    specification: { label: '사양서', icon: FileText, color: 'text-green-600' },
    manual: { label: '매뉴얼', icon: FileText, color: 'text-purple-600' },
    report: { label: '보고서', icon: FileText, color: 'text-orange-600' },
    certificate: { label: '인증서', icon: FileText, color: 'text-red-600' }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileType) => {
    // 실제로는 파일 타입별 아이콘 사용
    return FileText
  }

  const filteredDocuments = filter === 'all' 
    ? documents 
    : documents.filter(doc => doc.document_type === filter)

  const handleDownload = (doc) => {
    const url = doc.file_url || doc.url
    if (url) {
      window.open(url.startsWith('http') ? url : `${api.defaults.baseURL}${url}`, '_blank')
    } else {
      alert('다운로드 URL이 없습니다.')
    }
  }

  const handleDelete = async (docId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await api.delete(`/files/${docId}`)
      setDocuments(documents.filter(d => d.id !== docId))
    } catch (error) {
      console.error('문서 삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    }
  }

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', selectedFile)
      fd.append('entity_type', 'mold_document')
      fd.append('entity_id', id)
      fd.append('description', uploadForm.document_name || selectedFile.name)
      fd.append('category', uploadForm.document_type || 'document')
      const res = await api.post('/files/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.success) {
        setUploadModalOpen(false)
        setSelectedFile(null)
        setUploadForm({ document_type: '', document_name: '', version: '1.0' })
        loadDocuments()
      }
    } catch (error) {
      console.error('문서 업로드 실패:', error)
      alert('업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">금형 문서 관리</h1>
          <p className="text-sm text-gray-600 mt-1">
            도면, 사양서, 매뉴얼 등 금형 관련 문서
          </p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload size={20} />
          문서 업로드
        </button>
      </div>

      {/* 필터 */}
      <div className="card mb-6">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(documentTypes).map(([key, { label, icon: Icon, color }]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon size={16} className={filter === key ? 'text-white' : color} />
              {label}
              <span className="ml-1 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                {key === 'all' ? documents.length : documents.filter(d => d.document_type === key).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 문서 목록 */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-500">문서가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const Icon = getFileIcon(doc.file_type)
            const typeInfo = documentTypes[doc.document_type]
            
            return (
              <div key={doc.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-3 rounded-lg bg-gray-100 ${typeInfo.color}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {doc.document_name}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {typeInfo.label} • v{doc.version}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">파일 크기</span>
                    <span className="font-medium">{formatFileSize(doc.file_size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">업로드</span>
                    <span className="font-medium">{doc.uploaded_by}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">날짜</span>
                    <span className="font-medium">
                      {format(new Date(doc.created_at), 'yyyy-MM-dd')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1"
                  >
                    <Download size={16} />
                    다운로드
                  </button>
                  <button
                    className="px-3 btn-secondary text-sm"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="px-3 btn-secondary text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 업로드 모달 */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">문서 업로드</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문서 유형
                </label>
                <select className="input">
                  <option value="">선택하세요</option>
                  <option value="drawing">도면</option>
                  <option value="specification">사양서</option>
                  <option value="manual">매뉴얼</option>
                  <option value="report">보고서</option>
                  <option value="certificate">인증서</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문서 이름
                </label>
                <input type="text" className="input" placeholder="문서 이름 입력" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  버전
                </label>
                <input type="text" className="input" placeholder="1.0" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  파일 선택
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 cursor-pointer"
                >
                  <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                  {selectedFile ? (
                    <p className="text-sm text-primary-600 font-medium">{selectedFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">
                        클릭하여 파일 선택 또는 드래그 앤 드롭
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PDF, DWG, XLSX, DOCX (최대 10MB)
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.dwg,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="flex-1 btn-secondary"
              >
                취소
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={uploading || !selectedFile}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {uploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
