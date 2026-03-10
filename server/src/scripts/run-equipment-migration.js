/**
 * 장비 마스터 + 업체별 보유장비 테이블 마이그레이션 스크립트
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const sequelize = new Sequelize(DATABASE_URL, { logging: false });

async function runMigration() {
  try {
    console.log('Starting equipment master & company equipment migration...');
    
    const sqlPath = path.join(__dirname, '../migrations/20260310_equipment_master_and_company_equipment.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await sequelize.query(sql);
    
    console.log('Migration completed successfully!');
    
    // 결과 확인
    const [masters] = await sequelize.query(`SELECT COUNT(*) as count FROM equipment_master`);
    console.log('Equipment master records:', masters[0].count);
    
    const [compEquip] = await sequelize.query(`SELECT COUNT(*) as count FROM company_equipment`);
    console.log('Company equipment records:', compEquip[0].count);
    
    const [byType] = await sequelize.query(`
      SELECT equipment_type, COUNT(*) as count 
      FROM equipment_master 
      WHERE is_active = true 
      GROUP BY equipment_type
    `);
    console.log('Master by type:', byType);
    
    const [byCompany] = await sequelize.query(`
      SELECT c.company_name, COUNT(ce.id) as equipment_count
      FROM company_equipment ce
      JOIN companies c ON c.id = ce.company_id
      WHERE ce.is_active = true
      GROUP BY c.company_name
      ORDER BY equipment_count DESC
    `);
    console.log('Equipment by company:', byCompany);
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

runMigration();
