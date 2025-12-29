import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  QrCode, ArrowLeft, Search, Download, Printer, 
  Package, RefreshCw, CheckCircle, Filter, Eye
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';

// QR 코드 생성 함수
const generateQRCode = (moldCode) => {
  const checksum = moldCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0).toString(16).slice(-4).toUpperCase();
  return `CAMS-MOLD-[${moldCode}]-[${checksum}]`;
};

// QR 코드 카드 컴포넌트
const QRCodeCard = ({ mold, onPrint, onView }) => {
  const qrValue = generateQRCode(mold.mold_code || `M-${mold.id}`);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="bg-white p-2 border border-gray-200 rounded-lg">
          <QRCodeSVG 
            value={qrValue} 
            size={80} 
            level="M"
            includeMargin={false}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">{mold.mold_code || `M-${mold.id}`}</h4>
          <p className="text-sm text-gray-600 truncate">{mold.part_name || '-'}</p>
          <p className="text-xs text-gray-500">{mold.part_number || '-'}</p>
          <p className="text-xs text-gray-400 mt-1">{mold.car_model || '-'}</p>
          <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
            mold.status === 'production' ? 'bg-green-100 text-green-700' :
            mold.status === 'development' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {mold.status === 'production' ? '양산' : 
             mold.status === 'development' ? '개발' : 
             mold.status === 'draft' ? '임시저장' : mold.status || '-'}
          </span>
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onView(mold)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye size={14} /> 상세
        </button>
        <button
          onClick={() => onPrint(mold)}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Printer size={14} /> 출력
        </button>
      </div>
    </div>
  );
};

