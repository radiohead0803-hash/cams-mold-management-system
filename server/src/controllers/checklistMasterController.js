const { 
  ChecklistMasterVersion, 
  ChecklistItemMasterNew, 
  ChecklistCycleCode,
  ChecklistVersionItemMap,
  ChecklistItemCycleMap,
  InspectionSchedule,
  InspectionInstanceNew,
  InspectionInstanceItem,
  User,
  Mold,
  sequelize 
} = require('../models/newIndex');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * 마스터 버전 목록 조회
 */
const getMasterVersions = async (req, res) => {
  try {
    const { status, target_type, q } = req.query;
    
    const where = { is_active: true };
    if (status) where.status = status;
    if (target_type) where.target_type = target_type;
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const versions = await ChecklistMasterVersion.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] },
        { model: User, as: 'deployer', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: versions });
  } catch (error) {
    logger.error('Get master versions error:', error);
    res.status(500).json({ success: false, error: { message: '마스터 버전 목록 조회 실패' } });
  }
};

/**
 * 마스터 버전 상세 조회 (항목 + 주기 매핑 포함)
 */
const getMasterVersionById = async (req, res) => {
  try {
    const { id } = req.params;

    const version = await ChecklistMasterVersion.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: User, as: 'approver', attributes: ['id', 'name'] },
        { model: User, as: 'deployer', attributes: ['id', 'name'] },
        {
          model: ChecklistVersionItemMap,
          as: 'itemMaps',
          include: [{ model: ChecklistItemMasterNew, as: 'item' }]
        },
        {
          model: ChecklistItemCycleMap,
          as: 'cycleMaps',
          include: [
            { model: ChecklistItemMasterNew, as: 'item' },
            { model: ChecklistCycleCode, as: 'cycleCode' }
          ]
        }
      ]
    });

    if (!version) {
      return res.status(404).json({ success: false, error: { message: '마스터 버전을 찾을 수 없습니다' } });
    }

    res.json({ success: true, data: version });
  } catch (error) {
    logger.error('Get master version by ID error:', error);
    res.status(500).json({ success: false, error: { message: '마스터 버전 조회 실패' } });
  }
};

/**
 * 신규 마스터 버전 생성 (Draft)
 */
const createMasterVersion = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, description, target_type, items, cycleMappings } = req.body;
    const created_by = req.user.id;

    // 버전 생성
    const version = await ChecklistMasterVersion.create({
      name,
      description,
      target_type: target_type || 'all',
      status: 'draft',
      version: 1,
      created_by
    }, { transaction });

    // 항목 매핑 생성
    if (items && items.length > 0) {
      const itemMaps = items.map((item, idx) => ({
        checklist_version_id: version.id,
        item_id: item.id,
        is_required: item.is_required !== false,
        sort_order: idx
      }));
      await ChecklistVersionItemMap.bulkCreate(itemMaps, { transaction });
    }

    // 주기 매핑 생성
    if (cycleMappings && cycleMappings.length > 0) {
      await ChecklistItemCycleMap.bulkCreate(
        cycleMappings.map(m => ({
          checklist_version_id: version.id,
          item_id: m.item_id,
          cycle_code_id: m.cycle_code_id,
          is_enabled: m.is_enabled !== false
        })),
        { transaction }
      );
    }

    await transaction.commit();
    res.status(201).json({ success: true, data: version, message: '마스터 버전이 생성되었습니다' });
  } catch (error) {
    await transaction.rollback();
    logger.error('Create master version error:', error);
    res.status(500).json({ success: false, error: { message: '마스터 버전 생성 실패' } });
  }
};

/**
 * 마스터 버전 수정 (Draft 상태에서만)
 */
const updateMasterVersion = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { name, description, target_type, items, cycleMappings, change_reason } = req.body;

    const version = await ChecklistMasterVersion.findByPk(id);
    if (!version) {
      return res.status(404).json({ success: false, error: { message: '마스터 버전을 찾을 수 없습니다' } });
    }

    if (version.status !== 'draft') {
      return res.status(400).json({ success: false, error: { message: 'Draft 상태에서만 수정 가능합니다' } });
    }

    // 기본 정보 업데이트
    await version.update({
      name: name || version.name,
      description: description || version.description,
      target_type: target_type || version.target_type,
      change_reason
    }, { transaction });

    // 항목 매핑 업데이트
    if (items) {
      await ChecklistVersionItemMap.destroy({ where: { checklist_version_id: id }, transaction });
      const itemMaps = items.map((item, idx) => ({
        checklist_version_id: id,
        item_id: item.id || item.item_id,
        is_required: item.is_required !== false,
        sort_order: idx
      }));
      await ChecklistVersionItemMap.bulkCreate(itemMaps, { transaction });
    }

    // 주기 매핑 업데이트
    if (cycleMappings) {
      await ChecklistItemCycleMap.destroy({ where: { checklist_version_id: id }, transaction });
      await ChecklistItemCycleMap.bulkCreate(
        cycleMappings.map(m => ({
          checklist_version_id: id,
          item_id: m.item_id,
          cycle_code_id: m.cycle_code_id,
          is_enabled: m.is_enabled !== false
        })),
        { transaction }
      );
    }

    await transaction.commit();
    res.json({ success: true, data: version, message: '마스터 버전이 수정되었습니다' });
  } catch (error) {
    await transaction.rollback();
    logger.error('Update master version error:', error);
    res.status(500).json({ success: false, error: { message: '마스터 버전 수정 실패' } });
  }
};

