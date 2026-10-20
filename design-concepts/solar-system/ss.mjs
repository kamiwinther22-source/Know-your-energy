import fs from "fs";
import pkg from "./node_modules/circular-natal-horoscope-js/dist/index.js";
const {Origin,Horoscope}=pkg;
const E={ // a,da,e,de,I,dI,L,dL,w,dw,O,dO
mercury:[0.38709927,0.00000037,0.20563593,0.00001906,7.00497902,-0.00594749,252.25032350,149472.67411175,77.45779628,0.16047689,48.33076593,-0.12534081],
venus:[0.72333566,0.00000390,0.00677672,-0.00004107,3.39467605,-0.00078890,181.97909950,58517.81538729,131.60246718,0.00268329,76.67984255,-0.27769418],
earth:[1.00000261,0.00000562,0.01671123,-0.00004392,-0.00001531,-0.01294668,100.46457166,35999.37244981,102.93768193,0.32327364,0,0],
mars:[1.52371034,0.00001847,0.09339410,0.00007882,1.84969142,-0.00813131,-4.55343205,19140.30268499,-23.94362959,0.44441088,49.55953891,-0.29257343],
jupiter:[5.20288700,-0.00011607,0.04838624,-0.00013253,1.30439695,-0.00183714,34.39644051,3034.74612775,14.72847983,0.21252668,100.47390909,0.20469106],
saturn:[9.53667594,-0.00125060,0.05386179,-0.00050991,2.48599187,0.00193609,49.95424423,1222.49362201,92.59887831,-0.41897216,113.66242448,-0.28867794],
uranus:[19.18916464,-0.00196176,0.04725744,-0.00004397,0.77263783,-0.00242939,313.23810451,428.48202785,170.95427630,0.40805281,74.01692503,0.04240589],
neptune:[30.06992276,0.00026291,0.00859048,0.00005105,1.77004347,0.00035372,-55.12002969,218.45945325,44.96476227,-0.32241464,131.78422574,-0.00508664]};
const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
const jd=(y,m,d,h)=>{if(m<=2){y--;m+=12}const A=Math.floor(y/100),B=2-A+Math.floor(A/4);return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+h/24+B-1524.5};
function helio(name,JD){const T=(JD-2451545.0)/36525;const e=E[name];const a=e[0]+e[1]*T,ec=e[2]+e[3]*T,I=e[4]+e[5]*T,L=e[6]+e[7]*T,w=e[8]+e[9]*T,O=e[10]+e[11]*T;
 let M=((L-w)%360+540)%360-180;let Ea=rad(M)+ec*Math.sin(rad(M));for(let i=0;i<8;i++){Ea-= (Ea-ec*Math.sin(Ea)-rad(M))/(1-ec*Math.cos(Ea))}
 const xp=a*(Math.cos(Ea)-ec),yp=a*Math.sqrt(1-ec*ec)*Math.sin(Ea);const wp=rad(w-O),Or=rad(O),Ir=rad(I);
 const x=(Math.cos(wp)*Math.cos(Or)-Math.sin(wp)*Math.sin(Or)*Math.cos(Ir))*xp+(-Math.sin(wp)*Math.cos(Or)-Math.cos(wp)*Math.sin(Or)*Math.cos(Ir))*yp;
 const y=(Math.cos(wp)*Math.sin(Or)+Math.sin(wp)*Math.cos(Or)*Math.cos(Ir))*xp+(-Math.sin(wp)*Math.sin(Or)+Math.cos(wp)*Math.cos(Or)*Math.cos(Ir))*yp;
 return {x,y,a,r:Math.hypot(x,y),lon:((deg(Math.atan2(y,x))%360)+360)%360}}
const geoLon=(name,JD)=>{const p=helio(name,JD),e=helio('earth',JD);return ((deg(Math.atan2(p.y-e.y,p.x-e.x))%360)+360)%360};
// validate against library (geocentric)
const lib=(y,m,d,h,mi)=>{const hs=new Horoscope({origin:new Origin({year:y,month:m,date:d,hour:h,minute:mi,latitude:42.5,longitude:-96.4}),houseSystem:"whole-sign",zodiac:"tropical",aspectPoints:[],aspectWithPoints:[],aspectTypes:[],customOrbs:{},language:"en"});const o={};['mercury','venus','mars','jupiter','saturn','uranus','neptune'].forEach(k=>o[k]=hs.CelestialBodies[k].ChartPosition.Ecliptic.DecimalDegrees);return o};
const moments={birth:{y:1977,m:11,d:15,h:0.77,L:[1977,10,14,18,46],label:'November 14, 1977'},today:{y:2026,m:10,d:17,h:18,L:[2026,9,17,12,0],label:'October 17, 2026'}};
const out={};
for(const [k,mm] of Object.entries(moments)){const JD=jd(mm.y,mm.m,mm.d,mm.h);const ref=lib(...mm.L);const res={};
 for(const n of Object.keys(E)){res[n]=helio(n,JD)}
 const chk=Object.keys(ref).map(n=>`${n}: mine ${geoLon(n,JD).toFixed(2)} lib ${ref[n].toFixed(2)}`);console.log(k,chk.join(' | '));
 out[k]={label:mm.label,planets:res}}
fs.writeFileSync('ss.json',JSON.stringify(out));
