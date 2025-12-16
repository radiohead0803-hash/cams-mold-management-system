/**
 * 이관 Step UI 컴포넌트
 * - 단계별 진행 UI
 * - GPS 정확도 표시
 * - 사진 필수 검증
 * - 체크리스트 기반 승인
 */
import { useState, useEffect } from 'react';
import { 
  Check, Circle, ChevronRight, Camera, MapPin, 
  FileCheck, AlertTriangle, Upload, X, CheckCircle,
  Loader2
} from 'lucide-react';
import { GPSStatus } from './MobileLayout';
import { compressImage, uploadWithProgress, createPreviewUrl, revokePreviewUrl } from '../../utils/imageUtils';

// 이관 단계 정의
const TRANSFER_STEPS = [
  { id: 1, name: '반출 준비', description: 'GPS 위치 확인 및 사진 촬영' },
  { id: 2, name: '체크리스트', description: '반출 전 체크리스트 확인' },
  { id: 3, name: '반출 확인', description: '반출 담당자 서명' },
  { id: 4, name: '이동 중', description: '운송 중 상태' },
  { id: 5, name: '입고 확인', description: '입고 담당자 확인 및 사진' }
];

// Step Indicator
export function StepIndicator({ currentStep, steps = TRANSFER_STEPS }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.id < currentStep 
                  ? 'bg-green-500 text-white' 
                  : step.id === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {step.id < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              <span className={`text-xs mt-1 text-center max-w-[60px] ${
                step.id === currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                {step.name}
              </span>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${
                step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// GPS 위치 확인 단계
export function GPSConfirmStep({ onConfirm, onSkip }) {
  const [gpsData, setGpsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getGPSLocation();
  }, []);

  const getGPSLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('GPS를 지원하지 않는 기기입니다.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLoading(false);
      },
      (err) => {
        setError(`위치 정보를 가져올 수 없습니다: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-500" />
        GPS 위치 확인
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">위치 확인 중...</span>
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={getGPSLocation}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
            >
              다시 시도
            </button>
            <button
              onClick={onSkip}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
            >
              건너뛰기
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">위치 정확도</span>
              <GPSStatus accuracy={gpsData.accuracy} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">위도:</span>
                <span className="ml-1 font-mono">{gpsData.latitude.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-500">경도:</span>
                <span className="ml-1 font-mono">{gpsData.longitude.toFixed(6)}</span>
              </div>
            </div>
          </div>

          {gpsData.accuracy > 50 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm text-orange-700">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              GPS 정확도가 낮습니다. 실외에서 다시 시도해주세요.
            </div>
          )}

          <button
            onClick={() => onConfirm(gpsData)}
            disabled={gpsData.accuracy > 100}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300"
          >
            위치 확인 완료
          </button>
        </div>
      )}
    </div>
  );
}

