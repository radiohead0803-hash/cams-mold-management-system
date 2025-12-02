const { Mold, ChecklistTemplate, ChecklistTemplateItem, ChecklistInstance, ChecklistAnswer } = require('../models/newIndex');

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
    const { answers, comment } = req.body;

    // 입력 검증
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'answers 배열이 필요합니다.'
      });
    }

    // 인스턴스 조회
    const instance = await ChecklistInstance.findByPk(instanceId);
    if (!instance) {
      return res.status(404).json({
        success: false,
        message: '점검 세션을 찾을 수 없습니다.'
      });
    }

    // 실제 DB에 답변 저장
    for (const answer of answers) {
      const answerData = {
        instance_id: instance.id,
        item_id: answer.itemId
      };

      // 필드 타입에 따라 적절한 컬럼에 저장
      if (answer.fieldType === 'boolean') {
        answerData.value_bool = answer.value;
        answerData.is_ng = answer.value === false; // false면 NG
      } else if (answer.fieldType === 'number') {
        answerData.value_number = answer.value;
      } else if (answer.fieldType === 'text') {
        answerData.value_text = answer.value;
      }

      await ChecklistAnswer.create(answerData);
    }

    // 인스턴스 상태 업데이트
    await instance.update({
      status: 'submitted',
      inspected_at: new Date()
    });

    // NG 항목 카운트
    const ngCount = answers.filter(a => 
      a.fieldType === 'boolean' && a.value === false
    ).length;

    console.log('[submitChecklist] Saved:', {
      instanceId: instance.id,
      answersCount: answers.length,
      ngCount
    });

    return res.json({
      success: true,
      data: {
        instanceId: instance.id,
        ngCount,
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
