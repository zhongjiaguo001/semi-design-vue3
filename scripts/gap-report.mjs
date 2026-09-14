import fs from 'fs';
import path from 'path';
const mdDir = 'playground/official-md';
const demoDir = 'playground/demos';
const catalogSrc = fs.readFileSync('playground/catalog.ts','utf8');
const keys = [...catalogSrc.matchAll(/key: '([^']+)'/g)].map(m=>m[1]).filter(k=>!['start','introduction','getting-started','overview','basic','ai','plus','cat-input','cat-navigation','display','feedback','other'].includes(k));
const ALIAS = {autoComplete:'autocomplete',datePicker:'datepicker',inputNumber:'inputnumber',timePicker:'timepicker',tagInput:'taginput',treeSelect:'treeselect',colorPicker:'colorpicker',pinCode:'pincode',backTop:'backtop',overflowList:'overflowlist',sideSheet:'sidesheet',scrollList:'scrolllist',userGuide:'userguide',floatButton:'floatbutton',configProvider:'configprovider',localeProvider:'locale',markdownRender:'markdownrender',codeHighlight:'codehighlight',jsonViewer:'jsonviewer',hotKeys:'hotkeys',dragMove:'dragmove',audioPlayer:'audioplayer',videoPlayer:'videoplayer',aiChatInput:'aichatinput',aiChatDialogue:'aichatdialogue',vchart:'chart',aiButton:'button',aiTag:'tag',aiIcon:'icon',aiFloatButton:'floatbutton'};
const mdFiles = Object.fromEntries(fs.readdirSync(mdDir).map(f=>[f.replace(/\.md$/,'').toLowerCase(), path.join(mdDir,f)]));
const LIVE = /^```(?:jsx|tsx|js|javascript|typescript)[^\n]*\blive\b[^\n]*$/i;
function liveHeadings(raw){
  const lines = raw.split('\n'); const hp=[]; const out=[]; let inFence=false;
  for (let i=0;i<lines.length;i++){ const l=lines[i];
    if (!inFence){ const hm=l.match(/^(#{1,6})\s+(.*)$/); if(hm){ hp.length=hm[1].length-1; hp[hm[1].length-1]=hm[2].trim(); continue;}
      if (LIVE.test(l)) { out.push([...hp].reverse().find(Boolean)||''); inFence=true; continue;}
      if (/^```/.test(l)) { inFence=true; continue; }
    } else if (/^```/.test(l)) inFence=false;
  }
  return out;
}
function norm(s){return String(s||'').replace(/[`*_]/g,'').replace(/[·.,，。、:：()（）[\]【】]/g,'').replace(/\s+/g,'').toLowerCase();}
function score(a,b){a=norm(a);b=norm(b);if(!a||!b)return 0;if(a===b)return 100;if(a.includes(b)||b.includes(a))return 80;const cs=new Set(a);let h=0;for(const c of b)if(cs.has(c))h++;const r=h/Math.max(a.length,b.length);return r>=0.5?Math.round(r*60):0;}
// demo titles per component
const demoSrc = fs.readdirSync(demoDir).filter(f=>f.endsWith('.vue')).map(f=>fs.readFileSync(path.join(demoDir,f),'utf8')).join('\n');
function demoTitles(key){
  const titles=[];
  const perFile = path.join(demoDir,'components',key+'.vue');
  if (fs.existsSync(perFile)) { const s=fs.readFileSync(perFile,'utf8'); for(const m of s.matchAll(/<DemoBlock[^>]*?title="([^"]+)"/gs)) titles.push(m[1]); return titles; }
  if (key==='button'){ const s=fs.readFileSync(path.join(demoDir,'ButtonDemos.vue'),'utf8'); for(const m of s.matchAll(/<DemoBlock[^>]*?title="([^"]+)"/gs)) titles.push(m[1]); return titles;}
  if (key==='table'){ const s=fs.readFileSync(path.join(demoDir,'TableDemos.vue'),'utf8'); for(const m of s.matchAll(/<DemoBlock[^>]*?title="([^"]+)"/gs)) titles.push(m[1]); return titles;}
  const start = demoSrc.indexOf("name === '"+key+"'\"");
  if (start<0) return titles;
  let end = demoSrc.indexOf('<template v-else-if=', start+5); const end2 = demoSrc.indexOf('\n  </template>\n</template>', start);
  if (end<0 || (end2>=0 && end2<end)) end=end2; if(end<0) end=demoSrc.length;
  const m=[demoSrc.slice(start,end)];
  for (const t of m[0].matchAll(/<DemoBlock[^>]*?title="([^"]+)"/gs)) titles.push(t[1]);
  return titles;
}
const report={};
for (const k of keys){
  const md = mdFiles[k.toLowerCase()] || mdFiles[(ALIAS[k]||'').toLowerCase()];
  if(!md){report[k]={noMd:true};continue;}
  const heads = liveHeadings(fs.readFileSync(md,'utf8'));
  const titles = demoTitles(k);
  const used=new Set(); const missing=[];
  for (const h of heads){ let best=null; titles.forEach((t,i)=>{ if(used.has(i))return; const s=score(h,t); if(!best||s>best.s)best={i,s};}); if(best&&best.s>=55)used.add(best.i); else missing.push(h); }
  report[k]={md:path.basename(md),live:heads.length,demos:titles.length,missing};
}
fs.writeFileSync('scripts/gap-report.json',JSON.stringify(report,null,1));
for (const [k,v] of Object.entries(report)) console.log(k.padEnd(16), v.noMd?'NO MD':`live=${v.live} demos=${v.demos} missing=${v.missing.length}`);
if (process.argv[2]) { const v=report[process.argv[2]]; console.log('\nMISSING for '+process.argv[2]+':'); (v?.missing||[]).forEach(h=>console.log(' - '+h)); }
