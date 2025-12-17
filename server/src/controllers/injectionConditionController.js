const logger = require('../utils/logger');
const { sequelize } = require('../models/newIndex');

/**
 * 사출조건 등록 (제작처/생산처)
 * 등록 시 개발담당자 승인 대기 상태로 설정
 */
const createInjectionCondition = async (req, res) => {
  try {
    const data = req.body;
    const registered_by = req.user.id;

    // 금형 기본정보 자동 연결
    let moldInfo = {};
    if (data.mold_spec_id) {
      const [moldRows] = await sequelize.query(`
        SELECT mold_code, mold_name, part_name, material
        FROM mold_specifications WHERE id = :mold_spec_id
      `, { replacements: { mold_spec_id: data.mold_spec_id } });
      
      if (moldRows.length > 0) {
        moldInfo = moldRows[0];
      }
    }

    // 기존 현재 버전 해제
    if (data.mold_spec_id) {
      await sequelize.query(`
        UPDATE injection_conditions 
        SET is_current = false, updated_at = NOW()
        WHERE mold_spec_id = :mold_spec_id AND is_current = true
      `, { replacements: { mold_spec_id: data.mold_spec_id } });
    }

    // 새 버전 번호 계산
    const [versionRows] = await sequelize.query(`
      SELECT COALESCE(MAX(version), 0) + 1 as next_version
      FROM injection_conditions WHERE mold_spec_id = :mold_spec_id
    `, { replacements: { mold_spec_id: data.mold_spec_id || 0 } });
    const nextVersion = versionRows[0]?.next_version || 1;

    const insertQuery = `
      INSERT INTO injection_conditions (
        mold_spec_id, mold_id, mold_code, mold_name, part_name, material,
        speed_1, speed_2, speed_3, speed_4, speed_cooling,
        position_pv, position_1, position_2, position_3,
        pressure_1, pressure_2, pressure_3, pressure_4,
        time_injection, time_holding, time_holding_3, time_holding_4, time_cooling,
        metering_speed_vp, metering_speed_1, metering_speed_2, metering_speed_3,
        metering_position_1, metering_position_2,
        metering_pressure_2, metering_pressure_3, metering_pressure_4,
        holding_pressure_1, holding_pressure_2, holding_pressure_3, holding_pressure_4,
        holding_pressure_1h, holding_pressure_2h, holding_pressure_3h,
        barrel_temp_1, barrel_temp_2, barrel_temp_3, barrel_temp_4, barrel_temp_5,
        barrel_temp_6, barrel_temp_7, barrel_temp_8, barrel_temp_9,
        hot_runner_installed, hot_runner_type,
        hr_temp_1, hr_temp_2, hr_temp_3, hr_temp_4, hr_temp_5, hr_temp_6, hr_temp_7, hr_temp_8,
        valve_gate_count, valve_gate_data,
        chiller_temp_main, chiller_temp_moving, chiller_temp_fixed,
        cycle_time, status, registered_by, version, is_current, remarks,
        created_at, updated_at
      ) VALUES (
        :mold_spec_id, :mold_id, :mold_code, :mold_name, :part_name, :material,
        :speed_1, :speed_2, :speed_3, :speed_4, :speed_cooling,
        :position_pv, :position_1, :position_2, :position_3,
        :pressure_1, :pressure_2, :pressure_3, :pressure_4,
        :time_injection, :time_holding, :time_holding_3, :time_holding_4, :time_cooling,
        :metering_speed_vp, :metering_speed_1, :metering_speed_2, :metering_speed_3,
        :metering_position_1, :metering_position_2,
        :metering_pressure_2, :metering_pressure_3, :metering_pressure_4,
        :holding_pressure_1, :holding_pressure_2, :holding_pressure_3, :holding_pressure_4,
        :holding_pressure_1h, :holding_pressure_2h, :holding_pressure_3h,
        :barrel_temp_1, :barrel_temp_2, :barrel_temp_3, :barrel_temp_4, :barrel_temp_5,
        :barrel_temp_6, :barrel_temp_7, :barrel_temp_8, :barrel_temp_9,
        :hot_runner_installed, :hot_runner_type,
        :hr_temp_1, :hr_temp_2, :hr_temp_3, :hr_temp_4, :hr_temp_5, :hr_temp_6, :hr_temp_7, :hr_temp_8,
        :valve_gate_count, :valve_gate_data,
        :chiller_temp_main, :chiller_temp_moving, :chiller_temp_fixed,
        :cycle_time, 'pending', :registered_by, :version, true, :remarks,
        NOW(), NOW()
      ) RETURNING *
    `;

    const [rows] = await sequelize.query(insertQuery, {
      replacements: {
        mold_spec_id: data.mold_spec_id || null,
        mold_id: data.mold_id || null,
        mold_code: moldInfo.mold_code || data.mold_code || null,
        mold_name: moldInfo.mold_name || data.mold_name || null,
        part_name: moldInfo.part_name || data.part_name || null,
        material: moldInfo.material || data.material || null,
        // 속도
        speed_1: data.speed_1 || null,
        speed_2: data.speed_2 || null,
        speed_3: data.speed_3 || null,
        speed_4: data.speed_4 || null,
        speed_cooling: data.speed_cooling || null,
        // 위치
        position_pv: data.position_pv || null,
        position_1: data.position_1 || null,
        position_2: data.position_2 || null,
        position_3: data.position_3 || null,
        // 압력
        pressure_1: data.pressure_1 || null,
        pressure_2: data.pressure_2 || null,
        pressure_3: data.pressure_3 || null,
        pressure_4: data.pressure_4 || null,
        // 시간
        time_injection: data.time_injection || null,
        time_holding: data.time_holding || null,
        time_holding_3: data.time_holding_3 || null,
        time_holding_4: data.time_holding_4 || null,
        time_cooling: data.time_cooling || null,
        // 계량 속도
        metering_speed_vp: data.metering_speed_vp || null,
        metering_speed_1: data.metering_speed_1 || null,
        metering_speed_2: data.metering_speed_2 || null,
        metering_speed_3: data.metering_speed_3 || null,
        // 계량 위치
        metering_position_1: data.metering_position_1 || null,
        metering_position_2: data.metering_position_2 || null,
        // 계량 압력
        metering_pressure_2: data.metering_pressure_2 || null,
        metering_pressure_3: data.metering_pressure_3 || null,
        metering_pressure_4: data.metering_pressure_4 || null,
        // 보압
        holding_pressure_1: data.holding_pressure_1 || null,
        holding_pressure_2: data.holding_pressure_2 || null,
        holding_pressure_3: data.holding_pressure_3 || null,
        holding_pressure_4: data.holding_pressure_4 || null,
        holding_pressure_1h: data.holding_pressure_1h || null,
        holding_pressure_2h: data.holding_pressure_2h || null,
        holding_pressure_3h: data.holding_pressure_3h || null,
        // BARREL 온도
        barrel_temp_1: data.barrel_temp_1 || null,
        barrel_temp_2: data.barrel_temp_2 || null,
        barrel_temp_3: data.barrel_temp_3 || null,
        barrel_temp_4: data.barrel_temp_4 || null,
        barrel_temp_5: data.barrel_temp_5 || null,
        barrel_temp_6: data.barrel_temp_6 || null,
        barrel_temp_7: data.barrel_temp_7 || null,
        barrel_temp_8: data.barrel_temp_8 || null,
        barrel_temp_9: data.barrel_temp_9 || null,
        // 핫런너
        hot_runner_installed: data.hot_runner_installed || false,
        hot_runner_type: data.hot_runner_type || null,
        hr_temp_1: data.hr_temp_1 || null,
        hr_temp_2: data.hr_temp_2 || null,
        hr_temp_3: data.hr_temp_3 || null,
        hr_temp_4: data.hr_temp_4 || null,
        hr_temp_5: data.hr_temp_5 || null,
        hr_temp_6: data.hr_temp_6 || null,
        hr_temp_7: data.hr_temp_7 || null,
        hr_temp_8: data.hr_temp_8 || null,
        // 밸브게이트
        valve_gate_count: data.valve_gate_count || 0,
        valve_gate_data: JSON.stringify(data.valve_gate_data || []),
        // 칠러온도
        chiller_temp_main: data.chiller_temp_main || null,
        chiller_temp_moving: data.chiller_temp_moving || null,
        chiller_temp_fixed: data.chiller_temp_fixed || null,
        // 기타
        cycle_time: data.cycle_time || null,
        registered_by,
        version: nextVersion,
        remarks: data.remarks || null
      }
    });

    const savedCondition = rows[0];

    // 개발담당자에게 승인 요청 알림 생성
    await createApprovalNotification(savedCondition, registered_by, 'create');

    res.status(201).json({
      success: true,
      data: savedCondition,
      message: '사출조건이 등록되었습니다. 개발담당자 승인을 기다려주세요.'
    });
  } catch (error) {
    logger.error('Create injection condition error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사출조건 등록 실패', details: error.message }
    });
  }
};

