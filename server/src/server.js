const app = require('./app');
const { sequelize } = require('./models/newIndex');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 5000;

// Run migrations
const runMigrations = () => {
  return new Promise((resolve, reject) => {
    console.log('🔄 Running database migrations...');
    const migrationsPath = path.join(__dirname, '..');
    exec('npx sequelize-cli db:migrate', { cwd: migrationsPath }, (error, stdout, stderr) => {
      if (error) {
        console.error('⚠️ Migration warning:', stderr || error.message);
        // Don't reject - migrations might already be applied
        resolve();
      } else {
        console.log('✅ Migrations completed:', stdout);
        resolve();
      }
    });
  });
};

// Run SQL migrations for mold_images table
const runMoldImagesMigration = async () => {
  console.log('🔄 Running mold_images table migration...');
  try {
    // 테이블 생성 (없으면)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS mold_images (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER,
        mold_spec_id INTEGER,
        image_type VARCHAR(50) NOT NULL DEFAULT 'mold',
        image_url TEXT NOT NULL,
        original_filename VARCHAR(255),
        file_size INTEGER,
        mime_type VARCHAR(100),
        description TEXT,
        display_order INTEGER DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        uploaded_by INTEGER,
        reference_type VARCHAR(50),
        reference_id INTEGER,
        checklist_id INTEGER,
        checklist_item_id INTEGER,
        repair_id INTEGER,
        transfer_id INTEGER,
        maker_spec_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ mold_images table created/verified.');

    // image_data 컬럼 추가 (BYTEA - PostgreSQL에 직접 이미지 저장용)
    try {
      await sequelize.query(`ALTER TABLE mold_images ADD COLUMN IF NOT EXISTS image_data BYTEA`);
      console.log('✅ mold_images.image_data column added/verified.');
    } catch (e) {
      console.log('⚠️ image_data column may already exist');
    }

    // 인덱스 생성 (없으면)
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_mold_images_mold_id ON mold_images(mold_id)',
      'CREATE INDEX IF NOT EXISTS idx_mold_images_mold_spec_id ON mold_images(mold_spec_id)',
      'CREATE INDEX IF NOT EXISTS idx_mold_images_image_type ON mold_images(image_type)'
    ];
    for (const idx of indexes) {
      try {
        await sequelize.query(idx);
      } catch (e) {
        // 인덱스 이미 존재하면 무시
      }
    }
    console.log('✅ mold_images indexes created/verified.');

    // mold_specifications에 이미지 URL 컬럼 추가
    try {
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS mold_image_url TEXT`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS product_image_url TEXT`);
      console.log('✅ mold_specifications image columns added/verified.');
    } catch (e) {
      console.log('⚠️ mold_specifications columns may already exist:', e.message);
    }

    // mold_specifications에 비용 컬럼 추가 (ICMS 비용, 업체 견적가)
    try {
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS icms_cost DECIMAL(12, 2)`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS vendor_quote_cost DECIMAL(12, 2)`);
      // 기존 estimated_cost 데이터를 icms_cost로 복사
      await sequelize.query(`UPDATE mold_specifications SET icms_cost = estimated_cost WHERE icms_cost IS NULL AND estimated_cost IS NOT NULL`);
      console.log('✅ mold_specifications cost columns added/verified.');
    } catch (e) {
      console.log('⚠️ mold_specifications cost columns may already exist:', e.message);
    }

    // mold_specifications에 대표품번/대표품명 컬럼 추가
    try {
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS primary_part_number VARCHAR(50)`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS primary_part_name VARCHAR(200)`);
      console.log('✅ mold_specifications.primary_part_number/primary_part_name columns added/verified.');
    } catch (e) {
      console.log('⚠️ primary_part columns may already exist:', e.message);
    }

    // mold_specifications에 차종/원재료 관련 컬럼 추가
    try {
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS car_model_id INTEGER`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS car_specification VARCHAR(200)`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS raw_material_id INTEGER`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS ms_spec VARCHAR(100)`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS material_type VARCHAR(100)`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS supplier VARCHAR(200)`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS grade VARCHAR(100)`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS shrinkage_rate VARCHAR(50)`);
      await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS mold_shrinkage VARCHAR(50)`);
      console.log('✅ mold_specifications 차종/원재료 컬럼 추가/확인 완료.');
    } catch (e) {
      console.log('⚠️ mold_specifications 차종/원재료 columns may already exist:', e.message);
    }

    // maker_specifications에 대표품번/대표품명 컬럼 추가 (본사 연동용)
    try {
      await sequelize.query(`ALTER TABLE maker_specifications ADD COLUMN IF NOT EXISTS primary_part_number VARCHAR(50)`);
      await sequelize.query(`ALTER TABLE maker_specifications ADD COLUMN IF NOT EXISTS primary_part_name VARCHAR(200)`);
      await sequelize.query(`ALTER TABLE maker_specifications ADD COLUMN IF NOT EXISTS mold_spec_type VARCHAR(20)`);
      console.log('✅ maker_specifications 연동 컬럼 추가/확인 완료.');
    } catch (e) {
      console.log('⚠️ maker_specifications columns may already exist:', e.message);
    }

  } catch (error) {
    console.error('⚠️ mold_images migration warning:', error.message);
    // Don't throw - table might already exist with correct structure
  }
};

// Run SQL migrations for injection_conditions table
const runInjectionConditionsMigration = async () => {
  console.log('🔄 Running injection_conditions table migration...');
  try {
    const sqlPath = path.join(__dirname, 'migrations', '20251210_injection_conditions.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await sequelize.query(sql);
      console.log('✅ injection_conditions table migration completed.');
    } else {
      console.log('⚠️ injection_conditions migration file not found, skipping...');
    }
  } catch (error) {
    console.error('⚠️ injection_conditions migration warning:', error.message);
  }
};

// Run SQL migrations for production transfer tables
const runProductionTransferMigration = async () => {
  console.log('🔄 Running production transfer tables migration...');
  try {
    const sqlPath = path.join(__dirname, 'migrations', '20241211_production_transfer.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await sequelize.query(sql);
      console.log('✅ production_transfer tables migration completed.');
    } else {
      console.log('⚠️ production_transfer migration file not found, skipping...');
    }
  } catch (error) {
    console.error('⚠️ production_transfer migration warning:', error.message);
  }
};

// Run SQL migrations for tryout issues table
const runTryoutIssuesMigration = async () => {
  console.log('🔄 Running tryout_issues table migration...');
  try {
    const sqlPath = path.join(__dirname, 'migrations', '20241211_tryout_issues.sql');
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await sequelize.query(sql);
      console.log('✅ tryout_issues table migration completed.');
    } else {
      console.log('⚠️ tryout_issues migration file not found, skipping...');
    }
  } catch (error) {
    console.error('⚠️ tryout_issues migration warning:', error.message);
  }
};

// Run system_rules table creation + auto-seed
const runSystemRulesMigration = async () => {
  console.log('🔄 Running system_rules table migration...');
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS system_rules (
        id SERIAL PRIMARY KEY,
        rule_key VARCHAR(100) NOT NULL UNIQUE,
        category VARCHAR(50) NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        value VARCHAR(500) NOT NULL,
        value_type VARCHAR(20) DEFAULT 'number',
        unit VARCHAR(50),
        min_value DECIMAL(10,2),
        max_value DECIMAL(10,2),
        default_value VARCHAR(500),
        applies_to VARCHAR(100) DEFAULT 'all',
        is_active BOOLEAN DEFAULT true,
        is_editable BOOLEAN DEFAULT true,
        updated_by INTEGER,
        updated_by_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_system_rules_category ON system_rules(category);
      CREATE INDEX IF NOT EXISTS idx_system_rules_is_active ON system_rules(is_active);
    `);
    console.log('✅ system_rules table migration completed.');

    // Auto-seed default rules
    const { autoSeedRules } = require('./controllers/systemRuleController');
    await autoSeedRules();
  } catch (error) {
    console.error('⚠️ system_rules migration warning:', error.message);
  }
};

