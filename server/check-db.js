const { sequelize } = require('./src/models');

async function checkDB() {
  try {
    await sequelize.authenticate();
    console.log('=== DB 연결 성공 ===\n');

    // 1. 전체 테이블 목록
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    console.log(`=== 전체 테이블 (${tables.length}개) ===`);
    tables.forEach((t, i) => console.log(`  ${i + 1}. ${t.table_name}`));

    // 2. 각 테이블의 컬럼 수 + 행 수
    console.log('\n=== 테이블별 컬럼 수 / 행 수 ===');
    for (const t of tables) {
      const [cols] = await sequelize.query(
        `SELECT count(*) as cnt FROM information_schema.columns WHERE table_schema='public' AND table_name='${t.table_name}'`
      );
      let rowCount = '?';
      try {
        const [rows] = await sequelize.query(`SELECT count(*) as cnt FROM "${t.table_name}"`);
        rowCount = rows[0].cnt;
      } catch (e) {
        rowCount = 'ERR';
      }
      console.log(`  ${t.table_name}: ${cols[0].cnt} columns, ${rowCount} rows`);
    }

    // 3. 인덱스 목록
    const [indexes] = await sequelize.query(`
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname='public' 
      ORDER BY tablename, indexname
    `);
    console.log(`\n=== 인덱스 (${indexes.length}개) ===`);
    let prevTable = '';
    indexes.forEach(idx => {
      if (idx.tablename !== prevTable) {
        console.log(`\n  [${idx.tablename}]`);
        prevTable = idx.tablename;
      }
      console.log(`    ${idx.indexname}`);
    });

    // 4. Foreign Key 제약조건
    const [fks] = await sequelize.query(`
      SELECT
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `);
    console.log(`\n=== Foreign Keys (${fks.length}개) ===`);
    fks.forEach(fk => {
      console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

    // 5. UNIQUE 제약조건
    const [uniques] = await sequelize.query(`
      SELECT tc.table_name, tc.constraint_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `);
    console.log(`\n=== UNIQUE 제약조건 (${uniques.length}개) ===`);
    uniques.forEach(u => {
      console.log(`  ${u.table_name}: ${u.constraint_name} (${u.column_name})`);
    });

    // 6. drafts 테이블 상세 스키마
    const [draftsCols] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='drafts'
      ORDER BY ordinal_position
    `);
    console.log('\n=== drafts 테이블 상세 ===');
    draftsCols.forEach(c => {
      console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'} ${c.column_default || ''}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('점검 실패:', error.message);
    process.exit(1);
  }
}

checkDB();