/**
 * 사출조건 수정 (변경 이력 자동 생성)
 */
const updateInjectionCondition = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const changed_by = req.user.id;

    // 기존 데이터 조회
    const [existingRows] = await sequelize.query(
      'SELECT * FROM injection_conditions WHERE id = :id',
      { replacements: { id } }
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: '사출조건을 찾을 수 없습니다.' }
      });
    }

    const existing = existingRows[0];

    // 변경된 필드 감지 및 이력 생성
    const fieldLabels = {
      // 속도
      speed_1: '속도 1차', speed_2: '속도 2차', speed_3: '속도 3차', speed_4: '속도 4차', speed_cooling: '속도 냉',
      // 위치
      position_pv: '위치 PV', position_1: '위치 #', position_2: '위치 43', position_3: '위치 21',
      // 압력
      pressure_1: '압력 1차', pressure_2: '압력 2차', pressure_3: '압력 3차', pressure_4: '압력 4차',
      // 시간
      time_injection: '시간 사출', time_holding: '시간 보압', time_holding_3: '시간 보3', time_holding_4: '시간 보4', time_cooling: '시간 냉각',
      // 계량 속도
      metering_speed_vp: '계량속도 VP', metering_speed_1: '계량속도 계1', metering_speed_2: '계량속도 계2', metering_speed_3: '계량속도 계3',
      // 계량 위치
      metering_position_1: '계량위치 1', metering_position_2: '계량위치 2',
      // 계량 압력
      metering_pressure_2: '계량압력 계2', metering_pressure_3: '계량압력 3', metering_pressure_4: '계량압력 4',
      // 보압
      holding_pressure_1: '보압 1차', holding_pressure_2: '보압 2차', holding_pressure_3: '보압 3차', holding_pressure_4: '보압 4차',
      holding_pressure_1h: '보압 1H', holding_pressure_2h: '보압 2H', holding_pressure_3h: '보압 3H',
      // BARREL
      barrel_temp_1: 'BARREL 1', barrel_temp_2: 'BARREL 2', barrel_temp_3: 'BARREL 3', barrel_temp_4: 'BARREL 4', barrel_temp_5: 'BARREL 5',
      barrel_temp_6: 'BARREL 6', barrel_temp_7: 'BARREL 7', barrel_temp_8: 'BARREL 8', barrel_temp_9: 'BARREL 9',
      // H/R
      hr_temp_1: 'H/R 1', hr_temp_2: 'H/R 2', hr_temp_3: 'H/R 3', hr_temp_4: 'H/R 4',
      // 밸브게이트
      valve_gate_moving: '밸브게이트 가동', valve_gate_fixed: '밸브게이트 고정',
      // 칠러온도
      chiller_temp_main: '칠러온도 메인', chiller_temp_moving: '칠러온도 가동', chiller_temp_fixed: '칠러온도 고정',
      // 기타
      cycle_time: '사이클타임', remarks: '비고'
    };

    const fieldTypes = {
      // 속도
      speed_1: 'speed', speed_2: 'speed', speed_3: 'speed', speed_4: 'speed', speed_cooling: 'speed',
      // 위치
      position_pv: 'position', position_1: 'position', position_2: 'position', position_3: 'position',
      // 압력
      pressure_1: 'pressure', pressure_2: 'pressure', pressure_3: 'pressure', pressure_4: 'pressure',
      // 시간
      time_injection: 'time', time_holding: 'time', time_holding_3: 'time', time_holding_4: 'time', time_cooling: 'time',
      // 계량
      metering_speed_vp: 'metering', metering_speed_1: 'metering', metering_speed_2: 'metering', metering_speed_3: 'metering',
      metering_position_1: 'metering', metering_position_2: 'metering',
      metering_pressure_2: 'metering', metering_pressure_3: 'metering', metering_pressure_4: 'metering',
      // 보압
      holding_pressure_1: 'pressure', holding_pressure_2: 'pressure', holding_pressure_3: 'pressure', holding_pressure_4: 'pressure',
      holding_pressure_1h: 'pressure', holding_pressure_2h: 'pressure', holding_pressure_3h: 'pressure',
      // 온도
      barrel_temp_1: 'temperature', barrel_temp_2: 'temperature', barrel_temp_3: 'temperature', barrel_temp_4: 'temperature', barrel_temp_5: 'temperature',
      barrel_temp_6: 'temperature', barrel_temp_7: 'temperature', barrel_temp_8: 'temperature', barrel_temp_9: 'temperature',
      hr_temp_1: 'temperature', hr_temp_2: 'temperature', hr_temp_3: 'temperature', hr_temp_4: 'temperature',
      valve_gate_moving: 'other', valve_gate_fixed: 'other',
      chiller_temp_main: 'temperature', chiller_temp_moving: 'temperature', chiller_temp_fixed: 'temperature',
      cycle_time: 'time', remarks: 'other'
    };

    const changes = [];
    for (const [field, label] of Object.entries(fieldLabels)) {
      if (data[field] !== undefined && String(data[field]) !== String(existing[field])) {
        changes.push({
          field_name: field,
          field_label: label,
          change_type: fieldTypes[field] || 'other',
          old_value: existing[field],
          new_value: data[field]
        });
      }
    }

    if (changes.length === 0) {
      return res.json({
        success: true,
        data: existing,
        message: '변경된 내용이 없습니다.'
      });
    }

    // 변경 이력 저장 (승인 대기 상태)
    for (const change of changes) {
      await sequelize.query(`
        INSERT INTO injection_condition_history (
          injection_condition_id, mold_spec_id, change_type, field_name, field_label,
          old_value, new_value, change_reason, status, changed_by, changed_at
        ) VALUES (
          :injection_condition_id, :mold_spec_id, :change_type, :field_name, :field_label,
          :old_value, :new_value, :change_reason, 'pending', :changed_by, NOW()
        )
      `, {
        replacements: {
          injection_condition_id: id,
          mold_spec_id: existing.mold_spec_id,
          change_type: change.change_type,
          field_name: change.field_name,
          field_label: change.field_label,
          old_value: String(change.old_value || ''),
          new_value: String(change.new_value || ''),
          change_reason: data.change_reason || null,
          changed_by
        }
      });
    }

    // 사출조건 상태를 pending으로 변경
    await sequelize.query(`
      UPDATE injection_conditions 
      SET status = 'pending', updated_at = NOW()
      WHERE id = :id
    `, { replacements: { id } });

    // 개발담당자에게 승인 요청 알림 생성
    await createApprovalNotification({ ...existing, id }, changed_by, 'update', changes);

    res.json({
      success: true,
      data: { changes_count: changes.length },
      message: `${changes.length}개 항목이 변경되었습니다. 개발담당자 승인을 기다려주세요.`
    });
  } catch (error) {
    logger.error('Update injection condition error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사출조건 수정 실패', details: error.message }
    });
  }
};

