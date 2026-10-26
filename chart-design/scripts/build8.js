const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const S='/tmp/claude-0/-home-user-Know-your-energy/83849644-63e7-51ca-ac3a-9fdb74e9cfd0/scratchpad/nc';
const D=JSON.parse(fs.readFileSync(S+'/defs.json'));
const FONTS="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500;1,9..144,700&family=Playfair+Display:ital,wght@1,900&display=swap";
const ground=`background:radial-gradient(ellipse 600px 30% at 100% 97%,rgba(206,48,92,.8) 0,rgba(160,24,64,.42) 45%,rgba(130,14,50,0) 100%),radial-gradient(ellipse 560px 22% at 55% 33.7%,rgba(196,37,79,.62) 0,rgba(140,16,52,.3) 45%,rgba(140,16,52,0) 100%),radial-gradient(ellipse 620px 38.6% at 22% 4.1%,#c4254f 0,#8c1034 34%,#560a21 66%,#2a0510 100%) #2a0510`;
const SILVER='linear-gradient(180deg,#fff 0%,#b8c0c9 8%,#14181d 15%,#7d8791 19%,#dfe4ea 50%,#914b64 82%,#eef1f5 92%,#fff 100%)';
const base=`<link rel=stylesheet href="${FONTS}"><style>*{box-sizing:border-box;margin:0;padding:0}html,body{width:390px;height:844px;overflow:hidden}body{${ground};font-family:'Fraunces',Georgia,serif;color:#fff;position:relative}
.t{font:400 38px 'Alex Brush',cursive;text-align:center;padding-top:22px;line-height:1}
.l{font:700 14px 'Fraunces';letter-spacing:.02em;color:#fff}.n{font-family:'Playfair Display',serif;font-style:italic;font-weight:900;color:#fff;line-height:1}.hex .n{color:#000}
.row{display:flex;justify-content:space-between;align-items:baseline;margin:0 48px;border-bottom:1.5px solid #d7dce2;padding:4px 0 2px}
.hex{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;background:${SILVER};clip-path:polygon(var(--c) 0,calc(100% - var(--c)) 0,100% 50%,calc(100% - var(--c)) 100%,var(--c) 100%,0 50%);filter:none}
.hex::before{content:"";position:absolute;inset:var(--vy) var(--hx);z-index:-1;background:#f6f7fa;clip-path:polygon(var(--d) 0,calc(100% - var(--d)) 0,100% 50%,calc(100% - var(--d)) 100%,var(--d) 100%,0 50%)}
.hex.s{width:104px;height:62px;--c:18px;--d:12px;--vy:6px;--hx:10px}.hex.s .n{font-size:30px}
.hex.b{width:150px;height:100px;--c:28px;--d:20px;--vy:9px;--hx:16px}.hex.b .n{font-size:58px}
.cl{width:132px;height:44px;--c:12px;--d:8px;--vy:5px;--hx:8px;font:700 16px 'Fraunces';color:#000}
.gen{font:700 19px/1.3 'Fraunces';color:#000}.spec{font:500 16px/1.6 'Fraunces';color:#000}
</style>`;
const chart=`<div class=t>Kami · Numerology</div><div class=row style="margin-top:26px"><div class=l style="font-size:15px">LIFE PATH</div><div class=n style="font-size:60px">22</div></div><div class=row style="margin-top:16px"><div class=l>MATURITY</div><div class=n style="font-size:40px">1</div></div>`;
// D1: sheet rising from the bottom
const D1=base+chart+`<div style="position:absolute;left:0;right:0;top:240px;bottom:0;background:linear-gradient(165deg,#fcfdff 0%,#eceff4 48%,#f8f9fb 72%,#e2e6ec 100%);border-radius:18px 18px 0 0;box-shadow:0 -10px 24px rgba(0,0,0,.5);padding:26px 30px 0">
<div style="display:flex;align-items:center;gap:16px;margin-bottom:18px"><div class="hex s"><div class=n>22</div></div><div><div class=l style="font-size:13px;letter-spacing:.14em;color:#6b0f2b">LIFE PATH</div><div class=gen style="margin-top:4px;font-size:17px">${D.g}</div></div></div>
<div class=spec>${D.s}</div><div style="position:absolute;left:0;right:0;bottom:26px;display:flex;justify-content:center"><div class="hex cl"><span>Close</span></div></div></div>`;
// D2: cut-in panel opens in place
const D2=base+`<div class=t>Kami · Numerology</div>
<div class=row style="margin-top:30px;border-bottom:0"><div class=l style="font-size:15px">LIFE PATH</div><div class="hex s" style="margin-bottom:-6px"><div class=n>22</div></div></div>
<div style="margin:12px 28px 0;background:linear-gradient(165deg,#fcfdff 0%,#eceff4 48%,#f8f9fb 72%,#e2e6ec 100%);box-shadow:0 0 0 1.5px #d7dce2,0 8px 18px rgba(0,0,0,.4);border-radius:3px;padding:20px 20px 24px"><div class=gen style="margin-bottom:12px">${D.g}</div><div class=spec>${D.s}</div></div>
<div class=row style="margin-top:34px"><div class=l>MATURITY</div><div class=n style="font-size:40px">1</div></div>
`;
// D3: whole screen becomes the definition
const D3=base+`<div style="position:absolute;inset:0;background:linear-gradient(165deg,#fcfdff 0%,#eceff4 48%,#f8f9fb 72%,#e2e6ec 100%)"></div><div style="position:relative;padding:30px 44px 0;text-align:center"><div class="hex b" style="margin:0 auto"><div class=n>22</div></div>
<div style="font:400 40px 'Alex Brush',cursive;margin-top:14px;line-height:1;color:#6b0f2b">Life Path</div>
<div class=gen style="margin:14px auto 0;max-width:290px">${D.g}</div><div style="width:64px;height:2px;background:#6b0f2b;margin:18px auto"></div>
<div class=spec style="text-align:left;max-width:300px;margin:0 auto">${D.s}</div></div>
<div style="position:absolute;left:0;right:0;bottom:26px;display:flex;justify-content:center"><div class="hex cl"><span>Close</span></div></div>`;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await ctx.newPage();
 for(const [k,h] of [['1',D1],['2',D2],['3',D3]]){await p.setContent(h,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
  const ov=await p.evaluate(()=>{const els=[...document.querySelectorAll('.spec,.gen')];return els.map(e=>Math.round(e.getBoundingClientRect().bottom)).join(',')});console.log(k,ov);
  await p.screenshot({path:S+'/Readable-'+k+'.png'});}
 await b.close();})();
