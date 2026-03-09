const { Sequelize } = require('sequelize');
const DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const s = new Sequelize(DB_URL, { logging: false });

(async () => {
  try {
    // maker_specifications 컬럼 확인
    const [cols] = await s.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'maker_specifications' 
      ORDER BY ordinal_position
    `);
    console.log('=== maker_specifications columns ===');
    cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));

    // 데이터 확인
    const [rows] = await s.query('SELECT id, maker_id, maker_company_id, specification_id, mold_spec_id, part_number, current_stage, status FROM maker_specifications LIMIT 5');
    console.log('\n=== maker_specifications data (top 5) ===');
    console.log(JSON.stringify(rows, null, 2));

    // mold_specifications에서 maker/plant_company_id 분포 확인
    const [dist] = await s.query(`
      SELECT maker_company_id, plant_company_id, count(*) as cnt 
      FROM mold_specifications 
      WHERE maker_company_id IS NOT NULL 
      GROUP BY maker_company_id, plant_company_id 
      ORDER BY cnt DESC LIMIT 15
    `);
    console.log('\n=== mold_specifications company distribution ===');
    dist.forEach(d => console.log(`  maker=${d.maker_company_id} plant=${d.plant_company_id} count=${d.cnt}`));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await s.close();
  }
})();
