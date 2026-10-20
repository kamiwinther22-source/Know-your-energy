import fs from "fs";
import pkg from "./node_modules/circular-natal-horoscope-js/dist/index.js";
const {Origin,Horoscope}=pkg;
const E={mercury:[0.38709927,0.00000037,0.20563593,0.00001906,7.00497902,-0.00594749,252.25032350,149472.67411175,77.45779628,0.16047689,48.33076593,-0.12534081],
venus:[0.72333566,0.00000390,0.00677672,-0.00004107,3.39467605,-0.00078890,181.97909950,58517.81538729,131.60246718,0.00268329,76.67984255,-0.27769418],
earth:[1.00000261,0.00000562,0.01671123,-0.00004392,-0.00001531,-0.01294668,100.46457166,35999.37244981,102.93768193,0.32327364,0,0],
mars:[1.52371034,0.00001847,0.09339410,0.00007882,1.84969142,-0.00813131,-4.55343205,19140.30268499,-23.94362959,0.44441088,49.55953891,-0.29257343],
jupiter:[5.20288700,-0.00011607,0.04838624,-0.00013253,1.30439695,-0.00183714,34.39644051,3034.74612775,14.72847983,0.21252668,100.47390909,0.20469106],
saturn:[9.53667594,-0.00125060,0.05386179,-0.00050991,2.48599187,0.00193609,49.95424423,1222.49362201,92.59887831,-0.41897216,113.66242448,-0.28867794],
uranus:[19.18916464,-0.00196176,0.04725744,-0.00004397,0.77263783,-0.00242939,313.23810451,428.48202785,170.95427630,0.40805281,74.01692503,0.04240589],
neptune:[30.06992276,0.00026291,0.00859048,0.00005105,1.77004347,0.00035372,-55.12002969,218.45945325,44.96476227,-0.32241464,131.78422574,-0.00508664],
pluto:[39.48211675,-0.00031596,0.24882730,0.00005170,17.14001206,0.00004818,238.92903833,145.20780515,224.06891629,-0.04062942,110.30393684,-0.01183482]};
const R=Math.PI/180,D=180/Math.PI,n360=x=>((x%360)+360)%360;
const jd=(y,m,d,h)=>{if(m<=2){y--;m+=12}const A=Math.floor(y/100),B=2-A+Math.floor(A/4);return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+h/24+B-1524.5};
function helio(name,JD){const T=(JD-2451545.0)/36525,e=E[name];const a=e[0]+e[1]*T,ec=e[2]+e[3]*T,I=e[4]+e[5]*T,L=e[6]+e[7]*T,w=e[8]+e[9]*T,O=e[10]+e[11]*T;
 let M=((L-w)%360+540)%360-180;let Ea=M*R+ec*Math.sin(M*R);for(let i=0;i<10;i++)Ea-=(Ea-ec*Math.sin(Ea)-M*R)/(1-ec*Math.cos(Ea));
 const xp=a*(Math.cos(Ea)-ec),yp=a*Math.sqrt(1-ec*ec)*Math.sin(Ea),wp=(w-O)*R,Or=O*R,Ir=I*R;
 return {x:(Math.cos(wp)*Math.cos(Or)-Math.sin(wp)*Math.sin(Or)*Math.cos(Ir))*xp+(-Math.sin(wp)*Math.cos(Or)-Math.cos(wp)*Math.sin(Or)*Math.cos(Ir))*yp,
  y:(Math.cos(wp)*Math.sin(Or)+Math.sin(wp)*Math.cos(Or)*Math.cos(Ir))*xp+(-Math.sin(wp)*Math.sin(Or)+Math.cos(wp)*Math.cos(Or)*Math.cos(Ir))*yp,
  z:(Math.sin(wp)*Math.sin(Ir))*xp+(Math.cos(wp)*Math.sin(Ir))*yp}}
