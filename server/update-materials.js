const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway'
});

async function updateData() {
  try {
    // S45C
    await pool.query(`UPDATE materials SET usage_type = '몰드베이스, 서포트플레이트', heat_treatment = '담금질+뜨임', machinability = '우수', weldability = '우수', polishability = '보통', corrosion_resistance = '낮음', wear_resistance = '보통' WHERE material_name = 'S45C'`);
    
    // SKD11
    await pool.query(`UPDATE materials SET usage_type = '펀치, 다이, 슬라이드코어', heat_treatment = '담금질+뜨임', machinability = '보통', weldability = '어려움', polishability = '양호', corrosion_resistance = '양호', wear_resistance = '우수' WHERE material_name = 'SKD11'`);
    
    // STAVAX
    await pool.query(`UPDATE materials SET usage_type = '코어, 캐비티 (투명/의료)', heat_treatment = '담금질+뜨임', machinability = '양호', weldability = '양호', polishability = '우수', corrosion_resistance = '우수', wear_resistance = '양호' WHERE material_name = 'STAVAX'`);
    
    console.log('추가 재질 데이터 업데이트 완료');
    
    const result = await pool.query('SELECT material_name, category, usage_type, heat_treatment, machinability, polishability FROM materials WHERE is_active = true ORDER BY sort_order');
    console.table(result.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

updateData();
