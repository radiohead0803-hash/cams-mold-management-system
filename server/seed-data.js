/**
 * 데이터베이스 시드 스크립트
 * 모든 테이블에 테스트 데이터 10건씩 추가
 */

const { sequelize } = require('./src/models/newIndex');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // 1. Companies 테이블 (제작처 5개, 생산처 5개)
    console.log('\n📦 Seeding Companies...');
    const companies = [];
    
    // 제작처 5개
    for (let i = 1; i <= 5; i++) {
      const [company] = await sequelize.query(`
        INSERT INTO companies (
          company_code, company_name, company_type, business_number,
          representative, phone, email, address, latitude, longitude,
          manager_name, manager_phone, contract_status, rating,
          production_capacity, is_active, created_at, updated_at
        ) VALUES (
          'MAKER${String(i).padStart(3, '0')}',
          '${['현대금형', '삼성몰드', '대우제작소', '기아금형', 'LG몰딩'][i-1]}',
          'maker',
          '${100 + i}-${80 + i}-${String(10000 + i * 111).slice(0, 5)}',
          '${['김철수', '이영희', '박민수', '정수진', '최동욱'][i-1]}',
          '02-${1000 + i * 100}-${String(1000 + i * 11).slice(0, 4)}',
          'maker${i}@company.com',
          '경기도 화성시 ${['동탄', '봉담', '향남', '우정', '팔탄'][i-1]}읍 공단로 ${i * 10}',
          ${37.2 + i * 0.01},
          ${127.0 + i * 0.01},
          '${['홍길동', '김영수', '이철호', '박지민', '정민아'][i-1]}',
          '010-${1000 + i * 111}-${String(1000 + i * 222).slice(0, 4)}',
          'active',
          ${4.0 + i * 0.1},
          ${50 + i * 10},
          true,
          NOW(),
          NOW()
        ) RETURNING id
      `);
      companies.push({ id: company[0].id, type: 'maker' });
      console.log(`  ✅ Maker ${i}: ${company[0].id}`);
    }
    
    // 생산처 5개
    for (let i = 1; i <= 5; i++) {
      const [company] = await sequelize.query(`
        INSERT INTO companies (
          company_code, company_name, company_type, business_number,
          representative, phone, email, address, latitude, longitude,
          manager_name, manager_phone, contract_status, rating,
          production_lines, daily_capacity, is_active, created_at, updated_at
        ) VALUES (
          'PLANT${String(i).padStart(3, '0')}',
          '${['현대자동차 울산공장', '기아자동차 화성공장', 'GM 부평공장', '르노삼성 부산공장', '쌍용자동차 평택공장'][i-1]}',
          'plant',
          '${200 + i}-${90 + i}-${String(20000 + i * 222).slice(0, 5)}',
          '${['강대리', '송과장', '윤부장', '임상무', '한전무'][i-1]}',
          '052-${2000 + i * 100}-${String(2000 + i * 11).slice(0, 4)}',
          'plant${i}@company.com',
          '${['울산광역시', '경기도 화성시', '인천광역시', '부산광역시', '경기도 평택시'][i-1]} 공단대로 ${i * 100}',
          ${35.5 + i * 0.1},
          ${129.0 + i * 0.1},
          '${['최팀장', '김대리', '이과장', '박부장', '정상무'][i-1]}',
          '010-${2000 + i * 111}-${String(2000 + i * 222).slice(0, 4)}',
          'active',
          ${4.5 + i * 0.05},
          ${3 + i},
          ${1000 + i * 500},
          true,
          NOW(),
          NOW()
        ) RETURNING id
      `);
      companies.push({ id: company[0].id, type: 'plant' });
      console.log(`  ✅ Plant ${i}: ${company[0].id}`);
    }

    // 2. Users 테이블 (각 역할별 10명)
    console.log('\n👥 Seeding Users...');
    const users = [];
    const roles = ['system_admin', 'mold_developer', 'maker', 'plant'];
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    for (let roleIdx = 0; roleIdx < roles.length; roleIdx++) {
      const role = roles[roleIdx];
      for (let i = 1; i <= 10; i++) {
        const companyId = role === 'maker' ? companies[i % 5].id : 
                         role === 'plant' ? companies[5 + (i % 5)].id : null;
        
        const [user] = await sequelize.query(`
          INSERT INTO users (
            username, email, password, name, role, company_id,
            phone, department, position, is_active, created_at, updated_at
          ) VALUES (
            '${role}_${String(i).padStart(2, '0')}',
            '${role}${i}@cams.com',
            '${hashedPassword}',
            '${role === 'system_admin' ? '관리자' : role === 'mold_developer' ? '개발자' : role === 'maker' ? '제작담당' : '생산담당'}${i}',
            '${role}',
            ${companyId},
            '010-${3000 + roleIdx * 1000 + i * 10}-${String(1000 + i * 11).slice(0, 4)}',
            '${['시스템팀', '개발팀', '제작팀', '생산팀'][roleIdx]}',
            '${['관리자', '선임', '대리', '과장', '차장'][i % 5]}',
            true,
            NOW(),
            NOW()
          ) RETURNING id
        `);
        users.push({ id: user[0].id, role, companyId });
        if (i === 1) console.log(`  ✅ ${role}: ${user[0].id}`);
      }
    }

    // 3. Molds 테이블 (금형 10개)
    console.log('\n🔧 Seeding Molds...');
    const molds = [];
    const carModels = ['K5', '쏘나타', '아반떼', 'G80', '그랜저', '투싼', '스포티지', '셀토스', 'GV70', 'EV6'];
    const partNames = ['프론트 범퍼', '리어 범퍼', '프론트 펜더', '도어 패널', '후드', '트렁크 리드', '사이드 미러', '그릴', '헤드램프 하우징', '테일램프 하우징'];
    const statuses = ['active', 'in_production', 'maintenance', 'idle', 'active', 'in_production', 'active', 'active', 'ng', 'active'];
    
    for (let i = 1; i <= 10; i++) {
      const plantCompany = companies[5 + (i % 5)];
      const [mold] = await sequelize.query(`
        INSERT INTO molds (
          mold_code, mold_name, car_model, part_name, status,
          current_location_type, current_location_id,
          target_shots, current_shots, material, weight,
          manufacturer, manufacturing_date, last_maintenance_date,
          created_by, is_active, created_at, updated_at
        ) VALUES (
          'M2024-${String(i).padStart(3, '0')}',
          '${carModels[i-1]} ${partNames[i-1]} 금형',
          '${carModels[i-1]}',
          '${partNames[i-1]}',
          '${statuses[i-1]}',
          'plant',
          ${plantCompany.id},
          ${100000 + i * 10000},
          ${50000 + i * 5000},
          '${['P20', 'NAK80', 'S50C', 'SKD11', 'HPM38'][i % 5]}',
          ${5000 + i * 500},
          '${companies[i % 5].id}',
          '2024-${String(i).padStart(2, '0')}-15',
          '2024-11-${String(i).padStart(2, '0')}',
          ${users[0].id},
          true,
          NOW(),
          NOW()
        ) RETURNING id
      `);
      molds.push(mold[0].id);
      console.log(`  ✅ Mold ${i}: ${mold[0].id} - ${carModels[i-1]} ${partNames[i-1]}`);
    }

    // 4. Daily Checks 테이블 (일상점검 10개)
    console.log('\n✅ Seeding Daily Checks...');
    for (let i = 1; i <= 10; i++) {
      const plantUser = users.find(u => u.role === 'plant');
      await sequelize.query(`
        INSERT INTO daily_checks (
          mold_id, performed_by, check_date, shift,
          overall_status, temperature, pressure, cycle_time,
          visual_inspection, notes, created_at, updated_at
        ) VALUES (
          ${molds[i-1]},
          ${plantUser.id},
          CURRENT_DATE - INTERVAL '${i} days',
          '${['morning', 'afternoon', 'night'][i % 3]}',
          '${['normal', 'normal', 'warning', 'normal', 'normal', 'normal', 'critical', 'normal', 'normal', 'normal'][i-1]}',
          ${180 + i * 2},
          ${150 + i * 5},
          ${30 + i * 0.5},
          '${['정상', '정상', '약간 마모', '정상', '정상', '정상', '균열 발견', '정상', '정상', '정상'][i-1]}',
          '${i}차 일상점검 완료',
          NOW(),
          NOW()
        )
      `);
      if (i === 1) console.log(`  ✅ Daily Check ${i} created`);
    }

    // 5. Repairs 테이블 (수리요청 10개)
    console.log('\n🔨 Seeding Repairs...');
    for (let i = 1; i <= 10; i++) {
      const plantUser = users.find(u => u.role === 'plant');
      const makerCompany = companies[i % 5];
      await sequelize.query(`
        INSERT INTO repairs (
          mold_id, requested_by, repair_type, priority, status,
          issue_description, repair_location, estimated_cost,
          estimated_duration, assigned_to_company, requested_date,
          created_at, updated_at
        ) VALUES (
          ${molds[i-1]},
          ${plantUser.id},
          '${['corrective', 'preventive', 'emergency', 'corrective', 'preventive', 'corrective', 'emergency', 'corrective', 'preventive', 'corrective'][i-1]}',
          '${['high', 'medium', 'critical', 'medium', 'low', 'high', 'critical', 'medium', 'low', 'medium'][i-1]}',
          '${['pending', 'in_progress', 'completed', 'in_progress', 'pending', 'in_progress', 'pending', 'completed', 'in_progress', 'pending'][i-1]}',
          '${['코어 마모', '냉각수 누수', '이젝터 핀 파손', '파팅라인 불량', '정기 점검', '표면 거칠기', '급작스런 균열', '게이트 막힘', '예방 정비', '런너 마모'][i-1]}',
          '${makerCompany.id}',
          ${1000000 + i * 500000},
          ${5 + i * 2},
          ${makerCompany.id},
          CURRENT_DATE - INTERVAL '${i * 2} days',
          NOW(),
          NOW()
        )
      `);
      if (i === 1) console.log(`  ✅ Repair ${i} created`);
    }

    // 6. Production Quantities 테이블 (생산 수량 10개)
    console.log('\n📊 Seeding Production Quantities...');
    for (let i = 1; i <= 10; i++) {
      const plantUser = users.find(u => u.role === 'plant');
      await sequelize.query(`
        INSERT INTO production_quantities (
          mold_id, production_date, shift, quantity,
          ok_quantity, ng_quantity, recorded_by, notes,
          created_at, updated_at
        ) VALUES (
          ${molds[i-1]},
          CURRENT_DATE - INTERVAL '${i} days',
          '${['morning', 'afternoon', 'night'][i % 3]}',
          ${500 + i * 50},
          ${480 + i * 48},
          ${20 + i * 2},
          ${plantUser.id},
          '${i}일차 생산 기록',
          NOW(),
          NOW()
        )
      `);
      if (i === 1) console.log(`  ✅ Production ${i} created`);
    }

    // 7. QR Sessions 테이블 (QR 스캔 10개)
    console.log('\n📱 Seeding QR Sessions...');
    for (let i = 1; i <= 10; i++) {
      const plantUser = users.find(u => u.role === 'plant');
      await sequelize.query(`
        INSERT INTO qr_sessions (
          mold_id, user_id, session_token, scan_type,
          scanned_at, expires_at, is_active, created_at, updated_at
        ) VALUES (
          ${molds[i-1]},
          ${plantUser.id},
          'QR${Date.now()}${i}',
          '${['daily_check', 'production', 'inspection', 'daily_check', 'production', 'daily_check', 'inspection', 'production', 'daily_check', 'production'][i-1]}',
          NOW() - INTERVAL '${i} hours',
          NOW() + INTERVAL '${24 - i} hours',
          ${i <= 5},
          NOW(),
          NOW()
        )
      `);
      if (i === 1) console.log(`  ✅ QR Session ${i} created`);
    }

    // 8. GPS Locations 테이블 (GPS 위치 10개)
    console.log('\n📍 Seeding GPS Locations...');
    for (let i = 1; i <= 10; i++) {
      await sequelize.query(`
        INSERT INTO gps_locations (
          mold_id, latitude, longitude, accuracy, recorded_at,
          location_type, is_valid, created_at, updated_at
        ) VALUES (
          ${molds[i-1]},
          ${35.5 + i * 0.1},
          ${129.0 + i * 0.1},
          ${5 + i * 0.5},
          NOW() - INTERVAL '${i} hours',
          'plant',
          true,
          NOW(),
          NOW()
        )
      `);
      if (i === 1) console.log(`  ✅ GPS Location ${i} created`);
    }

    // 9. Alerts 테이블 (알람 10개)
    console.log('\n🚨 Seeding Alerts...');
    const alertTypes = ['over_shot', 'ng_detected', 'maintenance_due', 'gps_drift', 'over_shot', 'temperature_high', 'pressure_abnormal', 'ng_detected', 'maintenance_due', 'gps_drift'];
    const severities = ['critical', 'major', 'minor', 'major', 'critical', 'major', 'minor', 'major', 'minor', 'major'];
    
    for (let i = 1; i <= 10; i++) {
      await sequelize.query(`
        INSERT INTO alerts (
          mold_id, alert_type, severity, title, message,
          is_resolved, created_at, updated_at
        ) VALUES (
          ${molds[i-1]},
          '${alertTypes[i-1]}',
          '${severities[i-1]}',
          '${['타수 초과', 'NG 발생', '정기검사 필요', 'GPS 이탈', '타수 초과', '온도 이상', '압력 이상', 'NG 발생', '정기검사 필요', 'GPS 이탈'][i-1]}',
          '금형 M2024-${String(i).padStart(3, '0')} ${['타수가 목표치를 초과했습니다', 'NG가 발생했습니다', '정기검사가 필요합니다', 'GPS 위치가 이탈했습니다', '타수가 목표치를 초과했습니다', '온도가 정상 범위를 벗어났습니다', '압력이 비정상입니다', 'NG가 발생했습니다', '정기검사가 필요합니다', 'GPS 위치가 이탈했습니다'][i-1]}',
          ${i > 5},
          NOW() - INTERVAL '${i} hours',
          NOW()
        )
      `);
      if (i === 1) console.log(`  ✅ Alert ${i} created`);
    }

    // 10. Notifications 테이블 (알림 10개)
    console.log('\n🔔 Seeding Notifications...');
    for (let i = 1; i <= 10; i++) {
      const user = users[i % users.length];
      await sequelize.query(`
        INSERT INTO notifications (
          user_id, title, message, type, priority,
          is_read, created_at, updated_at
        ) VALUES (
          ${user.id},
          '${['새로운 수리요청', '점검 완료', 'NG 발생 알림', '타수 초과 경고', '정기검사 알림', '생산 목표 달성', '긴급 수리 요청', '금형 이동 완료', '계약 만료 예정', '시스템 업데이트'][i-1]}',
          '${['새로운 수리요청이 등록되었습니다', '일상점검이 완료되었습니다', 'NG가 발생했습니다', '타수가 초과되었습니다', '정기검사가 필요합니다', '생산 목표를 달성했습니다', '긴급 수리가 필요합니다', '금형 이동이 완료되었습니다', '계약이 곧 만료됩니다', '시스템이 업데이트되었습니다'][i-1]}',
          '${['repair', 'check', 'alert', 'alert', 'inspection', 'production', 'repair', 'location', 'contract', 'system'][i-1]}',
          '${['high', 'medium', 'critical', 'high', 'medium', 'low', 'critical', 'medium', 'high', 'low'][i-1]}',
          ${i > 5},
          NOW() - INTERVAL '${i} hours',
          NOW()
        )
      `);
      if (i === 1) console.log(`  ✅ Notification ${i} created`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Companies: 10 (5 makers, 5 plants)`);
    console.log(`  - Users: 40 (10 per role)`);
    console.log(`  - Molds: 10`);
    console.log(`  - Daily Checks: 10`);
    console.log(`  - Repairs: 10`);
    console.log(`  - Production Quantities: 10`);
    console.log(`  - QR Sessions: 10`);
    console.log(`  - GPS Locations: 10`);
    console.log(`  - Alerts: 10`);
    console.log(`  - Notifications: 10`);
    console.log('\n🎉 All data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 실행
seedDatabase()
  .then(() => {
    console.log('\n✅ Seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding process failed:', error);
    process.exit(1);
  });
