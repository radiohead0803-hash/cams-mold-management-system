'use strict';

const bcrypt = require('bcryptjs');

const COMPANY_USERS = [
  { eid: '103577', name: '김정중', phone: '010-3743-3410', email: 'sunjune28@icams.co.kr', pos: '회장', dept: '임원' },
  { eid: '103576', name: '김선구', phone: '010-8879-0138', email: 'suk@icams.co.kr', pos: '부회장', dept: '임원' },
  { eid: '103485', name: '홍정수', phone: '010-2080-8933', email: 'json@icams.co.kr', pos: '대표이사', dept: '임원' },
  { eid: '103502', name: '김정은', phone: '010-3615-3340', email: 'cekim@icams.co.kr', pos: '대표이사', dept: '임원' },
  { eid: '103493', name: '정환', phone: '010-9871-9801', email: 'radiohead@icams.co.kr', pos: '상무이사', dept: '임원' },
  { eid: '103564', name: '배형엽', phone: '010-4701-2325', email: 'hybae@icams.co.kr', pos: '상무이사', dept: '임원' },
  { eid: '103573', name: '박상병', phone: '010-4616-9893', email: 'mole94@icams.co.kr', pos: '이사', dept: '임원' },
  { eid: '103574', name: '박래선', phone: '010-4418-3820', email: 'prs1401@icams.co.kr', pos: '이사', dept: '임원' },
  { eid: '103619', name: '양창민', phone: null, email: null, pos: '이사', dept: '임원' },
  { eid: '203575', name: '전지혜', phone: '010-2639-7556', email: 'wisdommanaaa@icams.co.kr', pos: '이사', dept: '임원' },
  { eid: '103346', name: '최연상', phone: '010-6646-7957', email: 'yschoi@icams.co.kr', pos: '팀장', dept: '생산팀' },
  { eid: '103514', name: '박준현', phone: '010-7553-4324', email: 'wnsgus4324@icams.co.kr', pos: 'PM', dept: '생산팀' },
  { eid: '103518', name: '김환기', phone: '010-9369-5014', email: 'hwanki@icams.co.kr', pos: 'PM', dept: '생산팀' },
  { eid: '103617', name: '박석인', phone: '010-8859-2375', email: null, pos: 'PM', dept: '생산팀' },
  { eid: '103397', name: '오명진', phone: '010-9850-0215', email: 'afero@icams.co.kr', pos: '팀장', dept: '생산기술팀' },
  { eid: '103540', name: '이세영', phone: '010-3856-9981', email: 'lsy1659@icams.co.kr', pos: 'PM', dept: '생산기술팀' },
  { eid: '103550', name: '장지우', phone: '010-8701-4110', email: 'hanafos941@icams.co.kr', pos: 'PM', dept: '생산기술팀' },
  { eid: '103613', name: '정상협', phone: null, email: 'shjeong4066@icams.co.kr', pos: 'PM', dept: '생산기술팀' },
  { eid: '103459', name: '서진명', phone: '010-8611-1549', email: 'jmseo@icams.co.kr', pos: '팀장', dept: '개발팀' },
  { eid: '103543', name: '김신영', phone: '010-3950-2726', email: 'rud123@icams.co.kr', pos: 'PE', dept: '개발팀' },
  { eid: '103560', name: '채정훈', phone: '010-7151-1465', email: 'chaejh1234@icams.co.kr', pos: 'PE', dept: '개발팀' },
  { eid: '103498', name: '임승화', phone: '010-9629-3059', email: 'tmdghk0426@icams.co.kr', pos: 'PM', dept: '개발팀' },
  { eid: '103535', name: '김준수', phone: '010-7299-7483', email: 'jsk7483@icams.co.kr', pos: 'PM', dept: '개발팀' },
  { eid: '103544', name: '김민성', phone: '010-3239-7128', email: '312kkmmss@icams.co.kr', pos: 'PM', dept: '개발팀' },
  { eid: '103614', name: '조대운', phone: null, email: 'woon6888@icams.co.kr', pos: 'PM', dept: '개발팀' },
  { eid: '103449', name: '김부영', phone: '010-4588-8524', email: 'kimby82@icams.co.kr', pos: '팀장', dept: '자재관리팀' },
  { eid: '103541', name: '홍규현', phone: '010-4195-7155', email: 'rbgus159@icams.co.kr', pos: 'PM', dept: '자재관리팀' },
  { eid: '103455', name: '안광헌', phone: '010-3205-3063', email: 'ccacci22@icams.co.kr', pos: '팀장', dept: '설계팀' },
  { eid: '103398', name: '정우철', phone: '010-6488-0146', email: 'woochil2@icams.co.kr', pos: 'PE', dept: '설계팀' },
  { eid: '103466', name: '최진영', phone: '010-5092-5196', email: 'jinyoung@icams.co.kr', pos: 'PE', dept: '설계팀' },
  { eid: '103508', name: '윤상원', phone: '010-2252-9929', email: 'sangwonyun@icams.co.kr', pos: 'PM', dept: '양산품질팀' },
  { eid: '103515', name: '정지원', phone: '010-9978-0275', email: 'jjw2129@icams.co.kr', pos: 'PM', dept: '양산품질팀' },
  { eid: '103554', name: '이영찬', phone: '010-9723-5413', email: 'loc5413@icams.co.kr', pos: 'PM', dept: '양산품질팀' },
  { eid: '103558', name: '김주환', phone: '010-5772-8982', email: 'kjh8005@icams.co.kr', pos: 'PM', dept: '양산품질팀' },
  { eid: '103567', name: '김영준', phone: '010-9513-9325', email: 'kimasma@icams.co.kr', pos: 'PM', dept: '양산품질팀' },
  { eid: '103394', name: '성세용', phone: '010-8619-2233', email: 'sungsy@icams.co.kr', pos: '팀장', dept: '영업관리팀' },
  { eid: '103495', name: '이승준', phone: '010-5114-5931', email: 'lje5931@icams.co.kr', pos: 'PM', dept: '영업관리팀' },
  { eid: '103527', name: '김정학', phone: '010-6275-8959', email: 'kjh0910@icams.co.kr', pos: 'PM', dept: '영업관리팀' },
  { eid: '103538', name: '이상윤', phone: '010-5958-9865', email: 'lsy0838@icams.co.kr', pos: 'PM', dept: '영업관리팀' },
  { eid: '203566', name: '김현정', phone: '010-9796-2358', email: 'jung2358@icams.co.kr', pos: 'PM', dept: '영업관리팀' },
  { eid: '103476', name: '이시면', phone: '010-4186-4288', email: 'lsm2579@icams.co.kr', pos: 'PM', dept: '전산팀' },
  { eid: '203347', name: '정슬아', phone: '010-6313-7465', email: 'wjdtmfdk51@icams.co.kr', pos: 'PM', dept: '경영관리팀' },
  { eid: '103215', name: '배철성', phone: '010-8485-2585', email: '103215@icams.co.kr', pos: 'PM', dept: '상생협력팀' },
  { eid: '103561', name: '이갑연', phone: '010-8872-6512', email: 'leegy1229@icams.co.kr', pos: 'PM', dept: '상생협력팀' },
  { eid: '103562', name: '김병주', phone: '010-3633-9581', email: 'bjkim@icams.co.kr', pos: 'PM', dept: '상생협력팀' },
  { eid: '103565', name: '윤두섭', phone: '010-5601-3493', email: 'seogdu@icams.co.kr', pos: 'PM', dept: '상생협력팀' },
  { eid: '103523', name: '한동희', phone: '010-7471-7588', email: 'boss2618@icams.co.kr', pos: '별정직', dept: '별정직' },
  { eid: '103534', name: '박상원', phone: '010-3215-2628', email: 'swpark@icams.co.kr', pos: 'PM', dept: '함평팀' },
  { eid: '103553', name: '김재영', phone: '010-6437-6460', email: 'msk9414@icams.co.kr', pos: 'PM', dept: '함평팀' },
  { eid: '103611', name: '문용주', phone: '010-3374-1889', email: 'yjmun@icams.co.kr', pos: 'PM', dept: '함평팀' },
  { eid: '103612', name: '김명진', phone: '010-9680-0030', email: 'audwls0320@icams.co.kr', pos: 'PM', dept: '함평팀' },
];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // department, position, employee_id 컬럼 추가 (없으면)
    const addCol = async (col, type) => {
      try {
        await queryInterface.addColumn('users', col, { type, allowNull: true });
      } catch (e) { /* already exists */ }
    };
    await addCol('department', Sequelize.STRING(50));
    await addCol('position', Sequelize.STRING(50));
    await addCol('employee_id', Sequelize.STRING(20));

    // 사용자 UPSERT
    const hash = await bcrypt.hash('default_temp', 10);
    for (const u of COMPANY_USERS) {
      const pwHash = await bcrypt.hash(u.eid, 10);
      // 시스템관리자: 정환(103493), 홍정수(103485), 이시면(103476)
      // 관리자: 나머지 임원 (회장, 부회장, 대표이사, 상무이사, 이사)
      // 담당자: 일반 직원
      const SYSTEM_ADMINS = ['103493', '103485', '103476'];
      let userType, permClass;
      if (SYSTEM_ADMINS.includes(u.eid)) {
        userType = 'system_admin';
        permClass = 'admin';
      } else if (u.dept === '임원') {
        userType = 'mold_developer';
        permClass = 'manager';
      } else {
        userType = 'staff';
        permClass = 'user';
      }

      await queryInterface.sequelize.query(`
        INSERT INTO users (username, password_hash, name, phone, email, user_type, permission_class, company_type, company_name, employee_id, position, department, is_active, created_at, updated_at)
        VALUES (:username, :pwHash, :name, :phone, :email, :userType, :permClass, 'hq', 'ICAMS', :eid, :pos, :dept, true, NOW(), NOW())
        ON CONFLICT (username) DO UPDATE SET
          name = EXCLUDED.name, phone = EXCLUDED.phone,
          user_type = EXCLUDED.user_type, permission_class = EXCLUDED.permission_class,
          employee_id = EXCLUDED.employee_id,
          position = EXCLUDED.position, department = EXCLUDED.department,
          company_type = 'hq', company_name = 'ICAMS',
          is_active = true, updated_at = NOW()
      `, {
        replacements: {
          username: u.eid, pwHash, name: u.name,
          phone: u.phone, email: u.email, userType, permClass,
          eid: u.eid, pos: u.pos, dept: u.dept
        }
      });
    }

    // 51명 리스트 외 모든 사용자 삭제 (admin 보호)
    const eids = COMPANY_USERS.map(u => u.eid);
    const [deleted] = await queryInterface.sequelize.query(`
      DELETE FROM users
      WHERE username != 'admin'
        AND username NOT IN (:eids)
      RETURNING id, username, name
    `, { replacements: { eids } });
    if (deleted && deleted.length > 0) {
      console.log(`🗑️ ${deleted.length}명 삭제:`, deleted.map(u => `${u.username}(${u.name})`).join(', '));
    }

    console.log(`✅ 사내 사용자 ${COMPANY_USERS.length}명 DB 반영 완료`);
  },

  async down(queryInterface) {
    // 롤백: 사내 사용자 삭제
    await queryInterface.sequelize.query(`
      DELETE FROM users WHERE company_type = 'hq' AND username != 'admin'
    `);
  }
};
