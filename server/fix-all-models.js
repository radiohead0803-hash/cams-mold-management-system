const fs = require('fs');
const path = require('path');

const modelsToFix = [
  'CheckGuideMaterial.js',
  'CheckItemMaster.js',
  'DailyCheck.js',
  'GPSLocation.js',
  'Inspection.js',
  'InspectionItem.js',
  'MakerSpecification.js',
  'MoldDevelopmentPlan.js',
  'MoldProcessStep.js',
  'MoldSpecification.js',
  'Notification.js',
  'PreProductionChecklist.js',
  'ProductionQuantity.js',
  'QRSession.js',
  'Repair.js',
  'Shot.js',
  'Transfer.js'
];

const modelsDir = path.join(__dirname, 'src', 'models');

modelsToFix.forEach(filename => {
  const filePath = path.join(modelsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filename}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 이미 module.exports = (sequelize) => 형식이면 스킵
  if (content.includes('module.exports = (sequelize)')) {
    console.log(`✓ Already fixed: ${filename}`);
    return;
  }
  
  // 클래스 기반 export를 함수 기반으로 변경
  if (content.includes('static init(sequelize)') && content.includes('module.exports =')) {
    // 클래스명 추출
    const classMatch = content.match(/class\s+(\w+)\s+extends\s+Model/);
    if (!classMatch) {
      console.log(`⚠️  Could not find class name in: ${filename}`);
      return;
    }
    
    const className = classMatch[1];
    
    // static init 제거하고 module.exports = (sequelize) => 형식으로 변경
    content = content.replace(
      /class\s+\w+\s+extends\s+Model\s*\{[\s\S]*?static\s+init\(sequelize\)\s*\{[\s\S]*?return\s+super\.init\(/,
      `module.exports = (sequelize, DataTypes) => {\n  class ${className} extends Model {}\n\n  ${className}.init(`
    );
    
    // 마지막 부분 수정
    content = content.replace(
      /\);\s*\}\s*static\s+associate/,
      `);\n\n  ${className}.associate = function(models) {`
    );
    
    content = content.replace(
      /static\s+associate\(models\)\s*\{/,
      `${className}.associate = function(models) {`
    );
    
    // this를 className으로 변경
    content = content.replace(/\bthis\./g, `${className}.`);
    
    // 마지막 module.exports 수정
    content = content.replace(
      /\}\s*\}\s*module\.exports\s*=\s*\w+;/,
      `  };\n\n  return ${className};\n};`
    );
    
    content = content.replace(
      /module\.exports\s*=\s*\w+;/,
      `  return ${className};\n};`
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filename}`);
  } else {
    console.log(`⚠️  Pattern not matched: ${filename}`);
  }
});

console.log('\n✅ All models fixed!');
