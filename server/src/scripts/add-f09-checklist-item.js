const { Sequelize } = require('sequelize');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function addF09Item() {
  try {
    console.log('Adding F09 checklist item...');
    
    // 기존 F09 항목 확인
    const [[existing]] = await sequelize.query(`
      SELECT id FROM production_transfer_checklist_master WHERE item_code = 'F09'
    `);
    
    if (existing) {
      console.log('F09 item already exists, updating...');
      await sequelize.query(`
        UPDATE production_transfer_checklist_master 
        SET item_name = '볼트조림 식별 아이마킹',
            description = '볼트조림 식별을 위한 아이마킹 실시 여부 확인',
            is_required = true,
            requires_attachment = true,
            attachment_type = 'image',
            display_order = 39
        WHERE item_code = 'F09'
      `);
    } else {
      console.log('Inserting new F09 item...');
      await sequelize.query(`
        INSERT INTO production_transfer_checklist_master 
        (category, item_code, item_name, description, is_required, requires_attachment, attachment_type, display_order, is_active) 
        VALUES 
        ('5.성능기능점검', 'F09', '볼트조림 식별 아이마킹', '볼트조림 식별을 위한 아이마킹 실시 여부 확인', true, true, 'image', 39, true)
      `);
    }
    
    console.log('F09 item added successfully!');
    
    // 결과 확인
    const [items] = await sequelize.query(`
      SELECT item_code, item_name, is_required, requires_attachment 
      FROM production_transfer_checklist_master 
      WHERE category = '5.성능기능점검'
      ORDER BY display_order
    `);
    
    console.log('\n=== 성능기능점검 항목 목록 ===');
    items.forEach(item => {
      console.log(`${item.item_code}: ${item.item_name} (필수: ${item.is_required}, 첨부: ${item.requires_attachment})`);
    });
    
    const [[{ total }]] = await sequelize.query(`
      SELECT COUNT(*) as total FROM production_transfer_checklist_master
    `);
    console.log(`\n총 체크리스트 항목 수: ${total}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addF09Item();
