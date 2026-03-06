const { Sequelize } = require('sequelize');
const s = new Sequelize('postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway', {
  dialect: 'postgres', logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

(async () => {
  try {
    // NOT NULL 제약 확인
    const [cols] = await s.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name='inspection_photos' AND is_nullable='NO'
      ORDER BY ordinal_position
    `);
    console.log('NOT NULL 컬럼:', cols.map(c => c.column_name).join(', '));

    // file_name, original_name 등 nullable로 변경 (이전 코드 호환)
    const colsToFix = ['file_name', 'original_name', 'mime_type', 'category', 'inspection_type', 'checklist_type'];
    for (const col of colsToFix) {
      try {
        await s.query(`ALTER TABLE inspection_photos ALTER COLUMN ${col} DROP NOT NULL`);
        console.log(`  ✅ ${col} → nullable`);
      } catch (e) {
        console.log(`  ⏭️ ${col}: ${e.message.includes('does not exist') ? '컬럼 없음' : e.message}`);
      }
    }

    console.log('\n수정 후 NOT NULL 컬럼:');
    const [cols2] = await s.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns 
      WHERE table_name='inspection_photos' AND is_nullable='NO'
      ORDER BY ordinal_position
    `);
    console.log(cols2.map(c => c.column_name).join(', '));
  } catch (e) {
    console.error('❌ 오류:', e.message);
  } finally {
    await s.close();
  }
})();
