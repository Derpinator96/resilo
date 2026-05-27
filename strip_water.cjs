const fs = require('fs');

const path = 'e:/derpinat/resilo1/src/pages/InstituteDetail.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove states
content = content.replace(/\/\/ Interactive Water Tank State[\s\S]*?\/\/ Interactive Solar Grid State/, '// Interactive Solar Grid State');

// 2. Remove useEffect for Water Tank
content = content.replace(/useEffect\(\(\) => \{\s+if \(inst\) setCurrentWaterLevel\(inst\.waterLevel\.level\)\s+\}, \[inst\]\)\n*/g, '');

content = content.replace(/useEffect\(\(\) => \{\s+if \(!isWaterExpanded\) return\n[\s\S]*?\}, \[isWaterExpanded\]\)\n*/g, '');

// 3. Remove useEffect for Water Quality
content = content.replace(/useEffect\(\(\) => \{\s+if \(!isQualityExpanded\) return\n[\s\S]*?\}, \[isQualityExpanded\]\)\n*/g, '');

// 4. Remove mock data for water
content = content.replace(/waterQuality:[\s\S]*?waterLevel:[\s\S]*?statusDesc: 'Critical Level' \},/g, '');

// 5. Remove summary metric
content = content.replace(/\{\s+label: 'Water Level',[\s\S]*?\},/g, '');

// 6. Remove UI blocks (Water Quality and Water Tank expandable cards)
content = content.replace(/\{\/\* ── WATER QUALITY \(expandable\) ── \*\/\}[\s\S]*?\{\/\* INFRA CLIMATE \*\/\}/g, '{/* INFRA CLIMATE */}');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully stripped water UI from InstituteDetail.jsx');
