const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkChecklistTables() {
  try {
    // 1. 체크리스트 관련 테이블 확인
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%check%' OR table_name LIKE '%template%' OR table_name LIKE '%item%')
      ORDER BY table_name
    `);
    
    console.log('=== 체크리스트 관련 테이블 ===');
    tablesResult.rows.forEach(row => console.log('-', row.table_name));
    
    // 2. check_item_master 테이블 확인
    const masterResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'check_item_master'
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== check_item_master 컬럼 ===');
    masterResult.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
    // 3. check_item_master 데이터 확인
    const masterDataResult = await pool.query(`
      SELECT id, category, item_name, check_type, active
      FROM check_item_master
      ORDER BY category, id
      LIMIT 30
    `);
    
    console.log('\n=== check_item_master 데이터 (최대 30개) ===');
    console.log('Total:', masterDataResult.rows.length, 'records');
    masterDataResult.rows.forEach(row => {
      console.log(`[${row.id}] ${row.category} | ${row.item_name} | ${row.check_type} | active: ${row.active}`);
    });
    
    // 4. checklist_templates 테이블 확인
    const templateResult = await pool.query(`
      SELECT * FROM checklist_templates
      ORDER BY id
      LIMIT 20
    `);
    
    console.log('\n=== checklist_templates 데이터 ===');
    console.log('Total:', templateResult.rows.length, 'records');
    if (templateResult.rows.length > 0) {
      console.table(templateResult.rows);
    }
    
    // 5. checklist_template_items 테이블 확인
    const templateItemsResult = await pool.query(`
      SELECT * FROM checklist_template_items
      ORDER BY template_id, id
      LIMIT 30
    `);
    
    console.log('\n=== checklist_template_items 데이터 (최대 30개) ===');
    console.log('Total:', templateItemsResult.rows.length, 'records');
    if (templateItemsResult.rows.length > 0) {
      console.table(templateItemsResult.rows);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

checkChecklistTables();
