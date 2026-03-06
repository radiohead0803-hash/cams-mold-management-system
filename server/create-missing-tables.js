const { Sequelize } = require('sequelize');
const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const sequelize = new Sequelize(DATABASE_URL, { dialect: 'postgres', logging: false });

async function createMissingTables() {
  try {
    await sequelize.authenticate();
    console.log('Connected.\n');

    const createStatements = [
      // 1. approvals
      `CREATE TABLE IF NOT EXISTS approvals (
        id SERIAL PRIMARY KEY,
        approval_type VARCHAR(50) NOT NULL,
        target_id INTEGER NOT NULL,
        target_table VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        title VARCHAR(200) NOT NULL,
        description TEXT,
        requester_id INTEGER NOT NULL,
        requester_name VARCHAR(100),
        requester_company VARCHAR(100),
        requested_at TIMESTAMP DEFAULT NOW(),
        approver_id INTEGER,
        approver_name VARCHAR(100),
        processed_at TIMESTAMP,
        comment TEXT,
        priority VARCHAR(20) DEFAULT 'normal',
        due_date TIMESTAMP,
        mold_code VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // 2. checklist_answers
      `CREATE TABLE IF NOT EXISTS checklist_answers (
        id BIGSERIAL PRIMARY KEY,
        instance_id BIGINT NOT NULL,
        item_id BIGINT NOT NULL,
        value_bool BOOLEAN,
        value_number DECIMAL,
        value_text TEXT,
        is_ng BOOLEAN DEFAULT FALSE
      )`,

      // 3. checklist_templates
      `CREATE TABLE IF NOT EXISTS checklist_templates (
        id BIGSERIAL PRIMARY KEY,
        code VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        shot_interval INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        version INTEGER DEFAULT 1
      )`,

      // 4. checklist_template_deployment
      `CREATE TABLE IF NOT EXISTS checklist_template_deployment (
        id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL,
        deployed_version INTEGER NOT NULL,
        deployed_by INTEGER NOT NULL,
        deployment_date TIMESTAMP DEFAULT NOW(),
        target_companies JSONB,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'active'
      )`,

      // 5. mold_events
      `CREATE TABLE IF NOT EXISTS mold_events (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER NOT NULL,
        mold_code VARCHAR(50),
        event_type VARCHAR(50) NOT NULL,
        reference_id INTEGER,
        reference_table VARCHAR(100),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        previous_value VARCHAR(500),
        new_value VARCHAR(500),
        actor_id INTEGER,
        actor_name VARCHAR(100),
        actor_company VARCHAR(100),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // 6. mold_location_logs
      `CREATE TABLE IF NOT EXISTS mold_location_logs (
        id BIGSERIAL PRIMARY KEY,
        mold_id BIGINT NOT NULL,
        plant_id BIGINT,
        scanned_by_id BIGINT,
        scanned_at TIMESTAMP DEFAULT NOW(),
        gps_lat DECIMAL(10,7) NOT NULL,
        gps_lng DECIMAL(10,7) NOT NULL,
        distance_m INTEGER,
        status VARCHAR(20) DEFAULT 'normal',
        source VARCHAR(20) DEFAULT 'qr_scan',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // 7. repair_request_items
      `CREATE TABLE IF NOT EXISTS repair_request_items (
        id BIGSERIAL PRIMARY KEY,
        repair_request_id BIGINT NOT NULL,
        checklist_answer_id BIGINT,
        item_label VARCHAR(200) NOT NULL,
        item_section VARCHAR(50),
        value_text TEXT,
        value_bool BOOLEAN,
        is_ng BOOLEAN DEFAULT TRUE
      )`,

      // 8. shots
      `CREATE TABLE IF NOT EXISTS shots (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER NOT NULL,
        recorded_by INTEGER NOT NULL,
        recorded_date DATE NOT NULL,
        shift VARCHAR(20),
        previous_shots INTEGER NOT NULL,
        current_shots INTEGER NOT NULL,
        shots_increment INTEGER NOT NULL,
        production_quantity INTEGER,
        cavity_count INTEGER,
        defect_count INTEGER DEFAULT 0,
        notes TEXT,
        source VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // 9. system_rules
      `CREATE TABLE IF NOT EXISTS system_rules (
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
        is_active BOOLEAN DEFAULT TRUE,
        is_editable BOOLEAN DEFAULT TRUE,
        updated_by INTEGER,
        updated_by_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // 10. transfers
      `CREATE TABLE IF NOT EXISTS transfers (
        id SERIAL PRIMARY KEY,
        mold_id INTEGER NOT NULL,
        transfer_number VARCHAR(50) UNIQUE,
        transfer_type VARCHAR(50),
        from_location VARCHAR(200) NOT NULL,
        to_location VARCHAR(200) NOT NULL,
        from_party_id INTEGER,
        to_party_id INTEGER,
        requested_by INTEGER NOT NULL,
        request_date DATE NOT NULL,
        planned_transfer_date DATE,
        actual_transfer_date DATE,
        reason TEXT,
        current_shots INTEGER,
        mold_condition VARCHAR(50),
        status VARCHAR(20) DEFAULT 'requested',
        documents JSONB,
        photos JSONB,
        approved_by INTEGER,
        approved_at TIMESTAMP,
        shipped_at TIMESTAMP,
        delivered_at TIMESTAMP,
        confirmed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    ];

    const tableNames = [
      'approvals', 'checklist_answers', 'checklist_templates',
      'checklist_template_deployment', 'mold_events', 'mold_location_logs',
      'repair_request_items', 'shots', 'system_rules', 'transfers'
    ];

    for (let i = 0; i < createStatements.length; i++) {
      try {
        await sequelize.query(createStatements[i]);
        console.log(`+ ${tableNames[i]} created`);
      } catch (e) {
        console.log(`! ${tableNames[i]}: ${e.message.substring(0, 60)}`);
      }
    }

    // 인덱스 생성
    console.log('\nCreating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_approvals_type ON approvals(approval_type)',
      'CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status)',
      'CREATE INDEX IF NOT EXISTS idx_approvals_requester ON approvals(requester_id)',
      'CREATE INDEX IF NOT EXISTS idx_approvals_approver ON approvals(approver_id)',
      'CREATE INDEX IF NOT EXISTS idx_ca_instance ON checklist_answers(instance_id)',
      'CREATE INDEX IF NOT EXISTS idx_ca_item ON checklist_answers(item_id)',
      'CREATE INDEX IF NOT EXISTS idx_ctd_template ON checklist_template_deployment(template_id)',
      'CREATE INDEX IF NOT EXISTS idx_me_mold ON mold_events(mold_id)',
      'CREATE INDEX IF NOT EXISTS idx_me_type ON mold_events(event_type)',
      'CREATE INDEX IF NOT EXISTS idx_me_created ON mold_events(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_mll_mold ON mold_location_logs(mold_id)',
      'CREATE INDEX IF NOT EXISTS idx_mll_scanned ON mold_location_logs(scanned_at)',
      'CREATE INDEX IF NOT EXISTS idx_rri_request ON repair_request_items(repair_request_id)',
      'CREATE INDEX IF NOT EXISTS idx_shots_mold ON shots(mold_id)',
      'CREATE INDEX IF NOT EXISTS idx_shots_date ON shots(recorded_date)',
      'CREATE INDEX IF NOT EXISTS idx_sr_key ON system_rules(rule_key)',
      'CREATE INDEX IF NOT EXISTS idx_sr_category ON system_rules(category)',
      'CREATE INDEX IF NOT EXISTS idx_transfers_mold ON transfers(mold_id)',
      'CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status)',
      'CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(request_date)'
    ];

    for (const idx of indexes) {
      try { await sequelize.query(idx); } catch (e) {}
    }
    console.log('Indexes created.');

    // 검증
    console.log('\n=== VERIFICATION ===');
    const [after] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    const afterNames = after.map(t => t.tablename);
    for (const tbl of tableNames) {
      console.log(`  ${tbl}: ${afterNames.includes(tbl) ? 'OK' : 'MISSING'}`);
    }
    console.log(`\nTotal tables: ${afterNames.length}`);
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

createMissingTables();
