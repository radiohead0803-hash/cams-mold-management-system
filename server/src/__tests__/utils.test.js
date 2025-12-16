/**
 * 유틸리티 함수 테스트
 * - 날짜 포맷
 * - 타수 계산
 * - 검증 함수
 */

describe('타수 계산 로직', () => {
  /**
   * 타수 계산: 생산수량 / 캐비티 수 (올림)
   */
  const calculateShots = (productionQuantity, cavityCount) => {
    if (!cavityCount || cavityCount <= 0) return productionQuantity;
    return Math.ceil(productionQuantity / cavityCount);
  };

  test('기본 타수 계산', () => {
    expect(calculateShots(100, 4)).toBe(25);
    expect(calculateShots(100, 2)).toBe(50);
    expect(calculateShots(100, 1)).toBe(100);
  });

  test('올림 처리', () => {
    expect(calculateShots(101, 4)).toBe(26);
    expect(calculateShots(99, 4)).toBe(25);
  });

  test('캐비티 0 또는 null 처리', () => {
    expect(calculateShots(100, 0)).toBe(100);
    expect(calculateShots(100, null)).toBe(100);
  });
});

describe('점검 스케줄 계산', () => {
  /**
   * 다음 점검 타수 계산
   */
  const getNextInspectionShots = (currentShots) => {
    const intervals = [20000, 50000, 100000, 200000, 400000, 800000];
    
    for (const interval of intervals) {
      const nextTarget = Math.ceil(currentShots / interval) * interval;
      if (nextTarget > currentShots) {
        return nextTarget;
      }
    }
    return null;
  };

  test('다음 점검 타수 계산', () => {
    expect(getNextInspectionShots(0)).toBe(20000);
    expect(getNextInspectionShots(15000)).toBe(20000);
    expect(getNextInspectionShots(20000)).toBe(40000);
    expect(getNextInspectionShots(45000)).toBe(50000);
    expect(getNextInspectionShots(50000)).toBe(100000);
  });

  test('90% 도달 확인', () => {
    const currentShots = 18000;
    const nextInspection = getNextInspectionShots(currentShots);
    const threshold = nextInspection * 0.9;
    
    expect(currentShots >= threshold).toBe(true); // 18000 >= 18000
  });
});

describe('날짜 유틸리티', () => {
  /**
   * D-day 계산
   */
  const getDaysUntil = (targetDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  test('D-day 계산', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    expect(getDaysUntil(today)).toBe(0);
    expect(getDaysUntil(tomorrow)).toBe(1);
    expect(getDaysUntil(nextWeek)).toBe(7);
  });

  /**
   * 한국 날짜 포맷
   */
  const formatKoreanDate = (date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  test('한국 날짜 포맷', () => {
    const date = new Date('2024-12-16');
    const formatted = formatKoreanDate(date);
    
    expect(formatted).toContain('2024');
    expect(formatted).toContain('12');
    expect(formatted).toContain('16');
  });
});

describe('검증 함수', () => {
  /**
   * 이메일 검증
   */
  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  test('이메일 검증', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.kr')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  /**
   * 금형 코드 검증 (M + 년도 + 번호)
   */
  const isValidMoldCode = (code) => {
    const regex = /^M\d{4}-\d{3,4}$/;
    return regex.test(code);
  };

  test('금형 코드 검증', () => {
    expect(isValidMoldCode('M2024-001')).toBe(true);
    expect(isValidMoldCode('M2024-1234')).toBe(true);
    expect(isValidMoldCode('M24-001')).toBe(false);
    expect(isValidMoldCode('2024-001')).toBe(false);
    expect(isValidMoldCode('')).toBe(false);
  });
});