/**
 * 검토 요청 (Draft → Review)
 */
const submitForReview = async (req, res) => {
  try {
    const { id } = req.params;
    const version = await ChecklistMasterVersion.findByPk(id);

    if (!version) {
      return res.status(404).json({ success: false, error: { message: '마스터 버전을 찾을 수 없습니다' } });
    }

    if (version.status !== 'draft') {
      return res.status(400).json({ success: false, error: { message: 'Draft 상태에서만 검토 요청 가능합니다' } });
    }

    await version.update({ status: 'review' });
    res.json({ success: true, message: '검토 요청되었습니다' });
  } catch (error) {
    logger.error('Submit for review error:', error);
    res.status(500).json({ success: false, error: { message: '검토 요청 실패' } });
  }
};

/**
 * 승인 (Review → Approved)
 */
const approveMasterVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const approved_by = req.user.id;

    const version = await ChecklistMasterVersion.findByPk(id);
    if (!version) {
      return res.status(404).json({ success: false, error: { message: '마스터 버전을 찾을 수 없습니다' } });
    }

    if (version.status !== 'review') {
      return res.status(400).json({ success: false, error: { message: 'Review 상태에서만 승인 가능합니다' } });
    }

    await version.update({
      status: 'approved',
      approved_by,
      approved_at: new Date()
    });

    res.json({ success: true, message: '승인되었습니다' });
  } catch (error) {
    logger.error('Approve master version error:', error);
    res.status(500).json({ success: false, error: { message: '승인 실패' } });
  }
};

/**
 * 배포 (Approved → Deployed)
 */
const deployMasterVersion = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const deployed_by = req.user.id;

    const version = await ChecklistMasterVersion.findByPk(id, {
      include: [
        { model: ChecklistVersionItemMap, as: 'itemMaps', include: [{ model: ChecklistItemMasterNew, as: 'item' }] },
        { model: ChecklistItemCycleMap, as: 'cycleMaps', include: [{ model: ChecklistCycleCode, as: 'cycleCode' }] }
      ]
    });

    if (!version) {
      return res.status(404).json({ success: false, error: { message: '마스터 버전을 찾을 수 없습니다' } });
    }

    if (version.status !== 'approved') {
      return res.status(400).json({ success: false, error: { message: 'Approved 상태에서만 배포 가능합니다' } });
    }

    // 기존 배포 버전 비활성화
    await ChecklistMasterVersion.update(
      { is_current_deployed: false },
      { where: { is_current_deployed: true, target_type: version.target_type }, transaction }
    );

    // 스냅샷 생성
    const snapshotData = {
      items: version.itemMaps.map(m => ({
        item_id: m.item_id,
        item: m.item,
        is_required: m.is_required,
        sort_order: m.sort_order
      })),
      cycleMappings: version.cycleMaps.map(m => ({
        item_id: m.item_id,
        cycle_code_id: m.cycle_code_id,
        cycle_code: m.cycleCode,
        is_enabled: m.is_enabled
      }))
    };

    // 배포 처리
    await version.update({
      status: 'deployed',
      deployed_by,
      deployed_at: new Date(),
      is_current_deployed: true,
      snapshot_data: snapshotData
    }, { transaction });

    await transaction.commit();
    res.json({ success: true, message: '배포되었습니다' });
  } catch (error) {
    await transaction.rollback();
    logger.error('Deploy master version error:', error);
    res.status(500).json({ success: false, error: { message: '배포 실패' } });
  }
};

/**
 * 마스터 버전 복제 (새 Draft 생성)
 */
