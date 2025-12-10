import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

// 아이콘 및 색상 매핑
const variants = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-100',
    buttonColor: 'bg-red-600 hover:bg-red-700'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    iconBg: 'bg-yellow-100',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    buttonColor: 'bg-blue-600 hover:bg-blue-700'
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    buttonColor: 'bg-green-600 hover:bg-green-700'
  }
};

// 확인 다이얼로그 컴포넌트
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  message = '이 작업을 진행하시겠습니까?',
  confirmText = '확인',
  cancelText = '취소',
  variant = 'danger',
  loading = false
}) {
  if (!isOpen) return null;

  const { icon: Icon, iconColor, iconBg, buttonColor } = variants[variant] || variants.info;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${iconBg}`}>
            <Icon size={24} className={iconColor} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* 버튼 */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2 ${buttonColor}`}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// 삭제 확인 다이얼로그
export function DeleteConfirmDialog({ isOpen, onClose, onConfirm, itemName = '항목', loading }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="삭제 확인"
      message={`"${itemName}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
      confirmText="삭제"
      cancelText="취소"
      variant="danger"
      loading={loading}
    />
  );
}

// 저장 확인 다이얼로그
export function SaveConfirmDialog({ isOpen, onClose, onConfirm, loading }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="저장 확인"
      message="변경사항을 저장하시겠습니까?"
      confirmText="저장"
      cancelText="취소"
      variant="info"
      loading={loading}
    />
  );
}

// 취소 확인 다이얼로그
export function CancelConfirmDialog({ isOpen, onClose, onConfirm }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="취소 확인"
      message="작성 중인 내용이 저장되지 않습니다. 정말 취소하시겠습니까?"
      confirmText="취소하기"
      cancelText="계속 작성"
      variant="warning"
    />
  );
}
