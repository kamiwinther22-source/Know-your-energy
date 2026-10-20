const {open}=require('./lib.js');
(async()=>{const {b,p}=await open('',{wait:3000});
console.log('LOCKED state');
const probe=async(tag)=>{console.log(tag,await p.evaluate(()=>{const r=document.querySelector('#p1f').getBoundingClientRect();const x=r.left+30,y=r.top+10;window.scrollTo(0,r.top-300);const r2=document.querySelector('#p1f').getBoundingClientRect();return document.elementsFromPoint(r2.left+30,r2.top+10).map(e=>e.tagName+'.'+(e.className.baseVal??e.className)+'#'+e.id+' bg='+getComputedStyle(e).backgroundColor+' op='+getComputedStyle(e).opacity+' bi='+getComputedStyle(e).backgroundImage.slice(0,40)).join('\n')}))};
await probe('locked');
await p.fill('#heroEmail','test@example.com');await p.click('.hero-continue-btn');await p.waitForTimeout(1500);await probe('unlocked');
await b.close()})();
