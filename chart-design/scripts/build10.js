const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const S='/tmp/claude-0/-home-user-Know-your-energy/83849644-63e7-51ca-ac3a-9fdb74e9cfd0/scratchpad/nc';
const D=JSON.parse(fs.readFileSync(S+'/defs.json'));
const FONTS="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700&family=Playfair+Display:ital,wght@1,900&display=swap";
const SILVER='linear-gradient(180deg,#fff 0%,#b8c0c9 8%,#14181d 15%,#7d8791 19%,#dfe4ea 50%,#914b64 82%,#eef1f5 92%,#fff 100%)';
const G='#8c1034',GD='#5c0a22',INK='#0b0b10';
const W='#fff';
const css=(ground,extra)=>`<link rel=stylesheet href="${FONTS}"><style>*{box-sizing:border-box;margin:0;padding:0}html,body{width:390px;height:844px;overflow:hidden}body{background:${ground};font-family:'Fraunces',Georgia,serif;color:${W};position:relative}
.t{font:400 40px 'Alex Brush',cursive;text-align:center;padding-top:20px;line-height:1;color:${W}}
.sec{font:400 30px 'Alex Brush',cursive;line-height:1.1;margin:0 40px;color:${W}}
.row{display:flex;justify-content:space-between;align-items:baseline;margin:0 40px;border-bottom:1.5px solid ${W};padding:4px 0 2px}
.l{font:700 14px 'Fraunces';letter-spacing:.03em;color:${W}}.l::after{content:'';display:inline-block;width:6px;height:6px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);margin:0 0 3px 8px}.open .l::after{transform:rotate(225deg);margin-bottom:0}
.n{font-family:'Playfair Display',serif;font-style:italic;font-weight:900;color:${W};line-height:1}
.hex{position:relative;isolation:isolate;display:flex;align-items:center;justify-content:center;width:104px;height:62px;--c:18px;--d:12px;--vy:6px;--hx:10px;background:${SILVER};clip-path:polygon(var(--c) 0,calc(100% - var(--c)) 0,100% 50%,calc(100% - var(--c)) 100%,var(--c) 100%,0 50%)}
.hex::before{content:"";position:absolute;inset:var(--vy) var(--hx);z-index:-1;background:#f6f7fa;clip-path:polygon(var(--d) 0,calc(100% - var(--d)) 0,100% 50%,calc(100% - var(--d)) 100%,var(--d) 100%,0 50%)}
.hex .n{font-size:30px;color:#000}
.def{margin:8px 26px 0;background:#fff;border-radius:3px;padding:18px 18px 20px;box-shadow:0 8px 16px rgba(0,0,0,.35)}
.gen{font:700 17px/1.3 'Fraunces';color:${INK};margin-bottom:10px}.spec{font:500 15.5px/1.58 'Fraunces';color:${INK}}
${extra}</style>`;
const rows=()=>`<div class=t>Kami · Numerology</div>
<div class="row open" style="margin-top:22px;border-bottom:0"><div class=l>LIFE PATH</div><div class=hex><div class=n>22</div></div></div>
<div class=def><div class=gen>${D.g}</div><div class=spec>${D.s}</div></div>
<div class=row style="margin-top:26px"><div class=l>MATURITY</div><div class=n style="font-size:40px">1</div></div>
<div class=sec style="margin-top:30px">Internal State</div>
<div class=row><div class=l>ESSENCE CYCLE <span style="font:700 11px Fraunces">AGE 48</span></div><div class=n style="font-size:40px">5</div></div>`;
const lit=(a,b,c)=>`radial-gradient(ellipse 620px 520px at 22% 0%,${a} 0,${b} 45%,${c} 100%)`;
const A=css(lit('#e0344f','#b3162f','#6f0a1d'),'')+rows();
const B=css(lit('#12a39a','#0b7a78','#063f45'),'')+rows();
const C=css(lit('#d9722f','#a8501b','#5c2410'),'')+rows();
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await ctx.newPage();
 for(const [k,h] of [['A',A],['B',B],['C',C]]){await p.setContent(h,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
  console.log(k,await p.evaluate(()=>[...document.querySelectorAll('.row,.def,.sec')].map(e=>Math.round(e.getBoundingClientRect().bottom)).join(',')));
  await p.screenshot({path:S+'/Ground-'+k+'.png'});}
 await b.close();})();
