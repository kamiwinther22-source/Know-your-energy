const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs'),path=require('path');
const ROOT='/home/user/Know-your-energy';const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const S='/tmp/claude-0/-home-user-Know-your-energy/83849644-63e7-51ca-ac3a-9fdb74e9cfd0/scratchpad';
const astro=JSON.parse(fs.readFileSync(S+'/ae/astro.json'));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.route('http://site.test/**',r=>{let u=new URL(r.request().url()).pathname;if(u==='/')u='/index.html';const f=path.join(ROOT,decodeURIComponent(u));if(fs.existsSync(f)&&fs.statSync(f).isFile())r.fulfill({status:200,contentType:MIME[path.extname(f)]||'text/plain',body:fs.readFileSync(f)});else r.fulfill({status:404,body:''})});
await p.route(/fonts\.|orrery3d|three|metal3d/,r=>r.continue());
await p.route(/workers\.dev|orrery3d|three\.module|metal3d/,r=>r.abort());
await p.goto('http://site.test/index.html');await p.waitForTimeout(2500);
await p.evaluate(async(astro)=>{const {calculateFullChart}=await import('./numerology-calculator.js');
 const p1={first:'Kami',mid:'Sue',last:'Freeman',dob:'11/14/1977',time:'6:46 PM',city:'Sioux City',state:'Iowa',country:'US',numerology:calculateFullChart({first:'Kami',middle:'Sue',last:'Freeman',dob:'11/14/1977',currentDate:'10/26/2026'}),astro,hd:{type:'Generator',profile:'3/5',authority:'Sacral',incarnation_cross:'Right Angle Cross of the Sphinx',gates:['1','13','25','46','5','15','29','2','14','34','10','20','57','9','35','39']}};
 render(p1,null,null,'sample',false,false,'');},astro);
await p.waitForTimeout(1200);
await p.evaluate(()=>{const c=[...document.querySelectorAll('.quad-item')].find(e=>/Numerology/i.test(e.textContent.slice(0,40)));c.click()});await p.waitForTimeout(900);

const css=`
@import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Playfair+Display:ital,wght@1,900&display=swap');
.card-expand{position:absolute !important;left:0 !important;right:0 !important;top:0 !important;bottom:auto !important;height:auto !important;min-height:100% !important;overflow:visible !important;background:rgba(20,3,9,.80) !important;padding:16px !important;z-index:50}
.card-expand-close{display:none !important}
.ce-wrap{position:relative;width:358px;margin:0 auto}
.ce-body{position:relative;z-index:2;padding:64px 58px 78px}
.ce-wrap .card-expand-title{font:400 30px 'Alex Brush',cursive !important;color:#0b0b10 !important;text-align:center;text-transform:none !important;letter-spacing:0 !important;margin:0 0 26px !important;white-space:nowrap}
.ce-wrap .date-explorer{margin:0 0 22px}
.ce-wrap *{color:#0b0b10 !important}
.ce-wrap .dpsec{font:400 25px 'Alex Brush',cursive !important;color:#8c1034 !important;text-transform:none !important;letter-spacing:0 !important;display:flex !important;align-items:center;white-space:nowrap;margin:34px 0 8px !important;padding:0 !important;background:none !important;border:0 !important}
.ce-wrap .dpsec{color:#8c1034 !important}
.ce-wrap .dpsec::before{content:'';flex:none;width:13px;height:13px;margin-right:11px;background:#8c1034;clip-path:polygon(26% 0,74% 0,100% 50%,74% 100%,26% 100%,0 50%)}
.ce-wrap .dprow{background:transparent !important;border-bottom:1px solid #0b0b10;padding:0 !important;margin:0 0 14px}
.ce-wrap .dpr{display:flex !important;justify-content:space-between;align-items:baseline;padding:6px 0 2px !important}
.ce-wrap .dprl{font:800 14.5px 'Barlow Condensed',sans-serif !important;letter-spacing:.12em !important;text-transform:uppercase !important;white-space:nowrap}
.ce-wrap .dprv{font:italic 900 40px 'Playfair Display',serif !important;line-height:1;text-align:right !important}
.ce-wrap .stage-pair{display:grid !important;grid-template-columns:1fr 1fr;column-gap:18px}
.ce-wrap .stage-range{font:700 11px 'Barlow Condensed' !important;padding:0 !important}
.ce-wrap .pc-col .dpr{padding:4px 0 2px !important}.ce-wrap .pc-col .dprv{font-size:30px !important}
.ce-wrap .date-explorer-input{border-bottom:1px solid #0b0b10 !important}
.ce-frame{position:absolute;left:0;top:0;z-index:1}.ce-wrap .dpr{flex-direction:row !important;flex-wrap:nowrap !important;gap:0 !important}.ce-wrap .dprl{border-bottom:0 !important;align-self:auto !important;background:none !important;padding:0 !important}.ce-wrap .dprl.term::after{border-color:#0b0b10 !important}.ce-wrap .date-explorer{background:transparent !important;border-left:0 !important;padding:0 !important}.ce-wrap .date-explorer-head{display:flex;justify-content:space-between;align-items:baseline}.ce-wrap .dprow .dprv{align-self:auto !important}html,body{overflow-x:hidden}.ce-wrap .dprow:has(.stage-pair){border-bottom:0 !important;margin-bottom:6px !important}.ce-wrap .stage-pair{column-gap:20px !important}.ce-wrap .stage-pair .pc-col .dprv{font-size:26px !important}.ce-wrap .stage-pair .pc-col .dprl{font-size:11.5px !important;letter-spacing:.08em !important}.ce-wrap .birthdate-row{display:block !important}.ce-wrap .birthdate-row .pc-col{display:block;margin-bottom:14px;border-bottom:1px solid #0b0b10}.ce-wrap .birthdate-row .pc-col .dprv{font-size:40px !important}.ce-wrap .stage-pair .dpsec{font:800 12px 'Barlow Condensed',sans-serif !important;text-transform:uppercase !important;letter-spacing:.1em !important;white-space:normal !important;margin:0 0 6px !important;display:block !important}.ce-wrap .stage-pair .dpsec::before{display:none !important}.ce-wrap .dprl,.ce-wrap .dprl.term{margin:0 !important;padding-left:0 !important}.ce-wrap .dpr{padding-left:0 !important;margin-left:0 !important}.ce-wrap .kar .dprv{font-size:28px !important;white-space:nowrap}.ce-wrap .kar .dprl{white-space:nowrap}.ce-wrap .pc-col{border-bottom:1px solid #0b0b10;margin-bottom:12px}.ce-wrap .stage-pair .pc-col .dpr{padding-top:4px !important}`;
await p.addStyleTag({content:css});
await p.evaluate(()=>{const ce=document.querySelector('.card-expand');const title=document.getElementById('cardExpandTitle'),body=document.getElementById('cardExpandBody');
 const wrap=document.createElement('div');wrap.className='ce-wrap';const inner=document.createElement('div');inner.className='ce-body';wrap.appendChild(inner);inner.appendChild(title);inner.appendChild(body);ce.appendChild(wrap);});