const cloneMasterVersion = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const created_by = req.user.id;

    const source = await ChecklistMasterVersion.findByPk(id, {
      include: [
        { model: ChecklistVersionItemMap, as: 'itemMaps' },
        { model: ChecklistItemCycleMap, as: 'cycleMaps' }
      ]
    });

    if (!source) {
      return res.status(404).json({ success: false, error: { message: '원본 버전을 찾을 수 없습니다' } });
    }

    // 새 버전 생성
    const newVersion = await ChecklistMasterVersion.create({
      name: `${source.name} (복사본)`,
      description: source.description,
      target_type: source.target_type,
      status: 'draft',
      version: source.version + 1,
      created_by
    }, { transaction });

    // 항목 매핑 복제
    if (source.itemMaps.length > 0) {
      await ChecklistVersionItemMap.bulkCreate(
        source.itemMaps.map(m => ({
          checklist_version_id: newVersion.id,
          item_id: m.item_id,
          is_required: m.is_required,
          sort_order: m.sort_order
        })),
        { transaction }
      );
    }

    // 주기 매핑 복제
    if (source.cycleMaps.length > 0) {
      await ChecklistItemCycleMap.bulkCreate(
        source.cycleMaps.map(m => ({
          checklist_version_id: newVersion.id,
          item_id: m.item_id,
          cycle_code_id: m.cycle_code_id,
          is_enabled: m.is_enabled
        })),
        { transaction }
      );
    }

    await transaction.commit();
    res.status(201).json({ success: true, data: newVersion, message: '복제되었습니다' });
  } catch (error) {
    await transaction.rollback();
    logger.error('Clone master version error:', error);
    res.status(500).json({ success: false, error: { message: '복제 실패' } });
  }
};

/**
 * 현재 배포된 버전 조회
 */
const getCurrentDeployedVersion = async (req, res) => {
  try {
    const { target_type } = req.query;

    const where = { is_current_deployed: true, status: 'deployed' };
    if (target_type) where.target_type = target_type;

    const version = await ChecklistMasterVersion.findOne({
      where,
      include: [
        {
          model: ChecklistVersionItemMap,
          as: 'itemMaps',
          include: [{ model: ChecklistItemMasterNew, as: 'item' }],
          order: [['sort_order', 'ASC']]
        },
        {
          model: ChecklistItemCycleMap,
          as: 'cycleMaps',
          include: [
            { model: ChecklistItemMasterNew, as: 'item' },
            { model: ChecklistCycleCode, as: 'cycleCode' }
          ]
        }
      ]
    });

    res.json({ success: true, data: version });
  } catch (error) {
    logger.error('Get current deployed version error:', error);
    res.status(500).json({ success: false, error: { message: '배포 버전 조회 실패' } });
  }
};

/**
 * 점검항목 목록 조회
 */
const getChecklistItems = async (req, res) => {
  try {
    const { category, is_active } = req.query;

    const where = {};
    if (category) where.major_category = category;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const items = await ChecklistItemMasterNew.findAll({
      where,
      order: [['sort_order', 'ASC'], ['major_category', 'ASC']]
    });

    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Get checklist items error:', error);
    res.status(500).json({ success: false, error: { message: '점검항목 조회 실패' } });
  }
};

/**
 * 점검항목 생성
 */
const createChecklistItem = async (req, res) => {
  try {
    const { major_category, item_name, description, check_method, required_photo, sort_order } = req.body;

    const item = await ChecklistItemMasterNew.create({
      major_category,
      item_name,
      description,
      check_method,
      required_photo: required_photo || false,
      sort_order: sort_order || 0
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    logger.error('Create checklist item error:', error);
    res.status(500).json({ success: false, error: { message: '점검항목 생성 실패' } });
  }
};

/**
 * 점검항목 수정
 */
const updateChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const item = await ChecklistItemMasterNew.findByPk(id);
    if (!item) {
      return res.status(404).json({ success: false, error: { message: '점검항목을 찾을 수 없습니다' } });
    }

    await item.update(updates);
    res.json({ success: true, data: item });
  } catch (error) {
    logger.error('Update checklist item error:', error);
    res.status(500).json({ success: false, error: { message: '점검항목 수정 실패' } });
  }
};

/**
 * 주기 코드 목록 조회
 */
const getCycleCodes = async (req, res) => {
  try {
    const codes = await ChecklistCycleCode.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC']]
    });

    res.json({ success: true, data: codes });
  } catch (error) {
    logger.error('Get cycle codes error:', error);
    res.status(500).json({ success: false, error: { message: '주기 코드 조회 실패' } });
  }
};

module.exports = {
  getMasterVersions,
  getMasterVersionById,
  createMasterVersion,
  updateMasterVersion,
  submitForReview,
  approveMasterVersion,
  deployMasterVersion,
  cloneMasterVersion,
  getCurrentDeployedVersion,
  getChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  getCycleCodes
};
