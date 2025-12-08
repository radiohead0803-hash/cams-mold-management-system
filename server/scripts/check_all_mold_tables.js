/**
 * 금형 관련 모든 테이블 데이터 확인
 */
const { sequelize } = require('../src/models');

async function checkAllMoldTables() {
  try {
    console.log('=== 금형 관련 테이블 확인 ===\n');

    // 1. mold_specifications (본사 입력)
    console.log('[1. mold_specifications - 본사 입력]');
    const [specs] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'mold_specifications' ORDER BY ordinal_position
    `);
    console.log('  컬럼:', specs.map(c => c.column_name).join(', '));
    const [specCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM mold_specifications`);
    console.log(`  데이터: ${specCount[0].cnt}개`);

    // 2. maker_specifications (제작처 입력)
    console.log('\n[2. maker_specifications - 제작처 입력]');
    const [makerSpecs] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'maker_specifications' ORDER BY ordinal_position
    `);
    if (makerSpecs.length > 0) {
      console.log('  컬럼:', makerSpecs.map(c => c.column_name).join(', '));
      const [makerCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM maker_specifications`);
      console.log(`  데이터: ${makerCount[0].cnt}개`);
    } else {
      console.log('  테이블 없음');
    }

    // 3. plant_molds (생산처 입력)
    console.log('\n[3. plant_molds - 생산처 입력]');
    const [plantMolds] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'plant_molds' ORDER BY ordinal_position
    `);
    if (plantMolds.length > 0) {
      console.log('  컬럼:', plantMolds.map(c => c.column_name).join(', '));
      const [plantCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM plant_molds`);
      console.log(`  데이터: ${plantCount[0].cnt}개`);
    } else {
      console.log('  테이블 없음');
    }

    // 4. molds 테이블
    console.log('\n[4. molds - 통합 금형 테이블]');
    const [molds] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'molds' ORDER BY ordinal_position
    `);
    console.log('  컬럼:', molds.map(c => c.column_name).join(', '));
    const [moldCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM molds`);
    console.log(`  데이터: ${moldCount[0].cnt}개`);

    // 5. repair_requests (수리 요청)
    console.log('\n[5. repair_requests - 수리 요청]');
    const [repairs] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'repair_requests' ORDER BY ordinal_position
    `);
    if (repairs.length > 0) {
      console.log('  컬럼:', repairs.map(c => c.column_name).join(', '));
      const [repairCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM repair_requests`);
      console.log(`  데이터: ${repairCount[0].cnt}개`);
    } else {
      console.log('  테이블 없음');
    }

    // 6. daily_check_records (일상점검)
    console.log('\n[6. daily_check_records - 일상점검]');
    const [dailyChecks] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'daily_check_records' ORDER BY ordinal_position
    `);
    if (dailyChecks.length > 0) {
      console.log('  컬럼:', dailyChecks.map(c => c.column_name).join(', '));
      const [dailyCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM daily_check_records`);
      console.log(`  데이터: ${dailyCount[0].cnt}개`);
    } else {
      console.log('  테이블 없음');
    }

    // 7. periodic_inspections (정기점검)
    console.log('\n[7. periodic_inspections - 정기점검]');
    const [periodic] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'periodic_inspections' ORDER BY ordinal_position
    `);
    if (periodic.length > 0) {
      console.log('  컬럼:', periodic.map(c => c.column_name).join(', '));
      const [periodicCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM periodic_inspections`);
      console.log(`  데이터: ${periodicCount[0].cnt}개`);
    } else {
      console.log('  테이블 없음');
    }

    // 8. production_records (생산 기록)
    console.log('\n[8. production_records - 생산 기록]');
    const [production] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'production_records' ORDER BY ordinal_position
    `);
    if (production.length > 0) {
      console.log('  컬럼:', production.map(c => c.column_name).join(', '));
      const [prodCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM production_records`);
      console.log(`  데이터: ${prodCount[0].cnt}개`);
    } else {
      console.log('  테이블 없음');
    }

    console.log('\n=== 확인 완료 ===');

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkAllMoldTables();
