/**
 * 모바일 금형 QR코드 조회/생성 페이지
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, QrCode, Download, Share2, X, Package, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

export default function MobileMoldQRCode() {
  const navigate = useNavigate();
  const [molds, setMolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMold, setSelectedMold] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMolds();
  }, []);

  const fetchMolds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/molds');
      if (response.data.success) {
        setMolds(response.data.data || []);
      }
    } catch (err) {
      console.error('금형 목록 조회 오류:', err);
      setError('금형 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMolds = molds.filter(mold => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      mold.mold_number?.toLowerCase().includes(term) ||
      mold.mold_name?.toLowerCase().includes(term) ||
      mold.part_name?.toLowerCase().includes(term)
    );
  });

  const generateQRData = (mold) => {
    return `MOLD:${mold.mold_number}|NAME:${mold.mold_name || mold.part_name || ''}|ID:${mold.id}`;
  };

  const generateQRSvg = (data) => {
    // Simple QR placeholder SVG - in production, use a QR library
    const size = 200;
    const cellSize = 8;
    const cells = Math.floor(size / cellSize);
    let rects = '';

    // Generate a deterministic pattern based on data string
    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
        const charCode = data.charCodeAt((row * cells + col) % data.length);
        const isEdge = row < 3 || col < 3 || row >= cells - 3 || col >= cells - 3;
        const isFinder = (row < 7 && col < 7) || (row < 7 && col >= cells - 7) || (row >= cells - 7 && col < 7);

        if (isFinder) {
          const inBorder = row === 0 || col === 0 || row === 6 || col === 6 ||
                          row === cells - 1 || col === cells - 1 || row === cells - 7 || col === cells - 7 ||
                          (row >= 2 && row <= 4 && col >= 2 && col <= 4) ||
                          (row >= 2 && row <= 4 && col >= cells - 5 && col <= cells - 3) ||
                          (row >= cells - 5 && row <= cells - 3 && col >= 2 && col <= 4);
          if (inBorder) {
            rects += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
          }
        } else if ((charCode + row * 7 + col * 13) % 3 !== 0) {
          rects += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="white"/>${rects}</svg>`;
  };

  const handleCardTap = (mold) => {
    setSelectedMold(mold);
    setShowModal(true);
  };

  const handleDownload = () => {
    if (!selectedMold) return;
    const qrData = generateQRData(selectedMold);
    const svgContent = generateQRSvg(qrData);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${selectedMold.mold_number || 'mold'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!selectedMold) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `금형 QR코드 - ${selectedMold.mold_number}`,
          text: generateQRData(selectedMold),
        });
      } catch (err) {
        console.log('공유 취소:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(generateQRData(selectedMold));
        alert('QR 데이터가 클립보드에 복사되었습니다.');
      } catch (err) {
        console.error('복사 실패:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">금형 QR코드</h1>
          </div>
          <button onClick={fetchMolds} className="p-2">
            <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="금형번호 또는 금형명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={fetchMolds}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
            >
              다시 시도
            </button>
          </div>
        ) : filteredMolds.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 금형이 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-2">총 {filteredMolds.length}개 금형</p>
            {filteredMolds.map((mold) => {
              const qrData = generateQRData(mold);
              return (
                <div
                  key={mold.id}
                  className="bg-white rounded-xl shadow-sm p-4 active:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleCardTap(mold)}
                >
                  <div className="flex items-center gap-4">
                    {/* QR Preview */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: generateQRSvg(qrData).replace(/width="\d+"/, 'width="56"').replace(/height="\d+"/, 'height="56"'),
                        }}
                      />
                    </div>

                    {/* Mold Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {mold.mold_number || '-'}
                      </p>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {mold.mold_name || mold.part_name || '-'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          mold.status === 'active' ? 'bg-green-100 text-green-700' :
                          mold.status === 'repair' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {mold.status === 'active' ? '가동중' :
                           mold.status === 'repair' ? '수리중' :
                           mold.status === 'maintenance' ? '정비중' : '비가동'}
                        </span>
                      </div>
                    </div>

                    {/* QR Icon */}
                    <QrCode className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showModal && selectedMold && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">QR코드</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mold Info */}
            <div className="text-center mb-4">
              <p className="font-bold text-lg">{selectedMold.mold_number}</p>
              <p className="text-sm text-gray-500">{selectedMold.mold_name || selectedMold.part_name || '-'}</p>
            </div>

            {/* QR Code Large */}
            <div className="flex justify-center mb-6 p-4 bg-white border-2 border-gray-100 rounded-xl">
              <div
                dangerouslySetInnerHTML={{
                  __html: generateQRSvg(generateQRData(selectedMold)),
                }}
              />
            </div>

            {/* QR Data */}
            <p className="text-xs text-gray-400 text-center mb-4 break-all">
              {generateQRData(selectedMold)}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-medium active:bg-blue-600"
              >
                <Download className="w-4 h-4" />
                다운로드
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium active:bg-gray-200"
              >
                <Share2 className="w-4 h-4" />
                공유
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
