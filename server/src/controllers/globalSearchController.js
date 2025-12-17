/**
 * 전역 검색 컨트롤러
 * 금형, 업체, 수리요청 등 통합 검색
 */
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * 전역 검색
 * GET /api/v1/search
 */
const globalSearch = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const { q, type, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: { results: [], total: 0 }
      });
    }

    const searchQuery = q.trim().toLowerCase();
    const results = [];

    // 금형 검색
    if (!type || type === 'mold') {
      try {
        const MoldSpecification = sequelize.models.MoldSpecification || sequelize.models.mold_specifications;
        if (MoldSpecification) {
          const molds = await MoldSpecification.findAll({
            where: {
              [Op.or]: [
                { mold_code: { [Op.iLike]: `%${searchQuery}%` } },
                { mold_name: { [Op.iLike]: `%${searchQuery}%` } },
                { car_model: { [Op.iLike]: `%${searchQuery}%` } },
                { part_name: { [Op.iLike]: `%${searchQuery}%` } }
              ]
            },
            attributes: ['id', 'mold_code', 'mold_name', 'car_model', 'part_name', 'status'],
            limit: parseInt(limit)
          });

          molds.forEach(mold => {
            results.push({
              type: 'mold',
              id: mold.id,
              title: mold.mold_code,
              subtitle: `${mold.mold_name || ''} - ${mold.car_model || ''}`,
              description: mold.part_name,
              status: mold.status,
              link: `/molds/${mold.id}`
            });
          });
        }
      } catch (e) {
        logger.warn('금형 검색 실패:', e.message);
      }
    }

    // 업체 검색
    if (!type || type === 'company') {
      try {
        const Company = sequelize.models.Company || sequelize.models.companies;
        if (Company) {
          const companies = await Company.findAll({
            where: {
              [Op.or]: [
                { company_name: { [Op.iLike]: `%${searchQuery}%` } },
                { company_code: { [Op.iLike]: `%${searchQuery}%` } }
              ]
            },
            attributes: ['id', 'company_name', 'company_code', 'company_type'],
            limit: parseInt(limit)
          });

          companies.forEach(company => {
            results.push({
              type: 'company',
              id: company.id,
              title: company.company_name,
              subtitle: company.company_code,
              description: company.company_type === 'maker' ? '제작처' : '생산처',
              link: `/companies/${company.id}`
            });
          });
        }
      } catch (e) {
        logger.warn('업체 검색 실패:', e.message);
      }
    }

    // 수리 요청 검색
    if (!type || type === 'repair') {
      try {
        const RepairRequest = sequelize.models.RepairRequest || sequelize.models.repair_requests;
        if (RepairRequest) {
          const repairs = await RepairRequest.findAll({
            where: {
              [Op.or]: [
                { request_number: { [Op.iLike]: `%${searchQuery}%` } },
                { description: { [Op.iLike]: `%${searchQuery}%` } }
              ]
            },
            attributes: ['id', 'request_number', 'description', 'status', 'created_at'],
            limit: parseInt(limit)
          });

          repairs.forEach(repair => {
            results.push({
              type: 'repair',
              id: repair.id,
              title: repair.request_number,
              subtitle: repair.status,
              description: repair.description?.substring(0, 100),
              link: `/repairs/${repair.id}`
            });
          });
        }
      } catch (e) {
        logger.warn('수리 검색 실패:', e.message);
      }
    }

    // 사용자 검색 (관리자만)
    if ((!type || type === 'user') && req.user?.user_type === 'system_admin') {
      try {
        const User = sequelize.models.User || sequelize.models.users;
        if (User) {
          const users = await User.findAll({
            where: {
              [Op.or]: [
                { name: { [Op.iLike]: `%${searchQuery}%` } },
                { email: { [Op.iLike]: `%${searchQuery}%` } }
              ]
            },
            attributes: ['id', 'name', 'email', 'user_type', 'company_name'],
            limit: parseInt(limit)
          });

          users.forEach(user => {
            results.push({
              type: 'user',
              id: user.id,
              title: user.name,
              subtitle: user.email,
              description: `${user.company_name || ''} (${user.user_type})`,
              link: `/users/internal`
            });
          });
        }
      } catch (e) {
        logger.warn('사용자 검색 실패:', e.message);
      }
    }

    res.json({
      success: true,
      data: {
        results: results.slice(0, parseInt(limit) * 4),
        total: results.length,
        query: q
      }
    });
  } catch (error) {
    logger.error('전역 검색 에러:', error);
    res.status(500).json({
      success: false,
      error: { message: '검색에 실패했습니다.' }
    });
  }
};

/**
 * 검색 제안 (자동완성)
 * GET /api/v1/search/suggestions
 */
const getSearchSuggestions = async (req, res) => {
  try {
    const { sequelize } = req.app.locals;
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({
        success: true,
        data: { suggestions: [] }
      });
    }

    const searchQuery = q.trim().toLowerCase();
    const suggestions = [];

    // 금형 코드 제안
    try {
      const MoldSpecification = sequelize.models.MoldSpecification || sequelize.models.mold_specifications;
      if (MoldSpecification) {
        const molds = await MoldSpecification.findAll({
          where: {
            mold_code: { [Op.iLike]: `%${searchQuery}%` }
          },
          attributes: ['mold_code'],
          limit: 5,
          group: ['mold_code']
        });

        molds.forEach(mold => {
          suggestions.push({
            type: 'mold',
            value: mold.mold_code,
            label: `금형: ${mold.mold_code}`
          });
        });
      }
    } catch (e) {
      // 무시
    }

    // 차종 제안
    try {
      const MoldSpecification = sequelize.models.MoldSpecification || sequelize.models.mold_specifications;
      if (MoldSpecification) {
        const carModels = await MoldSpecification.findAll({
          where: {
            car_model: { [Op.iLike]: `%${searchQuery}%` }
          },
          attributes: ['car_model'],
          limit: 5,
          group: ['car_model']
        });

        carModels.forEach(item => {
          if (item.car_model) {
            suggestions.push({
              type: 'car_model',
              value: item.car_model,
              label: `차종: ${item.car_model}`
            });
          }
        });
      }
    } catch (e) {
      // 무시
    }

    res.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, 10)
      }
    });
  } catch (error) {
    logger.error('검색 제안 에러:', error);
    res.json({
      success: true,
      data: { suggestions: [] }
    });
  }
};

module.exports = {
  globalSearch,
  getSearchSuggestions
};