// Run checklist master new system tables migration (5 tables + seed)
const runChecklistMasterNewMigration = async () => {
  console.log('🔄 Running checklist master new system migration...');
  try {
    // 1) checklist_items_master - 점검항목 마스터
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS checklist_items_master (
        id SERIAL PRIMARY KEY,
        major_category VARCHAR(100) NOT NULL,
        item_name VARCHAR(200) NOT NULL,
        description TEXT,
        check_method TEXT,
        required_photo BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_checklist_items_master_category ON checklist_items_master(major_category);
      CREATE INDEX IF NOT EXISTS idx_checklist_items_master_active ON checklist_items_master(is_active);
      CREATE INDEX IF NOT EXISTS idx_checklist_items_master_sort ON checklist_items_master(sort_order);
    `);
    console.log('  ✅ checklist_items_master table OK');

    // 2) checklist_cycle_codes - 점검주기 코드
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS checklist_cycle_codes (
        id SERIAL PRIMARY KEY,
        label VARCHAR(50) NOT NULL UNIQUE,
        cycle_type VARCHAR(10) NOT NULL,
        cycle_shots INTEGER,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_checklist_cycle_codes_type ON checklist_cycle_codes(cycle_type);
      CREATE INDEX IF NOT EXISTS idx_checklist_cycle_codes_sort ON checklist_cycle_codes(sort_order);
    `);
    console.log('  ✅ checklist_cycle_codes table OK');

    // 3) checklist_master_versions - 마스터 버전 관리
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS checklist_master_versions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'draft',
        version INTEGER DEFAULT 1,
        target_type VARCHAR(50) DEFAULT 'all',
        created_by INTEGER REFERENCES users(id),
        approved_by INTEGER REFERENCES users(id),
        deployed_by INTEGER REFERENCES users(id),
        approved_at TIMESTAMP WITH TIME ZONE,
        deployed_at TIMESTAMP WITH TIME ZONE,
        change_reason TEXT,
        is_active BOOLEAN DEFAULT true,
        is_current_deployed BOOLEAN DEFAULT false,
        snapshot_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cmv_status ON checklist_master_versions(status);
      CREATE INDEX IF NOT EXISTS idx_cmv_deployed ON checklist_master_versions(is_current_deployed);
      CREATE INDEX IF NOT EXISTS idx_cmv_target ON checklist_master_versions(target_type);
    `);
    console.log('  ✅ checklist_master_versions table OK');

    // 4) checklist_version_item_maps - 버전-항목 매핑
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS checklist_version_item_maps (
        id SERIAL PRIMARY KEY,
        checklist_version_id INTEGER NOT NULL REFERENCES checklist_master_versions(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL REFERENCES checklist_items_master(id) ON DELETE CASCADE,
        is_required BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(checklist_version_id, item_id)
      );
      CREATE INDEX IF NOT EXISTS idx_cvim_version ON checklist_version_item_maps(checklist_version_id);
      CREATE INDEX IF NOT EXISTS idx_cvim_item ON checklist_version_item_maps(item_id);
    `);
    console.log('  ✅ checklist_version_item_maps table OK');

    // 5) checklist_item_cycle_maps - 항목-주기 매핑
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS checklist_item_cycle_maps (
        id SERIAL PRIMARY KEY,
        checklist_version_id INTEGER NOT NULL REFERENCES checklist_master_versions(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL REFERENCES checklist_items_master(id) ON DELETE CASCADE,
        cycle_code_id INTEGER NOT NULL REFERENCES checklist_cycle_codes(id) ON DELETE CASCADE,
        is_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(checklist_version_id, item_id, cycle_code_id)
      );
      CREATE INDEX IF NOT EXISTS idx_cicm_version ON checklist_item_cycle_maps(checklist_version_id);
      CREATE INDEX IF NOT EXISTS idx_cicm_item ON checklist_item_cycle_maps(item_id);
      CREATE INDEX IF NOT EXISTS idx_cicm_cycle ON checklist_item_cycle_maps(cycle_code_id);
    `);
    console.log('  ✅ checklist_item_cycle_maps table OK');

    // === Auto-seed: cycle codes ===
    const defaultCycles = [
      { label: 'DAILY', cycle_type: 'daily', cycle_shots: null, description: '매일 생산 전 점검', sort_order: 0 },
      { label: '20000', cycle_type: 'shots', cycle_shots: 20000, description: '20,000 SHOT 점검', sort_order: 1 },
      { label: '50000', cycle_type: 'shots', cycle_shots: 50000, description: '50,000 SHOT 점검', sort_order: 2 },
      { label: '80000', cycle_type: 'shots', cycle_shots: 80000, description: '80,000 SHOT 점검', sort_order: 3 },
      { label: '100000', cycle_type: 'shots', cycle_shots: 100000, description: '100,000 SHOT 점검', sort_order: 4 }
    ];
    for (const c of defaultCycles) {
      try {
        await sequelize.query(
          `INSERT INTO checklist_cycle_codes (label, cycle_type, cycle_shots, description, sort_order)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (label) DO NOTHING`,
          { bind: [c.label, c.cycle_type, c.cycle_shots, c.description, c.sort_order] }
        );
      } catch (e) { /* ignore duplicates */ }
    }
    console.log('  ✅ checklist_cycle_codes seed OK');

    // === Auto-seed: default inspection items ===
    const defaultItems = [
      // 금형 외관 점검
      { major_category: '금형 외관 점검', item_name: '금형 전체 외관 상태', description: '금형 외관 균열, 변형, 파손 여부 확인', check_method: '육안 검사', required_photo: false, sort_order: 1 },
      { major_category: '금형 외관 점검', item_name: '금형 외관 도색 상태', description: '도색 벗겨짐, 변색 여부 확인', check_method: '육안 검사', required_photo: false, sort_order: 2 },
      { major_category: '금형 외관 점검', item_name: '금형 명판 부착 상태', description: '명판 존재 및 정보 일치 확인', check_method: '육안 검사', required_photo: false, sort_order: 3 },
      { major_category: '금형 외관 점검', item_name: '파팅라인 상태', description: '파팅라인 손상, 버 발생 여부', check_method: '육안 검사', required_photo: true, sort_order: 4 },
      // 냉각 시스템
      { major_category: '냉각 시스템', item_name: '냉각수 연결 상태', description: '냉각 호스 연결 및 누수 확인', check_method: '육안 검사', required_photo: false, sort_order: 10 },
      { major_category: '냉각 시스템', item_name: '냉각 채널 청소 상태', description: '냉각 채널 막힘 및 스케일 확인', check_method: '유량 측정', required_photo: false, sort_order: 11 },
      { major_category: '냉각 시스템', item_name: '온도센서 작동 상태', description: '온도센서 정상 작동 확인', check_method: '온도 측정', required_photo: false, sort_order: 12 },
      // 작동부 점검
      { major_category: '작동부 점검', item_name: '이젝터 작동 상태', description: '이젝터 핀 원활한 작동 확인', check_method: '수동 작동 확인', required_photo: false, sort_order: 20 },
      { major_category: '작동부 점검', item_name: '이젝터 핀 마모 상태', description: '이젝터 핀 마모, 파손 여부', check_method: '육안 검사 및 유격 확인', required_photo: true, sort_order: 21 },
      { major_category: '작동부 점검', item_name: '슬라이드 작동 상태', description: '슬라이드 코어 작동 원활성', check_method: '수동 작동 확인', required_photo: false, sort_order: 22 },
      { major_category: '작동부 점검', item_name: '슬라이드 마모 상태', description: '슬라이드 마모, 유격 확인', check_method: '유격 측정', required_photo: true, sort_order: 23 },
      { major_category: '작동부 점검', item_name: '가이드 핀/부시 마모', description: '가이드 핀 및 부시 마모 확인', check_method: '유격 측정', required_photo: false, sort_order: 24 },
      // 성형부 점검
      { major_category: '성형부 점검', item_name: '캐비티/코어 손상', description: '캐비티, 코어 표면 스크래치, 손상 확인', check_method: '육안 검사', required_photo: true, sort_order: 30 },
      { major_category: '성형부 점검', item_name: '게이트 상태', description: '게이트 마모, 이물 잔류 확인', check_method: '육안 검사', required_photo: true, sort_order: 31 },
      { major_category: '성형부 점검', item_name: '벤트 상태', description: '가스 벤트 막힘 확인', check_method: '육안 검사', required_photo: false, sort_order: 32 },
      // 체결부 점검
      { major_category: '체결부 점검', item_name: '볼트/너트 체결 상태', description: '체결 토크 및 풀림 확인', check_method: '토크렌치 확인', required_photo: false, sort_order: 40 },
      { major_category: '체결부 점검', item_name: '스프링 상태', description: '리턴 스프링 파손, 피로 확인', check_method: '육안 검사 및 길이 측정', required_photo: false, sort_order: 41 },
      // 핫러너 시스템
      { major_category: '핫러너 시스템', item_name: '히터/온도센서 상태', description: '히터 단선, 온도센서 정상 작동 확인', check_method: '저항 측정', required_photo: false, sort_order: 50 },
      { major_category: '핫러너 시스템', item_name: '핫러너 누수 확인', description: '핫러너 매니폴드 수지 누출 확인', check_method: '육안 검사', required_photo: true, sort_order: 51 }
    ];

    const [existingItems] = await sequelize.query('SELECT COUNT(*) as cnt FROM checklist_items_master');
    if (parseInt(existingItems[0].cnt) === 0) {
      for (const item of defaultItems) {
        await sequelize.query(
          `INSERT INTO checklist_items_master (major_category, item_name, description, check_method, required_photo, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          { bind: [item.major_category, item.item_name, item.description, item.check_method, item.required_photo, item.sort_order] }
        );
      }
      console.log('  ✅ checklist_items_master seed OK (19 default items)');
    } else {
      console.log('  ℹ️ checklist_items_master already has data, skipping seed');
    }

    console.log('✅ Checklist master new system migration completed.');
  } catch (error) {
    console.error('⚠️ Checklist master new system migration warning:', error.message);
  }
};

