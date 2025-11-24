const { Company, User, Mold, MoldSpecification, sequelize } = require('../models/newIndex');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const ExcelJS = require('exceljs');

/**
 * 회사 목록 조회 (제작처/생산처 통합)
 */
const getCompanies = async (req, res) => {
  try {
    const { 
      company_type, 
      is_active, 
      contract_status,
      search,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    const where = {};
    
    // 회사 유형 필터 (maker, plant)
    if (company_type) {
      where.company_type = company_type;
    }
    
    // 활성 상태 필터
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }
    
    // 계약 상태 필터
    if (contract_status) {
      where.contract_status = contract_status;
    }
    
    // 검색 (회사명, 회사코드)
    if (search) {
      where[Op.or] = [
        { company_name: { [Op.iLike]: `%${search}%` } },
        { company_code: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const companies = await Company.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id', 'username', 'name', 'email', 'user_type', 'is_active']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        total: companies.count,
        items: companies.rows,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      error: { message: '회사 목록 조회 실패' }
    });
  }
};

/**
 * 회사 상세 조회
 */
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        error: { message: '회사를 찾을 수 없습니다' }
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    logger.error('Get company by ID error:', error);
    logger.error('Error details:', error.stack);
    res.status(500).json({
      success: false,
      error: { message: '회사 조회 실패' }
    });
  }
};

/**
 * 자동 업체 코드 생성
 */
const generateCompanyCode = async (company_type) => {
  const prefix = company_type === 'maker' ? 'MKR' : 'PLT';
  
  // 해당 타입의 마지막 코드 조회
  const lastCompany = await Company.findOne({
    where: { 
      company_type,
      company_code: { [Op.like]: `${prefix}-%` }
    },
    order: [['company_code', 'DESC']]
  });

  let nextNumber = 1;
  if (lastCompany) {
    // 마지막 코드에서 숫자 부분 추출 (예: MKR-003 → 3)
    const match = lastCompany.company_code.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0]) + 1;
    }
  }

  // 3자리 숫자로 포맷 (예: 1 → 001)
  const formattedNumber = String(nextNumber).padStart(3, '0');
  return `${prefix}-${formattedNumber}`;
};

/**
 * 회사 등록 (제작처/생산처)
 */
const createCompany = async (req, res) => {
  try {
    let {
      company_code,
      company_name,
      company_type,
      business_number,
      representative,
      phone,
      fax,
      email,
      address,
      address_detail,
      postal_code,
      latitude,
      longitude,
      manager_name,
      manager_phone,
      manager_email,
      contract_start_date,
      contract_end_date,
      production_capacity,
      equipment_list,
      certifications,
      specialties,
      production_lines,
      injection_machines,
      daily_capacity,
      notes
    } = req.body;

    // 필수 필드 검증
    if (!company_name || !company_type) {
      return res.status(400).json({
        success: false,
        error: { message: '회사명, 회사 유형은 필수입니다' }
      });
    }

    // 회사 유형 검증
    if (!['maker', 'plant'].includes(company_type)) {
      return res.status(400).json({
        success: false,
        error: { message: '회사 유형은 maker 또는 plant여야 합니다' }
      });
    }

    // 업체 코드 자동 생성 (제공되지 않은 경우)
    if (!company_code) {
      company_code = await generateCompanyCode(company_type);
      logger.info(`Auto-generated company code: ${company_code}`);
    }

    // 중복 확인
    const existingCompany = await Company.findOne({ 
      where: { 
        [Op.or]: [
          { company_code },
          { company_name }
        ]
      } 
    });
    
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        error: { message: '이미 등록된 회사 코드 또는 회사명입니다' }
      });
    }

    const company = await Company.create({
      company_code,
      company_name,
      company_type,
      business_number,
      representative,
      phone,
      fax,
      email,
      address,
      address_detail,
      postal_code,
      latitude,
      longitude,
      manager_name,
      manager_phone,
      manager_email,
      contract_start_date,
      contract_end_date,
      contract_status: 'active',
      production_capacity,
      equipment_list,
      certifications,
      specialties,
      production_lines,
      injection_machines,
      daily_capacity,
      notes,
      is_active: true,
      registered_by: req.user?.id
    });

    logger.info(`Company created: ${company.company_code} (${company.company_name})`);

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    logger.error('Create company error:', error);
    res.status(500).json({
      success: false,
      error: { message: '회사 등록 실패' }
    });
  }
};

