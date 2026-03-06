const { Sequelize } = require('sequelize');
const dbUrl = process.env.DATABASE_URL;
const sequelize = new Sequelize(dbUrl, { dialect: 'postgres', logging: false, dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } });

async function check() {
  try {
    await sequelize.authenticate();
    console.log('DB OK\n');

    // 1. file_attachments 테이블 확인
    console.log('=== file_attachments 테이블 ===');
    try {
      const [cols] = await sequelize.query(
        "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='file_attachments' ORDER BY ordinal_position"
      );
      if (cols.length === 0) {
        console.log('  ⚠️ file_attachments 테이블 없음!');
      } else {
        cols.forEach(function(c) { console.log('  ' + c.column_name + ': ' + c.data_type + ' ' + (c.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE')); });
      }
    } catch(e) { console.log('  에러: ' + e.message); }

    // 2. mold_images 테이블 확인
    console.log('\n=== mold_images 테이블 ===');
    try {
      const [cols] = await sequelize.query(
        "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='mold_images' ORDER BY ordinal_position"
      );
      if (cols.length === 0) {
        console.log('  ⚠️ mold_images 테이블 없음!');
      } else {
        cols.forEach(function(c) { console.log('  ' + c.column_name + ': ' + c.data_type + ' ' + (c.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE')); });
      }
    } catch(e) { console.log('  에러: ' + e.message); }

    // 3. inspection_photos 테이블 확인
    console.log('\n=== inspection_photos 테이블 ===');
    try {
      const [cols] = await sequelize.query(
        "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='inspection_photos' ORDER BY ordinal_position"
      );
      if (cols.length === 0) {
        console.log('  ⚠️ inspection_photos 테이블 없음!');
      } else {
        cols.forEach(function(c) { console.log('  ' + c.column_name + ': ' + c.data_type + ' ' + (c.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE')); });
      }
    } catch(e) { console.log('  에러: ' + e.message); }

    // 4. Cloudinary / S3 환경변수 체크
    console.log('\n=== 환경변수 상태 ===');
    console.log('CLOUDINARY_CLOUD_NAME: ' + (process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET'));
    console.log('CLOUDINARY_API_KEY: ' + (process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET'));
    console.log('CLOUDINARY_API_SECRET: ' + (process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'));
    console.log('AWS_ACCESS_KEY_ID: ' + (process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET'));
    console.log('AWS_SECRET_ACCESS_KEY: ' + (process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'));
    console.log('UPLOAD_PATH: ' + (process.env.UPLOAD_PATH || 'NOT SET (default: uploads/)'));

    // 5. file_attachments에 file_data 컬럼 있는지
    console.log('\n=== file_attachments.file_data 컬럼 확인 ===');
    try {
      const [rows] = await sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='file_attachments' AND column_name='file_data'"
      );
      console.log(rows.length > 0 ? '  ✅ file_data 컬럼 있음' : '  ⚠️ file_data 컬럼 없음');
    } catch(e) { console.log('  에러: ' + e.message); }

    // 6. mold_images에 image_data 컬럼 있는지
    console.log('\n=== mold_images.image_data 컬럼 확인 ===');
    try {
      const [rows] = await sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='mold_images' AND column_name='image_data'"
      );
      console.log(rows.length > 0 ? '  ✅ image_data 컬럼 있음' : '  ⚠️ image_data 컬럼 없음');
    } catch(e) { console.log('  에러: ' + e.message); }

    // 7. newIndex.js가 올바르게 로드되는지
    console.log('\n=== newIndex.js 모델 로딩 테스트 ===');
    try {
      const db = require('./src/models/newIndex');
      console.log('  sequelize: ' + (db.sequelize ? 'OK' : 'MISSING'));
      console.log('  InspectionPhoto: ' + (db.InspectionPhoto ? 'OK' : 'MISSING'));
      const modelKeys = Object.keys(db).filter(function(k) { return k !== 'sequelize' && k !== 'Sequelize'; });
      console.log('  등록 모델: ' + modelKeys.join(', '));
    } catch(e) { console.log('  에러: ' + e.message); }

    process.exit(0);
  } catch(e) {
    console.error('점검 실패:', e.message);
    process.exit(1);
  }
}

check();
