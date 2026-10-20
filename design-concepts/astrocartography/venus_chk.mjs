import fs from "fs";
const ac=JSON.parse(fs.readFileSync("ac.json"));
const R=3958.8,r=x=>x*Math.PI/180;
const hav=(a,b)=>{const dl=r(b[0]-a[0]),p1=r(a[1]),p2=r(b[1]);const h=Math.sin((p2-p1)/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
const V=ac.lines.venus;
for(const [n,lon,lat] of [["Cedar Rapids",-91.67,41.98],["Sioux City",-96.4,42.5]]){
 const mc=Math.abs(lon-V.mc)*Math.cos(r(lat))*69.17,ic=Math.abs(lon-V.ic)*Math.cos(r(lat))*69.17;
 let a=1e9,d=1e9,aL,dL;for(const [lo,la] of V.asc){const x=hav([lon,lat],[lo,la]);if(x<a){a=x;aL=[lo,la]}}for(const [lo,la] of V.dsc){const x=hav([lon,lat],[lo,la]);if(x<d){d=x;dL=[lo,la]}}
 // longitude of curves at this latitude
 const at=(arr)=>{let best=null;for(const [lo,la] of arr){if(Math.abs(la-lat)<0.6){best=lo}}return best};
 console.log(n,'MC',Math.round(mc),'IC',Math.round(ic),'ASC',Math.round(a),'DSC',Math.round(d),'| at this latitude: ASC lon',at(V.asc),'DSC lon',at(V.dsc));
}
console.log('Venus RA/dec',V.ra.toFixed(1),V.dec.toFixed(1),'gmst',ac.gmst.toFixed(1));
// hours of birth-time error needed to bring a Venus line to Cedar Rapids: lon shift 15 deg/hour
const lonCR=-91.67;const cands=[['MC',V.mc],['IC',V.ic]];for(const [n,l] of cands){let dl=lonCR-l;if(dl>180)dl-=360;if(dl<-180)dl+=360;console.log(n,'needs',(dl/15).toFixed(1),'hours of time shift')}
for(const [n,arr] of [['ASC',V.asc],['DSC',V.dsc]]){let best=null;for(const [lo,la] of arr){if(Math.abs(la-41.98)<0.6)best=lo}if(best!==null){let dl=lonCR-best;if(dl>180)dl-=360;if(dl<-180)dl+=360;console.log(n,'needs',(dl/15).toFixed(1),'hours of time shift')}}
