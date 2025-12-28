/**
 * 금형 수리 후 출하단계 점검 체크리스트 API 라우터
 * - 체크리스트 CRUD
 * - 제작처 점검 완료
 * - 본사 승인/반려
 * - 출하 상태 전환
 */
const express = require('express');
const router = express.Router();
const db = require('../models/newIndex');
const { Op } = require('sequelize');

// 표준 점검 항목 정의 (8개 카테고리) - 전체 항목 사진 필수
const STANDARD_CHECKLIST_ITEMS = [
  // 1️⃣ 수리 이력 및 범위 확인
  { category_code: 'repair_history', category_name: '수리 이력 및 범위 확인', category_order: 1, item_code: '1-1', item_name: '수리 요청 내역 일치 여부', item_description: '요청서의 NG 내용과 실제 수리 내용 일치', item_order: 1, photo_required: true },
  { category_code: 'repair_history', category_name: '수리 이력 및 범위 확인', category_order: 1, item_code: '1-2', item_name: '수리 범위 명확화', item_description: '코어/캐비티/슬라이드/리프터 등 명시', item_order: 2, photo_required: true },
  { category_code: 'repair_history', category_name: '수리 이력 및 범위 확인', category_order: 1, item_code: '1-3', item_name: '추가 수리 발생 여부', item_description: '최초 요청 외 추가 가공/보완 여부 기록', item_order: 3, photo_required: true },
  { category_code: 'repair_history', category_name: '수리 이력 및 범위 확인', category_order: 1, item_code: '1-4', item_name: '수리 전·후 비교 사진', item_description: '동일 위치 Before/After 사진 첨부 (필수)', item_order: 4, photo_required: true },
  
  // 2️⃣ 성형면 및 외관 상태 점검
  { category_code: 'surface', category_name: '성형면 및 외관 상태 점검', category_order: 2, item_code: '2-1', item_name: '성형면 손상', item_description: '찍힘, 스크래치, 용접 흔적 無', item_order: 1, photo_required: true },
  { category_code: 'surface', category_name: '성형면 및 외관 상태 점검', category_order: 2, item_code: '2-2', item_name: '폴리싱 상태', item_description: '광택 균일, 웨이브/오렌지필 無', item_order: 2, photo_required: true },
  { category_code: 'surface', category_name: '성형면 및 외관 상태 점검', category_order: 2, item_code: '2-3', item_name: '파팅라인', item_description: '단차, 까짐, 날카로움 無', item_order: 3, photo_required: true },
  { category_code: 'surface', category_name: '성형면 및 외관 상태 점검', category_order: 2, item_code: '2-4', item_name: '텍스처 영역', item_description: '텍스처 손상·번짐 無', item_order: 4, photo_required: true },
  { category_code: 'surface', category_name: '성형면 및 외관 상태 점검', category_order: 2, item_code: '2-5', item_name: '육안 이물', item_description: '연마 분진, 오일 잔존 無', item_order: 5, photo_required: true },
  
  // 3️⃣ 기능부 작동 점검 (Dry Run 기준)
  { category_code: 'function', category_name: '기능부 작동 점검', category_order: 3, item_code: '3-1', item_name: '슬라이드 작동', item_description: '전후진 부드러움, 걸림 無', item_order: 1, photo_required: true },
  { category_code: 'function', category_name: '기능부 작동 점검', category_order: 3, item_code: '3-2', item_name: '리프터 작동', item_description: '편마모·비틀림 無', item_order: 2, photo_required: true },
  { category_code: 'function', category_name: '기능부 작동 점검', category_order: 3, item_code: '3-3', item_name: '이젝터', item_description: '복귀 정상, 편심 無', item_order: 3, photo_required: true },
  { category_code: 'function', category_name: '기능부 작동 점검', category_order: 3, item_code: '3-4', item_name: '가이드핀/부시', item_description: '유격 이상 無', item_order: 4, photo_required: true },
  { category_code: 'function', category_name: '기능부 작동 점검', category_order: 3, item_code: '3-5', item_name: '볼트 체결 상태', item_description: '풀림 방지 상태 양호', item_order: 5, photo_required: true },
  
  // 4️⃣ 치수 및 맞물림(습합) 상태
  { category_code: 'dimension', category_name: '치수 및 맞물림 상태', category_order: 4, item_code: '4-1', item_name: '습합 상태', item_description: '코어·캐비티 밀착 균일', item_order: 1, photo_required: true },
  { category_code: 'dimension', category_name: '치수 및 맞물림 상태', category_order: 4, item_code: '4-2', item_name: '간섭 흔적', item_description: '긁힘/찍힘 無', item_order: 2, photo_required: true },
  { category_code: 'dimension', category_name: '치수 및 맞물림 상태', category_order: 4, item_code: '4-3', item_name: '틈새 과다 여부', item_description: '누유·플래시 우려 無', item_order: 3, photo_required: true },
  { category_code: 'dimension', category_name: '치수 및 맞물림 상태', category_order: 4, item_code: '4-4', item_name: 'Shim 변경 여부', item_description: '변경 시 두께·위치 기록', item_order: 4, photo_required: true },
  
  // 5️⃣ 냉각·윤활·방청 상태
  { category_code: 'cooling', category_name: '냉각·윤활·방청 상태', category_order: 5, item_code: '5-1', item_name: '냉각 회로', item_description: '막힘·누수 無', item_order: 1, photo_required: true },
  { category_code: 'cooling', category_name: '냉각·윤활·방청 상태', category_order: 5, item_code: '5-2', item_name: '오링/실링', item_description: '재조립 정상', item_order: 2, photo_required: true },
  { category_code: 'cooling', category_name: '냉각·윤활·방청 상태', category_order: 5, item_code: '5-3', item_name: '윤활 상태', item_description: '필요부 윤활 완료', item_order: 3, photo_required: true },
  { category_code: 'cooling', category_name: '냉각·윤활·방청 상태', category_order: 5, item_code: '5-4', item_name: '방청 처리', item_description: '출하용 방청 완료', item_order: 4, photo_required: true },
  { category_code: 'cooling', category_name: '냉각·윤활·방청 상태', category_order: 5, item_code: '5-5', item_name: '잔유 제거', item_description: '절삭유·연마유 無', item_order: 5, photo_required: true },
  
  // 6️⃣ 시운전(샘플) 결과 확인 (선택/조건부)
  { category_code: 'trial', category_name: '시운전 결과 확인', category_order: 6, item_code: '6-1', item_name: '시운전 실시 여부', item_description: '필요 시 실시', item_order: 1, photo_required: true },
  { category_code: 'trial', category_name: '시운전 결과 확인', category_order: 6, item_code: '6-2', item_name: '성형품 외관', item_description: '수리 NG 재발 無', item_order: 2, photo_required: true },
  { category_code: 'trial', category_name: '시운전 결과 확인', category_order: 6, item_code: '6-3', item_name: '기능 불량', item_description: '취출·변형·단차 無', item_order: 3, photo_required: true },
  { category_code: 'trial', category_name: '시운전 결과 확인', category_order: 6, item_code: '6-4', item_name: '판단 결과', item_description: 'PASS / 조건부 PASS', item_order: 4, photo_required: true },
  
  // 7️⃣ 출하 준비 및 식별 관리
  { category_code: 'shipment', category_name: '출하 준비 및 식별 관리', category_order: 7, item_code: '7-1', item_name: '금형 세척 상태', item_description: '이물 제거 완료', item_order: 1, photo_required: true },
  { category_code: 'shipment', category_name: '출하 준비 및 식별 관리', category_order: 7, item_code: '7-2', item_name: '금형 고정', item_description: '운송 중 이동 방지', item_order: 2, photo_required: true },
  { category_code: 'shipment', category_name: '출하 준비 및 식별 관리', category_order: 7, item_code: '7-3', item_name: 'QR/명판', item_description: 'QR 정상 스캔 확인', item_order: 3, photo_required: true },
  { category_code: 'shipment', category_name: '출하 준비 및 식별 관리', category_order: 7, item_code: '7-4', item_name: '출하 사진', item_description: '전체/포장 상태 사진', item_order: 4, photo_required: true },
  { category_code: 'shipment', category_name: '출하 준비 및 식별 관리', category_order: 7, item_code: '7-5', item_name: '출하 목적지', item_description: '생산처/보관처 명확', item_order: 5, photo_required: true },
  
  // 8️⃣ 최종 확인 및 승인
  { category_code: 'final', category_name: '최종 확인 및 승인', category_order: 8, item_code: '8-1', item_name: '제작처 확인', item_description: '수리 완료 확인', item_order: 1, photo_required: true },
  { category_code: 'final', category_name: '최종 확인 및 승인', category_order: 8, item_code: '8-2', item_name: '본사 승인', item_description: '승인 / 반려', item_order: 2, photo_required: true }
];