/**
 * 사출조건 승인/반려 (개발담당자)
 */
const approveInjectionCondition = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejection_reason } = req.body; // action: 'approve' or 'reject'
    const approved_by = req.user.id;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: { message: 'action은 approve 또는 reject이어야 합니다.' }
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // 사출조건 상태 업데이트
    await sequelize.query(`
      UPDATE injection_conditions 
      SET status = :status, approved_by = :approved_by, approved_at = NOW(),
          rejection_reason = :rejection_reason, updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: {
        id,
        status: newStatus,
        approved_by,
        rejection_reason: action === 'reject' ? rejection_reason : null
      }
    });

    // 대기 중인 변경 이력도 함께 승인/반려
    await sequelize.query(`
      UPDATE injection_condition_history 
      SET status = :status, approved_by = :approved_by, approved_at = NOW(),
          rejection_reason = :rejection_reason
      WHERE injection_condition_id = :id AND status = 'pending'
    `, {
      replacements: {
        id,
        status: newStatus,
        approved_by,
        rejection_reason: action === 'reject' ? rejection_reason : null
      }
    });

    // 승인된 경우 실제 값 업데이트
    if (action === 'approve') {
      const [historyRows] = await sequelize.query(`
        SELECT field_name, new_value FROM injection_condition_history
        WHERE injection_condition_id = :id AND status = 'approved'
        ORDER BY changed_at DESC
      `, { replacements: { id } });

      for (const history of historyRows) {
        await sequelize.query(`
          UPDATE injection_conditions 
          SET ${history.field_name} = :new_value, updated_at = NOW()
          WHERE id = :id
        `, { replacements: { id, new_value: history.new_value } });
      }
    }

    // 등록자에게 결과 알림
    const [conditionRows] = await sequelize.query(
      'SELECT * FROM injection_conditions WHERE id = :id',
      { replacements: { id } }
    );
    
    if (conditionRows.length > 0) {
      await createResultNotification(conditionRows[0], approved_by, action, rejection_reason);
    }

    res.json({
      success: true,
      message: action === 'approve' ? '사출조건이 승인되었습니다.' : '사출조건이 반려되었습니다.'
    });
  } catch (error) {
    logger.error('Approve injection condition error:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 처리 실패', details: error.message }
    });
  }
};

/**
 * 사출조건 조회 (금형별)
 */
const getInjectionCondition = async (req, res) => {
  try {
    const { mold_spec_id, mold_id, include_history } = req.query;

    // null 또는 'null' 문자열 파라미터 처리
    if (!mold_spec_id || mold_spec_id === 'null' || mold_spec_id === 'undefined') {
      if (!mold_id || mold_id === 'null' || mold_id === 'undefined') {
        return res.json({ success: true, data: null });
      }
    }

    // 테이블 존재 확인
    try {
      await sequelize.query('SELECT 1 FROM injection_conditions LIMIT 1');
    } catch (tableError) {
      return res.json({ success: true, data: null });
    }

    let query = `
      SELECT ic.*, 
             u1.name as registered_by_name,
             u2.name as approved_by_name
      FROM injection_conditions ic
      LEFT JOIN users u1 ON ic.registered_by = u1.id
      LEFT JOIN users u2 ON ic.approved_by = u2.id
      WHERE ic.is_current = true
    `;
    const replacements = {};

    if (mold_spec_id) {
      query += ` AND ic.mold_spec_id = :mold_spec_id`;
      replacements.mold_spec_id = mold_spec_id;
    }

    if (mold_id) {
      query += ` AND ic.mold_id = :mold_id`;
      replacements.mold_id = mold_id;
    }

    query += ` ORDER BY ic.created_at DESC LIMIT 1`;

    const [rows] = await sequelize.query(query, { replacements });

    let result = rows[0] || null;

    // 이력 포함 요청 시
    if (include_history === 'true' && result) {
      const [historyRows] = await sequelize.query(`
        SELECT ich.*, u.name as changed_by_name
        FROM injection_condition_history ich
        LEFT JOIN users u ON ich.changed_by = u.id
        WHERE ich.injection_condition_id = :id
        ORDER BY ich.changed_at DESC
        LIMIT 50
      `, { replacements: { id: result.id } });

      result.history = historyRows;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get injection condition error:', error);
    res.status(500).json({
      success: false,
      error: { message: '사출조건 조회 실패', details: error.message }
    });
  }
};

/**
 * 사출조건 이력 조회
 */
const getInjectionHistory = async (req, res) => {
  try {
    const { mold_spec_id, status, change_type, limit = 50 } = req.query;

    // 테이블 존재 확인
    try {
      await sequelize.query('SELECT 1 FROM injection_condition_history LIMIT 1');
    } catch (tableError) {
      return res.json({ success: true, data: [] });
    }

    let query = `
      SELECT ich.*, 
             u1.name as changed_by_name,
             u2.name as approved_by_name,
             ic.mold_code, ic.mold_name
      FROM injection_condition_history ich
      LEFT JOIN users u1 ON ich.changed_by = u1.id
      LEFT JOIN users u2 ON ich.approved_by = u2.id
      LEFT JOIN injection_conditions ic ON ich.injection_condition_id = ic.id
      WHERE 1=1
    `;
    const replacements = {};

    if (mold_spec_id) {
      query += ` AND ich.mold_spec_id = :mold_spec_id`;
      replacements.mold_spec_id = mold_spec_id;
    }

    if (status) {
      query += ` AND ich.status = :status`;
      replacements.status = status;
    }

    if (change_type) {
      query += ` AND ich.change_type = :change_type`;
      replacements.change_type = change_type;
    }

    query += ` ORDER BY ich.changed_at DESC LIMIT :limit`;
    replacements.limit = parseInt(limit);

    const [rows] = await sequelize.query(query, { replacements });

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    logger.error('Get injection history error:', error);
    res.status(500).json({
      success: false,
      error: { message: '이력 조회 실패', details: error.message }
    });
  }
};

/**
 * 사출조건 통계 조회
 */
const getInjectionStats = async (req, res) => {
  try {
    const { mold_spec_id, period = 'month' } = req.query;

    // 테이블 존재 확인
    try {
      await sequelize.query('SELECT 1 FROM injection_condition_history LIMIT 1');
    } catch (tableError) {
      return res.json({
        success: true,
        data: {
          summary: { total_changes: 0, approved: 0, pending: 0, rejected: 0, approval_rate: 0 },
          by_type: [],
          by_month: [],
          top_changers: []
        }
      });
    }

    const replacements = { mold_spec_id: mold_spec_id || 0 };

    // 요약 통계
    const [summaryRows] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_changes,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM injection_condition_history
      WHERE (:mold_spec_id = 0 OR mold_spec_id = :mold_spec_id)
    `, { replacements });

    const summary = summaryRows[0];
    summary.approval_rate = summary.total_changes > 0 
      ? Math.round((summary.approved / summary.total_changes) * 100 * 10) / 10 
      : 0;

    // 유형별 통계
    const [typeRows] = await sequelize.query(`
      SELECT change_type, COUNT(*) as count
      FROM injection_condition_history
      WHERE (:mold_spec_id = 0 OR mold_spec_id = :mold_spec_id)
      GROUP BY change_type
      ORDER BY count DESC
    `, { replacements });

    const typeLabels = {
      temperature: '온도', pressure: '압력', speed: '속도',
      time: '시간', metering: '계량', other: '기타'
    };

    const totalByType = typeRows.reduce((sum, r) => sum + parseInt(r.count), 0);
    const by_type = typeRows.map(r => ({
      type: r.change_type,
      label: typeLabels[r.change_type] || r.change_type,
      count: parseInt(r.count),
      percentage: totalByType > 0 ? Math.round((r.count / totalByType) * 100 * 10) / 10 : 0
    }));

    // 월별 통계
    const [monthRows] = await sequelize.query(`
      SELECT TO_CHAR(changed_at, 'MM') || '월' as month, COUNT(*) as count
      FROM injection_condition_history
      WHERE (:mold_spec_id = 0 OR mold_spec_id = :mold_spec_id)
        AND changed_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(changed_at, 'MM'), TO_CHAR(changed_at, 'YYYY-MM')
      ORDER BY TO_CHAR(changed_at, 'YYYY-MM')
    `, { replacements });

    // 변경자 순위
    const [changerRows] = await sequelize.query(`
      SELECT u.name, COUNT(*) as count
      FROM injection_condition_history ich
      JOIN users u ON ich.changed_by = u.id
      WHERE (:mold_spec_id = 0 OR ich.mold_spec_id = :mold_spec_id)
      GROUP BY u.id, u.name
      ORDER BY count DESC
      LIMIT 5
    `, { replacements });

    res.json({
      success: true,
      data: {
        summary,
        by_type,
        by_month: monthRows.map(r => ({ month: r.month, count: parseInt(r.count) })),
        top_changers: changerRows.map(r => ({ name: r.name, count: parseInt(r.count) }))
      }
    });
  } catch (error) {
    logger.error('Get injection stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: '통계 조회 실패', details: error.message }
    });
  }
};

