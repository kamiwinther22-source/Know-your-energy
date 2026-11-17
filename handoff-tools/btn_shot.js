const { chromium } = require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
for(const [name,q] of [['wide','w=340&h=112&c=40&ix=44&iy=22&d=26&f=40'],['short','w=232&h=112&c=40&ix=44&iy=22&d=26&f=40']]){
const p=await b.newPage({viewport:{width:400,height:200}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8771/btn_render.html?'+q);await p.waitForFunction(()=>window.__done,{timeout:60000});
const d=await p.evaluate(()=>document.querySelector('canvas').toDataURL('image/png'));
fs.writeFileSync('btn_'+name+'.png',Buffer.from(d.split(',')[1],'base64'));console.log(name,errs);await p.close();}
await b.close()})();
