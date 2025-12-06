/**
 * repairs 테이블 스키마 수정 스크립트
 * 누락된 컬럼들을 추가합니다.
 */
const { sequelize } = require('../src/models');

async function fixRepairsSchema() {
  try {
    console.log('=== repairs 테이블 스키마 수정 ===\n');

    // 추가할 컬럼 목록
    const columnsToAdd = [
      { name: 'mold_id', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS mold_id INTEGER REFERENCES molds(id)' },
      { name: 'requested_by', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS requested_by INTEGER REFERENCES users(id)' },
      { name: 'request_date', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()' },
      { name: 'issue_description', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS issue_description TEXT' },
      { name: 'current_shots', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS current_shots INTEGER DEFAULT 0' },
      { name: 'photos', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT \'[]\'::jsonb' },
      { name: 'documents', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT \'[]\'::jsonb' },
      { name: 'estimated_cost', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(15,2)' },
      { name: 'estimated_days', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS estimated_days INTEGER' },
      { name: 'target_completion_date', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS target_completion_date DATE' },
      { name: 'assigned_to', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id)' },
      { name: 'approved_by', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id)' },
      { name: 'approved_at', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE' },
      { name: 'started_at', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE' },
      { name: 'completed_at', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE' },
      { name: 'actual_cost', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(15,2)' },
      { name: 'actual_days', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS actual_days INTEGER' },
      { name: 'completion_notes', sql: 'ALTER TABLE repairs ADD COLUMN IF NOT EXISTS completion_notes TEXT' }
    ];

    for (const col of columnsToAdd) {
      try {
        await sequelize.query(col.sql);
        console.log(`✅ ${col.name} 컬럼 추가 완료`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⏭️ ${col.name} 컬럼 이미 존재`);
        } else {
          console.log(`❌ ${col.name} 컬럼 추가 실패: ${err.message}`);
        }
      }
    }

    console.log('\n=== 수정 후 컬럼 목록 ===');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'repairs' 
      ORDER BY ordinal_position
    `);
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    console.log('\n✅ repairs 테이블 스키마 수정 완료!');

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

fixRepairsSchema();
