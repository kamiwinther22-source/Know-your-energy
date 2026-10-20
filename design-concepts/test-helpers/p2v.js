const {open}=require('./lib.js');
(async()=>{const {b,p,errs}=await open('',{wait:2500,dsf:2});p.setDefaultTimeout(40000);
await p.fill('#heroEmail','test@example.com');await p.click('.hero-continue-btn');await p.waitForTimeout(1200);
await p.click('#p1Block .chk-txt');
await p.click('#togPill');await p.waitForTimeout(1200);
await p.evaluate(()=>document.getElementById('p1d').scrollIntoView({block:'start'}));await p.screenshot({path:'p1v.png'});
await p.evaluate(()=>document.getElementById('p2d').scrollIntoView({block:'start'}));await p.screenshot({path:'p2v.png'});
console.log(errs.filter(e=>/PAGEERR/.test(e)).join(';')||'none');await b.close()})();