await p.evaluate(()=>{document.querySelectorAll('.ce-wrap .dprow').forEach(r=>{if(/karmic/i.test(r.textContent))r.classList.add('kar')})});await p.waitForTimeout(800);
await p.evaluate(()=>{const wrap=document.querySelector('.ce-wrap');const W=358,Hh=Math.round(wrap.getBoundingClientRect().height),BAND=34,C=46;
  const oct=(inset,c)=>{const a=inset,b=W-inset,t=inset,u=Hh-inset;return `M${a+c},${t} L${b-c},${t} L${b},${t+c} L${b},${u-c} L${b-c},${u} L${a+c},${u} L${a},${u-c} L${a},${t+c} Z`;};
  const outer=oct(4,C),inner=oct(4+BAND,C-0.586*BAND),key=oct(4+BAND+10,C-0.586*(BAND+10));
  const stops=[[0,'#ffffff'],[.08,'#e7ebf0'],[.2,'#b9c1ca'],[.34,'#7f8892'],[.46,'#a7b0ba'],[.58,'#e9edf1'],[.66,'#ffffff'],[.76,'#c9d0d8'],[.9,'#8a939d'],[1,'#5f6872']];
  const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const col=t=>{for(let i=1;i<stops.length;i++){if(t<=stops[i][0]){const [t0,c0]=stops[i-1],[t1,c1]=stops[i],u=(t-t0)/(t1-t0),A=hex(c0),B=hex(c1);return 'rgb('+A.map((v,k)=>Math.round(v+(B[k]-v)*u)).join(',')+')';}}return stops[stops.length-1][1];};
  let rings='';for(let k=0;k<BAND;k+=0.75){rings+=`<path d="${oct(4+k,C-0.586*k)}" fill="none" stroke="${col(k/BAND)}" stroke-width="1.6" stroke-linejoin="miter"/>`;}
  const svg=`<svg class="ce-frame" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}"><defs><linearGradient id="lt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".45"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".35"/></linearGradient><filter id="s" x="-5%" y="-3%" width="110%" height="106%"><feDropShadow dx="0" dy="9" stdDeviation="9" flood-color="#000" flood-opacity=".5"/></filter></defs><g filter="url(#s)"><path d="${outer}" fill="#c9d0d8"/>${rings}</g><path d="${outer} ${inner}" fill="url(#lt)" fill-rule="evenodd"/><path d="${inner}" transform="translate(0,2)" fill="none" stroke="#f4f6f8" stroke-width="2" opacity=".9"/><path d="${inner}" fill="#ffffff" stroke="rgba(20,20,26,.8)" stroke-width="2.5"/><path d="${key}" fill="none" stroke="#6f7782" stroke-width="1" opacity=".9"/></svg>`;
  wrap.insertAdjacentHTML('afterbegin',svg);});
await p.waitForTimeout(500);
const hh=await p.evaluate(()=>Math.max(document.documentElement.scrollHeight,document.querySelector('.card-expand').scrollHeight));await p.screenshot({path:S+'/real-expanded.png',fullPage:true,clip:{x:0,y:0,width:390,height:hh}});await b.close();})();
