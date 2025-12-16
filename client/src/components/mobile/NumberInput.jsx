/**
 * 숫자 입력 컴포넌트
 * - 숫자 키패드 최적화
 * - 천단위 자동 표시
 * - 이상값 경고
 */
import { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function NumberInput({
  value,
  onChange,
  label,
  placeholder = '0',
  min = 0,
  max = 999999999,
  previousValue = null,
  warningThreshold = 0.5, // 50% 이상 변동 시 경고
  unit = '',
  required = false,
  disabled = false,
  className = ''
}) {
  const inputRef = useRef(null);
  const [displayValue, setDisplayValue] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  // 숫자 포맷팅 (천단위 콤마)
  const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 콤마 제거
  const parseNumber = (str) => {
    if (!str) return 0;
    return parseInt(str.replace(/,/g, ''), 10) || 0;
  };

  // 값 변경 시 포맷팅
  useEffect(() => {
    setDisplayValue(formatNumber(value));
  }, [value]);

  // 이상값 체크
  useEffect(() => {
    if (previousValue !== null && value) {
      const currentNum = parseNumber(value.toString());
      const prevNum = parseNumber(previousValue.toString());
      
      if (prevNum > 0) {
        const changeRate = Math.abs(currentNum - prevNum) / prevNum;
        
        if (changeRate > warningThreshold) {
          setShowWarning(true);
          if (currentNum > prevNum) {
            setWarningMessage(`이전 값(${formatNumber(prevNum)})보다 ${Math.round(changeRate * 100)}% 증가`);
          } else {
            setWarningMessage(`이전 값(${formatNumber(prevNum)})보다 ${Math.round(changeRate * 100)}% 감소`);
          }
        } else {
          setShowWarning(false);
          setWarningMessage('');
        }
      }
    }
  }, [value, previousValue, warningThreshold]);

  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numValue = parseInt(rawValue, 10) || 0;
    
    // 범위 체크
    if (numValue >= min && numValue <= max) {
      setDisplayValue(formatNumber(numValue));
      onChange?.(numValue);
    }
  };

  const handleFocus = () => {
    // 포커스 시 전체 선택
    inputRef.current?.select();
  };

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 text-lg font-semibold text-right border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            showWarning ? 'border-orange-400 bg-orange-50' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 text-gray-500' : ''}`}
        />
        
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
            {unit}
          </span>
        )}
      </div>

      {/* 이전 값 표시 */}
      {previousValue !== null && (
        <p className="text-xs text-gray-500 mt-1">
          이전: {formatNumber(previousValue)} {unit}
        </p>
      )}

      {/* 이상값 경고 */}
      {showWarning && (
        <div className="flex items-center gap-1 mt-2 text-orange-600 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>{warningMessage}</span>
        </div>
      )}
    </div>
  );
}

// 빠른 숫자 버튼 (+ / - 버튼)
export function NumberInputWithButtons({
  value,
  onChange,
  label,
  step = 1,
  min = 0,
  max = 999999999,
  unit = '',
  ...props
}) {
  const handleIncrement = () => {
    const newValue = Math.min((value || 0) + step, max);
    onChange?.(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max((value || 0) - step, min);
    onChange?.(newValue);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg text-xl font-bold disabled:opacity-50"
        >
          -
        </button>
        
        <NumberInput
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          unit={unit}
          className="flex-1"
          {...props}
        />
        
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg text-xl font-bold disabled:opacity-50"
        >
          +
        </button>
      </div>
    </div>
  );
}
