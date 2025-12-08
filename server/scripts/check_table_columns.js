const { sequelize } = require('../src/models');

async function checkColumns() {
  try {
    console.log('=== 마스터 테이블 컬럼 확인 ===\n');

    const tables = ['car_models', 'materials', 'mold_types', 'tonnages'];
    
    for (const table of tables) {
      console.log(`\n[${table}]`);
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = '${table}' 
        ORDER BY ordinal_position
      `);
      columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
      
      // 샘플 데이터 확인
      const [sample] = await sequelize.query(`SELECT * FROM ${table} LIMIT 2`);
      if (sample.length > 0) {
        console.log(`  샘플 데이터:`, JSON.stringify(sample[0], null, 2));
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

checkColumns();
