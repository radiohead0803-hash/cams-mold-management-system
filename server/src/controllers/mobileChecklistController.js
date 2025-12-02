const { 
  Mold, 
  ChecklistTemplate, 
  ChecklistTemplateItem, 
  ChecklistInstance, 
  ChecklistAnswer,
  RepairRequest,
  RepairRequestItem
} = require('../models/newIndex');

/**
 * 점검 세션 시작 - 템플릿으로 폼 생성
 * POST /api/v1/mobile/molds/:moldId/checklists/start
 */
async function startChecklist(req, res) {
  try {
    const { moldId } = req.params;
    const { templateId, siteType } = req.body;
    const userId = req.user?.id || null;

    // 입력 검증
    if (!templateId || !siteType) {
      return res.status(400).json({
        success: false,
        message: 'templateId와 siteType이 필요합니다.'
      });
    }

    // 금형 조회
    const mold = await Mold.findByPk(moldId);
    if (!mold) {
      return res.status(404).json({
        success: false,
        message: '금형을 찾을 수 없습니다.'
      });
    }

    // 실제 DB에서 템플릿 + 항목 조회
    const template = await ChecklistTemplate.findByPk(templateId, {
      include: [
        {
          model: ChecklistTemplateItem,
          as: 'items',
          order: [['order_no', 'ASC']]
        }
      ]
    });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: '템플릿을 찾을 수 없습니다.'
      });
    }

    // 실제 ChecklistInstance DB에 저장
    const instance = await ChecklistInstance.create({
      template_id: template.id,
      mold_id: mold.id,
      plant_id: mold.plant_id || null,
      site_type: siteType,
      category: template.category,
      shot_counter: mold.shot_counter || 0,
      status: 'draft',
      inspected_by: userId
    });

    return res.json({
      success: true,
      data: {
        instanceId: instance.id,
        mold: {
          id: mold.id,
          code: mold.mold_code,
          name: mold.mold_name,
          currentShot: mold.shot_counter || 0
        },
        template: {
          id: template.id,
          code: template.code,
          name: template.name,
          category: template.category,
          items: template.items.map(item => ({
            id: item.id,
            order_no: item.order_no,
            section: item.section,
            label: item.label,
            field_type: item.field_type,
            required: item.required,
            ng_criteria: item.ng_criteria
          }))
        }
      }
    });

  } catch (err) {
    console.error('[startChecklist] error:', err);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
}

/**
 * 점검 결과 제출
 * POST /api/v1/mobile/checklists/:instanceId/submit
 */
async function submitChecklist(req, res) {
  try {
    const { instanceId } = req.params;
    const { answers } = req.body;
    const userId = req.user?.id || null;
    const userRole = req.user?.role || 'production';

    // 입력 검증
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'answers 배열이 필요합니다.'
      });
    }

    // 인스턴스 조회 (Mold 포함)
    const instance = await ChecklistInstance.findByPk(instanceId, {
      include: [{ model: Mold, as: 'mold' }]
    });
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: '점검 세션을 찾을 수 없습니다.'
      });
    }

    // 기존 답변 삭제
    await ChecklistAnswer.destroy({ where: { instance_id: instance.id } });

    // 새 답변 저장
    const savedAnswers = [];
    
    for (const answer of answers) {
      const answerData = {
        instance_id: instance.id,
        item_id: answer.itemId,
        is_ng: false
      };

      // 필드 타입에 따라 적절한 컬럼에 저장
      if (answer.fieldType === 'boolean') {
        answerData.value_bool = !!answer.value;
        answerData.is_ng = answer.value === false; // false면 NG
      } else if (answer.fieldType === 'number') {
        answerData.value_number = answer.value;
      } else if (answer.fieldType === 'text') {
        answerData.value_text = answer.value;
      }

      const created = await ChecklistAnswer.create(answerData);
      savedAnswers.push(created);
    }

    // 인스턴스 상태 업데이트
    await instance.update({
      status: 'submitted',
      inspected_at: new Date()
    });

    // NG 항목 확인 및 자동 수리요청 생성
    const ngAnswers = savedAnswers.filter(a => a.is_ng);
    let repairRequestId = null;

    if (ngAnswers.length > 0) {
      // NG 항목의 라벨/섹션 가져오기
      const itemIds = ngAnswers.map(a => a.item_id);
      const items = await ChecklistTemplateItem.findAll({
        where: { id: itemIds }
      });
      
      const itemById = {};
      items.forEach(item => {
        itemById[item.id] = item;
      });

      // 수리요청 헤더 생성
      const mold = instance.mold;
      const title = `[NG] 금형 ${mold.mold_code} 점검 결과 수리요청`;
      const description = `체크리스트(ID: ${instance.id})에서 NG 항목 ${ngAnswers.length}건 발생\n\nNG 항목:\n${
        ngAnswers.map(a => {
          const item = itemById[a.item_id];
          return `- ${item?.section || '기타'}: ${item?.label || '항목'}`;
        }).join('\n')
      }`;

      const repairRequest = await RepairRequest.create({
        mold_id: instance.mold_id,
        plant_id: instance.plant_id,
        checklist_instance_id: instance.id,
        status: 'requested',
        priority: 'normal',
        request_type: 'ng_repair',
        requested_by: userId,
        requested_role: userRole,
        title,
        description
      });

      repairRequestId = repairRequest.id;

      // 수리요청 항목 상세 생성
      for (const ans of ngAnswers) {
        const item = itemById[ans.item_id];
        await RepairRequestItem.create({
          repair_request_id: repairRequest.id,
          checklist_answer_id: ans.id,
          item_label: item?.label || '',
          item_section: item?.section || null,
          value_text: ans.value_text ?? null,
          value_bool: ans.value_bool ?? null,
          is_ng: true
        });
      }

      console.log('[submitChecklist] Auto repair request created:', {
        repairRequestId: repairRequest.id,
        ngCount: ngAnswers.length
      });
    }

    console.log('[submitChecklist] Saved:', {
      instanceId: instance.id,
      answersCount: answers.length,
      ngCount: ngAnswers.length,
      repairRequestCreated: !!repairRequestId
    });

    return res.json({
      success: true,
      data: {
        instanceId: instance.id,
        hasNg: ngAnswers.length > 0,
        ngCount: ngAnswers.length,
        repairRequestId,
        message: '점검 결과가 저장되었습니다.'
      }
    });

  } catch (err) {
    console.error('[submitChecklist] error:', err);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
}

