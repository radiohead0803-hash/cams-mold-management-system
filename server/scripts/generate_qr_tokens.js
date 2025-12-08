/**
 * 기존 금형에 QR 토큰 생성 스크립트
 * - molds 테이블에서 qr_token이 없는 레코드에 QR 토큰 생성
 * - mold_specifications 테이블과 연동
 */

const { Sequelize } = require('sequelize');
const crypto = require('crypto');
require('dotenv').config();

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

async function generateQRTokens() {
  try {
    console.log('🔄 QR 토큰 생성 시작...');
    
    // 1. molds 테이블에서 qr_token이 없는 레코드 조회
    const [moldsWithoutQR] = await sequelize.query(`
      SELECT m.id, m.mold_code, m.mold_name, ms.part_number
      FROM molds m
      LEFT JOIN mold_specifications ms ON m.specification_id = ms.id
      WHERE m.qr_token IS NULL OR m.qr_token = ''
    `);
    
    console.log(`📋 QR 토큰이 없는 금형: ${moldsWithoutQR.length}개`);
    
    for (const mold of moldsWithoutQR) {
      const partNumber = mold.part_number || mold.mold_code || `MOLD-${mold.id}`;
      const qrToken = `CAMS-${partNumber}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      await sequelize.query(`
        UPDATE molds SET qr_token = :qrToken, updated_at = NOW()
        WHERE id = :moldId
      `, {
        replacements: { qrToken, moldId: mold.id }
      });
      
      console.log(`✅ 금형 ID ${mold.id} (${mold.mold_name}): ${qrToken}`);
    }
    
    // 2. mold_specifications에서 mold가 없는 레코드 확인 및 생성
    const [specsWithoutMold] = await sequelize.query(`
      SELECT id, part_number, part_name, car_model, cavity_count, maker_company_id, plant_company_id
      FROM mold_specifications
      WHERE mold_id IS NULL
    `);
    
    console.log(`\n📋 Mold가 없는 사양: ${specsWithoutMold.length}개`);
    
    for (const spec of specsWithoutMold) {
      const year = new Date().getFullYear();
      const qrToken = `CAMS-${spec.part_number}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      
      // 새 mold_code 생성
      const [lastMold] = await sequelize.query(`
        SELECT mold_code FROM molds ORDER BY id DESC LIMIT 1
      `);
      
      let sequence = 1;
      if (lastMold.length > 0 && lastMold[0].mold_code) {
        const match = lastMold[0].mold_code.match(/M-\d+-(\d+)/);
        if (match) sequence = parseInt(match[1]) + 1;
      }
      
      const moldCode = `M-${year}-${String(sequence).padStart(3, '0')}`;
      
      // Mold 생성
      const [result] = await sequelize.query(`
        INSERT INTO molds (mold_code, mold_name, car_model, part_name, cavity, 
          maker_company_id, plant_company_id, specification_id, qr_token, status, location, created_at, updated_at)
        VALUES (:moldCode, :moldName, :carModel, :partName, :cavity, 
          :makerCompanyId, :plantCompanyId, :specId, :qrToken, 'planning', '본사', NOW(), NOW())
        RETURNING id
      `, {
        replacements: {
          moldCode,
          moldName: spec.part_name,
          carModel: spec.car_model,
          partName: spec.part_name,
          cavity: spec.cavity_count || 1,
          makerCompanyId: spec.maker_company_id,
          plantCompanyId: spec.plant_company_id,
          specId: spec.id,
          qrToken
        }
      });
      
      const newMoldId = result[0]?.id;
      
      if (newMoldId) {
        // mold_specifications 업데이트
        await sequelize.query(`
          UPDATE mold_specifications SET mold_id = :moldId, updated_at = NOW()
          WHERE id = :specId
        `, {
          replacements: { moldId: newMoldId, specId: spec.id }
        });
        
        console.log(`✅ 사양 ID ${spec.id} → Mold ID ${newMoldId} 생성: ${qrToken}`);
      }
    }
    
    // 3. 결과 확인
    const [allMolds] = await sequelize.query(`
      SELECT m.id, m.mold_code, m.qr_token, ms.part_number, ms.part_name
      FROM molds m
      LEFT JOIN mold_specifications ms ON m.specification_id = ms.id
      ORDER BY m.id
    `);
    
    console.log('\n📊 전체 금형 QR 토큰 현황:');
    console.log('─'.repeat(80));
    allMolds.forEach(m => {
      console.log(`ID: ${m.id} | ${m.mold_code} | ${m.part_name || '-'} | QR: ${m.qr_token || '없음'}`);
    });
    console.log('─'.repeat(80));
    console.log(`총 ${allMolds.length}개 금형`);
    
    console.log('\n✅ QR 토큰 생성 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sequelize.close();
  }
}

generateQRTokens();
