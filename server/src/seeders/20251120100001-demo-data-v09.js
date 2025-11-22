'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. 사용자 생성 (DATABASE_SCHEMA.md 기준 - user_type 사용)
    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        password_hash: hashedPassword,
        name: 'CAMS 시스템 관리자',
        email: 'admin@cams.com',
        phone: '010-1234-5678',
        // 새 스키마
        user_type: 'system_admin',
        company_id: 1,
        company_name: '본사',
        company_type: 'hq',
        // 구 스키마 (호환성)
        role_group: 'hq',
        role_detail: 'system_admin',
        is_active: true,
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'hq_manager',
        password_hash: hashedPassword,
        name: '금형개발 담당',
        email: 'hq@cams.com',
        phone: '010-2345-6789',
        // 새 스키마
        user_type: 'mold_developer',
        company_id: 1,
        company_name: '본사',
        company_type: 'hq',
        // 구 스키마 (호환성)
        role_group: 'hq',
        role_detail: 'development_manager',
        is_active: true,
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'maker1',
        password_hash: hashedPassword,
        name: '금형제작처 담당자',
        email: 'maker@cams.com',
        phone: '010-3456-7890',
        // 새 스키마
        user_type: 'maker',
        company_id: 2,
        company_name: '제작처A',
        company_type: 'maker',
        // 구 스키마 (호환성)
        role_group: 'maker',
        role_detail: 'maker_manager',
        maker_id: 2,
        is_active: true,
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'plant1',
        password_hash: hashedPassword,
        name: '생산처 담당자',
        email: 'plant@cams.com',
        phone: '010-4567-8901',
        // 새 스키마
        user_type: 'plant',
        company_id: 3,
        company_name: '생산처A',
        company_type: 'plant',
        // 구 스키마 (호환성)
        role_group: 'plant',
        role_detail: 'plant_manager',
        plant_id: 3,
        is_active: true,
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 2. 금형 마스터 데이터 (10개)
    await queryInterface.bulkInsert('molds', [
      {
        mold_code: 'M-2024-001',
        mold_name: '도어 트림 금형',
        car_model: 'K5',
        part_name: '도어 트림 LH',
        cavity: 2,
        plant_id: 1,
        maker_id: 1,
        qr_token: 'QR-M2024001',
        sop_date: '2024-01-15',
        eop_date: null,
        target_shots: 500000,
        status: 'active',
        location: '생산 1공장',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        mold_code: 'M-2024-002',
        mold_name: '범퍼 금형',
        car_model: 'K8',
        part_name: '프론트 범퍼',
        cavity: 1,
        plant_id: 1,
        maker_id: 1,
        qr_token: 'QR-M2024002',
        sop_date: '2024-02-20',
        eop_date: null,
        target_shots: 300000,
        status: 'active',
        location: '생산 2공장',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        mold_code: 'M-2024-003',
        mold_name: '콘솔 박스 금형',
        car_model: 'Sportage',
        part_name: '센터 콘솔',
        cavity: 1,
        plant_id: 1,
        maker_id: 1,
        qr_token: 'QR-M2024003',
        sop_date: '2024-03-10',
        eop_date: null,
        target_shots: 400000,
        status: 'active',
        location: '생산 1공장',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        mold_code: 'M-2024-004',
        mold_name: '대시보드 금형',
        car_model: 'Sorento',
        part_name: '대시보드 패널',
        cavity: 1,
        plant_id: 1,
        maker_id: 1,
        qr_token: 'QR-M2024004',
        sop_date: '2024-04-05',
        eop_date: null,
        target_shots: 350000,
        status: 'active',
        location: '생산 1공장',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        mold_code: 'M-2024-005',
        mold_name: '사이드 미러 금형',
        car_model: 'Carnival',
        part_name: '사이드 미러 커버',
        cavity: 2,
        plant_id: 1,
        maker_id: 1,
        qr_token: 'QR-M2024005',
        sop_date: '2024-05-12',
        eop_date: null,
        target_shots: 600000,
        status: 'active',
        location: '생산 2공장',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        mold_code: 'M-2024-006',
        mold_name: '휠 커버 금형',
        car_model: 'EV6',
        part_name: '휠 센터 캡',
        cavity: 4,
        plant_id: 1,
        maker_id: 1,
        qr_token: 'QR-M2024006',
        sop_date: '2024-06-18',
        eop_date: null,
        target_shots: 800000,
        status: 'active',
        location: '생산 1공장',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        mold_code: 'M-2024-007',
        mold_name: '글로브 박스 금형',
        car_model: 'Seltos',
        part_name: '글로브 박스',
        cavity: 1,
        plant_id: 1,
        maker_id: 1,
        qr_token: 'QR-M2024007',
        sop_date: '2024-07-22',
        eop_date: null,
        target_shots: 450000,
        status: 'repair',
        location: '수리센터',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        mold_code: 'M-2024-008',
        mold_name: '헤드램프 하우징 금형',
        car_model: 'GV80',
        part_name: '헤드램프 하우징',
        cavity: 1,
        plant_id: 1,
        maker_id: 1,
        qr_token: 'QR-M2024008',
        sop_date: '2024-08-15',
        eop_date: null,
        target_shots: 250000,
        status: 'active',
        location: '생산 2공장',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        mold_code: 'M-2024-009',
        mold_name: '테일램프 렌즈 금형',
        car_model: 'Stinger',
        part_name: '테일램프 렌즈',
        cavity: 2,
        plant_id: 1,
        maker_id: 1,
        qr_token: 'QR-M2024009',
        sop_date: '2024-09-10',
        eop_date: null,
        target_shots: 550000,
        status: 'active',
        location: '생산 1공장',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        mold_code: 'M-2024-010',
        mold_name: '에어벤트 금형',
        car_model: 'Niro',
        part_name: '에어벤트 그릴',
        cavity: 4,
        plant_id: 1,
        maker_id: 1,
        qr_token: 'QR-M2024010',
        sop_date: '2024-10-25',
        eop_date: null,
        target_shots: 700000,
        status: 'idle',
        location: '보관창고',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 3. 본사 금형제작사양 (mold_specifications)
    // 사용자 ID 조회
    const users = await queryInterface.sequelize.query(
      `SELECT id, username FROM users ORDER BY id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const makerUser = users.find(u => u.username === 'maker1');
    const hqUser = users.find(u => u.username === 'hq_manager');

    // 금형 ID 조회
    const molds = await queryInterface.sequelize.query(
      `SELECT id, mold_code FROM molds ORDER BY id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const firstMold = molds[0];

    await queryInterface.bulkInsert('mold_specifications', [
      {
        part_number: 'P-2024-001',
        part_name: '도어 트림 LH',
        car_model: 'K5',
        car_year: '2024',
        mold_type: '사출금형',
        cavity_count: 2,
        material: 'NAK80',
        tonnage: 350,
        target_maker_id: makerUser.id,
        development_stage: '양산',
        production_stage: '양산중',
        order_date: '2023-10-01',
        target_delivery_date: '2024-01-10',
        actual_delivery_date: '2024-01-15',
        estimated_cost: 50000000,
        actual_cost: 48000000,
        status: 'completed',
        external_system_id: 'ERP-001',
        external_sync_enabled: true,
        last_sync_date: new Date(),
        mold_id: firstMold.id,
        created_by: hqUser.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 4. 제작처 사양 (maker_specifications)
    const specifications = await queryInterface.sequelize.query(
      `SELECT id FROM mold_specifications ORDER BY id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const firstSpec = specifications[0];

    await queryInterface.bulkInsert('maker_specifications', [
      {
        specification_id: firstSpec.id,
        maker_id: makerUser.id,
        // 본사 입력 항목 (자동 연동)
        part_number: 'P-2024-001',
        part_name: '도어 트림 LH',
        car_model: 'K5',
        mold_type: '사출금형',
        cavity_count: 2,
        material: 'NAK80',
        tonnage: 350,
        development_stage: '양산',
        // 제작처 입력 항목
        actual_material: 'NAK80',
        actual_cavity_count: 2,
        core_material: 'NAK80',
        cavity_material: 'NAK80',
        hardness: 'HRC 38-42',
        cooling_type: '냉각수',
        ejection_type: '유압',
        hot_runner: false,
        slide_count: 2,
        lifter_count: 4,
        cycle_time: 45,
        max_shots: 500000,
        production_progress: 100,
        current_stage: '완료',
        completed: true,
        completed_date: '2024-01-15',
        status: 'completed',
        synced_from_hq: true,
        synced_at: new Date(),
        notes: '정상 완료',
        updated_by: makerUser.id,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 5. 생산처 금형 (plant_molds)
    const plantUser = users.find(u => u.username === 'plant1');
    
    await queryInterface.bulkInsert('plant_molds', [
      {
        mold_id: firstMold.id,
        plant_id: plantUser.id,
        // 마스터 정보 (자동 연동)
        mold_code: 'M-2024-001',
        mold_name: '도어 트림 금형',
        part_number: 'P-2024-001',
        part_name: '도어 트림 LH',
        car_model: 'K5',
        cavity: 2,
        target_shots: 500000,
        // 생산처 입력 항목
        current_shots: 125000,
        production_quantity: 250000,
        production_line: 'LINE-01',
        injection_machine: 'INJ-350T-01',
        status: 'in_production',
        assigned_date: '2024-01-20',
        last_production_date: new Date(),
        synced_from_master: true,
        synced_to_master: true,
        synced_at: new Date(),
        last_sync_date: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    console.log('✅ 시드 데이터 생성 완료!');
    console.log('');
    console.log('📋 테스트 계정:');
    console.log('  - admin / password123 (CAMS 시스템 관리)');
    console.log('  - hq_manager / password123 (금형개발 담당)');
    console.log('  - maker1 / password123 (금형제작처)');
    console.log('  - plant1 / password123 (생산처)');
    console.log('');
    console.log('🔄 데이터 흐름:');
    console.log('  본사(mold_specifications) → 제작처(maker_specifications) → 생산처(plant_molds)');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('plant_molds', null, {});
    await queryInterface.bulkDelete('maker_specifications', null, {});
    await queryInterface.bulkDelete('mold_specifications', null, {});
    await queryInterface.bulkDelete('molds', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