// 체크리스트 번호 생성
const generateChecklistNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `RSC-${dateStr}`;
  
  const lastChecklist = await db.RepairShipmentChecklist.findOne({
    where: {
      checklist_number: {
        [Op.like]: `${prefix}%`
      }
    },
    order: [['checklist_number', 'DESC']]
  });
  
  let seq = 1;
  if (lastChecklist && lastChecklist.checklist_number) {
    const lastSeq = parseInt(lastChecklist.checklist_number.split('-')[2], 10);
    seq = lastSeq + 1;
  }
  
  return `${prefix}-${String(seq).padStart(3, '0')}`;
};

// GET /api/v1/repair-shipment-checklists - 목록 조회
router.get('/', async (req, res) => {
  try {
    const { repair_request_id, mold_id, status, maker_id, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (repair_request_id) where.repair_request_id = repair_request_id;
    if (mold_id) where.mold_id = mold_id;
    if (status) where.status = status;
    if (maker_id) where.maker_id = maker_id;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows } = await db.RepairShipmentChecklist.findAndCountAll({
      where,
      include: [
        {
          model: db.RepairShipmentChecklistItem,
          as: 'items',
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('체크리스트 목록 조회 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/repair-shipment-checklists/:id - 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const checklist = await db.RepairShipmentChecklist.findByPk(req.params.id, {
      include: [
        {
          model: db.RepairShipmentChecklistItem,
          as: 'items',
          order: [['category_order', 'ASC'], ['item_order', 'ASC']]
        }
      ]
    });
    
    if (!checklist) {
      return res.status(404).json({ success: false, error: { message: '체크리스트를 찾을 수 없습니다.' } });
    }
    
    res.json({ success: true, data: checklist });
  } catch (error) {
    console.error('체크리스트 상세 조회 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/repair-shipment-checklists/repair-request/:repairRequestId - 수리요청별 조회
router.get('/repair-request/:repairRequestId', async (req, res) => {
  try {
    const checklist = await db.RepairShipmentChecklist.findOne({
      where: { repair_request_id: req.params.repairRequestId },
      include: [
        {
          model: db.RepairShipmentChecklistItem,
          as: 'items',
          order: [['category_order', 'ASC'], ['item_order', 'ASC']]
        }
      ]
    });
    
    res.json({ success: true, data: checklist });
  } catch (error) {
    console.error('수리요청별 체크리스트 조회 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/repair-shipment-checklists - 체크리스트 생성
router.post('/', async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const {
      repair_request_id,
      mold_id,
      mold_spec_id,
      maker_id,
      maker_checker_id,
      maker_checker_name,
      gps_latitude,
      gps_longitude,
      gps_address,
      shipment_destination,
      notes
    } = req.body;
    
    if (!repair_request_id || !mold_id) {
      return res.status(400).json({ success: false, error: { message: '수리요청 ID와 금형 ID는 필수입니다.' } });
    }
    
    // 이미 존재하는지 확인
    const existing = await db.RepairShipmentChecklist.findOne({
      where: { repair_request_id }
    });
    
    if (existing) {
      return res.status(400).json({ success: false, error: { message: '이미 해당 수리요청에 대한 출하점검 체크리스트가 존재합니다.' } });
    }
    
    // 체크리스트 생성
    const checklistNumber = await generateChecklistNumber();
    const checklist = await db.RepairShipmentChecklist.create({
      checklist_number: checklistNumber,
      repair_request_id,
      mold_id,
      mold_spec_id,
      maker_id,
      maker_checker_id,
      maker_checker_name,
      gps_latitude,
      gps_longitude,
      gps_address,
      shipment_destination,
      notes,
      status: 'draft',
      total_items: STANDARD_CHECKLIST_ITEMS.length
    }, { transaction });
    
    // 표준 점검 항목 생성
    const items = STANDARD_CHECKLIST_ITEMS.map(item => ({
      ...item,
      checklist_id: checklist.id,
      result: 'pending'
    }));
    
    await db.RepairShipmentChecklistItem.bulkCreate(items, { transaction });
    
    await transaction.commit();
    
    // 생성된 체크리스트 조회
    const createdChecklist = await db.RepairShipmentChecklist.findByPk(checklist.id, {
      include: [{ model: db.RepairShipmentChecklistItem, as: 'items' }]
    });
    
    res.status(201).json({ success: true, data: createdChecklist });
  } catch (error) {
    await transaction.rollback();
    console.error('체크리스트 생성 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PUT /api/v1/repair-shipment-checklists/:id - 체크리스트 수정
router.put('/:id', async (req, res) => {
  try {
    const checklist = await db.RepairShipmentChecklist.findByPk(req.params.id);
    
    if (!checklist) {
      return res.status(404).json({ success: false, error: { message: '체크리스트를 찾을 수 없습니다.' } });
    }
    
    // 승인 완료된 체크리스트는 수정 불가
    if (checklist.status === 'approved' || checklist.status === 'shipped') {
      return res.status(400).json({ success: false, error: { message: '승인 완료된 체크리스트는 수정할 수 없습니다.' } });
    }
    
    await checklist.update(req.body);
    
    res.json({ success: true, data: checklist });
  } catch (error) {
    console.error('체크리스트 수정 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// PUT /api/v1/repair-shipment-checklists/:id/items/:itemId - 점검 항목 결과 업데이트
router.put('/:id/items/:itemId', async (req, res) => {
  try {
    const { result, notes, fail_reason, photo_urls, before_photo_url, after_photo_url, checked_by, checked_by_name, metadata } = req.body;
    
    const item = await db.RepairShipmentChecklistItem.findOne({
      where: { id: req.params.itemId, checklist_id: req.params.id }
    });
    
    if (!item) {
      return res.status(404).json({ success: false, error: { message: '점검 항목을 찾을 수 없습니다.' } });
    }
    
    // 사진 필수 항목 체크
    if (item.photo_required && result === 'pass' && (!photo_urls || photo_urls.length === 0) && !before_photo_url && !after_photo_url) {
      return res.status(400).json({ success: false, error: { message: '이 항목은 사진 첨부가 필수입니다.' } });
    }
    
    await item.update({
      result,
      notes,
      fail_reason,
      photo_urls,
      before_photo_url,
      after_photo_url,
      checked_by,
      checked_by_name,
      checked_at: new Date(),
      metadata
    });
    
    // 체크리스트 통계 업데이트
    const allItems = await db.RepairShipmentChecklistItem.findAll({
      where: { checklist_id: req.params.id }
    });
    
    const passed = allItems.filter(i => i.result === 'pass').length;
    const failed = allItems.filter(i => i.result === 'fail').length;
    const na = allItems.filter(i => i.result === 'na').length;
    
    await db.RepairShipmentChecklist.update({
      passed_items: passed,
      failed_items: failed,
      na_items: na
    }, { where: { id: req.params.id } });
    
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('점검 항목 업데이트 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/repair-shipment-checklists/:id/submit - 제작처 점검 완료 (승인 요청)
router.post('/:id/submit', async (req, res) => {
  try {
    const { maker_checker_id, maker_checker_name, gps_latitude, gps_longitude, gps_address } = req.body;
    
    const checklist = await db.RepairShipmentChecklist.findByPk(req.params.id, {
      include: [{ model: db.RepairShipmentChecklistItem, as: 'items' }]
    });
    
    if (!checklist) {
      return res.status(404).json({ success: false, error: { message: '체크리스트를 찾을 수 없습니다.' } });
    }
    
    // 모든 항목 점검 완료 확인
    const pendingItems = checklist.items.filter(i => i.result === 'pending');
    if (pendingItems.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: { message: `미완료 항목이 ${pendingItems.length}개 있습니다. 모든 항목을 점검해주세요.` } 
      });
    }
    
    // 사진 필수 항목 확인
    const photoRequiredItems = checklist.items.filter(i => i.photo_required && i.result === 'pass');
    for (const item of photoRequiredItems) {
      if ((!item.photo_urls || item.photo_urls.length === 0) && !item.before_photo_url && !item.after_photo_url) {
        return res.status(400).json({ 
          success: false, 
          error: { message: `항목 [${item.item_code}] ${item.item_name}에 사진 첨부가 필요합니다.` } 
        });
      }
    }
    
    // FAIL 항목이 있으면 승인 요청 불가
    const failedItems = checklist.items.filter(i => i.result === 'fail');
    if (failedItems.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: { message: `불합격 항목이 ${failedItems.length}개 있습니다. 모든 항목이 PASS여야 승인 요청이 가능합니다.` } 
      });
    }
    
    await checklist.update({
      status: 'pending_approval',
      maker_checker_id,
      maker_checker_name,
      maker_check_date: new Date(),
      gps_latitude,
      gps_longitude,
      gps_address
    });
    
    res.json({ success: true, data: checklist, message: '승인 요청이 완료되었습니다.' });
  } catch (error) {
    console.error('승인 요청 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/repair-shipment-checklists/:id/approve - 본사 승인
router.post('/:id/approve', async (req, res) => {
  try {
    const { hq_approver_id, hq_approver_name } = req.body;
    
    const checklist = await db.RepairShipmentChecklist.findByPk(req.params.id);
    
    if (!checklist) {
      return res.status(404).json({ success: false, error: { message: '체크리스트를 찾을 수 없습니다.' } });
    }
    
    if (checklist.status !== 'pending_approval') {
      return res.status(400).json({ success: false, error: { message: '승인 대기 상태가 아닙니다.' } });
    }
    
    await checklist.update({
      status: 'approved',
      hq_approver_id,
      hq_approver_name,
      hq_approval_date: new Date()
    });
    
    res.json({ success: true, data: checklist, message: '승인이 완료되었습니다. 출하가 가능합니다.' });
  } catch (error) {
    console.error('승인 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/repair-shipment-checklists/:id/reject - 본사 반려
router.post('/:id/reject', async (req, res) => {
  try {
    const { hq_approver_id, hq_approver_name, rejection_reason } = req.body;
    
    if (!rejection_reason) {
      return res.status(400).json({ success: false, error: { message: '반려 사유를 입력해주세요.' } });
    }
    
    const checklist = await db.RepairShipmentChecklist.findByPk(req.params.id);
    
    if (!checklist) {
      return res.status(404).json({ success: false, error: { message: '체크리스트를 찾을 수 없습니다.' } });
    }
    
    if (checklist.status !== 'pending_approval') {
      return res.status(400).json({ success: false, error: { message: '승인 대기 상태가 아닙니다.' } });
    }
    
    await checklist.update({
      status: 'rejected',
      hq_approver_id,
      hq_approver_name,
      hq_approval_date: new Date(),
      hq_rejection_reason: rejection_reason
    });
    
    res.json({ success: true, data: checklist, message: '반려되었습니다.' });
  } catch (error) {
    console.error('반려 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// POST /api/v1/repair-shipment-checklists/:id/ship - 출하 완료
router.post('/:id/ship', async (req, res) => {
  try {
    const { shipment_destination, shipment_date } = req.body;
    
    const checklist = await db.RepairShipmentChecklist.findByPk(req.params.id);
    
    if (!checklist) {
      return res.status(404).json({ success: false, error: { message: '체크리스트를 찾을 수 없습니다.' } });
    }
    
    if (checklist.status !== 'approved') {
      return res.status(400).json({ success: false, error: { message: '승인 완료 상태에서만 출하가 가능합니다.' } });
    }
    
    await checklist.update({
      status: 'shipped',
      shipment_destination: shipment_destination || checklist.shipment_destination,
      shipment_date: shipment_date || new Date()
    });
    
    res.json({ success: true, data: checklist, message: '출하가 완료되었습니다.' });
  } catch (error) {
    console.error('출하 완료 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

// GET /api/v1/repair-shipment-checklists/template/items - 표준 점검 항목 조회
router.get('/template/items', async (req, res) => {
  try {
    // 카테고리별로 그룹화
    const categories = {};
    STANDARD_CHECKLIST_ITEMS.forEach(item => {
      if (!categories[item.category_code]) {
        categories[item.category_code] = {
          code: item.category_code,
          name: item.category_name,
          order: item.category_order,
          items: []
        };
      }
      categories[item.category_code].items.push({
        code: item.item_code,
        name: item.item_name,
        description: item.item_description,
        order: item.item_order,
        photo_required: item.photo_required
      });
    });
    
    const result = Object.values(categories).sort((a, b) => a.order - b.order);
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('표준 점검 항목 조회 오류:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

module.exports = router;
