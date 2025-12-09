const { sequelize } = require('./src/models/newIndex');

async function seedQRMolds() {
  try {
    console.log('Seeding QR molds...');
    
    // QR 테스트용 금형 데이터 삽입
    await sequelize.query(`
      INSERT INTO molds (mold_code, mold_name, car_model, part_name, cavity, status, current_shots, target_shots, location, created_at, updated_at)
      VALUES 
        ('QR-MOLD-001', '범퍼 금형 A', 'K5', '프론트 범퍼', 2, 'active', 15000, 100000, '생산1공장 A라인', now(), now()),
        ('QR-MOLD-002', '도어트림 금형 B', 'K8', '도어 트림 LH', 4, 'active', 25000, 80000, '생산1공장 B라인', now(), now()),
        ('QR-MOLD-003', '대시보드 금형 C', 'EV6', '대시보드 센터', 1, 'maintenance', 8000, 50000, '수리센터', now(), now())
      ON CONFLICT (mold_code) DO UPDATE SET
        mold_name = EXCLUDED.mold_name,
        car_model = EXCLUDED.car_model,
        part_name = EXCLUDED.part_name,
        cavity = EXCLUDED.cavity,
        status = EXCLUDED.status,
        current_shots = EXCLUDED.current_shots,
        target_shots = EXCLUDED.target_shots,
        location = EXCLUDED.location,
        updated_at = now();
    `);
    console.log('QR molds seeded successfully');

    // 확인
    const [molds] = await sequelize.query(`SELECT id, mold_code, mold_name, car_model, status, current_shots, target_shots FROM molds WHERE mold_code LIKE 'QR-MOLD-%' ORDER BY mold_code`);
    console.log('\nQR Molds in DB:');
    console.table(molds);

    // qr_sessions 테이블 확인
    const [tables] = await sequelize.query(`SELECT table_name FROM information_schema.tables WHERE table_name = 'qr_sessions'`);
    if (tables.length === 0) {
      console.log('\nCreating qr_sessions table...');
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS qr_sessions (
          id SERIAL PRIMARY KEY,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          user_id INTEGER REFERENCES users(id),
          mold_id INTEGER NOT NULL REFERENCES molds(id),
          qr_code VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          gps_latitude DECIMAL(10, 8),
          gps_longitude DECIMAL(11, 8),
          device_info JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('qr_sessions table created');
    } else {
      console.log('\nqr_sessions table already exists');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

seedQRMolds();
