require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // 1. 차종 마스터 테이블
    console.log('\n1. Creating car_models table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS car_models (
        id SERIAL PRIMARY KEY,
        model_name VARCHAR(100) NOT NULL UNIQUE,
        model_code VARCHAR(50),
        manufacturer VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ car_models table created');

    // 2. 재질 마스터 테이블
    console.log('\n2. Creating materials table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        material_name VARCHAR(100) NOT NULL UNIQUE,
        material_code VARCHAR(50),
        category VARCHAR(50),
        hardness VARCHAR(50),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ materials table created');

    // 3. 금형타입 마스터 테이블
    console.log('\n3. Creating mold_types table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS mold_types (
        id SERIAL PRIMARY KEY,
        type_name VARCHAR(100) NOT NULL UNIQUE,
        type_code VARCHAR(50),
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ mold_types table created');

    // 4. 톤수 마스터 테이블
    console.log('\n4. Creating tonnages table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tonnages (
        id SERIAL PRIMARY KEY,
        tonnage_value INTEGER NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ tonnages table created');

    // 인덱스 생성
    console.log('\n5. Creating indexes...');
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_car_models_name ON car_models(model_name);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_car_models_active ON car_models(is_active);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(material_name);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_mold_types_name ON mold_types(type_name);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_mold_types_active ON mold_types(is_active);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_tonnages_value ON tonnages(tonnage_value);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_tonnages_active ON tonnages(is_active);`);
    console.log('✓ Indexes created');

    // 기본 데이터 삽입 - 차종
    console.log('\n6. Inserting default car models...');
    await sequelize.query(`
      INSERT INTO car_models (model_name, model_code, manufacturer, sort_order) VALUES
        ('K5', 'DL3', '기아', 1),
        ('K8', 'GL3', '기아', 2),
        ('Sportage', 'NQ5', '기아', 3),
        ('Sorento', 'MQ4', '기아', 4),
        ('G5', 'G5', '현대', 5)
      ON CONFLICT (model_name) DO NOTHING;
    `);
    console.log('✓ Car models inserted');

    // 기본 데이터 삽입 - 재질
    console.log('\n7. Inserting default materials...');
    await sequelize.query(`
      INSERT INTO materials (material_name, material_code, category, hardness, sort_order) VALUES
        ('NAK80', 'NAK80', '프리하든강', 'HRC 37-43', 1),
        ('P20', 'P20', '합금강', 'HRC 28-32', 2),
        ('S50C', 'S50C', '탄소강', 'HRC 20-25', 3),
        ('HPM38', 'HPM38', '프리하든강', 'HRC 38-42', 4),
        ('SKD61', 'SKD61', '열간공구강', 'HRC 48-52', 5)
      ON CONFLICT (material_name) DO NOTHING;
    `);
    console.log('✓ Materials inserted');

    // 기본 데이터 삽입 - 금형타입
    console.log('\n8. Inserting default mold types...');
    await sequelize.query(`
      INSERT INTO mold_types (type_name, type_code, description, sort_order) VALUES
        ('사출금형', 'INJECTION', '플라스틱 사출 성형용 금형', 1),
        ('프레스금형', 'PRESS', '금속 프레스 성형용 금형', 2),
        ('다이캐스팅금형', 'DIECASTING', '다이캐스팅 성형용 금형', 3),
        ('블로우금형', 'BLOW', '블로우 성형용 금형', 4)
      ON CONFLICT (type_name) DO NOTHING;
    `);
    console.log('✓ Mold types inserted');

    // 기본 데이터 삽입 - 톤수
    console.log('\n9. Inserting default tonnages...');
    await sequelize.query(`
      INSERT INTO tonnages (tonnage_value, sort_order) VALUES
        (180, 1),
        (280, 2),
        (350, 3),
        (420, 4),
        (500, 5),
        (650, 6),
        (800, 7),
        (1000, 8)
      ON CONFLICT (tonnage_value) DO NOTHING;
    `);
    console.log('✓ Tonnages inserted');

    // 데이터 확인
    console.log('\n=== Data Summary ===');
    const [carModels] = await sequelize.query('SELECT COUNT(*) as count FROM car_models');
    const [materials] = await sequelize.query('SELECT COUNT(*) as count FROM materials');
    const [moldTypes] = await sequelize.query('SELECT COUNT(*) as count FROM mold_types');
    const [tonnages] = await sequelize.query('SELECT COUNT(*) as count FROM tonnages');
    
    console.log(`Car Models: ${carModels[0].count}`);
    console.log(`Materials: ${materials[0].count}`);
    console.log(`Mold Types: ${moldTypes[0].count}`);
    console.log(`Tonnages: ${tonnages[0].count}`);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Failed:', err);
    process.exit(1);
  });
