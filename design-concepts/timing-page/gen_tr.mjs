import pkg from "./node_modules/circular-natal-horoscope-js/dist/index.js";
import fs from "fs";
const {Origin,Horoscope}=pkg;
const LAT=42.5,LON=-96.4;
const hs=(y,m,d,h,mi)=>new Horoscope({origin:new Origin({year:y,month:m,date:d,hour:h,minute:mi,latitude:LAT,longitude:LON}),houseSystem:"placidus",zodiac:"tropical",aspectPoints:[],aspectWithPoints:[],aspectTypes:[],customOrbs:{},language:"en"});
const K=["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto"];
const pos=h=>{const o={};K.forEach(k=>o[k]=h.CelestialBodies[k].ChartPosition.Ecliptic.DecimalDegrees);return o};
const nh=hs(1977,10,14,18,46);const natal=pos(nh);natal.asc=nh.Ascendant.ChartPosition.Ecliptic.DecimalDegrees;
const at=(dt)=>pos(hs(dt.getFullYear(),dt.getMonth(),dt.getDate(),12,0));
const today=new Date(2026,9,17);const T=at(today);
const ASP=[[0,'conjunct'],[60,'sextile'],[90,'square'],[120,'trine'],[180,'opposite']];
const sep=(a,b,ang)=>{let d=Math.abs(((a-b)%360+540)%360-180);return Math.abs(d-(180-ang))};
// angular diff between a and b is 'diff'; aspect orb = |diff-ang|
const diff=(a,b)=>{let d=Math.abs(a-b)%360;return d>180?360-d:d};
const NAT=["sun","moon","mercury","venus","mars","asc"];
const lim={moon:3,sun:2,mercury:2,venus:2,mars:2,jupiter:2.5,saturn:2.5,uranus:2.5,neptune:2.5,pluto:2.5};
const found=[];
K.forEach(t=>NAT.forEach(n=>{ASP.forEach(([ang,name])=>{const o=Math.abs(diff(T[t],natal[n])-ang);if(o<=lim[t])found.push({t,n,name,ang,orb:+o.toFixed(2)})})}));
// window for slow ones
const slow=found.filter(f=>['jupiter','saturn','uranus','neptune','pluto'].includes(f.t));
slow.forEach(f=>{let start=null,end=null,best=1e9,exact=null;for(let i=-500;i<=500;i+=3){const dt=new Date(2026,9,17+i);const P=at(dt);const o=Math.abs(diff(P[f.t],natal[f.n])-f.ang);if(o<=lim[f.t]){if(i<=0&&start===null||(i<=0&&start!==null&&dt-start>0&&false))start=start??dt;}
 }});
// simpler: scan out from today until orb exceeds limit both ways, and find min orb
slow.forEach(f=>{const lm=lim[f.t];const orbAt=i=>{const P=at(new Date(2026,9,17+i));return Math.abs(diff(P[f.t],natal[f.n])-f.ang)};
 let a=0;while(a>-700&&orbAt(a-3)<=lm)a-=3;let b=0;while(b<700&&orbAt(b+3)<=lm)b+=3;
 let best=1e9,bi=0;for(let i=a;i<=b;i+=1){const o=orbAt(i);if(o<best){best=o;bi=i}}
 f.start=new Date(2026,9,17+a).toISOString().slice(0,10);f.end=new Date(2026,9,17+b).toISOString().slice(0,10);f.exact=new Date(2026,9,17+bi).toISOString().slice(0,10);});
const SIGN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const sg=l=>SIGN[Math.floor(l/30)]+' '+(l%30).toFixed(0)+'°';
const moonPhase=(()=>{const e=((T.moon-T.sun)%360+360)%360;return e})();
const out={natal:Object.fromEntries(Object.entries(natal).map(([k,v])=>[k,sg(v)])),transit:Object.fromEntries(Object.entries(T).map(([k,v])=>[k,sg(v)])),moonElong:moonPhase,all:found,slow};
fs.writeFileSync('tr.json',JSON.stringify(out,null,1));
console.log(JSON.stringify(out.natal));console.log(JSON.stringify(out.transit));console.log(found.map(f=>`${f.t} ${f.name} natal ${f.n} orb ${f.orb}`).join('\n'));console.log(slow.map(f=>`${f.t} ${f.name} ${f.n}: ${f.start} → ${f.exact} → ${f.end}`).join('\n'));console.log('moon elong',moonPhase.toFixed(0));
const cusps=nh.Houses.map(h=>h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees);
const houseOf=l=>{for(let i=0;i<12;i++){const a=cusps[i],b=cusps[(i+1)%12];const x=((l-a)%360+360)%360,w=((b-a)%360+360)%360;if(x<w)return i+1}return null};
const out2=JSON.parse(fs.readFileSync('tr.json'));
out2.natalLon=natal;out2.transitLon=T;
out2.natalHouse=Object.fromEntries(K.map(k=>[k,houseOf(natal[k])]));
out2.transitHouse=Object.fromEntries(K.map(k=>[k,houseOf(T[k])]));
fs.writeFileSync('tr.json',JSON.stringify(out2,null,1));
console.log(JSON.stringify(out2.natalHouse),JSON.stringify(out2.transitHouse),cusps.map(c=>c.toFixed(0)).join(','));
