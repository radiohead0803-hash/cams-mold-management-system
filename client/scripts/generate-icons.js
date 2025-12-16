/**
 * PWA 아이콘 생성 스크립트
 * SVG를 PNG로 변환하여 다양한 크기의 아이콘 생성
 * 
 * 사용법: node scripts/generate-icons.js
 * 필요 패키지: sharp (npm install sharp)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// sharp 패키지 동적 import
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  console.log('sharp 패키지가 필요합니다.');
  console.log('설치: npm install sharp');
  console.log('');
  console.log('또는 온라인 SVG to PNG 변환기를 사용하세요:');
  console.log('- https://cloudconvert.com/svg-to-png');
  console.log('- https://svgtopng.com/');
  console.log('');
  console.log('필요한 크기:');
  console.log('- 72x72 (icon-72x72.png)');
  console.log('- 96x96 (icon-96x96.png)');
  console.log('- 128x128 (icon-128x128.png)');
  console.log('- 144x144 (icon-144x144.png)');
  console.log('- 152x152 (icon-152x152.png)');
  console.log('- 192x192 (icon-192x192.png)');
  console.log('- 384x384 (icon-384x384.png)');
  console.log('- 512x512 (icon-512x512.png)');
  process.exit(0);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('PWA 아이콘 생성 시작...');
  
  // SVG 파일 읽기
  const svgBuffer = fs.readFileSync(inputSvg);
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ icon-${size}x${size}.png 생성 완료`);
  }
  
  // Apple Touch Icon (180x180)
  const appleTouchPath = path.join(outputDir, 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log('✓ apple-touch-icon.png 생성 완료');
  
  // Favicon (32x32)
  const faviconPath = path.join(outputDir, 'favicon-32x32.png');
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(faviconPath);
  console.log('✓ favicon-32x32.png 생성 완료');
  
  // Favicon (16x16)
  const favicon16Path = path.join(outputDir, 'favicon-16x16.png');
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(favicon16Path);
  console.log('✓ favicon-16x16.png 생성 완료');
  
  console.log('');
  console.log('모든 아이콘 생성 완료!');
}

generateIcons().catch(console.error);
