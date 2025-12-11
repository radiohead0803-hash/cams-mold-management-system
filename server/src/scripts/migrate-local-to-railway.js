/**
 * 로컬 PostgreSQL에서 Railway DB로 데이터 이전 스크립트
 */

const { Client } = require('pg');

// 로컬 DB 연결 정보 (비밀번호 확인 필요)
// 일반적인 로컬 PostgreSQL 비밀번호 시도
const LOCAL_DB_URL = process.env.LOCAL_DB_URL || 'postgresql://postgres:1234@localhost:5432/cams';

// Railway DB 연결 정보
const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

// 이전할 테이블 목록 (순서 중요 - 외래키 의존성 고려)
const TABLES_TO_MIGRATE = [
  'users',
  'companies',
  'molds',
  'mold_specifications',
  'maker_specifications',
  'plant_molds',
  'mold_images',
  'mold_repairs',
  'repairs',
  'repair_progress',
  'inspections',
  'periodic_inspections',
  'periodic_inspection_items',
  'daily_checklists',
  'daily_checklist_items',
  'tryout_issues',
  'production_quantities',
  'qr_sessions',
  'gps_locations',
  'notifications',
  'alerts',
  'ng_records',
  'injection_conditions',
  'weight_history',
  'material_history',
  'materials',
  'tonnages',
  'mold_types',
  'car_models',
  'maker_info',
  'plant_info',
  'transfer_requests',
  'transfer_checklist_items',
  'transfer_approvals',
  'transfer_inspection_results',
  'production_transfer_requests',
  'production_transfer_checklist_master',
  'production_transfer_checklist_items',
  'production_transfer_approvals',
  'checklist_master_templates',
  'checklist_template_items',
  'checklist_template_deployments',
  'checklist_template_history',
  'user_requests',
  'company_revisions'
];

async function migrateData() {
  const localClient = new Client({ connectionString: LOCAL_DB_URL });
  const railwayClient = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 로컬 DB 연결 중...');
    await localClient.connect();
    console.log('✅ 로컬 DB 연결 성공!');

    console.log('🔗 Railway DB 연결 중...');
    await railwayClient.connect();
    console.log('✅ Railway DB 연결 성공!\n');

    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const tableName of TABLES_TO_MIGRATE) {
      try {
        // 로컬 테이블 존재 여부 확인
        const localExists = await localClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          )
        `, [tableName]);

        if (!localExists.rows[0].exists) {
          console.log(`  ⏭️ ${tableName}: 로컬에 없음`);
          totalSkipped++;
          continue;
        }

        // Railway 테이블 존재 여부 확인
        const railwayExists = await railwayClient.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = $1
          )
        `, [tableName]);

        if (!railwayExists.rows[0].exists) {
          console.log(`  ⏭️ ${tableName}: Railway에 테이블 없음`);
          totalSkipped++;
          continue;
        }

        // 로컬 데이터 조회
        const localData = await localClient.query(`SELECT * FROM ${tableName}`);
        
        if (localData.rows.length === 0) {
          console.log(`  ⏭️ ${tableName}: 데이터 없음`);
          totalSkipped++;
          continue;
        }

        // Railway 기존 데이터 수 확인
        const railwayCount = await railwayClient.query(`SELECT COUNT(*) FROM ${tableName}`);
        const existingCount = parseInt(railwayCount.rows[0].count);

        if (existingCount > 0) {
          console.log(`  ⚠️ ${tableName}: Railway에 이미 ${existingCount}개 데이터 존재 (건너뜀)`);
          totalSkipped++;
          continue;
        }

        // 컬럼 정보 가져오기
        const columns = Object.keys(localData.rows[0]);
        
        // 데이터 삽입
        let insertedCount = 0;
        for (const row of localData.rows) {
          try {
            const values = columns.map(col => row[col]);
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const columnNames = columns.map(c => `"${c}"`).join(', ');
            
            await railwayClient.query(
              `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
              values
            );
            insertedCount++;
          } catch (insertErr) {
            // 개별 행 삽입 오류는 무시하고 계속
          }
        }

        console.log(`  ✅ ${tableName}: ${insertedCount}/${localData.rows.length}개 이전 완료`);
        totalMigrated += insertedCount;

        // 시퀀스 업데이트 (id 컬럼이 있는 경우)
        if (columns.includes('id')) {
          try {
            await railwayClient.query(`
              SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), 
                COALESCE((SELECT MAX(id) FROM ${tableName}), 1), true)
            `);
          } catch (seqErr) {
            // 시퀀스 오류 무시
          }
        }

      } catch (tableErr) {
        console.log(`  ❌ ${tableName}: ${tableErr.message}`);
        totalErrors++;
      }
    }

    console.log('\n========================================');
    console.log('✅ 데이터 이전 완료!');
    console.log(`   이전된 레코드: ${totalMigrated}개`);
    console.log(`   건너뜀: ${totalSkipped}개 테이블`);
    console.log(`   오류: ${totalErrors}개 테이블`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await localClient.end();
    await railwayClient.end();
    console.log('🔌 DB 연결 종료');
  }
}

migrateData();
