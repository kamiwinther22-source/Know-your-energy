import pkg from "./node_modules/circular-natal-horoscope-js/dist/index.js";
import {calculateFullChart} from "/home/user/Know-your-energy/numerology-calculator.js";
import fs from "fs";
const {Origin,Horoscope}=pkg;
const NOW=new Date(Date.UTC(2026,9,17,12));
function lons(d){const o=new Origin({year:d.getUTCFullYear(),month:d.getUTCMonth(),date:d.getUTCDate(),hour:(d.getUTCHours()===12&&d.getUTCMinutes()===0&&false)?12:12,minute:0,latitude:42.5,longitude:-96.4});
 const h=new Horoscope({origin:o,houseSystem:"whole-sign",zodiac:"tropical",aspectPoints:[],aspectWithPoints:[],aspectTypes:[],customOrbs:{},language:"en"});
 const g=k=>h.CelestialBodies[k].ChartPosition.Ecliptic.DecimalDegrees;
 return {sun:g("sun"),moon:g("moon"),jupiter:g("jupiter"),saturn:g("saturn"),uranus:g("uranus"),chiron:g("chiron")};}
const iso=d=>d.toISOString().slice(0,10);
const fmt=d=>`${d.getUTCMonth()+1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
function person(name,first,last,y,m,d){
 const dob=new Date(Date.UTC(y,m-1,d,12));
 const at=dt=>calculateFullChart({first,last,dob:`${m}/${d}/${y}`,currentDate:fmt(dt)});
 const ageNow=(NOW-dob)/31557600000;
 const nat=lons(dob);
 const c=at(NOW);
 // life-axis transit samples: every 20 days to age 92
 const samp=[];for(let t=0;t<=92*365.25;t+=20){const dt=new Date(dob.getTime()+t*86400000);const L=lons(dt);samp.push({age:t/365.25,...L});}
 const signs=k=>{const out=[];let cur=null;for(const s of samp){const sg=Math.floor(s[k]/30);if(!cur||cur.sg!==sg){if(cur)cur.end=s.age;cur={sg,start:s.age};out.push(cur);}}out[out.length-1].end=92;return out;};
 const cross=(k,off,tol)=>{const target=(nat[k]+off+360)%360;const res=[];let prev=null;for(const s of samp){const dlt=(((s[k]-target+540)%360)-180);if(prev!==null&&Math.sign(prev)!==Math.sign(dlt)&&Math.abs(dlt-prev)<60){if(!res.length||s.age-res[res.length-1]>2)res.push(s.age);}prev=dlt;}return res;};
 const marks=[];
 for(const [k,off,label] of [["saturn",0,"Saturn return"],["saturn",90,"Saturn square"],["saturn",180,"Saturn opposition"],["jupiter",0,"Jupiter return"],["uranus",180,"Uranus opposition"],["chiron",0,"Chiron return"]]) for(const a of cross(k,off)) marks.push({k:label,age:+a.toFixed(1)});
 for(let i=1;i<=4;i++)marks.push({k:"Nodal return",age:+(i*18.61).toFixed(1)});
 // time windows
 const years=[];for(let i=-8;i<=16;i++){const dt=new Date(Date.UTC(NOW.getUTCFullYear()+i,NOW.getUTCMonth(),NOW.getUTCDate(),12));const cc=at(dt);years.push({y:dt.getUTCFullYear(),py:cc.personalYear,ess:cc.essenceCycle.value,age:cc.essenceCycle.currentAge});}
 const months=[];for(let i=-2;i<=9;i++){const dt=new Date(Date.UTC(NOW.getUTCFullYear(),NOW.getUTCMonth()+i,15,12));const cc=at(dt);months.push({m:dt.toLocaleString('en',{month:'short',timeZone:'UTC'}),pm:cc.personalMonth});}
 const days=[];for(let i=-2;i<=6;i++){const dt=new Date(NOW.getTime()+i*86400000);const cc=at(dt);days.push({d:dt.getUTCDate(),pd:cc.personalDay});}
 const calM=[];for(let i=0;i<12;i++){const dt=new Date(Date.UTC(NOW.getUTCFullYear(),i,15,12));const cc=at(dt);calM.push({m:dt.toLocaleString('en',{month:'short',timeZone:'UTC'}),pm:cc.personalMonth});}
 const calD=[];const dim=new Date(Date.UTC(NOW.getUTCFullYear(),NOW.getUTCMonth()+1,0)).getUTCDate();for(let i=1;i<=dim;i++){const dt=new Date(Date.UTC(NOW.getUTCFullYear(),NOW.getUTCMonth(),i,12));calD.push({d:i,pd:at(dt).personalDay});}
 // moon phase now
 const L=lons(NOW);
 return {name,age:+ageNow.toFixed(1),nat,now:L,py:c.personalYear,pm:c.personalMonth,pd:c.personalDay,ess:c.essenceCycle.value,
  pin:Object.values(c.pinnacles).map(p=>({v:p.value,r:p.ageRange})),per:Object.values(c.periodCycles).map(p=>({v:p.value,r:p.ageRange})),
  ch:Object.values(c.challengeNumbers),lp:c.lifePath,scr:[[2026,9,17],[2028,9,17],[2033,5,10]].map(([yy2,mm,dd])=>{const dt=new Date(Date.UTC(yy2,mm,dd,12));const cc=at(dt);return {y:yy2,m:mm,d:dd,py:cc.personalYear,pm:cc.personalMonth,pd:cc.personalDay,ess:cc.essenceCycle.value,age:cc.essenceCycle.currentAge,pin:Object.values(cc.pinnacles).map(p=>p.value),per:Object.values(cc.periodCycles).map(p=>p.value)}}),calM,calD,born:y,jup:signs("jupiter"),sat:signs("saturn"),marks,years,months,days};}
const out=[person("You","Pat","Doe",1977,11,14)];out[0].noEss=true;
fs.writeFileSync("me.json",JSON.stringify(out));
console.log(JSON.stringify(out[0]).slice(0,1500));console.log(out[0].marks);console.log(out[0].pin,out[0].per,out[0].ch);
