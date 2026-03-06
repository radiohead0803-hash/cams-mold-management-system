const { Sequelize } = require('sequelize');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const sequelize = new Sequelize(DATABASE_URL, { dialect: 'postgres', logging: false });

async function check() {
  try {
    await sequelize.authenticate();

    // 1. 빈 테이블 목록
    console.log('=== EMPTY TABLES ===');
    const [tables] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    for (const t of tables) {
      try {
        const [[{ count }]] = await sequelize.query(`SELECT COUNT(*) as count FROM "${t.tablename}"`);
        if (parseInt(count) === 0) console.log(`  ${t.tablename}`);
      } catch(e) {}
    }

    // 2. DB tables without model
    console.log('\n=== DB TABLES WITHOUT MODEL ===');
    const fs = require('fs');
    const path = require('path');
    const modelsDir = path.join(__dirname, 'src', 'models');
    const modelFiles = fs.readdirSync(modelsDir).filter(f => 
      f.endsWith('.js') && f !== 'index.js' && f !== 'newIndex.js'
    );
    const modelTableNames = [];
    for (const mf of modelFiles) {
      const content = fs.readFileSync(path.join(modelsDir, mf), 'utf8');
      const match = content.match(/tableName:\s*['"]([\w]+)['"]/);
      if (match) modelTableNames.push(match[1]);
    }
    const tableNames = tables.map(t => t.tablename);
    const noModel = tableNames.filter(t => !modelTableNames.includes(t) && t !== 'SequelizeMeta');
    noModel.forEach(t => console.log(`  ${t}`));

    // 3. Missing tables details - check model definitions
    console.log('\n=== MISSING TABLE DETAILS ===');
    const missingTables = ['approvals', 'checklist_answers', 'checklist_templates',
      'checklist_template_deployment', 'mold_events', 'mold_location_logs',
      'repair_request_items', 'shots', 'system_rules', 'transfers'];
    
    for (const tbl of missingTables) {
      // Find the model file
      for (const mf of modelFiles) {
        const content = fs.readFileSync(path.join(modelsDir, mf), 'utf8');
        const match = content.match(/tableName:\s*['"]([\w]+)['"]/);
        if (match && match[1] === tbl) {
          // Count the fields
          const fields = content.match(/(\w+):\s*\{\s*type:/g) || [];
          console.log(`  ${tbl} (${mf}) - ${fields.length} fields`);
          break;
        }
      }
    }

    // 4. Check newIndex.js for model associations errors
    console.log('\n=== MODEL ASSOCIATION ISSUES ===');
    const newIndexContent = fs.readFileSync(path.join(modelsDir, 'newIndex.js'), 'utf8');
    // Check if all models are properly loaded
    const defineMatches = newIndexContent.match(/define\w*\(/g) || [];
    const requireMatches = newIndexContent.match(/require\('\.\/(\w+)'\)/g) || [];
    console.log(`  Models required: ${requireMatches.length}`);
    console.log(`  Models in db object: ${(newIndexContent.match(/db\.\w+\s*=/g) || []).length}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}
check();
