const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'),path=require('path');const ROOT='/home/user/Know-your-energy';
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.exr':'application/octet-stream'};
(async()=>{
 for(const apple of [false,true]){
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},userAgent:apple?'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1':undefined});const p=await ctx.newPage();
  const errs=[],events=[];p.on('pageerror',e=>errs.push(e.message));
  await p.route('http://site.test/**',r=>{let u=new URL(r.request().url()).pathname;if(u==='/')u='/index.html';const f=path.join(ROOT,u);if(fs.existsSync(f)&&fs.statSync(f).isFile())r.fulfill({status:200,contentType:MIME[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)});else r.fulfill({status:404,body:'nf'})});
  await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await p.route(/workers\.dev/,r=>{const u=r.request().url();if(u.endsWith('/event'))events.push(JSON.parse(r.request().postData()).name);r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'Content-Type'},body:'{"active":false,"freeReadingUsed":false}'})});
  await p.goto('http://site.test/index.html');await p.waitForTimeout(2500);
  await p.evaluate(async()=>{const {calculateFullChart}=await import('./numerology-calculator.js');
   const mk=(first,last,dob)=>{const [m,d,y]=dob.split('/');return {first,mid:'',last,dob,numerology:calculateFullChart({first,middle:'',last,dob,currentDate:new Date().toLocaleDateString('en-US')}),astro:null,astroError:'stub',hd:null,hdError:'stub'}};
   render(mk('Alex','Morgan','08/14/1990'),mk('Sam','Rivera','03/02/1988'),null,'stub',false,false,'')});
  await p.waitForTimeout(800);
  const share=await p.evaluate(()=>/Share<|shareReading/.test(document.getElementById('bottomBtns').innerHTML));
  const note=await p.evaluate(()=>!!document.querySelector('.ios-save-note'));
  // open Alex's numerology card (the date tool lives inside it)
  await p.evaluate(()=>{const c=[...document.querySelectorAll('.quad-item')].find(e=>/Alex.*Numerology/.test(e.textContent.slice(0,40)));c.click()});await p.waitForTimeout(700);
  await p.evaluate(()=>{const i=document.querySelector('.date-explorer-input[data-person-idx="0"]');i.value='2031-06-15';i.dispatchEvent(new Event('change'))});
  await p.waitForTimeout(1200);
  const other=await p.evaluate(()=>[...document.querySelectorAll('.date-explorer-results .dpsec')].map(e=>e.textContent.trim()).join('+'));
  const coming=await p.evaluate(()=>(document.querySelector('.date-explorer-results').textContent.match(/Next (Pinnacle|Period):[^.]*\./g)||[]));
  const over=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await p.screenshot({path:apple?'res_ipad.png':'res_android.png',fullPage:true});
  await p.evaluate(()=>{track('save_print')});await p.evaluate(()=>resetToForm());await p.waitForTimeout(600);
  console.log(apple?'iPad UA':'Android UA','| share button gone:',!share,'| iOS note:',note,'| names shown in this card for the date:',other,'| sideways scroll:',over);
  console.log('  coming up:',JSON.stringify(coming));console.log('  events sent:',events.join(','),'| errors:',errs.join(';')||'none');
  await b.close();}
})();
