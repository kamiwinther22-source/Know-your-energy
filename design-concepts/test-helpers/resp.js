const {open}=require('./lib.js');
(async()=>{const {b,p}=await open('',{wait:2500,dsf:1});
await p.evaluate(async()=>{const {calculateFullChart}=await import('./numerology-calculator.js');
 const mk=(first,last,dob)=>({first,mid:'',last,dob,numerology:calculateFullChart({first,middle:'',last,dob,currentDate:new Date().toLocaleDateString('en-US')}),astro:null,astroError:'stub',hd:null,hdError:'stub'});
 render(mk('Alex','Morgan','08/14/1990'),mk('Sam','Rivera','03/02/1988'),null,'stub',false,false,'')});
await p.waitForTimeout(1000);await p.screenshot({path:'resp.png',fullPage:true});console.log(await p.evaluate(()=>document.documentElement.scrollHeight));await b.close()})();
