const PDFDocument = require('pdfkit');
const { sequelize } = require('../models/newIndex');

/**
 * PDF 리포트 생성 서비스
 * - 금형 점검 리포트
 * - 통계 리포트
 * - 유지보전 리포트
 */

/**
 * 금형 점검 리포트 PDF 생성
 */
const generateInspectionReport = async (moldId, startDate, endDate) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 금형 정보 조회
      const [moldInfo] = await sequelize.query(`
        SELECT 
          m.id, m.mold_code, m.mold_name, m.current_shots, m.status,
          ms.part_name, ms.car_model, ms.cavity_count, ms.tonnage
        FROM molds m
        LEFT JOIN mold_specifications ms ON m.id = ms.mold_id
        WHERE m.id = :moldId
      `, { replacements: { moldId } });

      if (!moldInfo || moldInfo.length === 0) {
        throw new Error('금형을 찾을 수 없습니다.');
      }

      const mold = moldInfo[0];

      // 점검 이력 조회
      const [inspections] = await sequelize.query(`
        SELECT 
          dc.id, dc.check_date, dc.shift, dc.production_quantity, 
          dc.current_shots, dc.status, dc.overall_status,
          u.name as checker_name
        FROM daily_checks dc
        LEFT JOIN users u ON dc.user_id = u.id
        WHERE dc.mold_id = :moldId
          AND dc.check_date BETWEEN :startDate AND :endDate
        ORDER BY dc.check_date DESC
        LIMIT 50
      `, { replacements: { moldId, startDate, endDate } });

      // PDF 생성
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        info: {
          Title: `금형 점검 리포트 - ${mold.mold_code}`,
          Author: 'CAMS 금형관리시스템'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // 헤더
      doc.fontSize(20).text('금형 점검 리포트', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`생성일시: ${new Date().toLocaleString('ko-KR')}`, { align: 'right' });
      doc.moveDown();

      // 금형 정보
      doc.fontSize(14).text('금형 정보', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`금형코드: ${mold.mold_code || '-'}`);
      doc.text(`금형명: ${mold.mold_name || '-'}`);
      doc.text(`품명: ${mold.part_name || '-'}`);
      doc.text(`차종: ${mold.car_model || '-'}`);
      doc.text(`캐비티: ${mold.cavity_count || '-'}`);
      doc.text(`현재 타수: ${(mold.current_shots || 0).toLocaleString()}회`);
      doc.text(`상태: ${mold.status || '-'}`);
      doc.moveDown();

      // 조회 기간
      doc.fontSize(12).text(`조회 기간: ${startDate} ~ ${endDate}`);
      doc.moveDown();

      // 점검 이력 테이블
      doc.fontSize(14).text('점검 이력', { underline: true });
      doc.moveDown(0.5);

      if (inspections.length === 0) {
        doc.fontSize(10).text('해당 기간에 점검 이력이 없습니다.');
      } else {
        // 테이블 헤더
        const tableTop = doc.y;
        const colWidths = [80, 50, 70, 70, 70, 80];
        const headers = ['점검일', '근무', '생산수량', '타수', '상태', '점검자'];
        
        doc.fontSize(9);
        let x = 50;
        headers.forEach((header, i) => {
          doc.text(header, x, tableTop, { width: colWidths[i], align: 'center' });
          x += colWidths[i];
        });

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // 테이블 데이터
        let y = tableTop + 20;
        for (const insp of inspections) {
          if (y > 750) {
            doc.addPage();
            y = 50;
          }

          x = 50;
          const rowData = [
            new Date(insp.check_date).toLocaleDateString('ko-KR'),
            insp.shift || '-',
            (insp.production_quantity || 0).toLocaleString(),
            (insp.current_shots || 0).toLocaleString(),
            insp.overall_status || insp.status || '-',
            insp.checker_name || '-'
          ];

          rowData.forEach((data, i) => {
            doc.text(data, x, y, { width: colWidths[i], align: 'center' });
            x += colWidths[i];
          });

          y += 18;
        }
      }

      // 푸터
      doc.moveDown(2);
      doc.fontSize(8).text('CAMS 금형관리시스템에서 자동 생성된 리포트입니다.', { align: 'center' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 통계 리포트 PDF 생성
 */
const generateStatisticsReport = async (startDate, endDate) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 통계 데이터 조회
      const [moldStats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_molds,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_molds,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_molds,
          COUNT(CASE WHEN status = 'repair' THEN 1 END) as repair_molds
        FROM molds
      `);

      const [inspectionStats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_inspections,
          COUNT(CASE WHEN overall_status = 'pass' THEN 1 END) as passed,
          COUNT(CASE WHEN overall_status = 'fail' THEN 1 END) as failed,
          SUM(COALESCE(production_quantity, 0)) as total_production
        FROM daily_checks
        WHERE check_date BETWEEN :startDate AND :endDate
      `, { replacements: { startDate, endDate } });

      const [repairStats] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_repairs,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
        FROM repair_requests
        WHERE created_at BETWEEN :startDate AND :endDate
      `, { replacements: { startDate, endDate } });

      // PDF 생성
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        info: {
          Title: '통계 리포트',
          Author: 'CAMS 금형관리시스템'
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // 헤더
      doc.fontSize(20).text('CAMS 통계 리포트', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`생성일시: ${new Date().toLocaleString('ko-KR')}`, { align: 'right' });
      doc.fontSize(10).text(`조회 기간: ${startDate} ~ ${endDate}`, { align: 'right' });
      doc.moveDown(2);

      // 금형 현황
      doc.fontSize(14).text('1. 금형 현황', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      const ms = moldStats[0] || {};
      doc.text(`전체 금형: ${ms.total_molds || 0}개`);
      doc.text(`가동 중: ${ms.active_molds || 0}개`);
      doc.text(`유지보전 중: ${ms.maintenance_molds || 0}개`);
      doc.text(`수리 중: ${ms.repair_molds || 0}개`);
      doc.moveDown();

      // 점검 현황
      doc.fontSize(14).text('2. 점검 현황', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      const is = inspectionStats[0] || {};
      doc.text(`총 점검 횟수: ${is.total_inspections || 0}회`);
      doc.text(`합격: ${is.passed || 0}회`);
      doc.text(`불합격: ${is.failed || 0}회`);
      doc.text(`총 생산수량: ${(parseInt(is.total_production) || 0).toLocaleString()}개`);
      doc.moveDown();

      // 수리 현황
      doc.fontSize(14).text('3. 수리 현황', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      const rs = repairStats[0] || {};
      doc.text(`총 수리 요청: ${rs.total_repairs || 0}건`);
      doc.text(`완료: ${rs.completed || 0}건`);
      doc.text(`대기 중: ${rs.pending || 0}건`);
      doc.moveDown(2);

      // 푸터
      doc.fontSize(8).text('CAMS 금형관리시스템에서 자동 생성된 리포트입니다.', { align: 'center' });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInspectionReport,
  generateStatisticsReport
};
