const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const sequelize = new Sequelize(DATABASE_URL, { dialect: 'postgres', logging: false });

async function systemCheck() {
  try {
    await sequelize.authenticate();
    console.log('=== 1. DATABASE TABLES ===');
    const [tables] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    console.log('Total tables:', tables.length);
    tables.forEach(t => console.log('  ' + t.tablename));

    console.log('\n=== 2. TABLES WITH ROW COUNTS ===');
    for (const t of tables) {
      try {
        const [[{ count }]] = await sequelize.query(
          `SELECT COUNT(*) as count FROM "${t.tablename}"`
        );
        if (parseInt(count) > 0) {
          console.log(`  ${t.tablename}: ${count} rows`);
        }
      } catch (e) {
        console.log(`  ${t.tablename}: ERROR - ${e.message.substring(0, 50)}`);
      }
    }

    console.log('\n=== 3. SEQUELIZE MODELS ===');
    const modelsDir = path.join(__dirname, 'src', 'models');
    const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js') && f !== 'index.js' && f !== 'newIndex.js');
    console.log('Model files:', modelFiles.length);
    modelFiles.forEach(f => console.log('  ' + f));

    console.log('\n=== 4. BACKEND ROUTES ===');
    const routesDir = path.join(__dirname, 'src', 'routes');
    const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
    console.log('Route files:', routeFiles.length);
    routeFiles.forEach(f => console.log('  ' + f));

    console.log('\n=== 5. APP.JS ROUTE REGISTRATIONS ===');
    const appContent = fs.readFileSync(path.join(__dirname, 'src', 'app.js'), 'utf8');
    const routeRegs = appContent.match(/app\.use\(['"]\/api\/v1\/[^'"]+['"]/g) || [];
    console.log('Registered API routes:', routeRegs.length);
    routeRegs.forEach(r => {
      const match = r.match(/['"]\/api\/v1\/([^'"]+)['"]/);
      if (match) console.log('  /api/v1/' + match[1]);
    });

    // Check which route files are NOT registered
    console.log('\n=== 6. UNREGISTERED ROUTE FILES ===');
    const registeredRouters = appContent.match(/require\('\.\/routes\/([^']+)'\)/g) || [];
    const registeredNames = registeredRouters.map(r => {
      const m = r.match(/require\('\.\/routes\/([^']+)'\)/);
      return m ? m[1] + '.js' : null;
    }).filter(Boolean);
    
    const unregistered = routeFiles.filter(f => !registeredNames.includes(f));
    if (unregistered.length > 0) {
      console.log('WARNING - Route files not imported in app.js:');
      unregistered.forEach(f => console.log('  ' + f));
    } else {
      console.log('All route files are registered.');
    }

    console.log('\n=== 7. CHECKLIST_INSTANCES TABLE CHECK ===');
    const [ciCols] = await sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='checklist_instances' ORDER BY ordinal_position"
    );
    console.log('checklist_instances columns:', ciCols.length);
    ciCols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

    console.log('\n=== 8. REPAIR_REQUESTS KEY COLUMNS CHECK ===');
    const keyColumns = ['plant_id', 'workflow_status', 'developer_id', 'maker_company_id', 'status', 'mold_id'];
    for (const col of keyColumns) {
      const [res] = await sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name='repair_requests' AND column_name='${col}'`
      );
      console.log(`  ${col}: ${res.length > 0 ? 'EXISTS' : 'MISSING'}`);
    }

    console.log('\n=== 9. USERS TABLE CHECK ===');
    const [userTypes] = await sequelize.query(
      "SELECT user_type, COUNT(*) as cnt FROM users GROUP BY user_type ORDER BY user_type"
    );
    userTypes.forEach(u => console.log(`  ${u.user_type}: ${u.cnt} users`));

    console.log('\n=== 10. FRONTEND PAGES ===');
    const pagesDir = path.join(__dirname, '..', 'client', 'src', 'pages');
    const countFiles = (dir) => {
      let count = 0;
      if (!fs.existsSync(dir)) return 0;
      fs.readdirSync(dir).forEach(f => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) count += countFiles(full);
        else if (f.match(/\.(jsx|tsx)$/)) count++;
      });
      return count;
    };
    console.log('Total page components:', countFiles(pagesDir));

    const mobilePagesDir = path.join(pagesDir, 'mobile');
    if (fs.existsSync(mobilePagesDir)) {
      const mobilePages = fs.readdirSync(mobilePagesDir).filter(f => f.match(/\.(jsx|tsx)$/));
      console.log('Mobile page components:', mobilePages.length);
    }

    console.log('\n=== 11. MIGRATION FILES ===');
    const migrationsDir = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migFiles = fs.readdirSync(migrationsDir);
      console.log('Migration files:', migFiles.length);
      migFiles.forEach(f => console.log('  ' + f));
    }

    const srcMigrationsDir = path.join(__dirname, 'src', 'migrations');
    if (fs.existsSync(srcMigrationsDir)) {
      const srcMigFiles = fs.readdirSync(srcMigrationsDir).filter(f => f.endsWith('.js'));
      console.log('Sequelize migration files:', srcMigFiles.length);
      srcMigFiles.forEach(f => console.log('  ' + f));
    }

    console.log('\n=== SYSTEM CHECK COMPLETE ===');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

systemCheck();
