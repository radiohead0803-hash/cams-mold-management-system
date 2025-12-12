const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway'
});

async function updateData() {
  try {
    // 사출금형
    await pool.query(`UPDATE mold_types SET category = '플라스틱', sub_category = '열가소성/열경화성', molding_method = '사출성형', typical_materials = 'PP, PE, ABS, PC, PA, POM, PBT, PMMA, PS, TPE, TPU' WHERE type_name = '사출금형'`);
    
    // 프레스금형
    await pool.query(`UPDATE mold_types SET category = '금속', sub_category = '판금/단조', molding_method = '프레스성형', typical_materials = '강판, 알루미늄, 스테인리스, 동, 황동' WHERE type_name = '프레스금형'`);
    
    // 블로우금형
    await pool.query(`UPDATE mold_types SET category = '플라스틱', sub_category = '열가소성', molding_method = '블로우성형', typical_materials = 'PE, PP, PET, PVC, PC' WHERE type_name = '블로우금형'`);
    
    // 다이캐스팅
    await pool.query(`UPDATE mold_types SET category = '금속', sub_category = '주조', molding_method = '다이캐스팅', typical_materials = '알루미늄, 아연, 마그네슘, 동합금' WHERE type_name = '다이캐스팅'`);
    
    // 발포금형
    await pool.query(`UPDATE mold_types SET category = '플라스틱', sub_category = '발포성형', molding_method = '발포성형', typical_materials = 'EPP, EPS, EPE, PU폼' WHERE type_name = '발포금형'`);
    
    console.log('데이터 업데이트 완료');
    
    const result = await pool.query('SELECT type_name, category, sub_category, molding_method, typical_materials FROM mold_types ORDER BY sort_order');
    console.table(result.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

updateData();
