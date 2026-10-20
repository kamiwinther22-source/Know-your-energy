import pkg from "./node_modules/circular-natal-horoscope-js/dist/index.js";
const {Origin,Horoscope}=pkg;
const mk=(y,m,d,h,mi)=>new Horoscope({origin:new Origin({year:y,month:m,date:d,hour:h,minute:mi,latitude:42.5,longitude:-96.4}),houseSystem:"placidus",zodiac:"tropical",aspectPoints:[],aspectWithPoints:[],aspectTypes:[],customOrbs:{},language:"en"});
const K=["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto"];
const nh=mk(1977,10,14,18,46);const nat={};K.forEach(k=>nat[k]=nh.CelestialBodies[k].ChartPosition.Ecliptic.DecimalDegrees);nat.asc=nh.Ascendant.ChartPosition.Ecliptic.DecimalDegrees;
const th=mk(2026,9,19,12,0);const tr={};K.forEach(k=>tr[k]=th.CelestialBodies[k].ChartPosition.Ecliptic.DecimalDegrees);
const SIGN=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const sg=l=>SIGN[Math.floor(l/30)]+' '+(l%30).toFixed(1);
const diff=(a,b)=>{let d=Math.abs(a-b)%360;return d>180?360-d:d};
const lim={moon:3,sun:2,mercury:2,venus:2,mars:2,jupiter:2.5,saturn:2.5,uranus:2.5,neptune:2.5,pluto:2.5};
for(const t of K)for(const n of [...K.slice(0,5),'asc'])for(const [a,nm] of [[0,'conj'],[60,'sextile'],[90,'square'],[120,'trine'],[180,'opp']]){const o=Math.abs(diff(tr[t],nat[n])-a);if(o<=lim[t])console.log(t,nm,'natal',n,o.toFixed(2))}
console.log('Moon today',sg(tr.moon),'Sun',sg(tr.sun));
console.log('houses of transit: ',['moon','jupiter','saturn','uranus','neptune','pluto'].map(k=>{const c=nh.Houses.map(h=>h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees);for(let i=0;i<12;i++){const a=c[i],b=c[(i+1)%12];const x=((tr[k]-a)%360+360)%360,w=((b-a)%360+360)%360;if(x<w)return k+' H'+(i+1)}}).join(', '));
console.log('moon phase elong',((tr.moon-tr.sun+360)%360).toFixed(0));
