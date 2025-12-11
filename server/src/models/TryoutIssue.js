const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TryoutIssue = sequelize.define('TryoutIssue', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mold_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'molds',
        key: 'id'
      },
      comment: '금형 ID'
    },
    mold_spec_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'mold_specifications',
        key: 'id'
      },
      comment: '금형사양 ID'
    },
    // T/O 정보
    tryout_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'T/O 차수 (1차, 2차, 3차...)'
    },
    tryout_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'T/O 일자'
    },
    // 문제점 정보
    issue_code: {
      type: DataTypes.STRING(50),
      comment: '문제점 코드 (자동생성)'
    },
    issue_category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '문제 카테고리: dimension(치수), appearance(외관), function(기능), cycle(사이클), quality(품질), other(기타)'
    },
    issue_title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '문제점 제목'
    },
    issue_description: {
      type: DataTypes.TEXT,
      comment: '문제점 상세 설명'
    },
    issue_location: {
      type: DataTypes.STRING(200),
      comment: '문제 발생 위치 (금형 부위)'
    },
    severity: {
      type: DataTypes.STRING(20),
      defaultValue: 'medium',
      comment: '심각도: critical(치명), major(중대), medium(보통), minor(경미)'
    },
    // 첨부파일
    issue_image_url: {
      type: DataTypes.TEXT,
      comment: '문제점 이미지 URL'
    },
    issue_image_filename: {
      type: DataTypes.STRING(255),
      comment: '문제점 이미지 파일명'
    },
    // 개선 정보
    improvement_status: {
      type: DataTypes.STRING(30),
      defaultValue: 'pending',
      comment: '개선 상태: pending(대기), in_progress(진행중), resolved(해결), deferred(보류), not_applicable(해당없음)'
    },
    improvement_action: {
      type: DataTypes.TEXT,
      comment: '개선 조치 내용'
    },
    improvement_date: {
      type: DataTypes.DATEONLY,
      comment: '개선 완료일'
    },
    improvement_image_url: {
      type: DataTypes.TEXT,
      comment: '개선 후 이미지 URL'
    },
    improvement_image_filename: {
      type: DataTypes.STRING(255),
      comment: '개선 후 이미지 파일명'
    },
    improved_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '개선 담당자'
    },
    // 검증 정보
    verification_status: {
      type: DataTypes.STRING(20),
      comment: '검증 상태: pending(대기), passed(통과), failed(실패)'
    },
    verified_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '검증자'
    },
    verified_at: {
      type: DataTypes.DATE,
      comment: '검증일시'
    },
    verification_remarks: {
      type: DataTypes.TEXT,
      comment: '검증 비고'
    },
    // 양산이관 연동
    transfer_check_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '양산이관 시 확인 필요 여부'
    },
    transfer_checked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '양산이관 시 확인 완료 여부'
    },
    transfer_checked_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    transfer_checked_at: {
      type: DataTypes.DATE
    },
    // 비고
    remarks: {
      type: DataTypes.TEXT,
      comment: '비고'
    },
    // 등록 정보
    registered_by: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: '등록자'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tryout_issues',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (issue, options) => {
        // 문제점 코드 자동 생성
        if (!issue.issue_code) {
          const count = await TryoutIssue.count({
            where: {
              mold_id: issue.mold_id,
              tryout_number: issue.tryout_number
            }
          });
          issue.issue_code = `TO${issue.tryout_number}-${String(count + 1).padStart(3, '0')}`;
        }
      }
    }
  });

  TryoutIssue.associate = (models) => {
    TryoutIssue.belongsTo(models.Mold, {
      foreignKey: 'mold_id',
      as: 'mold'
    });
    TryoutIssue.belongsTo(models.MoldSpecification, {
      foreignKey: 'mold_spec_id',
      as: 'moldSpecification'
    });
    TryoutIssue.belongsTo(models.User, {
      foreignKey: 'registered_by',
      as: 'registrant'
    });
    TryoutIssue.belongsTo(models.User, {
      foreignKey: 'improved_by',
      as: 'improver'
    });
    TryoutIssue.belongsTo(models.User, {
      foreignKey: 'verified_by',
      as: 'verifier'
    });
  };

  return TryoutIssue;
};