const geo=(name,JD,yr)=>{const p=helio(name,JD),e=helio('earth',JD);const x=p.x-e.x,y=p.y-e.y,z=p.z-e.z;return {lon:n360(Math.atan2(y,x)*D+0.01397*(yr-2000)),lat:Math.atan2(z,Math.hypot(x,y))*D}};
const sunGeo=(JD,yr)=>{const e=helio('earth',JD);return {lon:n360(Math.atan2(-e.y,-e.x)*D+0.01397*(yr-2000)),lat:0}};
const moonGeo=(JD)=>{const T=(JD-2451545)/36525;const s=(a,b)=>Math.sin((a+b*T)*R);
 const lon=218.32+481267.881*T+6.29*s(135.0,477198.87)-1.27*s(259.3,-413335.36)+0.66*s(235.7,890534.22)+0.21*s(269.9,954397.74)-0.19*s(357.5,35999.05)-0.11*s(186.5,966404.03);
 const lat=5.13*s(93.3,483202.02)+0.28*s(228.2,960400.89)-0.28*s(318.3,6003.15)-0.17*s(217.6,-407332.21);return {lon:n360(lon),lat}};
// birth: 1977-11-14 18:46 CST = 1977-11-15 00:46 UTC
const yr=1977.87,JD=jd(1977,11,15,46/60);const T=(JD-2451545)/36525;
const eps=(23.4392911-0.0130042*T)*R;
const bodies={sun:sunGeo(JD,yr),moon:moonGeo(JD),mercury:geo('mercury',JD,yr),venus:geo('venus',JD,yr),mars:geo('mars',JD,yr),jupiter:geo('jupiter',JD,yr),saturn:geo('saturn',JD,yr),uranus:geo('uranus',JD,yr),neptune:geo('neptune',JD,yr),pluto:geo('pluto',JD,yr)};
const eq=b=>{const l=b.lon*R,be=b.lat*R;const ra=Math.atan2(Math.sin(l)*Math.cos(eps)-Math.tan(be)*Math.sin(eps),Math.cos(l));const dec=Math.asin(Math.sin(be)*Math.cos(eps)+Math.cos(be)*Math.sin(eps)*Math.sin(l));return {ra:n360(ra*D),dec:dec*D}};
const gmst=n360(280.46061837+360.98564736629*(JD-2451545.0)+0.000387933*T*T);
const wrap=l=>((l+540)%360)-180;
const out={gmst,lines:{}};
for(const [k,b] of Object.entries(bodies)){const q=eq(b);const mc=wrap(q.ra-gmst),ic=wrap(q.ra-gmst+180);const asc=[],dsc=[];
 for(let lat=-80;lat<=80;lat+=1){const x=-Math.tan(lat*R)*Math.tan(q.dec*R);if(Math.abs(x)>=1)continue;const H=Math.acos(x)*D;asc.push([+wrap(q.ra-H-gmst).toFixed(2),lat]);dsc.push([+wrap(q.ra+H-gmst).toFixed(2),lat]);}
 out.lines[k]={ecl:b,ra:q.ra,dec:q.dec,mc:+mc.toFixed(2),ic:+ic.toFixed(2),asc,dsc}}
// validation: MC at Sioux City
const lonSC=-96.4;const lst=n360(gmst+lonSC);const mcEcl=n360(Math.atan2(Math.sin(lst*R),Math.cos(lst*R)*Math.cos(eps))*D);
const hs=new Horoscope({origin:new Origin({year:1977,month:10,date:14,hour:18,minute:46,latitude:42.5,longitude:-96.4}),houseSystem:"placidus",zodiac:"tropical",aspectPoints:[],aspectWithPoints:[],aspectTypes:[],customOrbs:{},language:"en"});
console.log('MC mine',mcEcl.toFixed(2),'lib',hs.Midheaven.ChartPosition.Ecliptic.DecimalDegrees.toFixed(2));
for(const k of ['venus','jupiter','saturn']){console.log(k,'mine ecl',out.lines[k].ecl.lon.toFixed(2),'lib',hs.CelestialBodies[k].ChartPosition.Ecliptic.DecimalDegrees.toFixed(2))}
console.log('moon',out.lines.moon.ecl.lon.toFixed(2),hs.CelestialBodies.moon.ChartPosition.Ecliptic.DecimalDegrees.toFixed(2));
fs.writeFileSync('ac.json',JSON.stringify(out));
