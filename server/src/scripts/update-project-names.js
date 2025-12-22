const { Sequelize } = require('sequelize');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

// 차종명별 프로젝트명 (개발 코드) 매핑
const projectNameData = [
  { model_name: 'Carnival', project_name: 'KA4' },
  { model_name: 'K9', project_name: 'RJ' },
  { model_name: '캐스퍼', project_name: 'AX1' },
  { model_name: 'K5', project_name: 'DL3' },
  { model_name: 'K8', project_name: 'GL3' },
  { model_name: 'Sportage', project_name: 'NQ5' },
  { model_name: 'Sorento', project_name: 'MQ4' },
  { model_name: 'G5', project_name: 'GN7' },
  { model_name: 'EV6', project_name: 'CV' },
  { model_name: 'EV9', project_name: 'MV' },
  { model_name: '아이오닉5', project_name: 'NE' },
  { model_name: '아이오닉6', project_name: 'CE' },
  { model_name: '팰리세이드', project_name: 'LX2' },
  { model_name: 'AVANTE', project_name: 'CN7' },
  { model_name: '캐스퍼 전기차', project_name: 'AX1e' },
  { model_name: '케스퍼 전기차', project_name: 'AX1e' }
];

async function updateProjectNames() {
  try {
    console.log('프로젝트명 업데이트 시작...\n');
    
    for (const data of projectNameData) {
      const [result] = await sequelize.query(`
        UPDATE car_models 
        SET project_name = :project_name, updated_at = NOW()
        WHERE model_name = :model_name
        RETURNING id, model_name, project_name, model_code
      `, {
        replacements: data
      });
      
      if (result.length > 0) {
        console.log(`✅ ${data.model_name} → 프로젝트명: ${data.project_name}`);
      } else {
        console.log(`⚠️ ${data.model_name} 찾을 수 없음`);
      }
    }
    
    console.log('\n=== 업데이트 완료 후 전체 데이터 ===');
    const [allModels] = await sequelize.query(`
      SELECT id, model_name, project_name, model_code, specification, model_year, manufacturer 
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

updateProjectNames();
