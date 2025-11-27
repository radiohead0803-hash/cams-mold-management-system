require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function addCompanyColumns() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✓ Database connected');

    // Check if columns exist
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'mold_specifications' 
      AND column_name IN ('maker_company_id', 'plant_company_id');
    `);

    const existingColumns = results.map(r => r.column_name);
    console.log('Existing columns:', existingColumns);

    // Add maker_company_id if not exists
    if (!existingColumns.includes('maker_company_id')) {
      console.log('Adding maker_company_id column...');
      await sequelize.query(`
        ALTER TABLE mold_specifications 
        ADD COLUMN maker_company_id INTEGER REFERENCES companies(id);
      `);
      console.log('✓ maker_company_id column added');
      
      // Copy data from target_maker_id to maker_company_id
      await sequelize.query(`
        UPDATE mold_specifications 
        SET maker_company_id = target_maker_id 
        WHERE target_maker_id IS NOT NULL;
      `);
      console.log('✓ Data copied from target_maker_id to maker_company_id');
    } else {
      console.log('✓ maker_company_id column already exists');
    }

    // Add plant_company_id if not exists
    if (!existingColumns.includes('plant_company_id')) {
      console.log('Adding plant_company_id column...');
      await sequelize.query(`
        ALTER TABLE mold_specifications 
        ADD COLUMN plant_company_id INTEGER REFERENCES companies(id);
      `);
      console.log('✓ plant_company_id column added');
    } else {
      console.log('✓ plant_company_id column already exists');
    }

    // Show table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'mold_specifications'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n=== mold_specifications table structure ===');
    console.table(columns);

    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

addCompanyColumns()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed:', err);
    process.exit(1);
  });