/**
 * 회사 정보 수정
 */
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: { message: '회사를 찾을 수 없습니다' }
      });
    }

    // company_code와 company_type은 수정 불가
    delete updateData.company_code;
    delete updateData.company_type;
    delete updateData.id;
    delete updateData.created_at;

    updateData.updated_at = new Date();

    await company.update(updateData);

    logger.info(`Company updated: ${company.company_code} (${company.company_name})`);

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    logger.error('Update company error:', error);
    res.status(500).json({
      success: false,
      error: { message: '회사 정보 수정 실패' }
    });
  }
};

/**
 * 회사 비활성화 (소프트 삭제)
 */
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: { message: '회사를 찾을 수 없습니다' }
      });
    }

    // 활성 금형이 있는지 확인
    const activeMoldsCount = await Mold.count({
      where: {
        [Op.or]: [
          { maker_company_id: id },
          { plant_company_id: id }
        ],
        status: { [Op.in]: ['active', 'in_production'] }
      }
    });

    if (activeMoldsCount > 0) {
      return res.status(400).json({
        success: false,
        error: { 
          message: '활성 금형이 있어 비활성화할 수 없습니다',
          active_molds: activeMoldsCount
        }
      });
    }

    // 소프트 삭제
    await company.update({ 
      is_active: false,
      updated_at: new Date()
    });

    logger.info(`Company deactivated: ${company.company_code} (${company.company_name})`);

    res.json({
      success: true,
      data: { message: '회사가 비활성화되었습니다' }
    });
  } catch (error) {
    logger.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      error: { message: '회사 비활성화 실패' }
    });
  }
};

/**
 * 회사 통계 조회
 */
const getCompanyStats = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({
        success: false,
        error: { message: '회사를 찾을 수 없습니다' }
      });
    }

    let stats = {};

    if (company.company_type === 'maker') {
      // 제작처 통계
      const makerMolds = await Mold.findAll({
        where: { maker_company_id: id },
        attributes: ['status']
      });

      const makerSpecs = await MoldSpecification.findAll({
        where: { maker_company_id: id },
        attributes: ['status']
      });

      stats = {
        total_molds: makerMolds.length,
        active_molds: makerMolds.filter(m => m.status === 'active').length,
        repair_molds: makerMolds.filter(m => m.status === 'repair').length,
        total_specifications: makerSpecs.length,
        in_production: makerSpecs.filter(s => s.status === 'in_production').length,
        completed: makerSpecs.filter(s => s.status === 'completed').length
      };
    } else if (company.company_type === 'plant') {
      // 생산처 통계
      const plantMolds = await Mold.findAll({
        where: { plant_company_id: id },
        attributes: ['status']
      });

      stats = {
        total_molds: plantMolds.length,
        active_molds: plantMolds.filter(m => m.status === 'active').length,
        in_production: plantMolds.filter(m => m.status === 'in_production').length,
        maintenance: plantMolds.filter(m => m.status === 'maintenance').length,
        idle: plantMolds.filter(m => m.status === 'idle').length
      };
    }

    res.json({
      success: true,
      data: {
        company_info: {
          id: company.id,
          company_code: company.company_code,
          company_name: company.company_name,
          company_type: company.company_type
        },
        stats
      }
    });
  } catch (error) {
    logger.error('Get company stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: '회사 통계 조회 실패' }
    });
  }
};

/**
 * 전체 업체 통계 조회 (대시보드용)
 */
