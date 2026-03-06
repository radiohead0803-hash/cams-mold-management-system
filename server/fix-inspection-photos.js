const { Sequelize } = require('sequelize');
const s = new Sequelize('postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway', {
  dialect: 'postgres', logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

(async () => {
  try {
    // item_status_id 컬럼 추가 (모델에 정의되어 있으나 DB에 없어서 INSERT 실패)
    await s.query('ALTER TABLE inspection_photos ADD COLUMN IF NOT EXISTS item_status_id INTEGER');
    console.log('✅ item_status_id 컬럼 추가 완료');

    // 확인
    const [rows] = await s.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='inspection_photos' ORDER BY ordinal_position"
    );
    console.log('현재 컬럼 목록:', rows.map(r => r.column_name).join(', '));
  } catch (e) {
    console.error('❌ 오류:', e.message);
  } finally {
    await s.close();
  }
})();
