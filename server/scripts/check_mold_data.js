/**
 * 금형 데이터 일치 여부 확인 스크립트
 */
const { sequelize } = require('../src/models');

async function checkMoldData() {
  try {
    console.log('=== 금형 데이터 확인 ===\n');

    // 1. mold_specifications 테이블 (개발금형현황)
    console.log('[1. mold_specifications 테이블]');
    const [specs] = await sequelize.query(`
      SELECT id, mold_code, part_name, status, current_location 
      FROM mold_specifications 
      ORDER BY id
    `);
    console.log(`  총 ${specs.length}개`);
    specs.forEach(s => console.log(`    - ID:${s.id} ${s.mold_code} | ${s.part_name} | 상태:${s.status} | 위치:${s.current_location}`));

    // 2. molds 테이블 (금형관리 마스터)
    console.log('\n[2. molds 테이블]');
    const [molds] = await sequelize.query(`
      SELECT id, mold_number, part_name, status, current_location 
      FROM molds 
      ORDER BY id
    `);
    console.log(`  총 ${molds.length}개`);
    molds.forEach(m => console.log(`    - ID:${m.id} ${m.mold_number} | ${m.part_name} | 상태:${m.status} | 위치:${m.current_location}`));

    // 3. gps_locations 테이블 (금형위치현황)
    console.log('\n[3. gps_locations 테이블]');
    const [gps] = await sequelize.query(`
      SELECT id, mold_id, mold_specification_id, location_name, is_current 
      FROM gps_locations 
      WHERE is_current = true
      ORDER BY id
    `);
    console.log(`  현재 위치 ${gps.length}개`);
    gps.forEach(g => console.log(`    - ID:${g.id} mold_id:${g.mold_id} spec_id:${g.mold_specification_id} | ${g.location_name}`));

    // 4. 불일치 확인
    console.log('\n[4. 불일치 확인]');
    
    // mold_specifications에는 있지만 gps_locations에 없는 것
    const [missingGps] = await sequelize.query(`
      SELECT ms.id, ms.mold_code, ms.part_name
      FROM mold_specifications ms
      LEFT JOIN gps_locations gl ON gl.mold_specification_id = ms.id AND gl.is_current = true
      WHERE gl.id IS NULL
    `);
    console.log(`  GPS 위치 없는 금형: ${missingGps.length}개`);
    missingGps.forEach(m => console.log(`    - ${m.mold_code} (${m.part_name})`));

    // mold_specifications와 molds 연결 확인
    const [linkedMolds] = await sequelize.query(`
      SELECT ms.id as spec_id, ms.mold_code, ms.mold_id, m.id as mold_table_id, m.mold_number
      FROM mold_specifications ms
      LEFT JOIN molds m ON ms.mold_id = m.id
      ORDER BY ms.id
    `);
    console.log(`\n  mold_specifications -> molds 연결:`);
    linkedMolds.slice(0, 10).forEach(l => {
      console.log(`    - spec_id:${l.spec_id} ${l.mold_code} -> mold_id:${l.mold_id} (molds.id:${l.mold_table_id || 'NULL'})`);
    });
    if (linkedMolds.length > 10) console.log(`    ... 외 ${linkedMolds.length - 10}개`);

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkMoldData();
