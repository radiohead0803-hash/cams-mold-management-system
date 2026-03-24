/**
 * 사내 사용자 동기화 스크립트
 * - 아이디/비밀번호: 사번
 * - 기존 사용자 비교 후 없는 사용자 비활성화, 중복은 업데이트
 *
 * 실행: node src/scripts/sync-company-users.js
 * Railway: railway run node src/scripts/sync-company-users.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('../models/newIndex');

// 사내 사용자 목록 (2026-03-24 기준)
const COMPANY_USERS = [
  { employee_id: '103577', name: '김정중', phone: '010-3743-3410', email: 'sunjune28@icams.co.kr', position: '회장', department: '임원' },
  { employee_id: '103576', name: '김선구', phone: '010-8879-0138', email: 'suk@icams.co.kr', position: '부회장', department: '임원' },
  { employee_id: '103485', name: '홍정수', phone: '010-2080-8933', email: 'json@icams.co.kr', position: '대표이사', department: '임원' },
  { employee_id: '103502', name: '김정은', phone: '010-3615-3340', email: 'cekim@icams.co.kr', position: '대표이사', department: '임원' },
  { employee_id: '103493', name: '정환', phone: '010-9871-9801', email: 'radiohead@icams.co.kr', position: '상무이사', department: '임원' },
  { employee_id: '103564', name: '배형엽', phone: '010-4701-2325', email: 'hybae@icams.co.kr', position: '상무이사', department: '임원' },
  { employee_id: '103573', name: '박상병', phone: '010-4616-9893', email: 'mole94@icams.co.kr', position: '이사', department: '임원' },
  { employee_id: '103574', name: '박래선', phone: '010-4418-3820', email: 'prs1401@icams.co.kr', position: '이사', department: '임원' },
  { employee_id: '103619', name: '양창민', phone: null, email: null, position: '이사', department: '임원' },
  { employee_id: '203575', name: '전지혜', phone: '010-2639-7556', email: 'wisdommanaaa@icams.co.kr', position: '이사', department: '임원' },
  { employee_id: '103346', name: '최연상', phone: '010-6646-7957', email: 'yschoi@icams.co.kr', position: '팀장', department: '생산팀' },
  { employee_id: '103514', name: '박준현', phone: '010-7553-4324', email: 'wnsgus4324@icams.co.kr', position: 'PM', department: '생산팀' },
  { employee_id: '103518', name: '김환기', phone: '010-9369-5014', email: 'hwanki@icams.co.kr', position: 'PM', department: '생산팀' },
  { employee_id: '103617', name: '박석인', phone: '010-8859-2375', email: null, position: 'PM', department: '생산팀' },
  { employee_id: '103397', name: '오명진', phone: '010-9850-0215', email: 'afero@icams.co.kr', position: '팀장', department: '생산기술팀' },
  { employee_id: '103540', name: '이세영', phone: '010-3856-9981', email: 'lsy1659@icams.co.kr', position: 'PM', department: '생산기술팀' },
  { employee_id: '103550', name: '장지우', phone: '010-8701-4110', email: 'hanafos941@icams.co.kr', position: 'PM', department: '생산기술팀' },
  { employee_id: '103613', name: '정상협', phone: null, email: 'shjeong4066@icams.co.kr', position: 'PM', department: '생산기술팀' },
  { employee_id: '103459', name: '서진명', phone: '010-8611-1549', email: 'jmseo@icams.co.kr', position: '팀장', department: '개발팀' },
  { employee_id: '103543', name: '김신영', phone: '010-3950-2726', email: 'rud123@icams.co.kr', position: 'PE', department: '개발팀' },
  { employee_id: '103560', name: '채정훈', phone: '010-7151-1465', email: 'chaejh1234@icams.co.kr', position: 'PE', department: '개발팀' },
  { employee_id: '103498', name: '임승화', phone: '010-9629-3059', email: 'tmdghk0426@icams.co.kr', position: 'PM', department: '개발팀' },
  { employee_id: '103535', name: '김준수', phone: '010-7299-7483', email: 'jsk7483@icams.co.kr', position: 'PM', department: '개발팀' },
  { employee_id: '103544', name: '김민성', phone: '010-3239-7128', email: '312kkmmss@icams.co.kr', position: 'PM', department: '개발팀' },
  { employee_id: '103614', name: '조대운', phone: null, email: 'woon6888@icams.co.kr', position: 'PM', department: '개발팀' },
  { employee_id: '103449', name: '김부영', phone: '010-4588-8524', email: 'kimby82@icams.co.kr', position: '팀장', department: '자재관리팀' },
  { employee_id: '103541', name: '홍규현', phone: '010-4195-7155', email: 'rbgus159@icams.co.kr', position: 'PM', department: '자재관리팀' },
  { employee_id: '103455', name: '안광헌', phone: '010-3205-3063', email: 'ccacci22@icams.co.kr', position: '팀장', department: '설계팀' },
  { employee_id: '103398', name: '정우철', phone: '010-6488-0146', email: 'woochil2@icams.co.kr', position: 'PE', department: '설계팀' },
  { employee_id: '103466', name: '최진영', phone: '010-5092-5196', email: 'jinyoung@icams.co.kr', position: 'PE', department: '설계팀' },
  { employee_id: '103508', name: '윤상원', phone: '010-2252-9929', email: 'sangwonyun@icams.co.kr', position: 'PM', department: '양산품질팀' },
  { employee_id: '103515', name: '정지원', phone: '010-9978-0275', email: 'jjw2129@icams.co.kr', position: 'PM', department: '양산품질팀' },
  { employee_id: '103554', name: '이영찬', phone: '010-9723-5413', email: 'loc5413@icams.co.kr', position: 'PM', department: '양산품질팀' },
  { employee_id: '103558', name: '김주환', phone: '010-5772-8982', email: 'kjh8005@icams.co.kr', position: 'PM', department: '양산품질팀' },
  { employee_id: '103567', name: '김영준', phone: '010-9513-9325', email: 'kimasma@icams.co.kr', position: 'PM', department: '양산품질팀' },
  { employee_id: '103394', name: '성세용', phone: '010-8619-2233', email: 'sungsy@icams.co.kr', position: '팀장', department: '영업관리팀' },
  { employee_id: '103495', name: '이승준', phone: '010-5114-5931', email: 'lje5931@icams.co.kr', position: 'PM', department: '영업관리팀' },
  { employee_id: '103527', name: '김정학', phone: '010-6275-8959', email: 'kjh0910@icams.co.kr', position: 'PM', department: '영업관리팀' },
  { employee_id: '103538', name: '이상윤', phone: '010-5958-9865', email: 'lsy0838@icams.co.kr', position: 'PM', department: '영업관리팀' },
  { employee_id: '203566', name: '김현정', phone: '010-9796-2358', email: 'jung2358@icams.co.kr', position: 'PM', department: '영업관리팀' },
  { employee_id: '103476', name: '이시면', phone: '010-4186-4288', email: 'lsm2579@icams.co.kr', position: 'PM', department: '전산팀' },
  { employee_id: '203347', name: '정슬아', phone: '010-6313-7465', email: 'wjdtmfdk51@icams.co.kr', position: 'PM', department: '경영관리팀' },
  { employee_id: '103215', name: '배철성', phone: '010-8485-2585', email: '103215@icams.co.kr', position: 'PM', department: '상생협력팀' },
  { employee_id: '103561', name: '이갑연', phone: '010-8872-6512', email: 'leegy1229@icams.co.kr', position: 'PM', department: '상생협력팀' },
  { employee_id: '103562', name: '김병주', phone: '010-3633-9581', email: 'bjkim@icams.co.kr', position: 'PM', department: '상생협력팀' },
  { employee_id: '103565', name: '윤두섭', phone: '010-5601-3493', email: 'seogdu@icams.co.kr', position: 'PM', department: '상생협력팀' },
  { employee_id: '103523', name: '한동희', phone: '010-7471-7588', email: 'boss2618@icams.co.kr', position: '별정직', department: '별정직' },
  { employee_id: '103534', name: '박상원', phone: '010-3215-2628', email: 'swpark@icams.co.kr', position: 'PM', department: '함평팀' },
  { employee_id: '103553', name: '김재영', phone: '010-6437-6460', email: 'msk9414@icams.co.kr', position: 'PM', department: '함평팀' },
  { employee_id: '103611', name: '문용주', phone: '010-3374-1889', email: 'yjmun@icams.co.kr', position: 'PM', department: '함평팀' },
  { employee_id: '103612', name: '김명진', phone: '010-9680-0030', email: 'audwls0320@icams.co.kr', position: 'PM', department: '함평팀' },
];

// 직급 → user_type 매핑
function getUserType(position, department) {
  // 임원 = system_admin (시스템 관리 권한)
  if (department === '임원') return 'system_admin';
  // 팀장 = mold_developer (금형개발 관리 권한)
  if (position === '팀장') return 'mold_developer';
  // 나머지 = mold_developer (사내 직원)
  return 'mold_developer';
}

async function syncUsers() {
  const transaction = await sequelize.transaction();

  try {
    console.log('🔄 사내 사용자 동기화 시작...');
    console.log(`📋 등록 대상: ${COMPANY_USERS.length}명`);

    // 1. 비밀번호 해싱 (사번 = 비밀번호)
    const passwordHashes = {};
    for (const user of COMPANY_USERS) {
      passwordHashes[user.employee_id] = await bcrypt.hash(user.employee_id, 10);
    }

    // 2. 기존 사내 사용자 조회 (company_type = 'hq')
    const [existingUsers] = await sequelize.query(
      `SELECT id, username, name, email, employee_id FROM users WHERE company_type = 'hq' OR company_name = 'ICAMS'`,
      { transaction }
    );
    console.log(`📊 기존 사내 사용자: ${existingUsers.length}명`);

    const newEmployeeIds = new Set(COMPANY_USERS.map(u => u.employee_id));
    const existingByUsername = new Map(existingUsers.map(u => [u.username, u]));
    const existingByEmployeeId = new Map(existingUsers.filter(u => u.employee_id).map(u => [u.employee_id, u]));

    let inserted = 0, updated = 0, deactivated = 0;

    // 3. 신규 등록 및 기존 업데이트
    for (const user of COMPANY_USERS) {
      const userType = getUserType(user.position, user.department);
      const existing = existingByUsername.get(user.employee_id) || existingByEmployeeId.get(user.employee_id);

      if (existing) {
        // 기존 사용자 업데이트
        await sequelize.query(`
          UPDATE users SET
            name = :name,
            phone = :phone,
            email = :email,
            position = :position,
            department = :department,
            employee_id = :employee_id,
            user_type = :user_type,
            company_type = 'hq',
            company_name = 'ICAMS',
            is_active = true,
            updated_at = NOW()
          WHERE id = :id
        `, {
          replacements: {
            id: existing.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            position: user.position,
            department: user.department,
            employee_id: user.employee_id,
            user_type: userType
          },
          transaction
        });
        updated++;
      } else {
        // 신규 등록 (username = 사번, password = 사번)
        // email 중복 확인
        const emailClause = user.email
          ? `AND NOT EXISTS (SELECT 1 FROM users WHERE email = :email)`
          : '';

        await sequelize.query(`
          INSERT INTO users (username, password_hash, name, phone, email, user_type, company_type, company_name, employee_id, position, department, is_active, created_at, updated_at)
          SELECT :username, :password_hash, :name, :phone, ${user.email ? ':email' : 'NULL'}, :user_type, 'hq', 'ICAMS', :employee_id, :position, :department, true, NOW(), NOW()
          WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = :username)
          ${emailClause}
        `, {
          replacements: {
            username: user.employee_id,
            password_hash: passwordHashes[user.employee_id],
            name: user.name,
            phone: user.phone,
            email: user.email,
            user_type: userType,
            employee_id: user.employee_id,
            position: user.position,
            department: user.department
          },
          transaction
        });
        inserted++;
      }
    }

    // 4. 목록에 없는 기존 사내 사용자 삭제
    for (const existing of existingUsers) {
      const matchByUsername = newEmployeeIds.has(existing.username);
      const matchByEmployeeId = existing.employee_id && newEmployeeIds.has(existing.employee_id);

      if (!matchByUsername && !matchByEmployeeId) {
        // admin 계정은 보호
        if (existing.username === 'admin') continue;

        await sequelize.query(`
          DELETE FROM users WHERE id = :id
        `, { replacements: { id: existing.id }, transaction });
        deactivated++;
        console.log(`  🗑️ 삭제: ${existing.username} (${existing.name})`);
      }
    }

    await transaction.commit();

    console.log('\n✅ 사내 사용자 동기화 완료!');
    console.log(`  📥 신규 등록: ${inserted}명`);
    console.log(`  🔄 업데이트: ${updated}명`);
    console.log(`  🗑️ 삭제: ${deactivated}명`);
    console.log(`  📊 총 활성 사용자: ${COMPANY_USERS.length}명`);
    console.log('\n📌 로그인 정보: 아이디 = 사번, 비밀번호 = 사번');

  } catch (error) {
    await transaction.rollback();
    console.error('❌ 사용자 동기화 실패:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

syncUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
