const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const S='/tmp/claude-0/-home-user-Know-your-energy/83849644-63e7-51ca-ac3a-9fdb74e9cfd0/scratchpad/nc';
const N=JSON.parse(fs.readFileSync(S+'/num.json'));
const FONTS="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Barlow+Condensed:wght@600;700;800&family=Playfair+Display:ital,wght@1,900&display=swap";
const ground='background:radial-gradient(ellipse 620px 40% at 22% 0%,#c4254f 0,#8c1034 34%,#560a21 66%,#2a0510 100%) #2a0510';
const H=1688-32;
const e=N.essenceCycle, pins=[1,2,3,4].map(i=>[N.pinnacles['pinnacle'+i],N.challengeNumbers['challenge'+i]]), pers=[1,2,3].map(i=>N.periodCycles['period'+i]);
const rest=[['Expression',N.expression],['Soul Urge',N.soulUrge],['Personality',N.personality],['Balance',N.balance],['Birthday',N.birthday],['Attitude',N.attitude],['Karmic Lessons',N.karmicLessons.join(', ')],['Karmic Debt',N.karmicDebtNumbers.join(', ')]];
const circ=[['Personal Year',N.personalYear],['Personal Month',N.personalMonth],['Personal Day',N.personalDay]];
const mk=()=>`<link rel=stylesheet href="${FONTS}"><style>*{box-sizing:border-box;margin:0;padding:0}html{height:1688px}body{${ground};padding:16px;width:390px;height:1688px}
.card{width:358px;height:${H}px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 0 0 2px #d7dce2,0 10px 22px rgba(0,0,0,.5);padding:26px 48px 30px;color:#000;display:flex;flex-direction:column;justify-content:space-between}
.t{font:400 38px 'Alex Brush',cursive;color:#0b0b10;text-align:center;line-height:1}
.sec{font:400 28px 'Alex Brush',cursive;color:#6b0f2b;line-height:1.1;margin-bottom:4px}
.l{font:800 13px 'Barlow Condensed';letter-spacing:.12em;text-transform:uppercase;color:#0b0b10}.age{font:700 11px 'Barlow Condensed';letter-spacing:.06em;text-transform:uppercase;color:#4a4a4a;margin-left:6px}
.n{font-family:'Playfair Display',serif;font-style:italic;font-weight:900;color:#000;font-size:34px;line-height:1}
.r{display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid #0b0b10;padding:3px 0 1px}
.lp{display:flex;justify-content:space-between;align-items:flex-end;padding:0 0 2px;border-bottom:2px solid #6b0f2b}.lp .n{font-size:84px}.lp .l{font-size:15px;padding-bottom:10px}.lp.m{border-bottom:1px solid #0b0b10}.lp.m .n{font-size:54px}.lp.m .l{padding-bottom:6px}
.pm{display:grid;grid-template-columns:1fr 1fr;column-gap:18px}.hd{font:800 12px 'Barlow Condensed';letter-spacing:.08em;text-transform:uppercase;color:#0b0b10;line-height:1.2;padding-bottom:4px}
.pm .r .n{font-size:28px}
</style><div class=card><div class=t>Kami · Numerology</div>
<div><div class=lp><div class=l>Life Path</div><div class=n>${N.lifePath}</div></div><div class="lp m"><div class=l>Maturity</div><div class=n>${N.maturity}</div></div></div>
<div><div class=sec>Internal State</div><div class=r><div class=l>Essence Cycle<span class=age>age ${e.currentAge}</span></div><div class=n>${e.value}</div></div></div>
<div><div class=sec>Circumstances</div>${circ.map(c=>`<div class=r><div class=l>${c[0]}</div><div class=n>${c[1]}</div></div>`).join('')}</div>
<div><div class=sec>Pinnacle &amp; Challenge</div><div class=pm><div class=hd>Pinnacle<br>(Opportunity)</div><div class=hd>Challenge<br>(Internal Resistance)</div>${pins.map(x=>`<div class=r><div class=l>${x[0].ageRange.replace('-','–')}</div><div class=n>${x[0].value}</div></div><div class=r><div class=l>&nbsp;</div><div class=n>${x[1]}</div></div>`).join('')}</div></div>
<div><div class=sec>Periods (Environment)</div>${pers.map((x,i)=>`<div class=r><div class=l>Period ${i+1}<span class=age>${x.ageRange}</span></div><div class=n>${x.value}</div></div>`).join('')}</div>
<div><div class=sec>The Rest</div>${rest.map(o=>`<div class=r><div class=l>${o[0]}</div><div class=n>${o[1]}</div></div>`).join('')}</div></div>`;
const css=`.card{position:relative;padding:64px 58px 78px !important;background:transparent !important;box-shadow:none !important;border-radius:0 !important}.card>*{position:relative;z-index:2}.t{font-size:30px !important;white-space:nowrap}.sec{font-size:25px !important;display:flex;align-items:center;white-space:nowrap}.l{white-space:nowrap}.kar .n{font-size:30px !important;white-space:nowrap}.sec::before{content:'';flex:none;width:13px;height:13px;margin-right:11px;background:#8c1034;clip-path:polygon(26% 0,74% 0,100% 50%,74% 100%,26% 100%,0 50%)}.l{font-size:14.5px !important}.n{font-size:40px !important}.lp .n{font-size:96px !important}.lp.m .n{font-size:60px !important}.lp .l{font-size:17px !important}.pm .r .n{font-size:32px !important}.hd{font-size:12px !important}`;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await ctx.newPage();
 await p.setContent(mk().replace('</style>',css+'</style>'),{waitUntil:'networkidle'});
 await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(()=>{
  const W=358,Hh=1656,BAND=34,C=46,N=document.querySelector('.card');
  const oct=(inset,c)=>{const a=inset,b=W-inset,t=inset,u=Hh-inset;return `M${a+c},${t} L${b-c},${t} L${b},${t+c} L${b},${u-c} L${b-c},${u} L${a+c},${u} L${a},${u-c} L${a},${t+c} Z`;};
  const outer=oct(4,C),inner=oct(4+BAND,C-0.586*BAND),key=oct(4+BAND+10,C-0.586*(BAND+10));
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}" style="position:absolute;left:0;top:0;z-index:0"><defs>
   <linearGradient id="g" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#c4254f"/><stop offset=".34" stop-color="#8c1034"/><stop offset=".66" stop-color="#560a21"/><stop offset="1" stop-color="#2a0510"/></linearGradient>
   <linearGradient id="sv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".08" stop-color="#b8c0c9"/><stop offset=".15" stop-color="#14181d"/><stop offset=".19" stop-color="#7d8791"/><stop offset=".5" stop-color="#dfe4ea"/><stop offset=".82" stop-color="#914b64"/><stop offset=".92" stop-color="#eef1f5"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
   <filter id="s" x="-5%" y="-3%" width="110%" height="106%"><feDropShadow dx="0" dy="9" stdDeviation="9" flood-color="#000" flood-opacity=".5"/></filter></defs>
   <path d="${outer}" fill="url(#g)" stroke="url(#sv)" stroke-width="6" stroke-linejoin="miter" filter="url(#s)"/>
   <path d="${inner}" transform="translate(0,2)" fill="none" stroke="#e6c3cc" stroke-width="2" stroke-linejoin="miter" opacity=".9"/><path d="${inner}" fill="#ffffff" stroke="rgba(20,2,8,.75)" stroke-width="2.5" stroke-linejoin="miter"/><path d="${key}" fill="none" stroke="#8c1034" stroke-width="1" opacity=".85" stroke-linejoin="miter"/></svg>`;
  N.insertAdjacentHTML('afterbegin',svg);document.querySelectorAll('.r').forEach(r=>{if(/KARMIC/i.test(r.textContent))r.classList.add('kar')});
 });
 await p.waitForTimeout(500);
 console.log(await p.evaluate(()=>{const c=document.querySelector('.card');return c.scrollHeight-c.clientHeight}));
 await p.screenshot({path:S+'/Craft-closed.png',fullPage:true});await b.close();})();
