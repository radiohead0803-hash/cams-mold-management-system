const { sequelize } = require('../src/models');

async function createTables() {
  try {
    console.log('=== Creating MoldDetail Tables ===\n');

    // 1. plant_info 테이블
    console.log('1. Creating plant_info table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS plant_info (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER NOT NULL REFERENCES molds(id),
        production_line VARCHAR(100),
        injection_machine VARCHAR(100),
        cycle_time INTEGER,
        injection_temp INTEGER,
        injection_pressure INTEGER,
        injection_speed INTEGER,
        temperature_settings JSONB,
        pressure_settings JSONB,
        speed_settings JSONB,
        material_type VARCHAR(100),
        color_code VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✓ plant_info created');

    // 2. injection_conditions 테이블
    console.log('2. Creating injection_conditions table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS injection_conditions (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER NOT NULL REFERENCES molds(id),
        plant_info_id INTEGER REFERENCES plant_info(id),
        modified_by INTEGER REFERENCES users(id),
        modification_date TIMESTAMP DEFAULT NOW(),
        previous_conditions JSONB,
        new_conditions JSONB,
        reason TEXT,
        approval_status VARCHAR(20) DEFAULT 'pending',
        approved_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✓ injection_conditions created');

    // 3. maker_info 테이블
    console.log('3. Creating maker_info table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS maker_info (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER NOT NULL REFERENCES molds(id),
        material VARCHAR(100),
        weight DECIMAL(10, 2),
        dimensions VARCHAR(100),
        cavity_count INTEGER,
        core_material VARCHAR(100),
        cavity_material VARCHAR(100),
        hardness VARCHAR(50),
        cooling_type VARCHAR(50),
        ejection_type VARCHAR(50),
        hot_runner BOOLEAN,
        slide_count INTEGER,
        lifter_count INTEGER,
        cycle_time INTEGER,
        max_shots INTEGER,
        specifications JSONB,
        summary TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✓ maker_info created');

    // 4. repair_progress 테이블
    console.log('4. Creating repair_progress table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS repair_progress (
        id SERIAL PRIMARY KEY,
        repair_id INTEGER NOT NULL REFERENCES repairs(id),
        progress_date TIMESTAMP DEFAULT NOW(),
        progress_percentage INTEGER,
        current_stage VARCHAR(50),
        work_details TEXT,
        issues_encountered TEXT,
        updated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✓ repair_progress created');

    // 5. mold_specifications 컬럼 추가
    console.log('5. Adding columns to mold_specifications...');
    const columns = [
      { name: 'injection_temp', type: 'INTEGER' },
      { name: 'injection_pressure', type: 'INTEGER' },
      { name: 'injection_speed', type: 'INTEGER' },
      { name: 'cycle_time', type: 'INTEGER' },
      { name: 'weight', type: 'DECIMAL(10, 2)' },
      { name: 'dimensions', type: 'VARCHAR(100)' },
      { name: 'current_location', type: 'VARCHAR(200)' },
      { name: 'manager_name', type: 'VARCHAR(100)' }
    ];

    for (const col of columns) {
      try {
        await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
        console.log(`   ✓ Added ${col.name}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`   ⚠ ${col.name} already exists`);
        } else {
          console.log(`   ✗ ${col.name}: ${err.message}`);
        }
      }
    }

    // 6. 인덱스 생성
    console.log('6. Creating indexes...');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_plant_info_mold ON plant_info(mold_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_injection_conditions_mold ON injection_conditions(mold_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_maker_info_mold ON maker_info(mold_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_repair_progress_repair ON repair_progress(repair_id)');
    console.log('   ✓ Indexes created');

    // 7. 샘플 데이터 삽입
    console.log('7. Inserting sample data...');
    
    // mold_id 5가 있는지 확인
    const [molds] = await sequelize.query('SELECT id FROM molds WHERE id = 5');
    if (molds.length > 0) {
      // plant_info 샘플
      const [existingPlantInfo] = await sequelize.query('SELECT id FROM plant_info WHERE mold_id = 5');
      if (existingPlantInfo.length === 0) {
        await sequelize.query(`
          INSERT INTO plant_info (mold_id, production_line, injection_machine, cycle_time, injection_temp, injection_pressure, injection_speed, material_type)
          VALUES (5, 'LINE-A01', 'INJ-350T', 35, 220, 80, 50, 'ABS')
        `);
        console.log('   ✓ plant_info sample data inserted');
      }

      // maker_info 샘플
      const [existingMakerInfo] = await sequelize.query('SELECT id FROM maker_info WHERE mold_id = 5');
      if (existingMakerInfo.length === 0) {
        await sequelize.query(`
          INSERT INTO maker_info (mold_id, material, weight, dimensions, cavity_count, core_material, cavity_material, hardness, cooling_type, ejection_type, hot_runner, slide_count, lifter_count, cycle_time, max_shots)
          VALUES (5, 'NAK80', 2500, '500x400x350', 1, 'NAK80', 'NAK80', 'HRC 40-42', '직접냉각', '이젝터핀', false, 2, 4, 35, 500000)
        `);
        console.log('   ✓ maker_info sample data inserted');
      }
    }

    // mold_specifications ID 60 업데이트
    await sequelize.query(`
      UPDATE mold_specifications 
      SET 
        injection_temp = 220,
        injection_pressure = 80,
        injection_speed = 50,
        cycle_time = 35,
        weight = 2500,
        dimensions = '500x400x350',
        current_location = 'A구역-01',
        manager_name = '김철수'
      WHERE id = 60
    `);
    console.log('   ✓ mold_specifications ID 60 updated');

    console.log('\n=== All Tables Created Successfully ===');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

createTables();