// QR 코드 출력 모달
const PrintModal = ({ mold, onClose }) => {
  const printRef = useRef();
  const qrValue = generateQRCode(mold.mold_code || `M-${mold.id}`);

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR 코드 출력 - ${mold.mold_code}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .qr-container { text-align: center; page-break-inside: avoid; }
            .qr-code { margin: 20px auto; }
            .mold-info { margin-top: 10px; }
            .mold-code { font-size: 18px; font-weight: bold; }
            .part-info { font-size: 14px; color: #666; }
            @media print {
              body { padding: 0; }
              .qr-container { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">QR 코드 출력</h3>
        
        <div ref={printRef} className="qr-container bg-gray-50 p-6 rounded-xl">
          <div className="qr-code flex justify-center">
            <QRCodeSVG 
              value={qrValue} 
              size={200} 
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="mold-info mt-4">
            <p className="mold-code text-xl font-bold text-gray-900">{mold.mold_code || `M-${mold.id}`}</p>
            <p className="part-info text-gray-600">{mold.part_name || '-'}</p>
            <p className="part-info text-gray-500">{mold.part_number || '-'}</p>
            <p className="text-xs text-gray-400 mt-2">{qrValue}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer size={16} /> 출력하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MoldQRCode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const moldId = searchParams.get('moldId');
  
  const [molds, setMolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [carModelFilter, setCarModelFilter] = useState('all');
  const [printMold, setPrintMold] = useState(null);
  const [selectedMolds, setSelectedMolds] = useState([]);

  useEffect(() => {
    loadMolds();
  }, []);

  const loadMolds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mold-specifications', { params: { limit: 200 } });
      const items = response.data?.data?.items || [];
      setMolds(items);
    } catch (error) {
      console.error('Failed to load molds:', error);
    } finally {
      setLoading(false);
    }
  };

  // 차종 목록 추출
  const carModels = ['all', ...new Set(molds.map(m => m.car_model).filter(Boolean))];

  // 필터링된 금형 목록
  const filteredMolds = molds.filter(m => {
    const matchesSearch = searchTerm === '' || 
      (m.mold?.mold_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.part_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.part_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesCarModel = carModelFilter === 'all' || m.car_model === carModelFilter;
    return matchesSearch && matchesStatus && matchesCarModel;
  });

  const handleSelectAll = () => {
    if (selectedMolds.length === filteredMolds.length) {
      setSelectedMolds([]);
    } else {
      setSelectedMolds(filteredMolds.map(m => m.id));
    }
  };

  const handleSelectMold = (moldId) => {
    if (selectedMolds.includes(moldId)) {
      setSelectedMolds(selectedMolds.filter(id => id !== moldId));
    } else {
      setSelectedMolds([...selectedMolds, moldId]);
    }
  };

  const handleBulkPrint = () => {
    const selectedMoldData = molds.filter(m => selectedMolds.includes(m.id));
    if (selectedMoldData.length === 0) return;

    const printWindow = window.open('', '_blank');
    const qrCards = selectedMoldData.map(mold => {
      const qrValue = generateQRCode(mold.mold?.mold_code || `M-${mold.id}`);
      return `
        <div class="qr-card">
          <div class="qr-code">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrValue)}" alt="QR Code" />
          </div>
          <div class="mold-info">
            <p class="mold-code">${mold.mold?.mold_code || `M-${mold.id}`}</p>
            <p class="part-name">${mold.part_name || '-'}</p>
            <p class="part-number">${mold.part_number || '-'}</p>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>QR 코드 일괄 출력</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .qr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            .qr-card { text-align: center; border: 1px solid #ddd; padding: 15px; page-break-inside: avoid; }
            .qr-code img { width: 120px; height: 120px; }
            .mold-code { font-size: 14px; font-weight: bold; margin-top: 10px; }
            .part-name { font-size: 12px; color: #666; }
            .part-number { font-size: 11px; color: #999; }
            @media print {
              .qr-grid { grid-template-columns: repeat(3, 1fr); }
            }
          </style>
        </head>
        <body>
          <h2>QR 코드 일괄 출력 (${selectedMoldData.length}건)</h2>
          <div class="qr-grid">${qrCards}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="text-blue-600" size={24} />
              QR 코드 조회 및 출력
            </h1>
            <p className="text-sm text-gray-500 mt-1">금형별 QR 코드를 조회하고 출력합니다 ({filteredMolds.length}건)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadMolds}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="새로고침"
          >
            <RefreshCw size={18} className="text-gray-600" />
          </button>
          {selectedMolds.length > 0 && (
            <button
              onClick={handleBulkPrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer size={16} />
              선택 출력 ({selectedMolds.length})
            </button>
          )}
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="금형코드, 품번, 품명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={carModelFilter}
              onChange={(e) => setCarModelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">전체 차종</option>
              {carModels.filter(c => c !== 'all').map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">전체 상태</option>
              <option value="draft">임시저장</option>
              <option value="development">개발</option>
              <option value="production">양산</option>
            </select>
            <button
              onClick={handleSelectAll}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMolds.length === filteredMolds.length && filteredMolds.length > 0
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {selectedMolds.length === filteredMolds.length && filteredMolds.length > 0 ? '전체 해제' : '전체 선택'}
            </button>
          </div>
        </div>
      </div>

      {/* QR 코드 그리드 */}
      {filteredMolds.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <QrCode className="mx-auto text-gray-300" size={48} />
          <p className="mt-4 text-gray-500">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMolds.map(mold => (
            <div key={mold.id} className="relative">
              <input
                type="checkbox"
                checked={selectedMolds.includes(mold.id)}
                onChange={() => handleSelectMold(mold.id)}
                className="absolute top-3 left-3 z-10 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <QRCodeCard
                mold={{
                  ...mold,
                  mold_code: mold.mold?.mold_code || `M-${mold.id}`
                }}
                onPrint={(m) => setPrintMold(m)}
                onView={(m) => navigate(`/molds/${m.id}`)}
              />
            </div>
          ))}
        </div>
      )}

      {/* 출력 모달 */}
      {printMold && (
        <PrintModal 
          mold={printMold} 
          onClose={() => setPrintMold(null)} 
        />
      )}
    </div>
  );
}