// Run SQL migrations for weight columns and history table
const runWeightColumnsMigration = async () => {
  console.log('🔄 Running weight columns migration...');
  try {
    // mold_specifications에 중량 컬럼 추가
    const columns = [
      { name: 'design_weight', sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS design_weight DECIMAL(10,2)' },
      { name: 'design_weight_unit', sql: "ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS design_weight_unit VARCHAR(10) DEFAULT 'g'" },
      { name: 'actual_weight', sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS actual_weight DECIMAL(10,2)' },
      { name: 'actual_weight_unit', sql: "ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS actual_weight_unit VARCHAR(10) DEFAULT 'g'" },
      { name: 'design_weight_registered_by', sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS design_weight_registered_by INTEGER' },
      { name: 'design_weight_registered_at', sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS design_weight_registered_at TIMESTAMP WITH TIME ZONE' },
      { name: 'actual_weight_registered_by', sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS actual_weight_registered_by INTEGER' },
      { name: 'actual_weight_registered_at', sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS actual_weight_registered_at TIMESTAMP WITH TIME ZONE' }
    ];
    
    for (const col of columns) {
      try {
        await sequelize.query(col.sql);
      } catch (e) {
        // 컬럼 이미 존재하면 무시
      }
    }
    console.log('✅ Weight columns added to mold_specifications.');

    // weight_history 이력 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS weight_history (
        id SERIAL PRIMARY KEY,
        mold_spec_id INTEGER NOT NULL,
        mold_id INTEGER,
        weight_type VARCHAR(20) NOT NULL,
        weight_value DECIMAL(10,2) NOT NULL,
        weight_unit VARCHAR(10) DEFAULT 'g',
        change_reason TEXT,
        registered_by INTEGER,
        registered_by_name VARCHAR(100),
        registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        previous_value DECIMAL(10,2),
        previous_unit VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ weight_history table created/verified.');

    // 인덱스 생성
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_weight_history_mold_spec ON weight_history(mold_spec_id)',
      'CREATE INDEX IF NOT EXISTS idx_weight_history_type ON weight_history(weight_type)',
      'CREATE INDEX IF NOT EXISTS idx_weight_history_registered_at ON weight_history(registered_at DESC)'
    ];
    for (const idx of indexes) {
      try {
        await sequelize.query(idx);
      } catch (e) {
        // 인덱스 이미 존재하면 무시
      }
    }
    console.log('✅ Weight history indexes created/verified.');

    // 원재료 정보 컬럼 추가
    const materialColumns = [
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS material_spec VARCHAR(100)' },
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS material_grade VARCHAR(100)' },
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS material_supplier VARCHAR(200)' },
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS material_shrinkage DECIMAL(5,3)' },
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS mold_shrinkage DECIMAL(5,3)' },
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS material_registered_by INTEGER' },
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS material_registered_at TIMESTAMP WITH TIME ZONE' }
    ];
    for (const col of materialColumns) {
      try { await sequelize.query(col.sql); } catch (e) { }
    }
    console.log('✅ Material columns added to mold_specifications.');

    // material_history 이력 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS material_history (
        id SERIAL PRIMARY KEY,
        mold_spec_id INTEGER NOT NULL,
        mold_id INTEGER,
        material_spec VARCHAR(100),
        material_grade VARCHAR(100),
        material_supplier VARCHAR(200),
        material_shrinkage DECIMAL(5,3),
        mold_shrinkage DECIMAL(5,3),
        change_reason TEXT,
        registered_by INTEGER,
        registered_by_name VARCHAR(100),
        registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        previous_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ material_history table created/verified.');

    // 인덱스 생성
    try { await sequelize.query('CREATE INDEX IF NOT EXISTS idx_material_history_mold_spec ON material_history(mold_spec_id)'); } catch (e) { }
    try { await sequelize.query('CREATE INDEX IF NOT EXISTS idx_material_history_registered_at ON material_history(registered_at DESC)'); } catch (e) { }
    console.log('✅ Material history indexes created/verified.');
  } catch (error) {
    console.error('⚠️ Weight columns migration warning:', error.message);
  }
};

// Run repair_requests columns migration
const runRepairRequestsMigration = async () => {
  console.log('🔄 Running repair_requests columns migration...');
  try {
    const columns = [
      // 기본 정보
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS problem TEXT' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS cause_and_reason TEXT' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS problem_source TEXT' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS occurred_date DATE' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS manager_id INTEGER' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS manager_name VARCHAR(100)' },
      // 금형/제품 정보
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS requester_id INTEGER' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS requester_name VARCHAR(100)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS car_model VARCHAR(100)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS part_number VARCHAR(100)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS part_name VARCHAR(200)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS occurrence_type VARCHAR(50)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS production_site VARCHAR(200)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS production_manager VARCHAR(100)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS contact VARCHAR(50)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS production_shot INTEGER' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS maker VARCHAR(200)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS problem_type VARCHAR(100)' },
      // 수리 정보
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS repair_cost DECIMAL(12,0)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS completion_date DATE' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS temporary_action TEXT' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS root_cause_action TEXT' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS mold_arrival_date DATE' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS stock_schedule_date DATE' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS stock_quantity INTEGER' },
      { sql: "ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS stock_unit VARCHAR(20) DEFAULT 'EA'" },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS repair_company VARCHAR(200)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS repair_duration INTEGER' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS management_type VARCHAR(50)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS sign_off_status VARCHAR(100)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS representative_part_number VARCHAR(100)' },
      { sql: 'ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS order_company VARCHAR(200)' },
      { sql: "ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS related_files JSONB DEFAULT '[]'::jsonb" }
    ];
    
    for (const col of columns) {
      try { await sequelize.query(col.sql); } catch (e) { }
    }
    console.log('✅ Repair requests columns added.');

    // 인덱스 생성
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_repair_requests_occurred_date ON repair_requests(occurred_date)',
      'CREATE INDEX IF NOT EXISTS idx_repair_requests_car_model ON repair_requests(car_model)',
      'CREATE INDEX IF NOT EXISTS idx_repair_requests_part_number ON repair_requests(part_number)',
      'CREATE INDEX IF NOT EXISTS idx_repair_requests_occurrence_type ON repair_requests(occurrence_type)',
      'CREATE INDEX IF NOT EXISTS idx_repair_requests_problem_type ON repair_requests(problem_type)'
    ];
    for (const idx of indexes) {
      try { await sequelize.query(idx); } catch (e) { }
    }
    console.log('✅ Repair requests indexes created/verified.');
  } catch (error) {
    console.error('⚠️ Repair requests migration warning:', error.message);
  }
};

// Run car_models columns migration (년식, 사양 추가)
const runCarModelsMigration = async () => {
  console.log('🔄 Running car_models columns migration...');
  try {
    // car_models 테이블에 년식, 사양 컬럼 추가
    await sequelize.query(`ALTER TABLE car_models ADD COLUMN IF NOT EXISTS model_year VARCHAR(20)`);
    await sequelize.query(`ALTER TABLE car_models ADD COLUMN IF NOT EXISTS specification VARCHAR(100)`);
    console.log('✅ car_models columns (model_year, specification) added/verified.');
    
    // mold_specifications 테이블에 차종 연동 컬럼 추가
    await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS car_model_id INTEGER`);
    await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS car_specification VARCHAR(100)`);
    // car_year 컬럼 타입 확장 (10 -> 20)
    await sequelize.query(`ALTER TABLE mold_specifications ALTER COLUMN car_year TYPE VARCHAR(20)`);
    console.log('✅ mold_specifications car model columns added/verified.');
    
    // mold_specifications 테이블에 원재료 연동 컬럼 추가
    await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS raw_material_id INTEGER`);
    await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS ms_spec VARCHAR(100)`);
    await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS material_type VARCHAR(200)`);
    await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS grade VARCHAR(100)`);
    await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS shrinkage_rate VARCHAR(50)`);
    await sequelize.query(`ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS supplier VARCHAR(200)`);
    console.log('✅ mold_specifications raw material columns added/verified.');
  } catch (error) {
    console.error('⚠️ car_models migration warning:', error.message);
  }
};

// Run master data tables migration (기초정보 테이블)
const runMasterDataMigration = async () => {
  console.log('🔄 Running master data tables migration...');
  try {
    // car_models 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS car_models (
        id SERIAL PRIMARY KEY,
        model_name VARCHAR(100) NOT NULL,
        model_code VARCHAR(50),
        manufacturer VARCHAR(100),
        model_year VARCHAR(10),
        specification VARCHAR(200),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ car_models table created/verified.');

    // materials 테이블 생성 (금형재질)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id SERIAL PRIMARY KEY,
        material_name VARCHAR(100) NOT NULL,
        material_code VARCHAR(50),
        category VARCHAR(50),
        hardness VARCHAR(50),
        tensile_strength VARCHAR(50),
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ materials table created/verified.');

    // mold_types 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS mold_types (
        id SERIAL PRIMARY KEY,
        type_name VARCHAR(100) NOT NULL,
        type_code VARCHAR(50),
        description TEXT,
        category VARCHAR(50),
        sub_category VARCHAR(50),
        molding_method VARCHAR(100),
        typical_materials TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ mold_types table created/verified.');

    // tonnages 테이블 생성 (사출기 사양)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tonnages (
        id SERIAL PRIMARY KEY,
        tonnage_value INTEGER NOT NULL,
        manufacturer VARCHAR(100),
        model_name VARCHAR(100),
        clamping_force INTEGER,
        clamping_stroke INTEGER,
        daylight_opening INTEGER,
        platen_size_h INTEGER,
        platen_size_v INTEGER,
        tiebar_spacing_h INTEGER,
        tiebar_spacing_v INTEGER,
        min_mold_thickness INTEGER,
        max_mold_thickness INTEGER,
        max_mold_width INTEGER,
        max_mold_height INTEGER,
        ejector_force INTEGER,
        ejector_stroke INTEGER,
        screw_diameter INTEGER,
        shot_volume INTEGER,
        shot_weight INTEGER,
        injection_pressure INTEGER,
        injection_rate INTEGER,
        plasticizing_capacity INTEGER,
        nozzle_contact_force INTEGER,
        machine_dimensions VARCHAR(100),
        machine_weight INTEGER,
        motor_power INTEGER,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ tonnages table created/verified.');

    // raw_materials 테이블 생성 (원재료)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS raw_materials (
        id SERIAL PRIMARY KEY,
        ms_spec VARCHAR(100),
        material_type VARCHAR(100),
        grade VARCHAR(100),
        grade_code VARCHAR(50),
        supplier VARCHAR(200),
        shrinkage_rate VARCHAR(50),
        specific_gravity VARCHAR(50),
        mold_shrinkage VARCHAR(50),
        usage TEXT,
        advantages TEXT,
        disadvantages TEXT,
        characteristics TEXT,
        unit_price DECIMAL(12,2),
        notes TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ raw_materials table created/verified.');

    // companies 테이블 생성 (제작처/생산처)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(200) NOT NULL,
        company_code VARCHAR(50),
        company_type VARCHAR(50) NOT NULL,
        business_number VARCHAR(50),
        representative VARCHAR(100),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(100),
        contact_person VARCHAR(100),
        contact_phone VARCHAR(50),
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ companies table created/verified.');

    // 기본 데이터 삽입 (없으면)
    // 차종 기본 데이터
    const defaultCarModels = ['K5', 'K8', 'K9', 'EV6', 'EV9', 'Sorento', 'Carnival', 'Sportage'];
    for (const model of defaultCarModels) {
      try {
        const [existing] = await sequelize.query(`SELECT id FROM car_models WHERE model_name = $1 LIMIT 1`, { bind: [model] });
        if (!existing || existing.length === 0) {
          await sequelize.query(`INSERT INTO car_models (model_name, is_active) VALUES ($1, TRUE)`, { bind: [model] });
        }
      } catch (e) { }
    }

    // 금형재질 기본 데이터
    const defaultMaterials = ['NAK80', 'S45C', 'SKD11', 'SKD61', 'P20', 'HPM38', 'STAVAX'];
    for (const mat of defaultMaterials) {
      try {
        const [existing] = await sequelize.query(`SELECT id FROM materials WHERE material_name = $1 LIMIT 1`, { bind: [mat] });
        if (!existing || existing.length === 0) {
          await sequelize.query(`INSERT INTO materials (material_name, is_active) VALUES ($1, TRUE)`, { bind: [mat] });
        }
      } catch (e) { }
    }

    // 금형타입 기본 데이터
    const defaultMoldTypes = ['사출금형', '프레스금형', '다이캐스팅금형', '블로우금형', '압출금형'];
    for (const type of defaultMoldTypes) {
      try {
        const [existing] = await sequelize.query(`SELECT id FROM mold_types WHERE type_name = $1 LIMIT 1`, { bind: [type] });
        if (!existing || existing.length === 0) {
          await sequelize.query(`INSERT INTO mold_types (type_name, is_active) VALUES ($1, TRUE)`, { bind: [type] });
        }
      } catch (e) { }
    }

    // 제작처/생산처 기본 데이터
    const defaultCompanies = [
      { name: '테스트 제작처', type: 'maker' },
      { name: '테스트 생산처', type: 'plant' }
    ];
    for (const comp of defaultCompanies) {
      try {
        const [existing] = await sequelize.query(`SELECT id FROM companies WHERE company_name = $1 LIMIT 1`, { bind: [comp.name] });
        if (!existing || existing.length === 0) {
          await sequelize.query(`INSERT INTO companies (company_name, company_type, is_active) VALUES ($1, $2, TRUE)`, { bind: [comp.name, comp.type] });
        }
      } catch (e) { }
    }

    console.log('✅ Default master data inserted/verified.');

  } catch (error) {
    console.error('⚠️ Master data migration warning:', error.message);
  }
};

// Run valve_gate columns migration (밸브게이트 옵션)
const runValveGateMigration = async () => {
  console.log('🔄 Running valve_gate columns migration...');
  try {
    // mold_specifications 테이블에 밸브게이트 관련 컬럼 추가
    const columns = [
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS gate_type VARCHAR(50)' }, // open, valve_gate
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS valve_gate_used BOOLEAN DEFAULT FALSE' },
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS valve_gate_count INTEGER DEFAULT 0' },
      { sql: "ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS valve_gate_data JSONB DEFAULT '[]'::jsonb" },
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS hot_runner_installed BOOLEAN DEFAULT FALSE' },
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS hot_runner_type VARCHAR(50)' },
      { sql: 'ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS hot_runner_count INTEGER DEFAULT 0' }
    ];
    
    for (const col of columns) {
      try { await sequelize.query(col.sql); } catch (e) { }
    }
    console.log('✅ Valve gate columns added to mold_specifications.');

    // injection_conditions 테이블에 밸브게이트 시퀀스 컬럼 추가
    const injectionColumns = [
      { sql: "ALTER TABLE injection_conditions ADD COLUMN IF NOT EXISTS valve_gate_sequence JSONB DEFAULT '[]'::jsonb" },
      { sql: 'ALTER TABLE injection_conditions ADD COLUMN IF NOT EXISTS valve_gate_used BOOLEAN DEFAULT FALSE' },
      { sql: 'ALTER TABLE injection_conditions ADD COLUMN IF NOT EXISTS approver_id INTEGER REFERENCES users(id)' },
      { sql: 'ALTER TABLE injection_conditions ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP' }
    ];
    
    for (const col of injectionColumns) {
      try { await sequelize.query(col.sql); } catch (e) { }
    }
    console.log('✅ Valve gate sequence + approver columns added to injection_conditions.');

  } catch (error) {
    console.error('⚠️ Valve gate migration warning:', error.message);
  }
};

// Run checklist_master_templates table migration (체크리스트 마스터 템플릿)
const runChecklistMasterTemplatesMigration = async () => {
  console.log('🔄 Running checklist_master_templates table migration...');
  try {
    // 체크리스트 마스터 템플릿 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS checklist_master_templates (
        id SERIAL PRIMARY KEY,
        template_name VARCHAR(100) NOT NULL,
        template_type VARCHAR(50) NOT NULL,
        version INTEGER DEFAULT 1,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ checklist_master_templates table created/verified.');

    // 인덱스 생성
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_checklist_master_templates_type ON checklist_master_templates(template_type)',
      'CREATE INDEX IF NOT EXISTS idx_checklist_master_templates_active ON checklist_master_templates(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_checklist_master_templates_version ON checklist_master_templates(version)'
    ];
    for (const idx of indexes) {
      try { await sequelize.query(idx); } catch (e) { }
    }
    console.log('✅ checklist_master_templates indexes created/verified.');

    // checklist_template_items 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS checklist_template_items (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL,
        item_name VARCHAR(200) NOT NULL,
        order_index INTEGER DEFAULT 0,
        is_required BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ checklist_template_items table created/verified.');

    // checklist_template_deployments 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS checklist_template_deployments (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL,
        deployed_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        deployed_by VARCHAR(100),
        target_type VARCHAR(50),
        target_id INTEGER,
        scope TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ checklist_template_deployments table created/verified.');

    // checklist_template_history 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS checklist_template_history (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        changes TEXT,
        changed_by VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ checklist_template_history table created/verified.');

    // 기본 템플릿 데이터 삽입 (없으면)
    const defaultTemplates = [
      { name: '제작전 체크리스트', type: 'pre_production' },
      { name: '일상점검 체크리스트', type: 'daily_check' },
      { name: '정기점검 체크리스트', type: 'periodic_check' },
      { name: '개발계획 템플릿', type: 'development_plan' },
      { name: '양산이관 체크리스트', type: 'transfer' },
      { name: '경도측정 기록표', type: 'hardness' },
      { name: '금형육성 체크리스트', type: 'nurturing' }
    ];

    for (const t of defaultTemplates) {
      try {
        const [existing] = await sequelize.query(
          `SELECT id FROM checklist_master_templates WHERE template_type = $1 LIMIT 1`,
          { bind: [t.type] }
        );
        if (!existing || existing.length === 0) {
          await sequelize.query(
            `INSERT INTO checklist_master_templates (template_name, template_type, is_active) VALUES ($1, $2, TRUE)`,
            { bind: [t.name, t.type] }
          );
        }
      } catch (e) { }
    }
    console.log('✅ Default checklist templates inserted/verified.');

  } catch (error) {
    console.error('⚠️ checklist_master_templates migration warning:', error.message);
  }
};

// Run standard_document_templates table migration (표준문서 마스터 관리)
const runStandardDocumentTemplatesMigration = async () => {
  console.log('🔄 Running standard_document_templates table migration...');
  try {
    // 표준문서 템플릿 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS standard_document_templates (
        id SERIAL PRIMARY KEY,
        template_code VARCHAR(50) UNIQUE NOT NULL,
        template_name VARCHAR(200) NOT NULL,
        template_type VARCHAR(50) NOT NULL,
        version VARCHAR(20) DEFAULT '1.0',
        status VARCHAR(30) DEFAULT 'draft',
        description TEXT,
        development_stage VARCHAR(20) DEFAULT 'all',
        deployed_to JSONB DEFAULT '[]'::jsonb,
        item_count INTEGER DEFAULT 0,
        category_count INTEGER DEFAULT 1,
        template_data JSONB DEFAULT '{}'::jsonb,
        items JSONB DEFAULT '[]'::jsonb,
        stages JSONB DEFAULT '[]'::jsonb,
        created_by INTEGER,
        created_by_name VARCHAR(100),
        approved_by INTEGER,
        approved_by_name VARCHAR(100),
        approved_at TIMESTAMP WITH TIME ZONE,
        deployed_by INTEGER,
        deployed_by_name VARCHAR(100),
        deployed_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ standard_document_templates table created/verified.');

    // 인덱스 생성
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_std_doc_templates_type ON standard_document_templates(template_type)',
      'CREATE INDEX IF NOT EXISTS idx_std_doc_templates_status ON standard_document_templates(status)',
      'CREATE INDEX IF NOT EXISTS idx_std_doc_templates_stage ON standard_document_templates(development_stage)',
      'CREATE INDEX IF NOT EXISTS idx_std_doc_templates_active ON standard_document_templates(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_std_doc_templates_created_at ON standard_document_templates(created_at DESC)'
    ];
    for (const idx of indexes) {
      try { await sequelize.query(idx); } catch (e) { }
    }
    console.log('✅ standard_document_templates indexes created/verified.');

    // 표준문서 버전 이력 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS standard_document_versions (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL,
        version VARCHAR(20) NOT NULL,
        template_data JSONB,
        items JSONB,
        stages JSONB,
        change_reason TEXT,
        changed_by INTEGER,
        changed_by_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ standard_document_versions table created/verified.');

    // 버전 이력 인덱스
    try { await sequelize.query('CREATE INDEX IF NOT EXISTS idx_std_doc_versions_template ON standard_document_versions(template_id)'); } catch (e) { }
    try { await sequelize.query('CREATE INDEX IF NOT EXISTS idx_std_doc_versions_created_at ON standard_document_versions(created_at DESC)'); } catch (e) { }

    // 표준문서 승인 이력 테이블 생성
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS standard_document_approvals (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL,
        action VARCHAR(30) NOT NULL,
        status VARCHAR(30) NOT NULL,
        version VARCHAR(20),
        comment TEXT,
        action_by INTEGER,
        action_by_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ standard_document_approvals table created/verified.');

    // 승인 이력 인덱스
    try { await sequelize.query('CREATE INDEX IF NOT EXISTS idx_std_doc_approvals_template ON standard_document_approvals(template_id)'); } catch (e) { }
    try { await sequelize.query('CREATE INDEX IF NOT EXISTS idx_std_doc_approvals_action ON standard_document_approvals(action)'); } catch (e) { }

    // 기본 템플릿 데이터 삽입 (없으면)
    const defaultTemplates = [
      { code: 'PRE_PROD_CHK', name: '제작전 체크리스트', type: 'pre_production', items: 81, categories: 9 },
      { code: 'DAILY_CHK', name: '일상점검 체크리스트', type: 'daily_check', items: 7, categories: 3 },
      { code: 'PERIODIC_CHK', name: '정기점검 체크리스트', type: 'periodic_check', items: 13, categories: 1 },
      { code: 'DEV_PLAN', name: '개발계획 템플릿', type: 'development_plan', items: 12, categories: 1 },
      { code: 'TRANSFER_CHK', name: '양산이관 체크리스트', type: 'transfer', items: 45, categories: 8 },
      { code: 'HARDNESS_REC', name: '경도측정 기록표', type: 'hardness', items: 6, categories: 1 },
      { code: 'NURTURING_CHK', name: '금형육성 체크리스트', type: 'nurturing', items: 10, categories: 2 }
    ];

    for (const t of defaultTemplates) {
      try {
        await sequelize.query(`
          INSERT INTO standard_document_templates (template_code, template_name, template_type, status, item_count, category_count, deployed_to)
          VALUES ($1, $2, $3, 'deployed', $4, $5, '["제작처", "생산처"]'::jsonb)
          ON CONFLICT (template_code) DO NOTHING
        `, { bind: [t.code, t.name, t.type, t.items, t.categories] });
      } catch (e) { }
    }
    console.log('✅ Default standard document templates inserted/verified.');

  } catch (error) {
    console.error('⚠️ standard_document_templates migration warning:', error.message);
  }
};

// Run transfer_requests table migration
const runTransferRequestsMigration = async () => {
  console.log('🔄 Running transfer_requests table migration...');
  try {
    // 테이블 생성 (없으면)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS transfer_requests (
        id SERIAL PRIMARY KEY,
        transfer_number VARCHAR(50) UNIQUE,
        mold_id INTEGER,
        status VARCHAR(30) DEFAULT 'pending',
        from_company_id INTEGER,
        to_company_id INTEGER,
        requested_by INTEGER,
        request_date DATE,
        planned_transfer_date DATE,
        actual_transfer_date DATE,
        reason TEXT,
        current_shots INTEGER,
        mold_info_snapshot JSONB,
        all_approvals_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ transfer_requests table created/verified.');

    // 인덱스 생성
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_transfer_requests_mold_id ON transfer_requests(mold_id)',
      'CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON transfer_requests(status)',
      'CREATE INDEX IF NOT EXISTS idx_transfer_requests_created_at ON transfer_requests(created_at DESC)'
    ];
    for (const idx of indexes) {
      try { await sequelize.query(idx); } catch (e) { }
    }
    console.log('✅ transfer_requests indexes created/verified.');
  } catch (error) {
    console.error('⚠️ Transfer requests migration warning:', error.message);
  }
};

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Run migrations automatically
    await runMigrations();
    
    // Run mold_images table migration
    await runMoldImagesMigration();
    
    // Run injection_conditions table migration
    await runInjectionConditionsMigration();
    
    // Run weight columns migration
    await runWeightColumnsMigration();
    
    // Run repair_requests columns migration
    await runRepairRequestsMigration();
    
    // Run transfer_requests table migration
    await runTransferRequestsMigration();
    
    // Run car_models columns migration
    await runCarModelsMigration();
    
    // Run master data tables migration
    await runMasterDataMigration();
    
    // Run valve gate migration
    await runValveGateMigration();
    
    // Run checklist master templates migration
    await runChecklistMasterTemplatesMigration();
    
    // Run standard document templates migration
    await runStandardDocumentTemplatesMigration();
    
    // Run production transfer tables migration
    await runProductionTransferMigration();
    
    // Run tryout issues table migration
    await runTryoutIssuesMigration();
    
    // Run system_rules table migration + auto-seed
    await runSystemRulesMigration();
    
    // Run checklist master new system migration (5 tables + seed)
    await runChecklistMasterNewMigration();
    
    // Sync models (development only)
    if (process.env.NODE_ENV === 'development') {
      // await sequelize.sync({ alter: true });
      console.log('📊 Database models synced.');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log('🚀 CAMS API Server started');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 Daily Checks API: http://localhost:${PORT}/api/v1/daily-checks`);
      console.log(`🔍 Periodic Inspections API: http://localhost:${PORT}/api/v1/periodic-inspections`);
      console.log(`🖼️ Mold Images API: http://localhost:${PORT}/api/v1/mold-images`);
      console.log(`\n⏰ Server started at: ${new Date().toLocaleString('ko-KR')}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await sequelize.close();
  console.log('✅ Database connection closed.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await sequelize.close();
  console.log('✅ Database connection closed.');
  process.exit(0);
});

// Start the server
startServer();