/**
 * 승인 대기 목록 조회 (개발담당자용)
 */
const getPendingApprovals = async (req, res) => {
  try {
    // 테이블 존재 확인
    try {
      await sequelize.query('SELECT 1 FROM injection_conditions LIMIT 1');
    } catch (tableError) {
      return res.json({ success: true, data: [] });
    }

    const [rows] = await sequelize.query(`
      SELECT ic.*, u.name as registered_by_name,
             (SELECT COUNT(*) FROM injection_condition_history 
              WHERE injection_condition_id = ic.id AND status = 'pending') as pending_changes
      FROM injection_conditions ic
      LEFT JOIN users u ON ic.registered_by = u.id
      WHERE ic.status = 'pending'
      ORDER BY ic.updated_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    logger.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      error: { message: '승인 대기 목록 조회 실패', details: error.message }
    });
  }
};

/**
 * 승인 요청 알림 생성
 */
async function createApprovalNotification(condition, requesterId, actionType, changes = []) {
  try {
    // 개발담당자 조회 (mold_developer 또는 system_admin)
    const [developers] = await sequelize.query(`
      SELECT id FROM users WHERE user_type IN ('mold_developer', 'system_admin') AND is_active = true
    `);

    const title = actionType === 'create' 
      ? '사출조건 등록 승인 요청'
      : '사출조건 변경 승인 요청';
    
    const message = actionType === 'create'
      ? `금형 ${condition.mold_code || condition.mold_spec_id}의 사출조건이 등록되었습니다. 승인이 필요합니다.`
      : `금형 ${condition.mold_code || condition.mold_spec_id}의 사출조건이 ${changes.length}개 항목 변경되었습니다. 승인이 필요합니다.`;

    for (const dev of developers) {
      await sequelize.query(`
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id, created_at)
        VALUES (:user_id, :title, :message, 'approval_request', 'injection_condition', :reference_id, NOW())
      `, {
        replacements: {
          user_id: dev.id,
          title,
          message,
          reference_id: condition.id
        }
      });
    }
  } catch (error) {
    logger.error('Create approval notification error:', error);
  }
}

/**
 * 승인 결과 알림 생성
 */
async function createResultNotification(condition, approverId, action, rejectionReason) {
  try {
    const title = action === 'approve' ? '사출조건 승인 완료' : '사출조건 반려';
    const message = action === 'approve'
      ? `금형 ${condition.mold_code || condition.mold_spec_id}의 사출조건이 승인되었습니다.`
      : `금형 ${condition.mold_code || condition.mold_spec_id}의 사출조건이 반려되었습니다. 사유: ${rejectionReason || '없음'}`;

    await sequelize.query(`
      INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id, created_at)
      VALUES (:user_id, :title, :message, :type, 'injection_condition', :reference_id, NOW())
    `, {
      replacements: {
        user_id: condition.registered_by,
        title,
        message,
        type: action === 'approve' ? 'approval_complete' : 'approval_rejected',
        reference_id: condition.id
      }
    });
  } catch (error) {
    logger.error('Create result notification error:', error);
  }
}

module.exports = {
  createInjectionCondition,
  updateInjectionCondition,
  approveInjectionCondition,
  getInjectionCondition,
  getInjectionHistory,
  getInjectionStats,
  getPendingApprovals
};
