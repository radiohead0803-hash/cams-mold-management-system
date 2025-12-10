const express = require('express');
const router = express.Router();
const { sequelize } = require('../models/newIndex');

// 테스트 사출조건 데이터 삽입 API
router.post('/injection-conditions', async (req, res) => {
  try {
    // 기존 금형 목록 조회
    const [molds] = await sequelize.query(`
      SELECT id, mold_id, mold_code, mold_name FROM mold_specifications LIMIT 10
    `);

    const results = [];
    
    for (const mold of molds) {
      // 이미 사출조건이 있는지 확인
      const [existing] = await sequelize.query(`
        SELECT id FROM injection_conditions WHERE mold_spec_id = :moldSpecId LIMIT 1
      `, { replacements: { moldSpecId: mold.id } });

      if (existing.length > 0) {
        results.push({ mold_code: mold.mold_code, status: 'skipped', reason: 'already exists' });
        continue;
      }

      // 랜덤 값 생성 함수
      const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
      const randDec = (min, max) => (Math.random() * (max - min) + min).toFixed(1);

      const hotRunnerInstalled = Math.random() > 0.5;
      const hotRunnerType = Math.random() > 0.5 ? 'valve_gate' : 'open';
      const gateCount = hotRunnerInstalled && hotRunnerType === 'valve_gate' ? rand(2, 6) : 0;
      const valveGateData = gateCount > 0 
        ? JSON.stringify(Array.from({ length: gateCount }, (_, i) => ({ seq: i + 1, moving: rand(200, 260), fixed: rand(195, 255) })))
        : '[]';

      // INSERT 쿼리 실행
      await sequelize.query(`
        INSERT INTO injection_conditions (
          mold_spec_id, mold_id,
          speed_1, speed_2, speed_3, speed_4, speed_cooling,
          position_pv, position_1, position_2, position_3,
          pressure_1, pressure_2, pressure_3, pressure_4,
          time_injection, time_holding, time_holding_3, time_holding_4, time_cooling,
          metering_speed_vp, metering_speed_1, metering_speed_2, metering_speed_3,
          metering_position_1, metering_position_2,
          metering_pressure_2, metering_pressure_3, metering_pressure_4,
          holding_pressure_1, holding_pressure_2, holding_pressure_3, holding_pressure_4,
          holding_pressure_1h, holding_pressure_2h, holding_pressure_3h,
          barrel_temp_1, barrel_temp_2, barrel_temp_3, barrel_temp_4, barrel_temp_5,
          barrel_temp_6, barrel_temp_7, barrel_temp_8, barrel_temp_9,
          hot_runner_installed, hot_runner_type,
          hr_temp_1, hr_temp_2, hr_temp_3, hr_temp_4,
          valve_gate_count, valve_gate_data,
          chiller_temp_main, chiller_temp_moving, chiller_temp_fixed,
          cycle_time, remarks, status,
          created_by, created_by_name, created_at, updated_at
        ) VALUES (
          :mold_spec_id, :mold_id,
          :speed_1, :speed_2, :speed_3, :speed_4, :speed_cooling,
          :position_pv, :position_1, :position_2, :position_3,
          :pressure_1, :pressure_2, :pressure_3, :pressure_4,
          :time_injection, :time_holding, :time_holding_3, :time_holding_4, :time_cooling,
          :metering_speed_vp, :metering_speed_1, :metering_speed_2, :metering_speed_3,
          :metering_position_1, :metering_position_2,
          :metering_pressure_2, :metering_pressure_3, :metering_pressure_4,
          :holding_pressure_1, :holding_pressure_2, :holding_pressure_3, :holding_pressure_4,
          :holding_pressure_1h, :holding_pressure_2h, :holding_pressure_3h,
          :barrel_temp_1, :barrel_temp_2, :barrel_temp_3, :barrel_temp_4, :barrel_temp_5,
          :barrel_temp_6, :barrel_temp_7, :barrel_temp_8, :barrel_temp_9,
          :hot_runner_installed, :hot_runner_type,
          :hr_temp_1, :hr_temp_2, :hr_temp_3, :hr_temp_4,
          :valve_gate_count, :valve_gate_data::jsonb,
          :chiller_temp_main, :chiller_temp_moving, :chiller_temp_fixed,
          :cycle_time, :remarks, :status,
          1, 'System Admin', NOW(), NOW()
        )
      `, {
        replacements: {
          mold_spec_id: mold.id,
          mold_id: mold.mold_id,
          speed_1: rand(30, 80), speed_2: rand(40, 90), speed_3: rand(35, 85), speed_4: rand(25, 70), speed_cooling: rand(10, 30),
          position_pv: rand(80, 150), position_1: rand(60, 120), position_2: rand(40, 80), position_3: rand(20, 50),
          pressure_1: rand(60, 120), pressure_2: rand(50, 100), pressure_3: rand(40, 90), pressure_4: rand(30, 80),
          time_injection: randDec(1, 5), time_holding: randDec(2, 8), time_holding_3: randDec(1, 4), time_holding_4: randDec(0.5, 3), time_cooling: randDec(10, 30),
          metering_speed_vp: rand(20, 60), metering_speed_1: rand(30, 70), metering_speed_2: rand(25, 65), metering_speed_3: rand(20, 55),
          metering_position_1: rand(50, 100), metering_position_2: rand(30, 70),
          metering_pressure_2: rand(30, 80), metering_pressure_3: rand(25, 70), metering_pressure_4: rand(20, 60),
          holding_pressure_1: rand(40, 90), holding_pressure_2: rand(35, 85), holding_pressure_3: rand(30, 75), holding_pressure_4: rand(25, 65),
          holding_pressure_1h: randDec(1, 4), holding_pressure_2h: randDec(1, 3), holding_pressure_3h: randDec(0.5, 2),
          barrel_temp_1: rand(200, 260), barrel_temp_2: rand(210, 270), barrel_temp_3: rand(220, 280), barrel_temp_4: rand(215, 275), barrel_temp_5: rand(210, 265),
          barrel_temp_6: rand(200, 255), barrel_temp_7: rand(190, 245), barrel_temp_8: rand(180, 235), barrel_temp_9: rand(170, 220),
          hot_runner_installed: hotRunnerInstalled, hot_runner_type: hotRunnerType,
          hr_temp_1: rand(200, 260), hr_temp_2: rand(205, 265), hr_temp_3: rand(210, 270), hr_temp_4: rand(215, 275),
          valve_gate_count: gateCount, valve_gate_data: valveGateData,
          chiller_temp_main: rand(15, 30), chiller_temp_moving: rand(20, 35), chiller_temp_fixed: rand(18, 32),
          cycle_time: randDec(25, 60),
          remarks: `테스트 데이터 - ${mold.mold_code}`,
          status: ['draft', 'pending', 'approved'][rand(0, 2)]
        }
      });

      results.push({ mold_code: mold.mold_code, status: 'inserted' });
    }

    res.json({ success: true, message: '테스트 데이터 삽입 완료', results });
  } catch (error) {
    console.error('Test data insert error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
