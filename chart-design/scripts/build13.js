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
const SENT=D.s.match(/[^.]+\.(?:\s|$)/g).map(x=>x.trim());
const grp=[[0,1],[2,3,4],[5]].map(g=>g.map(k=>SENT[k]).join(' '));
const hdr=`<div class=t>Kami · Numerology</div><div class="row open" style="margin-top:22px;border-bottom:0"><div class=l>LIFE PATH</div><div class=hex><div class=n>22</div></div></div>`;
const tail=`<div class=row style="margin-top:30px"><div class=l>MATURITY</div><div class=n style="font-size:40px">1</div></div><div class=sec style="margin-top:30px">Internal State</div><div class=row><div class=l>ESSENCE CYCLE <span style="font:700 11px Fraunces">AGE 48</span></div><div class=n style="font-size:40px">5</div></div>`;
const FRONT="radial-gradient(ellipse 600px 30% at 100% 97%,rgba(206,48,92,.8) 0,rgba(160,24,64,.42) 45%,rgba(130,14,50,0) 100%),radial-gradient(ellipse 560px 22% at 55% 33.7%,rgba(196,37,79,.62) 0,rgba(140,16,52,.3) 45%,rgba(140,16,52,0) 100%),radial-gradient(ellipse 620px 38.6% at 22% 4.1%,#c4254f 0,#8c1034 34%,#560a21 66%,#2a0510 100%) #2a0510";
const X=`.d{margin:12px 40px 0}.d p{color:#fff}`;
const body=(g)=>css(g,X+`.d{padding-left:16px;border-left:2px solid #d7dce2}.g1{font:italic 700 21px/1.3 'Fraunces';margin-bottom:16px}.d .p{font:500 16.5px/1.62 'Fraunces';margin-bottom:14px}`)+hdr+`<div class=d><div class=g1>${D.g}</div>${grp.map(g=>`<div class=p>${g}</div>`).join('')}</div>`+tail;
const O1=body("radial-gradient(ellipse 640px 560px at 22% 0%,#e0344f 0,#b3162f 42%,#6f0a1d 100%)");
const O2=body("radial-gradient(ellipse 700px 520px at 78% 100%,#c4254f 0,#8c1034 40%,#3a0714 100%)");
const O3=body("radial-gradient(ellipse 520px 420px at 50% 42%,#a31342 0,#6a0d2b 45%,#26040f 100%)");
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await ctx.newPage();
 for(const [k,h] of [['1',O1],['2',O2],['3',O3]]){await p.setContent(h,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
  console.log(k,await p.evaluate(()=>[...document.querySelectorAll('.row,.def,.sec')].map(e=>Math.round(e.getBoundingClientRect().bottom)).join(',')));
  await p.screenshot({path:S+'/Family-'+k+'.png'});}
 await b.close();})();
