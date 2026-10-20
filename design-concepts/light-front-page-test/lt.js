const {open}=require('./lib.js');const fs=require('fs');
(async()=>{const {b,p}=await open('',{wait:3500,dsf:1});
await p.addStyleTag({content:fs.readFileSync('light.css','utf8')+'html,body{overflow-x:hidden}'});await p.evaluate(()=>document.documentElement.classList.add('lt'));await p.waitForTimeout(500);
await p.fill('#heroEmail','test@example.com');await p.click('.hero-continue-btn');await p.waitForTimeout(1500);
await p.screenshot({path:'lt_full.png',fullPage:true,clip:{x:0,y:0,width:390,height:1250}});await b.close()})();
