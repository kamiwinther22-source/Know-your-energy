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
const html=`<link rel=stylesheet href="${FONTS}"><style>*{box-sizing:border-box;margin:0;padding:0}html{height:1688px}body{${ground};padding:16px;width:390px;height:1688px}
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
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});const p=await ctx.newPage();
 await p.setContent(html,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
 console.log(JSON.stringify(await p.evaluate(()=>{const c=document.querySelector('.card');const k=[...c.children];return {over:c.scrollHeight-c.clientHeight,gaps:k.slice(1).map((e,i)=>Math.round(e.getBoundingClientRect().top-k[i].getBoundingClientRect().bottom)).join(','),page:document.documentElement.scrollHeight}})));
 await p.screenshot({path:S+'/C-two-screens.png',fullPage:true});await b.close();})();
