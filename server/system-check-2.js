const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const sequelize = new Sequelize(DATABASE_URL, { dialect: 'postgres', logging: false });

async function systemCheck2() {
  try {
    await sequelize.authenticate();

    // 1. DB 테이블 vs 모델 매칭 확인
    console.log('=== 1. DB TABLES vs MODELS ===');
    const [tables] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    const tableNames = tables.map(t => t.tablename);
    
    // 모델에서 tableName 추출
    const modelsDir = path.join(__dirname, 'src', 'models');
    const modelFiles = fs.readdirSync(modelsDir).filter(f => 
      f.endsWith('.js') && f !== 'index.js' && f !== 'newIndex.js'
    );
    
    const modelTableNames = [];
    for (const mf of modelFiles) {
      const content = fs.readFileSync(path.join(modelsDir, mf), 'utf8');
      const match = content.match(/tableName:\s*['"]([\w]+)['"]/);
      if (match) {
        modelTableNames.push({ model: mf, table: match[1] });
      }
    }
    
    // 모델에 있지만 DB에 없는 테이블
    const missingInDb = modelTableNames.filter(m => !tableNames.includes(m.table));
    if (missingInDb.length > 0) {
      console.log('MODELS without DB table:');
      missingInDb.forEach(m => console.log(`  ${m.model} -> ${m.table} (MISSING IN DB)`));
    } else {
      console.log('All model tables exist in DB.');
    }
    
    // DB에 있지만 모델 없는 테이블
    const modelTables = modelTableNames.map(m => m.table);
    const noModel = tableNames.filter(t => !modelTables.includes(t) && t !== 'SequelizeMeta');
    if (noModel.length > 0) {
      console.log('DB tables without Model:');
      noModel.forEach(t => console.log(`  ${t}`));
    }

    // 2. 빈 테이블 vs 데이터 있는 테이블
    console.log('\n=== 2. EMPTY TABLES ===');
    const emptyTables = [];
    for (const t of tableNames) {
      try {
        const [[{ count }]] = await sequelize.query(`SELECT COUNT(*) as count FROM "${t}"`);
        if (parseInt(count) === 0) emptyTables.push(t);
      } catch(e) {}
    }
    console.log(`Empty tables (${emptyTables.length}/${tableNames.length}):`);
    emptyTables.forEach(t => console.log(`  ${t}`));

    // 3. 프론트엔드에서 사용하는 API 경로 추출
    console.log('\n=== 3. FRONTEND API CALLS ===');
    const clientSrcDir = path.join(__dirname, '..', 'client', 'src');
    const apiCalls = new Set();
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      fs.readdirSync(dir).forEach(f => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
          scanDir(full);
        } else if (f.match(/\.(jsx|tsx|js|ts)$/) && !f.includes('.d.ts')) {
          const content = fs.readFileSync(full, 'utf8');
          // api.get/post/put/delete/patch patterns
          const matches = content.matchAll(/api\.(get|post|put|delete|patch)\s*\(\s*[`'"]([^`'"]+)/g);
          for (const m of matches) {
            let endpoint = m[2];
            // Remove template literal variables
            endpoint = endpoint.replace(/\$\{[^}]+\}/g, ':param');
            apiCalls.add(`${m[1].toUpperCase()} ${endpoint}`);
          }
        }
      });
    };
    scanDir(clientSrcDir);
    
    const sortedCalls = [...apiCalls].sort();
    console.log(`Unique API calls from frontend: ${sortedCalls.length}`);
    sortedCalls.forEach(c => console.log(`  ${c}`));

    // 4. newIndex.js 모델 로드 확인
    console.log('\n=== 4. MODEL EXPORTS CHECK ===');
    const newIndexContent = fs.readFileSync(path.join(modelsDir, 'newIndex.js'), 'utf8');
    const exportedModels = newIndexContent.match(/(\w+):\s*(\w+)/g) || [];
    console.log(`Models exported from newIndex.js: ${exportedModels.length}`);

    // 5. 컨트롤러 파일 확인
    console.log('\n=== 5. CONTROLLERS ===');
    const controllersDir = path.join(__dirname, 'src', 'controllers');
    if (fs.existsSync(controllersDir)) {
      const controllerFiles = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
      console.log(`Controller files: ${controllerFiles.length}`);
      controllerFiles.forEach(f => console.log(`  ${f}`));
    }

    // 6. 미들웨어 확인
    console.log('\n=== 6. MIDDLEWARE ===');
    const middlewareDir = path.join(__dirname, 'src', 'middleware');
    if (fs.existsSync(middlewareDir)) {
      const mwFiles = fs.readdirSync(middlewareDir).filter(f => f.endsWith('.js'));
      console.log(`Middleware files: ${mwFiles.length}`);
      mwFiles.forEach(f => console.log(`  ${f}`));
    }

    console.log('\n=== SYSTEM CHECK 2 COMPLETE ===');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

systemCheck2();