const getAllCompaniesStats = async (req, res) => {
  try {
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*)::int as total_companies,
        COUNT(CASE WHEN company_type = 'maker' THEN 1 END)::int as total_makers,
        COUNT(CASE WHEN company_type = 'plant' THEN 1 END)::int as total_plants,
        COUNT(CASE WHEN is_active = true THEN 1 END)::int as active_companies,
        COUNT(CASE WHEN company_type = 'maker' AND is_active = true THEN 1 END)::int as active_makers,
        COUNT(CASE WHEN company_type = 'plant' AND is_active = true THEN 1 END)::int as active_plants,
        ROUND(CAST(AVG(CASE WHEN rating IS NOT NULL THEN rating END) AS NUMERIC), 2) as avg_rating,
        ROUND(CAST(AVG(CASE WHEN company_type = 'maker' AND rating IS NOT NULL THEN rating END) AS NUMERIC), 2) as avg_maker_rating,
        ROUND(CAST(AVG(CASE WHEN company_type = 'plant' AND rating IS NOT NULL THEN rating END) AS NUMERIC), 2) as avg_plant_rating,
        COALESCE(SUM(total_molds), 0)::int as total_molds_managed,
        COALESCE(SUM(active_molds), 0)::int as total_active_molds
      FROM companies;
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    logger.error('Get all companies stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: '전체 업체 통계 조회 실패' }
    });
  }
};

/**
 * 엑셀 샘플 파일 다운로드
 */
const downloadSampleExcel = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('업체 목록');

    // 헤더 스타일
    worksheet.columns = [
      { header: '업체 유형*', key: 'company_type', width: 15 },
      { header: '업체명*', key: 'company_name', width: 25 },
      { header: '사업자번호', key: 'business_number', width: 20 },
      { header: '대표자명', key: 'representative', width: 15 },
      { header: '전화번호', key: 'phone', width: 20 },
      { header: '팩스', key: 'fax', width: 20 },
      { header: '이메일', key: 'email', width: 30 },
      { header: '주소', key: 'address', width: 40 },
      { header: '상세주소', key: 'address_detail', width: 30 },
      { header: '우편번호', key: 'postal_code', width: 15 },
      { header: '담당자명', key: 'manager_name', width: 15 },
      { header: '담당자 전화', key: 'manager_phone', width: 20 },
      { header: '담당자 이메일', key: 'manager_email', width: 30 },
      { header: '계약 시작일', key: 'contract_start_date', width: 15 },
      { header: '계약 종료일', key: 'contract_end_date', width: 15 },
      { header: '비고', key: 'notes', width: 40 }
    ];

    // 헤더 스타일 적용
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 샘플 데이터
    worksheet.addRow({
      company_type: 'maker',
      company_name: '대한금형제작소',
      business_number: '123-45-67890',
      representative: '김철수',
      phone: '02-1234-5678',
      fax: '02-1234-5679',
      email: 'info@daehangeum.com',
      address: '서울시 강남구 테헤란로 123',
      address_detail: '5층',
      postal_code: '06234',
      manager_name: '이영희',
      manager_phone: '010-1234-5678',
      manager_email: 'manager@daehangeum.com',
      contract_start_date: '2024-01-01',
      contract_end_date: '2025-12-31',
      notes: '주력 제품: 자동차 부품 금형'
    });

    worksheet.addRow({
      company_type: 'plant',
      company_name: '한국플라스틱공업',
      business_number: '234-56-78901',
      representative: '박민수',
      phone: '031-9876-5432',
      email: 'contact@hanplastic.com',
      address: '경기도 안산시 단원구 공단로 456',
      postal_code: '15588',
      manager_name: '최수진',
      manager_phone: '010-9876-5432',
      manager_email: 'manager@hanplastic.com',
      contract_start_date: '2024-03-01',
      contract_end_date: '2026-02-28'
    });

    // 설명 시트 추가
    const instructionSheet = workbook.addWorksheet('작성 가이드');
    instructionSheet.columns = [
      { header: '항목', key: 'field', width: 20 },
      { header: '필수여부', key: 'required', width: 12 },
      { header: '설명', key: 'description', width: 50 },
      { header: '예시', key: 'example', width: 30 }
    ];

    instructionSheet.getRow(1).font = { bold: true };
    instructionSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' }
    };

    const instructions = [
      { field: '업체 유형', required: '필수', description: 'maker (제작처) 또는 plant (생산처)', example: 'maker' },
      { field: '업체명', required: '필수', description: '업체의 정식 명칭', example: '대한금형제작소' },
      { field: '사업자번호', required: '선택', description: '사업자등록번호 (하이픈 포함 가능)', example: '123-45-67890' },
      { field: '대표자명', required: '선택', description: '대표자 이름', example: '김철수' },
      { field: '전화번호', required: '선택', description: '대표 전화번호', example: '02-1234-5678' },
      { field: '이메일', required: '선택', description: '대표 이메일 주소', example: 'info@company.com' },
      { field: '주소', required: '선택', description: '사업장 주소', example: '서울시 강남구 테헤란로 123' },
      { field: '담당자명', required: '선택', description: '담당자 이름', example: '이영희' },
      { field: '담당자 전화', required: '선택', description: '담당자 연락처', example: '010-1234-5678' },
      { field: '계약 시작일', required: '선택', description: '계약 시작일 (YYYY-MM-DD)', example: '2024-01-01' },
      { field: '계약 종료일', required: '선택', description: '계약 종료일 (YYYY-MM-DD)', example: '2025-12-31' }
    ];

    instructions.forEach(inst => instructionSheet.addRow(inst));

    // 파일 전송
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=company_upload_sample.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    logger.error('Download sample excel error:', error);
    res.status(500).json({
      success: false,
      error: { message: '샘플 파일 다운로드 실패' }
    });
  }
};

