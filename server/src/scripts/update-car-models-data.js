const { Sequelize } = require('sequelize');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

// 차종별 사양, 년식, 제조사 데이터
const carModelsData = [
  { model_name: 'Carnival', model_code: 'KA4', specification: 'LX', model_year: '2024', manufacturer: '기아' },
  { model_name: 'K9', model_code: 'RJ', specification: 'GL', model_year: '2024', manufacturer: '기아' },
  { model_name: '캐스퍼', model_code: 'AX1', specification: 'PE', model_year: '2024', manufacturer: 'GGM' },
  { model_name: 'K5', model_code: 'DL3', specification: 'LX', model_year: '2024', manufacturer: '기아' },
  { model_name: 'K8', model_code: 'GL3', specification: 'GL', model_year: '2024', manufacturer: '기아' },
  { model_name: 'Sportage', model_code: 'NQ5', specification: 'LX', model_year: '2024', manufacturer: '기아' },
  { model_name: 'Sorento', model_code: 'MQ4', specification: 'LX', model_year: '2024', manufacturer: '기아' },
  { model_name: 'G5', model_code: 'G5', specification: 'GL', model_year: '2024', manufacturer: '현대' },
  { model_name: 'EV6', model_code: 'CV', specification: 'GT', model_year: '2024', manufacturer: '기아' },
  { model_name: 'EV9', model_code: 'MV', specification: 'GT', model_year: '2024', manufacturer: '기아' },
  { model_name: '아이오닉5', model_code: 'NE', specification: 'PE', model_year: '2024', manufacturer: '현대' },
  { model_name: '아이오닉6', model_code: 'CE', specification: 'PE', model_year: '2024', manufacturer: '현대' },
  { model_name: '팰리세이드', model_code: 'LX2', specification: 'LX', model_year: '2024', manufacturer: '현대' },
  { model_name: 'AVANTE', model_code: 'AVANTE', specification: 'LX', model_year: '2024', manufacturer: '현대' },
  { model_name: 'DEMO', model_code: 'DEMO', specification: 'DEMO', model_year: '2024', manufacturer: '테스트' },
  { model_name: '케스퍼 전기차', model_code: 'AX1 EV', specification: 'PE', model_year: '2024', manufacturer: '현대' }
];

async function updateCarModels() {
  try {
    console.log('차종 데이터 업데이트 시작...');
    
    for (const data of carModelsData) {
      const [result] = await sequelize.query(`
        UPDATE car_models 
        SET 
          model_code = COALESCE(NULLIF(:model_code, ''), model_code),
          specification = :specification,
          model_year = :model_year,
          manufacturer = :manufacturer,
          updated_at = NOW()
        WHERE model_name = :model_name
        RETURNING id, model_name, model_code, specification, model_year, manufacturer
      `, {
        replacements: data
      });
      
      if (result.length > 0) {
        console.log(`✅ ${data.model_name} 업데이트 완료:`, result[0]);
      } else {
        console.log(`⚠️ ${data.model_name} 찾을 수 없음`);
      }
    }
    
    console.log('\n=== 업데이트 완료 후 전체 데이터 ===');
    const [allModels] = await sequelize.query(`
      SELECT id, model_name, model_code, specification, model_year, manufacturer 
      FROM car_models 
      WHERE is_active = true 
      ORDER BY sort_order, model_name
    `);
    console.table(allModels);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updateCarModels();
