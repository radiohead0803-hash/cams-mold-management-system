const { Sequelize } = require('sequelize');

// Railway PostgreSQL 연결 (프로덕션 DB)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:rlxTdQPMvpcpNNKNlNnCPqVHdKNNBdBa@ballast.proxy.rlwy.net:58498/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function insertTestInjectionConditions() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // 기존 금형 목록 조회
    const [molds] = await sequelize.query(`
      SELECT id, mold_id, mold_code, mold_name FROM mold_specifications LIMIT 10
    `);
    console.log(`📋 Found ${molds.length} molds`);

    for (const mold of molds) {
      // 이미 사출조건이 있는지 확인
      const [existing] = await sequelize.query(`
        SELECT id FROM injection_conditions WHERE mold_spec_id = :moldSpecId LIMIT 1
      `, { replacements: { moldSpecId: mold.id } });

      if (existing.length > 0) {
        console.log(`⏭️ Mold ${mold.mold_code} already has injection conditions, skipping...`);
        continue;
      }

      // 랜덤 값 생성 함수
      const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
      const randDec = (min, max, decimals = 1) => (Math.random() * (max - min) + min).toFixed(decimals);

      // 사출조건 데이터 생성
      const conditionData = {
        mold_spec_id: mold.id,
        mold_id: mold.mold_id,
        
        // 속도 설정
        speed_1: rand(30, 80),
        speed_2: rand(40, 90),
        speed_3: rand(35, 85),
        speed_4: rand(25, 70),
        speed_cooling: rand(10, 30),
        
        // 위치 설정
        position_pv: rand(80, 150),
        position_1: rand(60, 120),
        position_2: rand(40, 80),
        position_3: rand(20, 50),
        
        // 압력 설정
        pressure_1: rand(60, 120),
        pressure_2: rand(50, 100),
        pressure_3: rand(40, 90),
        pressure_4: rand(30, 80),
        
        // 시간 설정
        time_injection: randDec(1, 5),
        time_holding: randDec(2, 8),
        time_holding_3: randDec(1, 4),
        time_holding_4: randDec(0.5, 3),
        time_cooling: randDec(10, 30),
        
        // 계량 속도
        metering_speed_vp: rand(20, 60),
        metering_speed_1: rand(30, 70),
        metering_speed_2: rand(25, 65),
        metering_speed_3: rand(20, 55),
        
        // 계량 위치
        metering_position_1: rand(50, 100),
        metering_position_2: rand(30, 70),
        
        // 계량 압력
        metering_pressure_2: rand(30, 80),
        metering_pressure_3: rand(25, 70),
        metering_pressure_4: rand(20, 60),
        
        // 보압 설정
        holding_pressure_1: rand(40, 90),
        holding_pressure_2: rand(35, 85),
        holding_pressure_3: rand(30, 75),
        holding_pressure_4: rand(25, 65),
        holding_pressure_1h: randDec(1, 4),
        holding_pressure_2h: randDec(1, 3),
        holding_pressure_3h: randDec(0.5, 2),
        
        // BARREL 온도
        barrel_temp_1: rand(200, 260),
        barrel_temp_2: rand(210, 270),
        barrel_temp_3: rand(220, 280),
        barrel_temp_4: rand(215, 275),
        barrel_temp_5: rand(210, 265),
        barrel_temp_6: rand(200, 255),
        barrel_temp_7: rand(190, 245),
        barrel_temp_8: rand(180, 235),
        barrel_temp_9: rand(170, 220),
        
        // 핫런너 설정 (50% 확률로 설치)
        hot_runner_installed: Math.random() > 0.5,
        hot_runner_type: Math.random() > 0.5 ? 'valve_gate' : 'open',
        
        // H/R 온도
        hr_temp_1: rand(200, 260),
        hr_temp_2: rand(205, 265),
        hr_temp_3: rand(210, 270),
        hr_temp_4: rand(215, 275),
        
        // 칠러온도
        chiller_temp_main: rand(15, 30),
        chiller_temp_moving: rand(20, 35),
        chiller_temp_fixed: rand(18, 32),
        
        // 기타
        cycle_time: randDec(25, 60),
        remarks: `테스트 데이터 - ${mold.mold_code}`,
        
        // 상태
        status: ['draft', 'pending', 'approved'][rand(0, 2)],
        created_by: 1,
        created_by_name: 'System Admin'
      };

      // 밸브게이트 데이터 (핫런너가 밸브게이트 타입인 경우)
      if (conditionData.hot_runner_installed && conditionData.hot_runner_type === 'valve_gate') {
        const gateCount = rand(2, 6);
        conditionData.valve_gate_count = gateCount;
        conditionData.valve_gate_data = JSON.stringify(
          Array.from({ length: gateCount }, (_, i) => ({
            seq: i + 1,
            moving: rand(200, 260),
            fixed: rand(195, 255)
          }))
        );
      } else {
        conditionData.valve_gate_count = 0;
        conditionData.valve_gate_data = JSON.stringify([]);
      }

      // INSERT 쿼리 실행
      const columns = Object.keys(conditionData);
      const values = Object.values(conditionData);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

      await sequelize.query(`
        INSERT INTO injection_conditions (${columns.join(', ')}, created_at, updated_at)
        VALUES (${placeholders}, NOW(), NOW())
      `, {
        bind: values
      });

      console.log(`✅ Inserted injection condition for ${mold.mold_code} (status: ${conditionData.status})`);
    }

    console.log('\n🎉 Test injection conditions inserted successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

insertTestInjectionConditions();
