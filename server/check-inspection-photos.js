const { Sequelize } = require('sequelize');
const s = new Sequelize('postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway', {
  dialect: 'postgres', logging: false,
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

(async () => {
  try {
    const [rows] = await s.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='inspection_photos' ORDER BY ordinal_position"
    );
    console.log('inspection_photos columns:');
    rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));
  } catch (e) {
    console.error(e.message);
  } finally {
    await s.close();
  }
})();
