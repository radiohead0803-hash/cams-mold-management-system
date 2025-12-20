/**
 * 양산이관 요청 테이블 마이그레이션 스크립트
 */
require('dotenv').config();
const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting production transfer migration...');
    
    // 마이그레이션 SQL 파일 읽기
    const sqlPath = path.join(__dirname, '../migrations/20241220_production_transfer_requests.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // SQL 실행
    await sequelize.query(sql);
    
    console.log('Production transfer tables created successfully!');
    
    // 체크리스트 마스터 데이터 마이그레이션
    const masterDataPath = path.join(__dirname, '../migrations/20241220_production_transfer_checklist_master_data.sql');
    if (fs.existsSync(masterDataPath)) {
      const masterDataSql = fs.readFileSync(masterDataPath, 'utf8');
      await sequelize.query(masterDataSql);
      console.log('Checklist master data inserted successfully!');
    }
    
    // 결과 확인
    const [requests] = await sequelize.query(`
      SELECT COUNT(*) as count FROM production_transfer_requests
    `);
    console.log('Production transfer requests count:', requests[0].count);
    
    const [attachments] = await sequelize.query(`
      SELECT COUNT(*) as count FROM production_transfer_attachments
    `);
    console.log('Production transfer attachments count:', attachments[0].count);
    
    const [masterItems] = await sequelize.query(`
      SELECT COUNT(*) as count FROM production_transfer_checklist_master
    `);
    console.log('Checklist master items count:', masterItems[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
