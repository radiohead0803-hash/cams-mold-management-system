const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// QR 코드 저장 디렉토리
const outputDir = path.join(__dirname, '../qr-codes');

// 디렉토리가 없으면 생성
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 프론트엔드 도메인
const FRONTEND_URL = 'https://bountiful-nurturing-production-cd5c.up.railway.app';

// 역할별 QR 로그인 URL
const qrUrls = {
  production: {
    url: `${FRONTEND_URL}/mobile/qr-login?role=production`,
    filename: 'qr-login-production.png',
    title: '생산처 QR 로그인'
  },
  maker: {
    url: `${FRONTEND_URL}/mobile/qr-login?role=maker`,
    filename: 'qr-login-maker.png',
    title: '제작처 QR 로그인'
  },
  hq: {
    url: `${FRONTEND_URL}/mobile/qr-login?role=hq`,
    filename: 'qr-login-hq.png',
    title: '본사 QR 로그인'
  },
  general: {
    url: `${FRONTEND_URL}/mobile/qr-login`,
    filename: 'qr-login-general.png',
    title: '일반 QR 로그인'
  }
};

// QR 코드 생성 옵션
const qrOptions = {
  width: 400,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  errorCorrectionLevel: 'H'
};

// QR 코드 생성 함수
async function generateQRCode(config) {
  const filePath = path.join(outputDir, config.filename);
  
  try {
    await QRCode.toFile(filePath, config.url, qrOptions);
    console.log(`✅ ${config.title} 생성 완료: ${config.filename}`);
    console.log(`   URL: ${config.url}`);
    console.log(`   파일: ${filePath}`);
    console.log('');
  } catch (err) {
    console.error(`❌ ${config.title} 생성 실패:`, err);
  }
}

// HTML 미리보기 생성
function generateHTMLPreview() {
  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR 로그인 코드 미리보기</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      color: white;
      text-align: center;
      margin-bottom: 40px;
      font-size: 2.5rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
    }
    
    .qr-card {
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      transition: transform 0.3s ease;
    }
    
    .qr-card:hover {
      transform: translateY(-5px);
    }
    
    .qr-card h2 {
      font-size: 1.5rem;
      margin-bottom: 15px;
      color: #333;
    }
    
    .qr-card.production h2 { color: #3b82f6; }
    .qr-card.maker h2 { color: #10b981; }
    .qr-card.hq h2 { color: #8b5cf6; }
    .qr-card.general h2 { color: #64748b; }
    
    .qr-image {
      width: 100%;
      height: auto;
      border-radius: 10px;
      margin-bottom: 15px;
      border: 3px solid #f1f5f9;
    }
    
    .url {
      font-size: 0.875rem;
      color: #64748b;
      word-break: break-all;
      background: #f8fafc;
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    
    .features {
      list-style: none;
      font-size: 0.875rem;
      color: #475569;
    }
    
    .features li {
      padding: 5px 0;
      padding-left: 20px;
      position: relative;
    }
    
    .features li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
    
    .download-btn {
      display: block;
      width: 100%;
      padding: 12px;
      margin-top: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: opacity 0.3s ease;
    }
    
    .download-btn:hover {
      opacity: 0.9;
    }
    
    .footer {
      text-align: center;
      color: white;
      margin-top: 40px;
      font-size: 0.875rem;
    }
    
    @media print {
      body {
        background: white;
      }
      
      .download-btn {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 QR 로그인 코드</h1>
    
    <div class="grid">
      <div class="qr-card production">
        <h2>🏭 생산처 로그인</h2>
        <img src="qr-login-production.png" alt="생산처 QR 코드" class="qr-image">
        <div class="url">${qrUrls.production.url}</div>
        <ul class="features">
          <li>QR 스캔으로 금형 점검</li>
          <li>일상/정기 점검 체크리스트</li>
          <li>수리요청 조회 및 관리</li>
          <li>생산 현황 모니터링</li>
        </ul>
        <a href="qr-login-production.png" download class="download-btn">다운로드</a>
      </div>
      
      <div class="qr-card maker">
        <h2>🔧 제작처 로그인</h2>
        <img src="qr-login-maker.png" alt="제작처 QR 코드" class="qr-image">
        <div class="url">${qrUrls.maker.url}</div>
        <ul class="features">
          <li>수리요청 접수 및 처리</li>
          <li>금형 수리 이력 관리</li>
          <li>작업 진행 상황 업데이트</li>
          <li>완료 보고서 작성</li>
        </ul>
        <a href="qr-login-maker.png" download class="download-btn">다운로드</a>
      </div>
      
      <div class="qr-card hq">
        <h2>🏢 본사 로그인</h2>
        <img src="qr-login-hq.png" alt="본사 QR 코드" class="qr-image">
        <div class="url">${qrUrls.hq.url}</div>
        <ul class="features">
          <li>전체 금형 현황 모니터링</li>
          <li>수리요청 통합 관리</li>
          <li>통계 및 리포트 조회</li>
          <li>시스템 설정 관리</li>
        </ul>
        <a href="qr-login-hq.png" download class="download-btn">다운로드</a>
      </div>
      
      <div class="qr-card general">
        <h2>🔑 일반 로그인</h2>
        <img src="qr-login-general.png" alt="일반 QR 코드" class="qr-image">
        <div class="url">${qrUrls.general.url}</div>
        <ul class="features">
          <li>모든 역할 사용 가능</li>
          <li>로그인 후 역할별 대시보드</li>
          <li>유연한 접근 방식</li>
          <li>범용 QR 코드</li>
        </ul>
        <a href="qr-login-general.png" download class="download-btn">다운로드</a>
      </div>
    </div>
    
    <div class="footer">
      <p>금형 관리 시스템 - QR 로그인</p>
      <p>생성일: ${new Date().toLocaleString('ko-KR')}</p>
    </div>
  </div>
</body>
</html>
  `;
  
  const htmlPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`✅ HTML 미리보기 생성 완료: ${htmlPath}`);
  console.log('');
}

// 메인 실행
async function main() {
  console.log('');
  console.log('🎨 QR 로그인 코드 생성 시작...');
  console.log('='.repeat(60));
  console.log('');
  
  // 각 역할별 QR 코드 생성
  for (const [key, config] of Object.entries(qrUrls)) {
    await generateQRCode(config);
  }
  
  // HTML 미리보기 생성
  generateHTMLPreview();
  
  console.log('='.repeat(60));
  console.log('✨ 모든 QR 코드 생성 완료!');
  console.log('');
  console.log(`📁 저장 위치: ${outputDir}`);
  console.log(`🌐 미리보기: ${path.join(outputDir, 'index.html')}`);
  console.log('');
  console.log('💡 사용 방법:');
  console.log('   1. qr-codes 폴더의 index.html을 브라우저로 열기');
  console.log('   2. 필요한 QR 코드 이미지 다운로드');
  console.log('   3. 인쇄하거나 디지털로 배포');
  console.log('');
}

main().catch(console.error);
