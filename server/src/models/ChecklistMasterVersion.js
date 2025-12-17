const { Model, DataTypes } = require('sequelize');

/**
 * 체크리스트 마스터 버전 관리
 * - Draft → Review → Approved → Deployed 상태 흐름
 * - 배포된 버전만 현장 점검에 노출
 */
class ChecklistMasterVersion extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: '마스터 이름'
        },
        description: {
          type: DataTypes.TEXT,
          comment: '설명'
        },
        status: {
          type: DataTypes.ENUM('draft', 'review', 'approved', 'deployed'),
          defaultValue: 'draft',
          comment: '상태: draft, review, approved, deployed'
        },
        version: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
          comment: '버전 번호'
        },
        target_type: {
          type: DataTypes.STRING(50),
          defaultValue: 'all',
          comment: '적용대상: all, daily, periodic, pre_production'
        },
        created_by: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        approved_by: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        deployed_by: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        approved_at: {
          type: DataTypes.DATE
        },
        deployed_at: {
          type: DataTypes.DATE
        },
        change_reason: {
          type: DataTypes.TEXT,
          comment: '변경 사유'
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        is_current_deployed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '현재 활성 배포 버전 여부'
        },
        snapshot_data: {
          type: DataTypes.JSONB,
          comment: '배포 시점 스냅샷 (항목+매핑 전체)'
        }
      },
      {
        sequelize,
        modelName: 'ChecklistMasterVersion',
        tableName: 'checklist_master_versions',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['status'] },
          { fields: ['is_current_deployed'] },
          { fields: ['target_type'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    this.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver'
    });
    this.belongsTo(models.User, {
      foreignKey: 'deployed_by',
      as: 'deployer'
    });
    this.hasMany(models.ChecklistVersionItemMap, {
      foreignKey: 'checklist_version_id',
      as: 'itemMaps'
    });
    this.hasMany(models.ChecklistItemCycleMap, {
      foreignKey: 'checklist_version_id',
      as: 'cycleMaps'
    });
  }
}

module.exports = ChecklistMasterVersion;
