'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 금형 사양 테스트 데이터 10건
    const moldSpecifications = [
      {
        part_number: 'P-2024-001',
        part_name: '도어 트림 LH',
        car_model: 'K5',
        car_year: '2024',
        mold_type: '사출금형',
        cavity_count: 1,
        material: 'NAK80',
        tonnage: 350,
        target_maker_id: 3, // maker1
        development_stage: '개발',
        production_stage: '시제',
        order_date: new Date('2024-01-10'),
        target_delivery_date: new Date('2024-03-10'),
        estimated_cost: 45000000,
        status: 'sent_to_maker',
        created_by: 2, // hq_manager
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        part_number: 'P-2024-002',
        part_name: '범퍼 금형 RH',
        car_model: 'K8',
        car_year: '2024',
        mold_type: '사출금형',
        cavity_count: 1,
        material: 'P20',
        tonnage: 500,
        target_maker_id: 3,
        development_stage: '개발',
        production_stage: '시제',
        order_date: new Date('2024-01-12'),
        target_delivery_date: new Date('2024-03-15'),
        estimated_cost: 52000000,
        status: 'sent_to_maker',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        part_number: 'P-2024-003',
        part_name: '콘솔 박스',
        car_model: 'Sportage',
        car_year: '2024',
        mold_type: '사출금형',
        cavity_count: 1,
        material: 'NAK80',
        tonnage: 280,
        target_maker_id: 3,
        development_stage: '개발',
        production_stage: '시제',
        order_date: new Date('2024-01-15'),
        target_delivery_date: new Date('2024-03-20'),
        estimated_cost: 38000000,
        status: 'in_production',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        part_number: 'P-2024-004',
        part_name: '대시보드 패널',
        car_model: 'Sorento',
        car_year: '2024',
        mold_type: '사출금형',
        cavity_count: 1,
        material: 'HPM38',
        tonnage: 650,
        target_maker_id: 3,
        development_stage: '양산',
        production_stage: '양산중',
        order_date: new Date('2024-01-08'),
        target_delivery_date: new Date('2024-03-05'),
        estimated_cost: 68000000,
        status: 'in_production',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        part_number: 'P-2024-005',
        part_name: '사이드 미러 커버',
        car_model: 'K5',
        car_year: '2024',
        mold_type: '사출금형',
        cavity_count: 2,
        material: 'NAK80',
        tonnage: 180,
        target_maker_id: 3,
        development_stage: '개발',
        production_stage: '시제',
        order_date: new Date('2024-01-18'),
        target_delivery_date: new Date('2024-03-25'),
        estimated_cost: 32000000,
        status: 'sent_to_maker',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        part_number: 'P-2024-006',
        part_name: '휀더 라이너',
        car_model: 'K8',
        car_year: '2024',
        mold_type: '사출금형',
        cavity_count: 1,
        material: 'S50C',
        tonnage: 420,
        target_maker_id: 3,
        development_stage: '개발',
        production_stage: '시제',
        order_date: new Date('2024-01-20'),
        target_delivery_date: new Date('2024-03-28'),
        estimated_cost: 41000000,
        status: 'draft',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        part_number: 'P-2024-007',
        part_name: '테일 램프 하우징',
        car_model: 'Sportage',
        car_year: '2024',
        mold_type: '사출금형',
        cavity_count: 1,
        material: 'NAK80',
        tonnage: 320,
        target_maker_id: 3,
        development_stage: '개발',
        production_stage: '시제',
        order_date: new Date('2024-01-22'),
        target_delivery_date: new Date('2024-04-01'),
        estimated_cost: 44000000,
        status: 'sent_to_maker',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        part_number: 'P-2024-008',
        part_name: '글로브 박스',
        car_model: 'Sorento',
        car_year: '2024',
        mold_type: '사출금형',
        cavity_count: 1,
        material: 'P20',
        tonnage: 250,
        target_maker_id: 3,
        development_stage: '개발',
        production_stage: '시제',
        order_date: new Date('2024-01-25'),
        target_delivery_date: new Date('2024-04-05'),
        estimated_cost: 35000000,
        status: 'draft',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        part_number: 'P-2024-009',
        part_name: '센터 페시아',
        car_model: 'K5',
        car_year: '2024',
        mold_type: '사출금형',
        cavity_count: 1,
        material: 'NAK80',
        tonnage: 380,
        target_maker_id: 3,
        development_stage: '개발',
        production_stage: '시제',
        order_date: new Date('2024-01-28'),
        target_delivery_date: new Date('2024-04-10'),
        estimated_cost: 47000000,
        status: 'sent_to_maker',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        part_number: 'P-2024-010',
        part_name: '도어 핸들 베젤',
        car_model: 'K8',
        car_year: '2024',
        mold_type: '사출금형',
        cavity_count: 2,
        material: 'NAK80',
        tonnage: 200,
        target_maker_id: 3,
        development_stage: '개발',
        production_stage: '시제',
        order_date: new Date('2024-01-30'),
        target_delivery_date: new Date('2024-04-15'),
        estimated_cost: 36000000,
        status: 'sent_to_maker',
        created_by: 2,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // mold_specifications 테이블에 삽입
    await queryInterface.bulkInsert('mold_specifications', moldSpecifications, {});
    
    // 삽입된 데이터의 ID 가져오기
    const insertedSpecs = await queryInterface.sequelize.query(
      `SELECT id, part_number FROM mold_specifications WHERE part_number LIKE 'P-2024-%' ORDER BY id`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // 각 사양에 대한 molds 테이블 데이터 생성
    const molds = moldSpecifications.map((spec, index) => ({
      mold_code: `M-2024-${String(index + 1).padStart(3, '0')}`,
      mold_name: spec.part_name,
      car_model: spec.car_model,
      part_name: spec.part_name,
      cavity: spec.cavity_count,
      plant_id: 4, // plant1
      maker_id: 3, // maker1
      qr_token: `CAMS-M2024${String(index + 1).padStart(3, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      status: spec.status === 'draft' ? 'planning' : spec.status === 'sent_to_maker' ? 'design' : 'manufacturing',
      location: '제작처',
      created_at: new Date(),
      updated_at: new Date()
    }));

    await queryInterface.bulkInsert('molds', molds, {});

    // maker_specifications 테이블에 자동 연동 데이터 생성 (sent_to_maker 상태인 것만)
    const makerSpecs = [];
    for (let i = 0; i < moldSpecifications.length; i++) {
      const spec = moldSpecifications[i];
      if (spec.status === 'sent_to_maker' || spec.status === 'in_production') {
        const insertedSpec = insertedSpecs.find(s => s.part_number === spec.part_number);
        if (insertedSpec) {
          makerSpecs.push({
            specification_id: insertedSpec.id,
            maker_id: spec.target_maker_id,
            part_number: spec.part_number,
            part_name: spec.part_name,
            car_model: spec.car_model,
            mold_type: spec.mold_type,
            cavity_count: spec.cavity_count,
            material: spec.material,
            tonnage: spec.tonnage,
            development_stage: spec.development_stage,
            production_progress: spec.status === 'in_production' ? 45 : 0,
            current_stage: spec.status === 'in_production' ? '가공' : '설계',
            status: spec.status === 'in_production' ? 'in_progress' : 'pending',
            synced_from_hq: true,
            synced_at: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    }

    if (makerSpecs.length > 0) {
      await queryInterface.bulkInsert('maker_specifications', makerSpecs, {});
    }

    console.log('✅ 금형 사양 테스트 데이터 10건 생성 완료');
  },

  down: async (queryInterface, Sequelize) => {
    // 외래키 제약조건 때문에 순서대로 삭제
    // 1. plant_molds 먼저 삭제
    const molds = await queryInterface.sequelize.query(
      `SELECT id FROM molds WHERE mold_code LIKE 'M-2024-%'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    if (molds.length > 0) {
      const moldIds = molds.map(m => m.id);
      await queryInterface.bulkDelete('plant_molds', {
        mold_id: {
          [Sequelize.Op.in]: moldIds
        }
      }, {});
    }

    // 2. maker_specifications 삭제
    await queryInterface.bulkDelete('maker_specifications', {
      part_number: {
        [Sequelize.Op.like]: 'P-2024-%'
      }
    }, {});

    // 3. mold_specifications 삭제
    await queryInterface.bulkDelete('mold_specifications', {
      part_number: {
        [Sequelize.Op.like]: 'P-2024-%'
      }
    }, {});

    // 4. molds 마지막 삭제
    await queryInterface.bulkDelete('molds', {
      mold_code: {
        [Sequelize.Op.like]: 'M-2024-%'
      }
    }, {});
  }
};
