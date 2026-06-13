const fs = require('fs');
const path = require('path');

const dir = 'E:/derpinat/resilo1/src/components/landing';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(f => {
  const fp = path.join(dir, f);
  let content = fs.readFileSync(fp, 'utf8');
  content = content.replace(/text-slate-900/g, 'text-[#1C1C1C]');
  content = content.replace(/bg-slate-900/g, 'bg-[#1C1C1C]');
  content = content.replace(/border-slate-900/g, 'border-[#1C1C1C]');
  content = content.replace(/text-slate-50/g, 'text-[#F0F5F0]');
  content = content.replace(/bg-slate-50/g, 'bg-[#F0F5F0]');
  content = content.replace(/border-slate-50/g, 'border-[#F0F5F0]');
  content = content.replace(/shadow-slate-900/g, 'shadow-[#1C1C1C]');
  fs.writeFileSync(fp, content);
});
console.log('done');
