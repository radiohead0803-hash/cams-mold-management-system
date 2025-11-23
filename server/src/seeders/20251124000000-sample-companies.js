'use strict';

/**
 * 샘플 회사 데이터 시더
 * 제작처(maker) 3개, 생산처(plant) 3개
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 제작처 샘플 데이터
    const makers = [
      {
        company_code: 'MKR-001',
        company_name: '대한금형제작소',
        company_type: 'maker',
        business_number: '123-45-67890',
        representative: '김철수',
        phone: '02-1234-5678',
        fax: '02-1234-5679',
        email: 'contact@daehan-mold.com',
        address: '경기도 평택시 산업단지로 123',
        address_detail: '1동 101호',
        postal_code: '17700',
        latitude: 37.0000,
        longitude: 127.0000,
        manager_name: '이영희',
        manager_phone: '010-1234-5678',
        manager_email: 'manager@daehan-mold.com',
        contract_start_date: '2023-01-01',
        contract_end_date: '2025-12-31',
        contract_status: 'active',
        rating: 4.5,
        quality_score: 92.5,
        delivery_score: 88.0,
        production_capacity: 15,
        equipment_list: JSON.stringify([
          { name: 'CNC 머시닝센터', count: 5 },
          { name: 'EDM 방전가공기', count: 3 },
          { name: '와이어컷', count: 2 }
        ]),
        certifications: JSON.stringify(['ISO 9001', 'ISO 14001']),
        specialties: JSON.stringify(['사출금형', '프레스금형']),
        total_molds: 45,
        active_molds: 38,
        completed_projects: 120,
        notes: '20년 경력의 우수 협력사',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        company_code: 'MKR-002',
        company_name: '한국정밀금형',
        company_type: 'maker',
        business_number: '234-56-78901',
        representative: '박민수',
        phone: '031-2345-6789',
        email: 'info@korea-precision.com',
        address: '경기도 화성시 동탄산업로 456',
        postal_code: '18500',
        latitude: 37.2000,
        longitude: 127.1000,
        manager_name: '최수진',
        manager_phone: '010-2345-6789',
        manager_email: 'manager@korea-precision.com',
        contract_start_date: '2023-03-01',
        contract_end_date: '2026-02-28',
        contract_status: 'active',
        rating: 4.2,
        quality_score: 89.0,
        delivery_score: 85.5,
        production_capacity: 12,
        equipment_list: JSON.stringify([
          { name: 'CNC 머시닝센터', count: 4 },
          { name: 'EDM 방전가공기', count: 2 }
        ]),
        certifications: JSON.stringify(['ISO 9001']),
        specialties: JSON.stringify(['사출금형', '정밀금형']),
        total_molds: 32,
        active_molds: 28,
        completed_projects: 85,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        company_code: 'MKR-003',
        company_name: '서울금형산업',
        company_type: 'maker',
        business_number: '345-67-89012',
        representative: '정대호',
        phone: '02-3456-7890',
        email: 'contact@seoul-mold.com',
        address: '서울시 금천구 가산디지털로 789',
        postal_code: '08500',
        latitude: 37.4800,
        longitude: 126.8800,
        manager_name: '강미영',
        manager_phone: '010-3456-7890',
        manager_email: 'manager@seoul-mold.com',
        contract_start_date: '2022-06-01',
        contract_end_date: '2025-05-31',
        contract_status: 'active',
        rating: 4.7,
        quality_score: 95.0,
        delivery_score: 92.0,
        production_capacity: 20,
        equipment_list: JSON.stringify([
          { name: 'CNC 머시닝센터', count: 8 },
          { name: 'EDM 방전가공기', count: 4 },
          { name: '와이어컷', count: 3 },
          { name: '3D 프린터', count: 2 }
        ]),
        certifications: JSON.stringify(['ISO 9001', 'ISO 14001', 'IATF 16949']),
        specialties: JSON.stringify(['사출금형', '프레스금형', '다이캐스팅금형']),
        total_molds: 68,
        active_molds: 55,
        completed_projects: 200,
        notes: '대형 금형 전문, 자동차 부품 특화',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    // 생산처 샘플 데이터
    const plants = [
      {
        company_code: 'PLT-001',
        company_name: '현대자동차 울산공장',
        company_type: 'plant',
        business_number: '456-78-90123',
        representative: '홍길동',
        phone: '052-4567-8901',
        email: 'ulsan@hyundai.com',
        address: '울산광역시 북구 연암공단로 1234',
        postal_code: '44200',
        latitude: 35.5500,
        longitude: 129.3500,
        manager_name: '김생산',
        manager_phone: '010-4567-8901',
        manager_email: 'production@hyundai.com',
        contract_start_date: '2020-01-01',
        contract_end_date: '2030-12-31',
        contract_status: 'active',
        rating: 5.0,
        quality_score: 98.0,
        delivery_score: 97.5,
        production_lines: 12,
        injection_machines: JSON.stringify([
          { machine_name: 'IM-1000-A', tonnage: 1000, manufacturer: 'Engel' },
          { machine_name: 'IM-1500-B', tonnage: 1500, manufacturer: 'Engel' },
          { machine_name: 'IM-2000-C', tonnage: 2000, manufacturer: 'Arburg' }
        ]),
        daily_capacity: 50000,
        total_molds: 150,
        active_molds: 120,
        notes: '주력 생산 공장',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        company_code: 'PLT-002',
        company_name: '기아자동차 화성공장',
        company_type: 'plant',
        business_number: '567-89-01234',
        representative: '이공장',
        phone: '031-5678-9012',
        email: 'hwaseong@kia.com',
        address: '경기도 화성시 남양읍 공장로 5678',
        postal_code: '18540',
        latitude: 37.2200,
        longitude: 126.8500,
        manager_name: '박생산',
        manager_phone: '010-5678-9012',
        manager_email: 'production@kia.com',
        contract_start_date: '2021-01-01',
        contract_end_date: '2031-12-31',
        contract_status: 'active',
        rating: 4.8,
        quality_score: 96.5,
        delivery_score: 95.0,
        production_lines: 10,
        injection_machines: JSON.stringify([
          { machine_name: 'IM-800-A', tonnage: 800, manufacturer: 'Sumitomo' },
          { machine_name: 'IM-1200-B', tonnage: 1200, manufacturer: 'Sumitomo' }
        ]),
        daily_capacity: 40000,
        total_molds: 120,
        active_molds: 95,
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        company_code: 'PLT-003',
        company_name: 'LG전자 창원공장',
        company_type: 'plant',
        business_number: '678-90-12345',
        representative: '최전자',
        phone: '055-6789-0123',
        email: 'changwon@lge.com',
        address: '경상남도 창원시 성산구 공단로 9012',
        postal_code: '51500',
        latitude: 35.2200,
        longitude: 128.6800,
        manager_name: '정생산',
        manager_phone: '010-6789-0123',
        manager_email: 'production@lge.com',
        contract_start_date: '2022-01-01',
        contract_end_date: '2027-12-31',
        contract_status: 'active',
        rating: 4.6,
        quality_score: 94.0,
        delivery_score: 93.5,
        production_lines: 8,
        injection_machines: JSON.stringify([
          { machine_name: 'IM-500-A', tonnage: 500, manufacturer: 'Haitian' },
          { machine_name: 'IM-750-B', tonnage: 750, manufacturer: 'Haitian' }
        ]),
        daily_capacity: 30000,
        total_molds: 80,
        active_molds: 65,
        notes: '가전제품 플라스틱 부품 전문',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ];

    // 데이터 삽입
    await queryInterface.bulkInsert('companies', [...makers, ...plants], {});

    console.log('✅ Sample companies seeded successfully');
    console.log(`   - Makers: ${makers.length}`);
    console.log(`   - Plants: ${plants.length}`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('companies', {
      company_code: {
        [Sequelize.Op.in]: ['MKR-001', 'MKR-002', 'MKR-003', 'PLT-001', 'PLT-002', 'PLT-003']
      }
    }, {});
  }
};
