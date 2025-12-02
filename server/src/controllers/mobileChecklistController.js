const { Mold } = require('../models');

/**
 * 점검 세션 시작 - 템플릿으로 폼 생성
 * POST /api/v1/mobile/molds/:moldId/checklists/start
 */
exports.startChecklist = async (req, res) => {
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

    // TODO: 나중에 실제 템플릿 DB에서 조회
    // 현재는 하드코딩된 템플릿 데이터 반환
    const templateData = getTemplateData(templateId);
    
    if (!templateData) {
      return res.status(404).json({
        success: false,
        message: '템플릿을 찾을 수 없습니다.'
      });
    }

    // TODO: 나중에 실제 ChecklistInstance DB에 저장
    // 현재는 임시 instanceId 생성
    const instanceId = Date.now();

    return res.json({
      success: true,
      data: {
        instanceId,
        mold: {
          id: mold.id,
          code: mold.mold_code,
          name: mold.mold_name,
          currentShot: mold.shot_counter || 0
        },
        template: templateData
      }
    });

  } catch (err) {
    console.error('[startChecklist] error:', err);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

/**
 * 점검 결과 제출
 * POST /api/v1/mobile/checklists/:instanceId/submit
 */
exports.submitChecklist = async (req, res) => {
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

    // TODO: 나중에 실제 DB에 저장
    // 현재는 로그만 출력
    console.log('[submitChecklist] instanceId:', instanceId);
    console.log('[submitChecklist] answers:', answers);
    console.log('[submitChecklist] comment:', comment);

    // NG 항목 카운트
    const ngCount = answers.filter(a => 
      a.fieldType === 'boolean' && a.value === false
    ).length;

    return res.json({
      success: true,
      data: {
        instanceId,
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
};

/**
 * 하드코딩된 템플릿 데이터 (임시)
 * TODO: 나중에 DB에서 조회
 */
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

module.exports = {
  startChecklist,
  submitChecklist
};
