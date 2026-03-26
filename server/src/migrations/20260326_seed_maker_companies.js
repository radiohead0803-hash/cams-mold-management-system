'use strict';

const bcrypt = require('bcryptjs');

/**
 * 금형제조업체 16개사 + 대표 사용자 계정 시드
 * - 업체 코드를 username/초기 비밀번호로 사용
 * - company_type: 'maker' (금형제작처)
 * - user_type: 'maker'
 * - UPSERT (ON CONFLICT DO NOTHING) → 재실행 안전
 */
const MAKER_COMPANIES = [
  {
    code: 'E0018', name: '제일솔루텍',
    address: '경기도 화성시 남양읍 무하로 110번길 74-21',
    biz_no: '138-81-33955', rep: '신영호'
  },
  {
    code: 'C5389', name: '현태금형',
    address: '광주광역시 광산구 하남산단6번로 46-18',
    biz_no: '410-81-73107', rep: '김국현'
  },
  {
    code: 'C1134', name: '상봉정밀',
    address: '광주시 북구 월출동 973-3',
    biz_no: '409-81-79945', rep: '이제훈'
  },
  {
    code: 'C1531', name: '제일산기',
    address: '광주시 광산구 도천동 619-7',
    biz_no: '409-81-32969', rep: '임채선'
  },
  {
    code: 'C1853', name: '아이앤테크',
    address: '광주 북구 첨단연신로 398번길 23',
    biz_no: '410-81-69700', rep: '정동근'
  },
  {
    code: 'C1133', name: '한국몰드',
    address: '울산시 북구 단청동 210-6',
    biz_no: '620-81-16998', rep: '고일주'
  },
  {
    code: 'C2406', name: '두성정공',
    address: '인천광역시 남동구 앵고개로556번길 17',
    biz_no: '131-81-73432', rep: '백건호'
  },
  {
    code: 'E0191', name: '에스엠정밀기술',
    address: '부산광역시 강서구 과학산단2로 3번길 88',
    biz_no: '486-85-00991', rep: '정순원'
  },
  {
    code: 'C6425', name: '창대정밀',
    address: '경기도 화성시 양감면 토성로 608',
    biz_no: '243-81-01342', rep: '박제현'
  },
  {
    code: 'C7853', name: '동신산업(울산)',
    address: '울산광역시 북구 매곡산업1길 1',
    biz_no: '620-81-03493', rep: '오영윤'
  },
  {
    code: 'C0809', name: '동신산업(평택)',
    address: '경기도 평택시 팽성읍 추팔리 392-4',
    biz_no: '125-85-14630', rep: '오승구'
  },
  {
    code: 'C1308', name: '신혁2공장',
    address: '경상남도 김해시 진영읍 하계로240번길 93-18',
    biz_no: '615-81-97233', rep: '박성배'
  },
  {
    code: 'C1354', name: '진흥공업',
    address: '울산 북구 매곡동 354-6',
    biz_no: '620-85-09869', rep: '박상구'
  },
  {
    code: 'E0239', name: '디에스메탈',
    address: '경상북도 경주시 외동읍 구어들밑길 34-47',
    biz_no: '505-14-85248', rep: '박동구'
  },
  {
    code: 'E0249', name: '에스에스몰드',
    address: '광주 광산구 진곡산단4번로 67-21',
    biz_no: '410-86-12973', rep: '김동인'
  },
  {
    code: 'E0198', name: '제일이앤티',
    address: '광주 광산구 평동산단2번로 112, 나동 1층',
    biz_no: '228-86-00747', rep: '임영재'
  }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;

    // 1) 비밀번호 해시 (각 업체 코드를 비밀번호로 사용)
    const hashCache = {};
    for (const c of MAKER_COMPANIES) {
      hashCache[c.code] = await bcrypt.hash(c.code, 10);
    }

    // 2) companies UPSERT
    for (const c of MAKER_COMPANIES) {
      await sequelize.query(`
        INSERT INTO companies (company_code, company_name, company_type, business_number, representative, address, is_active, contract_status, created_at, updated_at)
        VALUES ($1, $2, 'maker', $3, $4, $5, true, 'active', NOW(), NOW())
        ON CONFLICT (company_code) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          business_number = EXCLUDED.business_number,
          representative = EXCLUDED.representative,
          address = EXCLUDED.address,
          updated_at = NOW()
      `, {
        bind: [c.code, c.name, c.biz_no, c.rep, c.address]
      });
    }

    // 3) users UPSERT — company_id 조회 후 생성
    for (const c of MAKER_COMPANIES) {
      // company_id 가져오기
      const [rows] = await sequelize.query(
        `SELECT id FROM companies WHERE company_code = $1`,
        { bind: [c.code] }
      );
      const companyId = rows.length > 0 ? rows[0].id : null;

      await sequelize.query(`
        INSERT INTO users (username, password_hash, name, user_type, company_id, company_name, company_type, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, 'maker', $4, $5, 'maker', true, NOW(), NOW())
        ON CONFLICT (username) DO UPDATE SET
          name = EXCLUDED.name,
          company_id = EXCLUDED.company_id,
          company_name = EXCLUDED.company_name,
          updated_at = NOW()
      `, {
        bind: [c.code, hashCache[c.code], c.rep + ' (' + c.name + ')', companyId, c.name]
      });
    }

    console.log(`✅ ${MAKER_COMPANIES.length}개 금형제조업체 + 사용자 계정 시드 완료`);
  },

  async down(queryInterface) {
    const codes = MAKER_COMPANIES.map(c => `'${c.code}'`).join(',');
    await queryInterface.sequelize.query(`DELETE FROM users WHERE username IN (${codes})`);
    await queryInterface.sequelize.query(`DELETE FROM companies WHERE company_code IN (${codes})`);
  }
};