// 사진 촬영 단계
export function PhotoCaptureStep({ 
  title = '사진 촬영',
  description = '금형 상태 사진을 촬영해주세요',
  required = true,
  minPhotos = 1,
  maxPhotos = 5,
  onComplete 
}) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleCapture = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPhotos = [];
    for (const file of files) {
      if (photos.length + newPhotos.length >= maxPhotos) break;

      try {
        // 이미지 압축
        const compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8
        });

        newPhotos.push({
          id: Date.now() + Math.random(),
          file: compressed,
          preview: createPreviewUrl(compressed),
          uploaded: false
        });
      } catch (error) {
        console.error('Image compression failed:', error);
      }
    }

    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (id) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo?.preview) {
        revokePreviewUrl(photo.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const handleComplete = () => {
    if (required && photos.length < minPhotos) {
      alert(`최소 ${minPhotos}장의 사진이 필요합니다.`);
      return;
    }
    onComplete(photos);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <Camera className="w-5 h-5 text-blue-500" />
        {title}
        {required && <span className="text-red-500 text-sm">*</span>}
      </h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>

      {/* 사진 그리드 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {photos.map(photo => (
          <div key={photo.id} className="relative aspect-square">
            <img
              src={photo.preview}
              alt="촬영 사진"
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={() => removePhoto(photo.id)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* 추가 버튼 */}
        {photos.length < maxPhotos && (
          <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500">
            <Camera className="w-8 h-8 text-gray-400" />
            <span className="text-xs text-gray-500 mt-1">촬영</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleCapture}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* 진행률 */}
      {uploading && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>업로드 중...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 안내 메시지 */}
      <p className="text-xs text-gray-400 mb-4">
        {photos.length}/{maxPhotos}장 (최소 {minPhotos}장 필요)
      </p>

      <button
        onClick={handleComplete}
        disabled={required && photos.length < minPhotos}
        className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300"
      >
        다음 단계
      </button>
    </div>
  );
}

// 체크리스트 단계
export function ChecklistStep({ 
  title = '체크리스트',
  items = [],
  onComplete 
}) {
  const [checkedItems, setCheckedItems] = useState({});

  const toggleItem = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const allChecked = items.every(item => !item.required || checkedItems[item.id]);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <FileCheck className="w-5 h-5 text-blue-500" />
        {title}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {checkedCount}/{items.length}개 확인 완료
      </p>

      <div className="space-y-2 mb-4">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`w-full p-3 rounded-lg border text-left flex items-start gap-3 ${
              checkedItems[item.id] 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200'
            }`}
          >
            <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center ${
              checkedItems[item.id] 
                ? 'bg-green-500 border-green-500' 
                : 'border-gray-300'
            }`}>
              {checkedItems[item.id] && <Check className="w-3 h-3 text-white" />}
            </div>
            <div>
              <p className={`text-sm ${checkedItems[item.id] ? 'text-green-700' : 'text-gray-900'}`}>
                {item.name}
                {item.required && <span className="text-red-500 ml-1">*</span>}
              </p>
              {item.description && (
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={() => onComplete(checkedItems)}
        disabled={!allChecked}
        className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300"
      >
        확인 완료
      </button>
    </div>
  );
}

// 서명 단계
export function SignatureStep({ 
  title = '담당자 확인',
  onComplete 
}) {
  const [signature, setSignature] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-blue-500" />
        {title}
      </h3>

      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-1">담당자명</label>
        <input
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="이름을 입력하세요"
          className="w-full px-4 py-3 border rounded-lg"
        />
      </div>

      <label className="flex items-start gap-3 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1"
        />
        <span className="text-sm text-gray-600">
          위 내용을 확인하였으며, 이관 절차를 진행합니다.
        </span>
      </label>

      <button
        onClick={() => onComplete({ signature, confirmed })}
        disabled={!signature.trim() || !confirmed}
        className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300"
      >
        확인 완료
      </button>
    </div>
  );
}

// 전체 이관 프로세스
export default function TransferStepUI({
  moldId,
  moldInfo,
  transferType = 'outbound', // 'outbound' | 'inbound'
  checklistItems = [],
  onComplete,
  onCancel
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState({
    gps: null,
    photos: [],
    checklist: {},
    signature: null
  });

  const steps = transferType === 'outbound' 
    ? TRANSFER_STEPS.slice(0, 3) 
    : TRANSFER_STEPS.slice(3);

  const handleStepComplete = (stepId, data) => {
    setStepData(prev => ({
      ...prev,
      ...data
    }));

    if (stepId < steps.length) {
      setCurrentStep(stepId + 1);
    } else {
      // 모든 단계 완료
      onComplete?.({
        ...stepData,
        ...data,
        completedAt: new Date().toISOString()
      });
    }
  };

  const renderCurrentStep = () => {
    const step = steps[currentStep - 1];
    
    switch (step?.id) {
      case 1: // 반출 준비 - GPS
        return (
          <GPSConfirmStep
            onConfirm={(gps) => handleStepComplete(1, { gps })}
            onSkip={() => handleStepComplete(1, { gps: null })}
          />
        );
      
      case 2: // 체크리스트
        return (
          <ChecklistStep
            title="반출 전 체크리스트"
            items={checklistItems.length > 0 ? checklistItems : [
              { id: 1, name: '금형 외관 상태 확인', required: true },
              { id: 2, name: '부속품 확인', required: true },
              { id: 3, name: '서류 확인', required: true },
              { id: 4, name: '포장 상태 확인', required: false }
            ]}
            onComplete={(checklist) => handleStepComplete(2, { checklist })}
          />
        );
      
      case 3: // 반출 확인 - 서명
        return (
          <SignatureStep
            title="반출 담당자 확인"
            onComplete={(signature) => handleStepComplete(3, { signature })}
          />
        );
      
      case 4: // 이동 중 상태
        return (
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">이동 중</h3>
            <p className="text-sm text-gray-500 mb-4">금형이 운송 중입니다.</p>
            <button
              onClick={() => handleStepComplete(4, {})}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium"
            >
              입고 확인으로 이동
            </button>
          </div>
        );
      
      case 5: // 입고 확인
        return (
          <>
            <PhotoCaptureStep
              title="입고 사진 촬영"
              description="입고된 금형 상태를 촬영해주세요"
              required={true}
              minPhotos={1}
              onComplete={(photos) => setStepData(prev => ({ ...prev, photos }))}
            />
            <div className="mt-4">
              <SignatureStep
                title="입고 담당자 확인"
                onComplete={(signature) => handleStepComplete(5, { signature, photos: stepData.photos })}
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 금형 정보 */}
      {moldInfo && (
        <div className="bg-blue-600 text-white p-4">
          <p className="text-sm opacity-80">이관 금형</p>
          <h2 className="text-lg font-bold">{moldInfo.mold_code || moldInfo.code}</h2>
          <p className="text-sm">{moldInfo.part_name || moldInfo.name}</p>
        </div>
      )}

      {/* Step Indicator */}
      <div className="p-4">
        <StepIndicator currentStep={currentStep} steps={steps} />
      </div>

      {/* Current Step Content */}
      <div className="px-4">
        {renderCurrentStep()}
      </div>

      {/* Cancel Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={onCancel}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium"
        >
          취소
        </button>
      </div>
    </div>
  );
}
