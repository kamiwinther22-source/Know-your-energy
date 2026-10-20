const {open}=require('./lib.js');
const DB=[{city:'Cedar Rapids',state:'IA',country:'US',label:'Cedar Rapids, Iowa'},{city:'Cedar Falls',state:'IA',country:'US',label:'Cedar Falls, Iowa'},{city:'Cedar Park',state:'TX',country:'US',label:'Cedar Park, Texas'},{city:'Cedarville',state:'OH',country:'US',label:'Cedarville, Ohio'}];
(async()=>{const {b,p,errs}=await open('',{wait:2500,dsf:2});p.setDefaultTimeout(40000);
await p.route(/know-your-energy\.kwdoanchor\.workers\.dev\/places/,r=>{const q=new URL(r.request().url()).searchParams.get('q').toLowerCase();r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(DB.filter(x=>x.label.toLowerCase().startsWith(q.split(',')[0])).slice(0,7))})});
await p.fill('#heroEmail','test@example.com');await p.click('.hero-continue-btn');await p.waitForTimeout(1500);
await p.fill('#p1f','Pat');await p.fill('#p1l','Doe');await p.fill('#p1d','11/14/1977');
await p.click('#p1loc');await p.type('#p1loc','ced',{delay:60});await p.waitForTimeout(700);
await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');await p.waitForTimeout(200);
const val=await p.evaluate(()=>({v:document.getElementById('p1loc').value,pick:document.getElementById('p1loc').dataset.pick}));console.log(JSON.stringify(val));
await p.click('#p1Block .chk-txt');await p.click('#p1tzToggle');await p.selectOption('#p1tz','America/Chicago');await p.waitForTimeout(300);
await p.evaluate(()=>document.getElementById('p1d').scrollIntoView({block:'start'}));await p.screenshot({path:'places_form2.png'});
// capture request body
let body=null;await p.route(/workers\.dev\/chart-data/,r=>{body=JSON.parse(r.request().postData());r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"error":"stop here"}'})});
await p.click('#genBtn');await p.waitForTimeout(1500);console.log(JSON.stringify(body&&body.p1));
console.log('errors:',errs.filter(e=>/PAGEERR/.test(e)).join(';')||'none');await b.close()})();