/**
 * 엑셀 파일로 업체 일괄 등록
 */
const bulkUploadCompanies = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: '파일이 업로드되지 않았습니다' }
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    
    const worksheet = workbook.getWorksheet('업체 목록') || workbook.getWorksheet(1);
    
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        error: { message: '올바른 형식의 엑셀 파일이 아닙니다' }
      });
    }

    const companies = [];
    const errors = [];
    let rowNumber = 1;

    // 헤더 행 건너뛰기
    worksheet.eachRow((row, index) => {
      if (index === 1) return; // 헤더 행 건너뛰기
      
      rowNumber = index;
      const rowData = {
        company_type: row.getCell(1).value,
        company_name: row.getCell(2).value,
        business_number: row.getCell(3).value,
        representative: row.getCell(4).value,
        phone: row.getCell(5).value,
        fax: row.getCell(6).value,
        email: row.getCell(7).value,
        address: row.getCell(8).value,
        address_detail: row.getCell(9).value,
        postal_code: row.getCell(10).value,
        manager_name: row.getCell(11).value,
        manager_phone: row.getCell(12).value,
        manager_email: row.getCell(13).value,
        contract_start_date: row.getCell(14).value,
        contract_end_date: row.getCell(15).value,
        notes: row.getCell(16).value
      };

      // 필수 필드 검증
      if (!rowData.company_name || !rowData.company_type) {
        errors.push({
          row: rowNumber,
          error: '업체명과 업체 유형은 필수입니다'
        });
        return;
      }

      // 업체 유형 검증
      if (!['maker', 'plant'].includes(rowData.company_type)) {
        errors.push({
          row: rowNumber,
          error: '업체 유형은 maker 또는 plant여야 합니다'
        });
        return;
      }

      companies.push(rowData);
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: { 
          message: '데이터 검증 실패',
          details: errors
        }
      });
    }

    // 트랜잭션으로 일괄 등록
    const results = await sequelize.transaction(async (t) => {
      const created = [];
      const failed = [];

      for (const companyData of companies) {
        try {
          // 업체 코드 자동 생성
          const company_code = await generateCompanyCode(companyData.company_type);
          
          // 중복 확인
          const existing = await Company.findOne({
            where: { company_name: companyData.company_name },
            transaction: t
          });

          if (existing) {
            failed.push({
              company_name: companyData.company_name,
              error: '이미 등록된 업체명입니다'
            });
            continue;
          }

          // 업체 생성
          const company = await Company.create({
            ...companyData,
            company_code,
            is_active: true
          }, { transaction: t });

          created.push(company);
        } catch (error) {
          failed.push({
            company_name: companyData.company_name,
            error: error.message
          });
        }
      }

      return { created, failed };
    });

    res.json({
      success: true,
      data: {
        total: companies.length,
        created: results.created.length,
        failed: results.failed.length,
        createdCompanies: results.created,
        failedCompanies: results.failed
      }
    });
  } catch (error) {
    logger.error('Bulk upload companies error:', error);
    res.status(500).json({
      success: false,
      error: { message: '업체 일괄 등록 실패' }
    });
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStats,
  getAllCompaniesStats,
  downloadSampleExcel,
  bulkUploadCompanies
};
