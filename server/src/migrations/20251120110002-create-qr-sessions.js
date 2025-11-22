'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('qr_sessions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      session_token: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      mold_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'molds',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      qr_code: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      gps_latitude: {
        type: Sequelize.DECIMAL(10, 8)
      },
      gps_longitude: {
        type: Sequelize.DECIMAL(11, 8)
      },
      device_info: {
        type: Sequelize.JSONB
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // Add indexes separately to avoid conflicts
    try {
      await queryInterface.addIndex('qr_sessions', ['qr_code'], {
        name: 'idx_qr_sessions_qr_code'
      });
    } catch (e) {
      console.log('Index idx_qr_sessions_qr_code may already exist');
    }
    
    try {
      await queryInterface.addIndex('qr_sessions', ['expires_at'], {
        name: 'idx_qr_sessions_expires'
      });
    } catch (e) {
      console.log('Index idx_qr_sessions_expires may already exist');
    }
    
    try {
      await queryInterface.addIndex('qr_sessions', ['is_active'], {
        name: 'idx_qr_sessions_active'
      });
    } catch (e) {
      console.log('Index idx_qr_sessions_active may already exist');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('qr_sessions');
  }
};
