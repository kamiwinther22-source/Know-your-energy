const {open}=require('./lib.js');
(async()=>{const {b,p}=await open('',{wait:3000});
console.log(await p.evaluate(()=>document.getAnimations().map(a=>(a.animationName||a.constructor.name)+' '+(a.effect&&a.effect.target?a.effect.target.tagName+'.'+(a.effect.target.getAttribute('class')||'')+' '+a.playState:'')).slice(0,20).join('\n')));
const s1=await p.evaluate(()=>[...document.querySelectorAll('#heroIllustration circle,#heroIllustration g')].slice(0,6).map(e=>e.getBoundingClientRect().x));await p.waitForTimeout(1500);
const s2=await p.evaluate(()=>[...document.querySelectorAll('#heroIllustration circle,#heroIllustration g')].slice(0,6).map(e=>e.getBoundingClientRect().x));console.log(s1.join(),'\n',s2.join());
await b.close()})();