// 하드코딩된 템플릿 데이터 제거됨 - 이제 DB에서 조회
// getTemplateData() 함수는 더 이상 사용하지 않음

module.exports = {
  startChecklist,
  submitChecklist
};

/* 
// 이전 하드코딩 버전 (참고용)
function getTemplateData(templateId) {
  const templates = {
    1: {
      id: 1,
      code: 'DAILY',
      name: '일상 점검',
      category: 'daily',
      items: [
        {
          id: 1001,
          order_no: 1,
          section: '공통',
          label: '금형 외관 손상 여부',
          field_type: 'boolean',
          required: true,
          ng_criteria: 'NO면 NG'
        },
        {
          id: 1002,
          order_no: 2,
          section: '공통',
          label: '금형 청결 상태',
          field_type: 'boolean',
          required: true,
          ng_criteria: 'NO면 NG'
        },
        {
          id: 1003,
          order_no: 3,
          section: '냉각',
          label: '냉각라인 누수 여부',
          field_type: 'boolean',
          required: true,
          ng_criteria: 'NO면 NG'
        },
        {
          id: 1004,
          order_no: 4,
          section: '냉각',
          label: '냉각수 온도 (°C)',
          field_type: 'number',
          required: true
        },
        {
          id: 1005,
          order_no: 5,
          section: '기타',
          label: '특이사항',
          field_type: 'text',
          required: false
        }
      ]
    },
    2: {
      id: 2,
      code: 'REG_20K',
      name: '2만샷 정기점검',
      category: 'regular',
      shot_interval: 20000,
      items: [
        {
          id: 2001,
          order_no: 1,
          section: '성형조건',
          label: '사출압력 정상 여부',
          field_type: 'boolean',
          required: true
        },
        {
          id: 2002,
          order_no: 2,
          section: '성형조건',
          label: '사출온도 (°C)',
          field_type: 'number',
          required: true
        },
        {
          id: 2003,
          order_no: 3,
          section: '금형',
          label: '캐비티 마모 상태',
          field_type: 'boolean',
          required: true
        },
        {
          id: 2004,
          order_no: 4,
          section: '금형',
          label: '이젝터 핀 상태',
          field_type: 'boolean',
          required: true
        },
        {
          id: 2005,
          order_no: 5,
          section: '냉각',
          label: '냉각 효율 정상 여부',
          field_type: 'boolean',
          required: true
        },
        {
          id: 2006,
          order_no: 6,
          section: '기타',
          label: '종합 의견',
          field_type: 'text',
          required: false
        }
      ]
    }
  };

  return templates[templateId] || null;
}
*/
