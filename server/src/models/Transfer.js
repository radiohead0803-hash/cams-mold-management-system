const { Model, DataTypes } = require('sequelize');

class Transfer extends Model {
  static init(sequelize) {
    return super.init(
      {
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
          }
        },
        transfer_number: {
          type: DataTypes.STRING(50),
          unique: true,
          comment: '이관번호'
        },
        transfer_type: {
          type: DataTypes.STRING(50),
          comment: 'maker_to_plant, plant_to_plant, plant_to_storage'
        },
        from_location: {
          type: DataTypes.STRING(200),
          allowNull: true
        },
        to_location: {
          type: DataTypes.STRING(200),
          allowNull: true
        },
        from_company_id: {
          type: DataTypes.INTEGER,
          references: { model: 'companies', key: 'id' },
          comment: '인계 업체 ID'
        },
        to_company_id: {
          type: DataTypes.INTEGER,
          references: { model: 'companies', key: 'id' },
          comment: '인수 업체 ID'
        },
        developer_id: {
          type: DataTypes.INTEGER,
          references: { model: 'users', key: 'id' },
          comment: '개발담당자 ID'
        },
        from_party_id: {
          type: DataTypes.INTEGER,
          references: { model: 'users', key: 'id' },
          comment: '이관 출발지 담당자'
        },
        to_party_id: {
          type: DataTypes.INTEGER,
          references: { model: 'users', key: 'id' },
          comment: '이관 도착지 담당자'
        },
        requested_by: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' }
        },
        request_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        planned_transfer_date: {
          type: DataTypes.DATEONLY
        },
        actual_transfer_date: {
          type: DataTypes.DATEONLY
        },
        reason: {
          type: DataTypes.TEXT,
          comment: '이관 사유'
        },
        current_shots: {
          type: DataTypes.INTEGER
        },
        mold_condition: {
          type: DataTypes.STRING(50),
          comment: 'excellent, good, fair, poor'
        },
        status: {
          type: DataTypes.STRING(30),
          defaultValue: 'draft',
          comment: 'draft, requested, in_progress, completed, rejected'
        },
        current_step: {
          type: DataTypes.STRING(50),
          defaultValue: '요청',
          comment: '현재 저장 단계'
        },
        priority: {
          type: DataTypes.STRING(20),
          defaultValue: '보통'
        },
        from_manager_name: { type: DataTypes.STRING(100) },
        from_manager_contact: { type: DataTypes.STRING(50) },
        to_manager_name: { type: DataTypes.STRING(100) },
        to_manager_contact: { type: DataTypes.STRING(50) },
        developer_name: { type: DataTypes.STRING(100) },
        developer_contact: { type: DataTypes.STRING(50) },
        mold_info_snapshot: {
          type: DataTypes.JSONB,
          comment: '이관 시점 금형 정보 스냅샷'
        },
        checklist_completed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        all_approvals_completed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        // 3단계 승인 상태 (인계/검수/이관)
        handover_approval_status: {
          type: DataTypes.STRING(20),
          defaultValue: '대기'
        },
        handover_approval_date: { type: DataTypes.DATE },
        handover_approver_id: {
          type: DataTypes.INTEGER,
          references: { model: 'users', key: 'id' }
        },
        handover_rejection_reason: { type: DataTypes.TEXT },
        inspection_approval_status: {
          type: DataTypes.STRING(20),
          defaultValue: '대기'
        },
        inspection_approval_date: { type: DataTypes.DATE },
        inspection_approver_id: {
          type: DataTypes.INTEGER,
          references: { model: 'users', key: 'id' }
        },
        inspection_rejection_reason: { type: DataTypes.TEXT },
        transfer_approval_status: {
          type: DataTypes.STRING(20),
          defaultValue: '대기'
        },
        transfer_approval_date: { type: DataTypes.DATE },
        transfer_approver_id: {
          type: DataTypes.INTEGER,
          references: { model: 'users', key: 'id' }
        },
        transfer_rejection_reason: { type: DataTypes.TEXT },
        documents: {
          type: DataTypes.JSONB,
          comment: '이관 문서'
        },
        photos: {
          type: DataTypes.JSONB,
          comment: '이관 전 사진'
        },
        approved_by: {
          type: DataTypes.INTEGER,
          references: { model: 'users', key: 'id' }
        },
        approved_at: { type: DataTypes.DATE },
        shipped_at: { type: DataTypes.DATE },
        delivered_at: { type: DataTypes.DATE },
        confirmed_at: { type: DataTypes.DATE },
        notes: { type: DataTypes.TEXT }
      },
      {
        sequelize,
        modelName: 'Transfer',
        tableName: 'transfers',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['mold_id'] },
          { fields: ['transfer_number'] },
          { fields: ['status'] },
          { fields: ['request_date'] },
          { fields: ['current_step'] },
          { fields: ['from_company_id'] },
          { fields: ['to_company_id'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Mold, {
      foreignKey: 'mold_id',
      as: 'mold'
    });

    this.belongsTo(models.Company, {
      foreignKey: 'from_company_id',
      as: 'fromCompany'
    });

    this.belongsTo(models.Company, {
      foreignKey: 'to_company_id',
      as: 'toCompany'
    });

    this.belongsTo(models.User, {
      foreignKey: 'developer_id',
      as: 'developer'
    });

    this.belongsTo(models.User, {
      foreignKey: 'from_party_id',
      as: 'fromParty'
    });

    this.belongsTo(models.User, {
      foreignKey: 'to_party_id',
      as: 'toParty'
    });

    this.belongsTo(models.User, {
      foreignKey: 'requested_by',
      as: 'requester'
    });

    this.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver'
    });
  }
}

module.exports = Transfer;
