const { Sequelize } = require('sequelize');
const dbUrl = process.env.DATABASE_URL;
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false, dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } });

async function checkDB() {
  try {
    await sequelize.authenticate();
    console.log('DB OK\n');

    // 1. 전체 테이블 + 행수
    const [tables] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    console.log('[TABLES] total=' + tables.length);
    for (let i = 0; i < tables.length; i++) {
      const tn = tables[i].tablename;
      if (!tn) continue;
      let rc = 0;
      try { const [r] = await sequelize.query('SELECT count(*)::int as cnt FROM "' + tn + '"'); rc = r[0].cnt; } catch(e) { rc = -1; }
      console.log((i+1) + '. ' + tn + ' rows=' + rc);
    }

    // 2. FK 요약
    const [fks] = await sequelize.query(
      "SELECT tc.table_name, count(*) as fk_count FROM information_schema.table_constraints tc WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' GROUP BY tc.table_name ORDER BY tc.table_name"
    );
    const totalFk = fks.reduce(function(s, f) { return s + parseInt(f.fk_count); }, 0);
    console.log('\n=== FK 현황 (총 ' + totalFk + '개) ===');
    fks.forEach(function(f) { console.log('  ' + f.table_name + ': ' + f.fk_count + '개'); });

    // 3. 인덱스 요약
    const [idxs] = await sequelize.query(
      "SELECT tablename, count(*) as idx_count FROM pg_indexes WHERE schemaname='public' GROUP BY tablename ORDER BY tablename"
    );
    const totalIdx = idxs.reduce(function(s, i) { return s + parseInt(i.idx_count); }, 0);
    console.log('\n=== 인덱스 현황 (총 ' + totalIdx + '개) ===');
    idxs.forEach(function(i) { console.log('  ' + i.tablename + ': ' + i.idx_count + '개'); });

    // 4. UNIQUE 제약조건 수
    const [uniques] = await sequelize.query(
      "SELECT count(*) as cnt FROM information_schema.table_constraints WHERE constraint_type = 'UNIQUE' AND table_schema = 'public'"
    );
    console.log('\n=== UNIQUE 제약조건: ' + uniques[0].cnt + '개 ===');

    // 5. 빈 테이블 (0행)
    console.log('\n=== 데이터 없는 테이블 (0행) ===');
    let emptyCount = 0;
    for (let i = 0; i < tables.length; i++) {
      const tn = tables[i].table_name;
      if (!tn) continue;
      try {
        const [rows] = await sequelize.query('SELECT count(*) as cnt FROM "' + tn + '"');
        if (parseInt(rows[0].cnt) === 0) {
          console.log('  ' + tn);
          emptyCount++;
        }
      } catch (e) {}
    }
    console.log('  총 ' + emptyCount + '개 빈 테이블');

    process.exit(0);
  } catch (error) {
    console.error('점검 실패:', error.message);
    process.exit(1);
  }
}

checkDB();
