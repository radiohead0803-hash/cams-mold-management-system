/**
 * maker_specifications와 plant_molds 테스트 데이터 추가
 */
const { sequelize } = require('../src/models');

async function addTestData() {
  try {
    console.log('=== 제작처/생산처 테스트 데이터 추가 ===\n');

    // 1. mold_specifications ID 조회
    console.log('[1. mold_specifications 조회]');
    const [specs] = await sequelize.query(`
      SELECT id, mold_code, part_name FROM mold_specifications ORDER BY id LIMIT 20
    `);
    console.log(`  ${specs.length}개 조회됨`);

    // 2. maker_specifications 테스트 데이터 추가
    console.log('\n[2. maker_specifications 데이터 추가]');
    
    const makerStages = ['설계', '가공', '조립', '시운전', '완료'];
    const qualityChecks = ['대기', '진행중', '합격', '불합격'];
    
    let makerCount = 0;
    for (let i = 0; i < Math.min(specs.length, 15); i++) {
      const spec = specs[i];
      const progress = Math.floor(Math.random() * 100);
      const stageIndex = Math.floor(progress / 20);
      const stage = makerStages[Math.min(stageIndex, makerStages.length - 1)];
      const quality = progress >= 80 ? '합격' : (progress >= 50 ? '진행중' : '대기');
      
      // 이미 존재하는지 확인
      const [existing] = await sequelize.query(`
        SELECT id FROM maker_specifications WHERE mold_spec_id = ${spec.id}
      `);
      
      if (existing.length === 0) {
        const designStart = new Date();
        designStart.setDate(designStart.getDate() - Math.floor(Math.random() * 60) - 30);
        
        const designEnd = new Date(designStart);
        designEnd.setDate(designEnd.getDate() + Math.floor(Math.random() * 20) + 10);
        
        const mfgStart = new Date(designEnd);
        mfgStart.setDate(mfgStart.getDate() + Math.floor(Math.random() * 5));
        
        const mfgEnd = progress >= 100 ? new Date() : null;
        
        await sequelize.query(`
          INSERT INTO maker_specifications 
          (mold_spec_id, design_start_date, design_end_date, manufacturing_start_date, manufacturing_end_date, 
           production_progress, current_stage, technical_notes, quality_check, maker_notes, created_at, updated_at)
          VALUES 
          (${spec.id}, '${designStart.toISOString().split('T')[0]}', '${designEnd.toISOString().split('T')[0]}', 
           '${mfgStart.toISOString().split('T')[0]}', ${mfgEnd ? `'${mfgEnd.toISOString().split('T')[0]}'` : 'NULL'},
           ${progress}, '${stage}', '${spec.part_name} 제작 진행 중', '${quality}', 
           '제작처 테스트 데이터', NOW(), NOW())
        `);
        makerCount++;
      }
    }
    console.log(`  ${makerCount}개 추가됨`);

    // 3. plant_molds 테스트 데이터 추가
    console.log('\n[3. plant_molds 데이터 추가]');
    
    const locations = ['A공장 1라인', 'A공장 2라인', 'B공장 1라인', 'B공장 2라인', 'C공장'];
    
    let plantCount = 0;
    for (let i = 0; i < Math.min(specs.length, 10); i++) {
      const spec = specs[i];
      
      // 이미 존재하는지 확인
      const [existing] = await sequelize.query(`
        SELECT id FROM plant_molds WHERE mold_spec_id = ${spec.id}
      `);
      
      if (existing.length === 0) {
        const installDate = new Date();
        installDate.setDate(installDate.getDate() - Math.floor(Math.random() * 180) - 30);
        
        const totalShots = Math.floor(Math.random() * 500000) + 10000;
        const targetShots = Math.floor(Math.random() * 300000) + 500000;
        
        const lastMaintenance = new Date();
        lastMaintenance.setDate(lastMaintenance.getDate() - Math.floor(Math.random() * 30));
        
        const nextMaintenance = new Date();
        nextMaintenance.setDate(nextMaintenance.getDate() + Math.floor(Math.random() * 30) + 7);
        
        const location = locations[i % locations.length];
        
        await sequelize.query(`
          INSERT INTO plant_molds 
          (mold_spec_id, plant_id, installation_date, total_shots, target_shots, 
           last_maintenance_date, next_maintenance_date, current_location, plant_notes, created_at, updated_at)
          VALUES 
          (${spec.id}, 1, '${installDate.toISOString().split('T')[0]}', ${totalShots}, ${targetShots},
           '${lastMaintenance.toISOString().split('T')[0]}', '${nextMaintenance.toISOString().split('T')[0]}',
           '${location}', '생산처 테스트 데이터', NOW(), NOW())
        `);
        plantCount++;
      }
    }
    console.log(`  ${plantCount}개 추가됨`);

    // 4. 최종 확인
    console.log('\n[4. 최종 확인]');
    const [makerFinal] = await sequelize.query(`SELECT COUNT(*) as cnt FROM maker_specifications`);
    const [plantFinal] = await sequelize.query(`SELECT COUNT(*) as cnt FROM plant_molds`);
    console.log(`  maker_specifications: ${makerFinal[0].cnt}개`);
    console.log(`  plant_molds: ${plantFinal[0].cnt}개`);

    // 5. 샘플 데이터 출력
    console.log('\n[5. 샘플 데이터]');
    const [makerSample] = await sequelize.query(`
      SELECT ms.mold_spec_id, mk.production_progress, mk.current_stage, mk.quality_check
      FROM maker_specifications mk
      JOIN mold_specifications ms ON mk.mold_spec_id = ms.id
      LIMIT 5
    `);
    console.log('  maker_specifications:');
    makerSample.forEach(m => console.log(`    - spec_id:${m.mold_spec_id} | ${m.production_progress}% | ${m.current_stage} | ${m.quality_check}`));

    const [plantSample] = await sequelize.query(`
      SELECT pm.mold_spec_id, pm.total_shots, pm.current_location
      FROM plant_molds pm
      LIMIT 5
    `);
    console.log('  plant_molds:');
    plantSample.forEach(p => console.log(`    - spec_id:${p.mold_spec_id} | ${p.total_shots}타 | ${p.current_location}`));

    console.log('\n=== 완료 ===');

  } catch (error) {
    console.error('오류:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addTestData();
