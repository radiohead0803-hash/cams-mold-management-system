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
        nozzle_temp, cylinder_temp_1, cylinder_temp_2, cylinder_temp_3, cylinder_temp_4,
        mold_temp_fixed, mold_temp_moving,
        injection_pressure_1, injection_pressure_2, injection_pressure_3,
        holding_pressure_1, holding_pressure_2, holding_pressure_3, back_pressure,
        injection_speed_1, injection_speed_2, injection_speed_3, screw_rpm,
        injection_time, holding_time, cooling_time, cycle_time,
        metering_stroke, suck_back, cushion,
        clamping_force, ejector_stroke, ejector_speed,
        status, registered_by, version, is_current, remarks,
        created_at, updated_at
      ) VALUES (
        :mold_spec_id, :mold_id, :mold_code, :mold_name, :part_name, :material,
        :nozzle_temp, :cylinder_temp_1, :cylinder_temp_2, :cylinder_temp_3, :cylinder_temp_4,
        :mold_temp_fixed, :mold_temp_moving,
        :injection_pressure_1, :injection_pressure_2, :injection_pressure_3,
        :holding_pressure_1, :holding_pressure_2, :holding_pressure_3, :back_pressure,
        :injection_speed_1, :injection_speed_2, :injection_speed_3, :screw_rpm,
        :injection_time, :holding_time, :cooling_time, :cycle_time,
        :metering_stroke, :suck_back, :cushion,
        :clamping_force, :ejector_stroke, :ejector_speed,
        'pending', :registered_by, :version, true, :remarks,
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
        nozzle_temp: data.nozzle_temp || null,
        cylinder_temp_1: data.cylinder_temp_1 || null,
        cylinder_temp_2: data.cylinder_temp_2 || null,
        cylinder_temp_3: data.cylinder_temp_3 || null,
        cylinder_temp_4: data.cylinder_temp_4 || null,
        mold_temp_fixed: data.mold_temp_fixed || null,
        mold_temp_moving: data.mold_temp_moving || null,
        injection_pressure_1: data.injection_pressure_1 || null,
        injection_pressure_2: data.injection_pressure_2 || null,
        injection_pressure_3: data.injection_pressure_3 || null,
        holding_pressure_1: data.holding_pressure_1 || null,
        holding_pressure_2: data.holding_pressure_2 || null,
        holding_pressure_3: data.holding_pressure_3 || null,
        back_pressure: data.back_pressure || null,
        injection_speed_1: data.injection_speed_1 || null,
        injection_speed_2: data.injection_speed_2 || null,
        injection_speed_3: data.injection_speed_3 || null,
        screw_rpm: data.screw_rpm || null,
        injection_time: data.injection_time || null,
        holding_time: data.holding_time || null,
        cooling_time: data.cooling_time || null,
        cycle_time: data.cycle_time || null,
        metering_stroke: data.metering_stroke || null,
        suck_back: data.suck_back || null,
        cushion: data.cushion || null,
        clamping_force: data.clamping_force || null,
        ejector_stroke: data.ejector_stroke || null,
        ejector_speed: data.ejector_speed || null,
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
      // 온도 설정
      nozzle_temp: '노즐 온도',
      cylinder_temp_1: '실린더 온도 1존',
      cylinder_temp_2: '실린더 온도 2존',
      cylinder_temp_3: '실린더 온도 3존',
      cylinder_temp_4: '실린더 온도 4존',
      mold_temp_fixed: '금형 온도 (고정측)',
      mold_temp_moving: '금형 온도 (가동측)',
      // 압력 설정
      injection_pressure_1: '사출 압력 1단',
      injection_pressure_2: '사출 압력 2단',
      injection_pressure_3: '사출 압력 3단',
      holding_pressure_1: '보압 1단',
      holding_pressure_2: '보압 2단',
      holding_pressure_3: '보압 3단',
      back_pressure: '배압',
      // 속도 설정
      injection_speed_1: '사출 속도 1단',
      injection_speed_2: '사출 속도 2단',
      injection_speed_3: '사출 속도 3단',
      screw_rpm: '스크류 회전수',
      // 시간 설정
      injection_time: '사출 시간',
      holding_time: '보압 시간',
      cooling_time: '냉각 시간',
      cycle_time: '사이클 타임',
      // 계량 설정
      metering_stroke: '계량값',
      suck_back: '석백',
      cushion: '쿠션',
      // 기타 설정
      clamping_force: '형체력',
      ejector_stroke: '이젝터 스트로크',
      ejector_speed: '이젝터 속도',
      remarks: '비고'
    };

    const fieldTypes = {
      // 온도
      nozzle_temp: 'temperature', cylinder_temp_1: 'temperature', cylinder_temp_2: 'temperature',
      cylinder_temp_3: 'temperature', cylinder_temp_4: 'temperature',
      mold_temp_fixed: 'temperature', mold_temp_moving: 'temperature',
      // 압력
      injection_pressure_1: 'pressure', injection_pressure_2: 'pressure', injection_pressure_3: 'pressure',
      holding_pressure_1: 'pressure', holding_pressure_2: 'pressure', holding_pressure_3: 'pressure',
      back_pressure: 'pressure',
      // 속도
      injection_speed_1: 'speed', injection_speed_2: 'speed', injection_speed_3: 'speed', screw_rpm: 'speed',
      // 시간
      injection_time: 'time', holding_time: 'time', cooling_time: 'time', cycle_time: 'time',
      // 계량
      metering_stroke: 'metering', suck_back: 'metering', cushion: 'metering',
      // 기타
      clamping_force: 'other', ejector_stroke: 'other', ejector_speed: 'other', remarks: 'other'
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
