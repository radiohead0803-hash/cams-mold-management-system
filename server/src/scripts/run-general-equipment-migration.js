/**
 * 협력사 보유 장비현황 테이블 마이그레이션 스크립트
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const sequelize = new Sequelize(DATABASE_URL, { logging: false });

async function runMigration() {
  try {
    console.log('Starting general equipment migration...');
    
    const sqlPath = path.join(__dirname, '../migrations/20260310_general_equipment.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await sequelize.query(sql);
    
    console.log('Migration completed successfully!');
    
    const [cats] = await sequelize.query(`SELECT COUNT(*) as count FROM general_equipment_category`);
    console.log('Categories:', cats[0].count);
    
    const [masters] = await sequelize.query(`SELECT COUNT(*) as count FROM general_equipment_master`);
    console.log('Master equipment:', masters[0].count);
    
    const [byCat] = await sequelize.query(`
      SELECT c.category_code, c.category_name, c.applicable_to, COUNT(m.id) as master_count
      FROM general_equipment_category c
      LEFT JOIN general_equipment_master m ON m.category_id = c.id AND m.is_active = true
      GROUP BY c.id, c.category_code, c.category_name, c.applicable_to
      ORDER BY c.sort_order
    `);
    console.log('\nCategories with master data:');
    byCat.forEach(r => console.log(`  [${r.applicable_to}] ${r.category_code}: ${r.category_name} (${r.master_count})`));
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

runMigration();
