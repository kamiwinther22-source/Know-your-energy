const {open}=require('./lib.js');
(async()=>{const {b,p}=await open('',{wait:3000});
await p.fill('#heroEmail','test@example.com');await p.click('.hero-continue-btn');await p.waitForTimeout(1500);
console.log(await p.evaluate(()=>{const o={};document.querySelectorAll('body *').forEach(e=>{if(!e.childNodes.length)return;const t=[...e.childNodes].some(n=>n.nodeType==3&&n.textContent.trim());if(!t&&!/INPUT|SELECT|TEXTAREA/.test(e.tagName))return;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')return;const c=cs.color;if(c!=='rgb(255, 255, 255)')o[e.tagName+'.'+e.className+'#'+e.id]=c+' op'+cs.opacity});
 const ph=[];document.querySelectorAll('input,select').forEach(e=>ph.push(e.id+':'+getComputedStyle(e,'::placeholder').color));return JSON.stringify(o,null,1)+'\nPH '+ph.join(' ')}));
await b.close()})();
