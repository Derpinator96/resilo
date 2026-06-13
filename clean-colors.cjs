const fs = require('fs');
const path = require('path');

const filesToClean = [
  'AIChat.jsx',
  'Energy.jsx',
  'InstituteDetail.jsx',
  'SolarForecast.jsx'
];

filesToClean.forEach(file => {
  const fp = path.join(__dirname, 'src', 'pages', file);
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf8');
    
    content = content.replace(/purple-950/g, 'slate-900');
    content = content.replace(/purple-900/g, 'slate-800');
    content = content.replace(/purple-800/g, 'slate-700');
    content = content.replace(/purple-700/g, 'teal-700');
    content = content.replace(/purple-600/g, 'teal-600');
    content = content.replace(/purple-500/g, 'teal-500');
    content = content.replace(/purple-300/g, 'teal-300');
    content = content.replace(/purple-200/g, 'teal-200');
    
    content = content.replace(/fuchsia-950/g, 'slate-900');
    content = content.replace(/fuchsia-600/g, 'teal-600');
    content = content.replace(/fuchsia-500/g, 'teal-500');
    
    content = content.replace(/pink-900/g, 'slate-900');
    content = content.replace(/pink-600/g, 'teal-600');
    content = content.replace(/pink-500/g, 'teal-500');
    
    content = content.replace(/violet-950/g, 'slate-900');
    content = content.replace(/violet-600/g, 'teal-600');
    content = content.replace(/violet-500/g, 'teal-500');

    fs.writeFileSync(fp, content);
  }
});
console.log('colors cleaned');
