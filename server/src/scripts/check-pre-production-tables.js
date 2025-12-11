const { Client } = require('pg');

const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

async function checkTables() {
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Railway DB');
    
    // Check for pre_production tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name LIKE 'pre_production%'
      ORDER BY table_name
    `);
    
    console.log('\n=== Pre-production related tables ===');
    if (tables.rows.length === 0) {
      console.log('No pre_production tables found!');
    } else {
      tables.rows.forEach(row => console.log('- ' + row.table_name));
    }
    
    // Check pre_production_checklist_items
    const itemsCheck = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'pre_production_checklist_items'
    `);
    
    if (itemsCheck.rows[0].count === '0') {
      console.log('\n❌ pre_production_checklist_items table does not exist!');
    } else {
      const items = await client.query('SELECT COUNT(*) as count FROM pre_production_checklist_items');
      console.log('\n✅ pre_production_checklist_items: ' + items.rows[0].count + ' items');
    }
    
    // Check pre_production_checklists
    const checklistsCheck = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_name = 'pre_production_checklists'
    `);
    
    if (checklistsCheck.rows[0].count === '0') {
      console.log('❌ pre_production_checklists table does not exist!');
    } else {
      const checklists = await client.query('SELECT COUNT(*) as count FROM pre_production_checklists');
      console.log('✅ pre_production_checklists: ' + checklists.rows[0].count + ' records');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
