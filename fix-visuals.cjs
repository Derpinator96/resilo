const fs = require('fs');
const path = require('path');

const fixApp = () => {
  const fp = path.join(__dirname, 'src', 'App.jsx');
  let content = fs.readFileSync(fp, 'utf8');
  content = content.replace('className="absolute top-4 right-6', 'className="absolute top-[52px] right-6');
  fs.writeFileSync(fp, content);
}

const fixSanitation = () => {
  const fp = path.join(__dirname, 'src', 'pages', 'Sanitation.jsx');
  let content = fs.readFileSync(fp, 'utf8');
  content = content.replace(/bg-gray-50/g, 'bg-slate-50');
  content = content.replace(/bg-white/g, 'bg-slate-50/70 backdrop-blur-md'); // wait, bg-white is fine for cards, but maybe keep bg-white.
  fs.writeFileSync(fp, content);
}

const fixInstituteDetail = () => {
  const fp = path.join(__dirname, 'src', 'pages', 'InstituteDetail.jsx');
  let content = fs.readFileSync(fp, 'utf8');
  
  // Remove the loud background
  content = content.replace(
    /<div className="absolute inset-0 -z-10" style={{ background: `linear-gradient[\s\S]*?\/>/,
    '<div className="fixed inset-0 z-0 bg-slate-50 pointer-events-none" />\n      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-200/50 rounded-full blur-[120px] pointer-events-none z-0" />\n      <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-200/30 rounded-full blur-[150px] pointer-events-none z-0" />'
  );

  // Replace loud purple/pink blurs
  content = content.replace(/bg-violet-600\/30/g, 'bg-blue-100/40');
  content = content.replace(/bg-fuchsia-600\/30/g, 'hidden');

  // Change text colors
  content = content.replace(/text-purple-950/g, 'text-slate-800');
  content = content.replace(/text-purple-900/g, 'text-slate-800');
  content = content.replace(/bg-purple-600/g, 'bg-blue-600');
  content = content.replace(/from-violet-950 via-fuchsia-950 to-pink-900/g, 'from-blue-800 to-cyan-600');
  content = content.replace(/bg-gradient-to-r from-violet-600 to-fuchsia-600/g, 'bg-slate-900');

  // Specific classes
  content = content.replace(/border-purple-200/g, 'border-blue-200');
  content = content.replace(/border-t-purple-600/g, 'border-t-blue-600');

  fs.writeFileSync(fp, content);
}

fixApp();
fixSanitation();
fixInstituteDetail();
console.log('done');
