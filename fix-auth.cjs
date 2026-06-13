const fs = require('fs');
const path = require('path');

const fixAuthority = () => {
  const fp = path.join(__dirname, 'src', 'pages', 'AuthorityDashboard.jsx');
  let content = fs.readFileSync(fp, 'utf8');
  
  // Make the background consistent with Dashboard Mesh
  content = content.replace(/<div className="min-h-screen bg-slate-900 text-slate-100 font-sans">/, 
    `<div className="relative min-h-screen font-sans pb-32">
      <div className="fixed inset-0 z-0 bg-slate-50 pointer-events-none" />
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-200/50 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-200/30 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="fixed top-[40%] left-[20%] w-[40vw] h-[40vw] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="relative z-10">`
  );

  // Close the extra div at the end
  const lastIndex = content.lastIndexOf('</div>');
  content = content.substring(0, lastIndex) + '</div>\n    </div>' + content.substring(lastIndex + 6);

  // Convert elements
  content = content.replace(/bg-slate-800/g, 'bg-white/70 backdrop-blur-lg border-white/50 shadow-xl shadow-blue-900/5');
  content = content.replace(/bg-slate-900/g, 'bg-slate-50/70 backdrop-blur-md');
  
  // Colors
  content = content.replace(/text-white/g, 'text-slate-900');
  content = content.replace(/text-slate-100/g, 'text-slate-800');
  content = content.replace(/text-slate-300/g, 'text-slate-600');
  content = content.replace(/text-slate-400/g, 'text-slate-500');
  
  // Borders
  content = content.replace(/border-slate-700/g, 'border-slate-200');
  content = content.replace(/border-slate-600/g, 'border-slate-300');
  
  fs.writeFileSync(fp, content);
}

fixAuthority();
console.log('done auth');
