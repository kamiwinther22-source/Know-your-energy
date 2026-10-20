import fs from "fs";
import {geoEquirectangular,geoPath} from "d3-geo";
import {feature} from "topojson-client";
const topo=JSON.parse(fs.readFileSync("node_modules/world-atlas/land-110m.json"));
const land=feature(topo,topo.objects.land);
const ac=JSON.parse(fs.readFileSync("ac.json"));
const NAMES={sun:'Sun',moon:'Moon',mercury:'Mercury',venus:'Venus',mars:'Mars',jupiter:'Jupiter',saturn:'Saturn',uranus:'Uranus',neptune:'Neptune',pluto:'Pluto'};
const COL={sun:'#e8702a',moon:'#7a8aa8',mercury:'#5a8f6a',venus:'#d4488a',mars:'#c9483d',jupiter:'#5a4fc4',saturn:'#4b4f63',uranus:'#17958c',neptune:'#2f78c4',pluto:'#7a4a2a'};
function mapSvg({W,H,lon0,lon1,lat0,lat1,planets,thin,labelPlanets,cities}){
 const sc=W/((lon1-lon0)*Math.PI/180);const proj=geoEquirectangular().scale(sc).translate([W/2,H/2]).center([(lon0+lon1)/2,(lat0+lat1)/2]);
 const path=geoPath(proj);
 let s=`<defs><clipPath id="c"><rect width="${W}" height="${H}" rx="6"/></clipPath></defs><g clip-path="url(#c)"><rect width="${W}" height="${H}" fill="#eef1f8"/><path d="${path(land)}" fill="#fff" stroke="#c9cfe0" stroke-width=".6"/>`;
 // graticule
 for(let lo=Math.ceil(lon0/30)*30;lo<=lon1;lo+=30){const [x]=proj([lo,0]);s+=`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#dfe3ef" stroke-width=".6"/>`}
 for(let la=Math.ceil(lat0/30)*30;la<=lat1;la+=30){const [,y]=proj([0,la]);s+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#dfe3ef" stroke-width=".6"/>`}
 for(const k of planets){const L=ac.lines[k],c=COL[k],w=thin?1.1:2;
  const emph=labelPlanets.includes(k);const sw=emph?w*1.5:w;
  const vline=(lon,dash)=>{const [x]=proj([lon,0]);if(x<-5||x>W+5)return '';return `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${c}" stroke-width="${sw}" ${dash?'stroke-dasharray="5 4"':''} opacity="${emph?1:.55}"/>`};
  s+=vline(L.mc,false)+vline(L.ic,true);
  for(const [arr,dash] of [[L.asc,false],[L.dsc,true]]){let d='',prev=null;for(const [lo,la] of arr){const p=proj([lo,la]);if(prev&&Math.abs(lo-prev[0])>180){d+=` M${p[0].toFixed(1)},${p[1].toFixed(1)}`}else d+=(d?' L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1);prev=[lo,la]}
   s+=`<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" ${dash?'stroke-dasharray="5 4"':''} opacity="${emph?1:.55}"/>`}
 }
 for(const c of cities||[]){const [x,y]=proj([c.lon,c.lat]);s+=`<circle cx="${x}" cy="${y}" r="${c.big?4.5:3}" fill="${c.big?'#17182b':'#fff'}" stroke="#17182b" stroke-width="1.5"/><text x="${x+(c.dx??7)}" y="${y+(c.dy??4)}" font-size="${c.big?12:10.5}" font-weight="600" fill="#17182b" stroke="#fff" stroke-width="3" paint-order="stroke">${c.name}</text>`}
 s+='</g>';return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`}
// distances to lines
const R=3958.8,toR=x=>x*Math.PI/180;
const hav=(a,b)=>{const dl=toR(b[0]-a[0]),p1=toR(a[1]),p2=toR(b[1]);const h=Math.sin((p2-p1)/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
function distToLine(L,type,pt){if(type==='mc'||type==='ic'){const lon=L[type];let dl=Math.abs(pt[0]-lon);if(dl>180)dl=360-dl;return dl*Math.cos(toR(pt[1]))*69.17}
 const arr=type==='asc'?L.asc:L.dsc;let best=1e9;for(const [lo,la] of arr){const d=hav(pt,[lo,la]);if(d<best)best=d}return best}
const CITIES=[["Sioux City",-96.4,42.5],["Cedar Rapids",-91.67,41.98],["Chicago",-87.63,41.88],["New York",-74.01,40.71],["Los Angeles",-118.24,34.05],["Denver",-104.99,39.74],["Seattle",-122.33,47.61],["Miami",-80.19,25.76],["Austin",-97.74,30.27],["Atlanta",-84.39,33.75],["Boston",-71.06,42.36],["Phoenix",-112.07,33.45],["San Francisco",-122.42,37.77],["Minneapolis",-93.27,44.98],["Nashville",-86.78,36.16],["Honolulu",-157.86,21.31],["London",-0.13,51.51],["Paris",2.35,48.85],["Sydney",151.21,-33.87],["Tokyo",139.69,35.68]];
const TYPE={mc:'overhead (MC)',ic:'underfoot (IC)',asc:'rising (ASC)',dsc:'setting (DSC)'};
const rows={};
for(const k of ['venus','jupiter','sun','moon','saturn','mars']){rows[k]=[];for(const [n,lo,la] of CITIES){for(const t of ['mc','ic','asc','dsc']){const d=distToLine(ac.lines[k],t,[lo,la]);rows[k].push({city:n,type:t,d})}}}
const near=(k,lim)=>rows[k].filter(r=>r.d<=lim).sort((a,b)=>a.d-b.d);
console.log('VENUS',near('venus',400).map(r=>`${r.city} ${r.type} ${Math.round(r.d)}`).join(' | '));
console.log('JUPITER',near('jupiter',400).map(r=>`${r.city} ${r.type} ${Math.round(r.d)}`).join(' | '));
console.log('lines',Object.fromEntries(Object.entries(ac.lines).map(([k,v])=>[k,[v.mc,v.ic]])));
const world=mapSvg({W:362,H:140,lon0:-180,lon1:180,lat0:-58,lat1:80,planets:Object.keys(COL),thin:true,labelPlanets:['venus','jupiter'],cities:[{name:'Sioux City',lon:-96.4,lat:42.5,big:true,dx:-4,dy:-9}]});
const us=mapSvg({W:362,H:210,lon0:-128,lon1:-66,lat0:23,lat1:52,planets:['venus','jupiter'],thin:false,labelPlanets:['venus','jupiter'],cities:[{name:'Sioux City',lon:-96.4,lat:42.5,big:true,dx:-4,dy:-9},{name:'Cedar Rapids',lon:-91.67,lat:41.98,dx:6,dy:12},{name:'Los Angeles',lon:-118.24,lat:34.05,dx:6,dy:4},{name:'Chicago',lon:-87.63,lat:41.88,dx:5,dy:-6},{name:'New York',lon:-74.01,lat:40.71,dx:-60,dy:-6},{name:'Miami',lon:-80.19,lat:25.76,dx:-48,dy:-6},{name:'Denver',lon:-104.99,lat:39.74,dx:-6,dy:14}]});
fs.writeFileSync('ac_maps.json',JSON.stringify({world,us,rows:{venus:near('venus',500).slice(0,8),jupiter:near('jupiter',500).slice(0,8)}}));
const all=[];for(const k of Object.keys(COL)){for(const [n,lo,la] of CITIES){for(const t of ['mc','ic','asc','dsc']){const d=distToLine(ac.lines[k],t,[lo,la]);if(d<=300)all.push({k,n,t,d:Math.round(d)})}}}
all.sort((a,b)=>a.d-b.d);console.log(all.map(r=>`${r.n}: ${NAMES[r.k]} ${r.t} ${r.d}mi`).join('\n'));
fs.writeFileSync('ac_near.json',JSON.stringify(all));
const usAll=mapSvg({W:362,H:176,lon0:-128,lon1:-66,lat0:23,lat1:52,planets:Object.keys(COL),thin:true,labelPlanets:['saturn','sun','jupiter'],cities:[{name:'Sioux City',lon:-96.4,lat:42.5,big:true,dx:7,dy:-8},{name:'Minneapolis',lon:-93.27,lat:44.98,dx:7,dy:-3},{name:'Cedar Rapids',lon:-91.67,lat:41.98,dx:7,dy:14},{name:'Los Angeles',lon:-118.24,lat:34.05,dx:7,dy:12},{name:'Chicago',lon:-87.63,lat:41.88,dx:7,dy:4}]});
const worldAll=mapSvg({W:362,H:140,lon0:-180,lon1:180,lat0:-58,lat1:80,planets:Object.keys(COL),thin:true,labelPlanets:['venus','jupiter','saturn','sun'],cities:[{name:'Sioux City',lon:-96.4,lat:42.5,big:true,dx:-4,dy:-9}]});
const items=[
 ['Sydney','Venus','overhead','141 miles','venus','Love, charm and money are noticed here. People are drawn to you.'],
 ['Los Angeles','Sun','setting','6 miles','sun','Your identity is brought into relationships. Partnerships shape who you become here.'],
 ['Minneapolis','Saturn','underfoot','12 miles','saturn','Home and roots feel heavy and serious. A place for building, not for ease.'],
 ['Cedar Rapids','Saturn','underfoot','69 miles','saturn','The same line, a little to the east. Duty and family responsibility sit close.'],
 ['Chicago','Jupiter','rising','239 miles','jupiter','Optimism and opportunity come to meet you. Easier to be seen and to say yes.'],
 ['Tokyo','Jupiter','setting','82 miles','jupiter','Luck comes through other people: partners, clients, close friends.']];
const swatch=Object.keys(COL).map(k=>`<span><i style="background:${COL[k]}"></i>${NAMES[k]}</span>`).join('');
const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=390"><style>
@font-face{font-family:'Fr';font-weight:400;src:url(../fonts/node_modules/@fontsource/fraunces/files/fraunces-latin-400-normal.woff2)}
@font-face{font-family:'Fr';font-weight:400;font-style:italic;src:url(../fonts/node_modules/@fontsource/fraunces/files/fraunces-latin-400-italic.woff2)}
@font-face{font-family:'Fr';font-weight:600;src:url(../fonts/node_modules/@fontsource/fraunces/files/fraunces-latin-600-normal.woff2)}
*{box-sizing:border-box;margin:0;padding:0}html{width:390px;background:#fff}
body{width:390px;padding:28px 14px 30px;background:#fff;color:#17182b;font-family:'Fr',Georgia,serif;overflow-x:clip}
.brand{text-align:center;font-size:11px;letter-spacing:.34em;color:#6b6d84;font-weight:600}
h1{text-align:center;font-weight:400;font-style:italic;font-size:29px;margin-top:10px;line-height:1.15}
.rule{width:44px;height:2px;background:#8c1034;margin:12px auto 0}
.sub{text-align:center;font-size:14px;color:#6b6d84;font-style:italic;margin-top:7px}
.cap{text-align:center;font-size:11px;letter-spacing:.28em;color:#6b6d84;font-weight:600;margin-top:30px}
svg{display:block;margin:10px auto 0}
.leg{display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:center;margin-top:12px;font-size:12.5px}
.leg i{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.how{text-align:center;font-size:13px;color:#6b6d84;margin-top:8px;line-height:1.4}
.it{margin-top:22px}.it h3{font-size:19px;font-weight:600;line-height:1.2}.it h3 small{display:block;font-size:12px;letter-spacing:.16em;color:#8c1034;margin-top:4px;font-weight:600}
.it p{font-size:16px;line-height:1.5;margin-top:7px;color:#2a2b42}
.dot{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:8px;vertical-align:0}
.note{margin-top:26px;text-align:center;font-size:12px;color:#6b6d84;font-style:italic}
</style></head><body>
<div class="brand">KNOW YOUR ENERGY</div><h1>Where in the world your planets pull</h1><div class="rule"></div>
<div class="sub">Born November 14, 1977, 6:46 pm, Sioux City, Iowa</div>
<div class="cap">THE WHOLE WORLD</div>${worldAll}
<div class="leg">${swatch}</div>
<div class="how">Solid line: the planet is rising or overhead. Dashed: setting or underfoot. Venus and Jupiter are drawn thicker.</div>
<div class="cap">YOUR PART OF THE WORLD</div>${usAll}
<div class="how">Only curved lines cross the United States. Straight lines run north to south.</div>
<div class="cap">NEAR PLACES YOU MIGHT KNOW</div>
${items.map(i=>`<div class="it"><h3><span class="dot" style="background:${COL[i[4]]}"></span>${i[0]}<small>${i[1].toUpperCase()} ${i[2].toUpperCase()} · ${i[3].toUpperCase()}</small></h3><p>${i[5]}</p></div>`).join('')}
<div class="note">Sample wording and sample art. Lines are drawn from the exact moment of birth, and a place within a few hundred miles of a line is said to feel it.</div>
</body></html>`;
fs.writeFileSync('ac_page.html',html);
const PL={sun:'who you are and how you shine',moon:'feelings, home and what makes you feel safe',mercury:'thinking, talking, learning and trade',venus:'love, beauty, pleasure and money',mars:'energy, drive and conflict',jupiter:'growth, luck and plenty',saturn:'hard work, limits and responsibility',uranus:'change, freedom and surprises',neptune:'dreams, imagination and confusion',pluto:'power, intensity and rebirth'};
const diagram=`<svg width="362" height="214" viewBox="0 0 362 214">
<rect width="362" height="214" rx="10" fill="#eef1f8"/>
<line x1="20" y1="98" x2="342" y2="98" stroke="#8a90a8" stroke-width="2"/>
<text x="181" y="116" text-anchor="middle" font-size="10.5" letter-spacing="2" fill="#6b6d84">THE GROUND, WHERE YOU STAND</text>
<path d="M 34 98 A 147 100 0 0 1 328 98" fill="none" stroke="#c4c9dc" stroke-width="1.5" stroke-dasharray="3 5"/>
<circle cx="34" cy="98" r="11" fill="#5a4fc4"/><circle cx="181" cy="9" r="11" fill="#5a4fc4"/><circle cx="328" cy="98" r="11" fill="#5a4fc4" opacity=".75"/><circle cx="181" cy="201" r="11" fill="#5a4fc4" opacity=".75"/>
<text x="44" y="136" font-size="14" font-weight="600" fill="#17182b">Rising</text><text x="44" y="152" font-size="11.5" fill="#6b6d84">how you come across</text>
<text x="181" y="44" text-anchor="middle" font-size="14" font-weight="600" fill="#17182b">Overhead</text><text x="181" y="60" text-anchor="middle" font-size="11.5" fill="#6b6d84">work and reputation</text>
<text x="318" y="136" text-anchor="end" font-size="14" font-weight="600" fill="#17182b">Setting</text><text x="318" y="152" text-anchor="end" font-size="11.5" fill="#6b6d84">partners and others</text>
<text x="181" y="166" text-anchor="middle" font-size="14" font-weight="600" fill="#17182b">Underfoot</text><text x="181" y="182" text-anchor="middle" font-size="11.5" fill="#6b6d84">home and family</text>
</svg>`;
const cards=[
 {n:'Minneapolis',pl:'saturn',ang:'Underfoot',d:'12 miles',why:'Your Saturn line runs almost straight through this city.',what:'Saturn stands for hard work, rules and responsibility. Underfoot means home and family: the ground you stand on. Astrologers say this combination makes home life serious here.',feel:'Home and family can feel like a duty. It is a good place to build something that lasts, such as a house, a business base, or a family routine. It can also feel cold, lonely or heavy.',good:'Building a solid foundation, committing, getting organised.',watch:'Feeling stuck, isolated, or that everything depends on you.'},
 {n:'Cedar Rapids',pl:'saturn',ang:'Underfoot',d:'69 miles',why:'The same Saturn line, about 70 miles from this city.',what:'You are close enough to the same line to feel a milder version: responsibilities around home and family matter more than usual.',feel:'Quieter than Minneapolis. Steady and dutiful rather than heavy.',good:'Stability, a dependable home base.',watch:'Taking on too much for family and not enough for yourself.'},
 {n:'Los Angeles',pl:'sun',ang:'Setting',d:'6 miles',why:'Your Sun line runs through this city. This is the closest line on the whole list.',what:'The Sun stands for who you are and how you shine. Setting means other people: partners, clients, close friends. Together it says that relationships shape your identity here.',feel:'You meet strong people and learn who you are through them. You can also give your own power away by living through a partner.',good:'Partnerships, working with others, being seen through who you are with.',watch:'Losing yourself in a relationship or in what others want.'},
 {n:'Chicago',pl:'jupiter',ang:'Rising',d:'239 miles',why:'Your Jupiter line passes within about 240 miles. That is on the far edge, so the effect is mild.',what:'Jupiter stands for growth, luck and plenty. Rising means how you come across: your body, your energy, first impressions. Astrologers say it makes you look and feel confident and fortunate.',feel:'More optimism and more doors opening. You may feel bigger than usual, in a good way.',good:'New starts, being noticed, saying yes to opportunity.',watch:'Overdoing it: spending, eating, promising too much.'},
 {n:'Sydney',pl:'venus',ang:'Overhead',d:'141 miles',why:'Your Venus line is the one that runs near here.',what:'Venus stands for love, beauty, pleasure and money. Overhead means work and reputation: how the world sees you. Together, astrologers say people like you and your work is received warmly.',feel:'Charm and goodwill come easily. Money and creative work can flow.',good:'Careers in the arts, beauty, hospitality, or anything that depends on being liked.',watch:'Putting comfort ahead of effort.'}];
const html2=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=390"><style>
@font-face{font-family:'Fr';font-weight:400;src:url(../fonts/node_modules/@fontsource/fraunces/files/fraunces-latin-400-normal.woff2)}
@font-face{font-family:'Fr';font-weight:400;font-style:italic;src:url(../fonts/node_modules/@fontsource/fraunces/files/fraunces-latin-400-italic.woff2)}
@font-face{font-family:'Fr';font-weight:600;src:url(../fonts/node_modules/@fontsource/fraunces/files/fraunces-latin-600-normal.woff2)}
*{box-sizing:border-box;margin:0;padding:0}html{width:390px;background:#fff}
body{width:390px;padding:28px 16px 30px;background:#fff;color:#17182b;font-family:'Fr',Georgia,serif;overflow-x:clip}
.brand{text-align:center;font-size:11px;letter-spacing:.34em;color:#6b6d84;font-weight:600}
h1{text-align:center;font-weight:400;font-style:italic;font-size:29px;margin-top:10px;line-height:1.15}
.rule{width:44px;height:2px;background:#8c1034;margin:12px auto 0}
.sub{text-align:center;font-size:14px;color:#6b6d84;font-style:italic;margin-top:7px}
.cap{text-align:center;font-size:11px;letter-spacing:.28em;color:#6b6d84;font-weight:600;margin-top:36px}
h2{font-size:21px;font-weight:600;line-height:1.2;text-align:center;margin-top:8px}
p.b{font-size:16.5px;line-height:1.55;color:#2a2b42;margin-top:10px}
svg{display:block;margin:12px auto 0}
.pl{display:flex;align-items:flex-start;gap:10px;margin-top:9px;font-size:15.5px;line-height:1.3}.pl i{flex:0 0 14px;height:14px;border-radius:50%;margin-top:3px}.pl b{font-weight:600}
.leg{display:flex;flex-wrap:wrap;gap:6px 14px;justify-content:center;margin-top:12px;font-size:12.5px}.leg i{display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.how{text-align:center;font-size:13px;color:#6b6d84;margin-top:8px;line-height:1.4}
.card{margin-top:30px;padding-top:22px;border-top:1px solid #e3e5ef}
.card h3{font-size:23px;font-weight:600;line-height:1.15}.card .tag{font-size:12px;letter-spacing:.14em;color:#8c1034;font-weight:600;margin-top:5px}
.card h4{font-size:11.5px;letter-spacing:.2em;color:#6b6d84;margin-top:14px;font-weight:600}
.card p{font-size:16px;line-height:1.5;margin-top:4px;color:#2a2b42}
.note{margin-top:30px;text-align:center;font-size:12px;color:#6b6d84;font-style:italic;line-height:1.4}
</style></head><body>
<div class="brand">KNOW YOUR ENERGY</div><h1>Where in the world your planets pull</h1><div class="rule"></div>
<div class="sub">Born November 14, 1977, 6:46 pm, Sioux City, Iowa</div>
<div class="cap">WHAT THIS IS</div>
<h2>A map of where each planet was pointing at you when you were born.</h2>
<p class="b">At the moment you were born, every planet was in a particular place in the sky. Because the Earth turns, a planet is overhead for some places on Earth, just coming up for others, and going down for others. Draw those places on a map and you get lines. Astrologers say that being near a line brings out what that planet is about, in your life.</p>
<p class="b">You don't have to move anywhere. People use it to decide where to live, where to travel, or why a place felt good or hard.</p>
<div class="cap">THE FOUR KINDS OF LINE</div>
<h2>Each planet has four lines.</h2>${diagram}
<p class="b">Think of standing on the ground and looking at the sky. A planet can be coming up on one side, high above you, going down on the other side, or on the far side of the Earth beneath your feet. Each one colours a different part of life.</p>
<div class="cap">THE PLANETS, IN PLAIN WORDS</div>
${Object.keys(COL).map(k=>`<div class="pl"><i style="background:${COL[k]}"></i><span><b>${NAMES[k]}</b>: ${PL[k]}.</span></div>`).join('')}
<div class="cap">YOUR MAP</div>
<h2>Every line, for the whole world.</h2>${worldAll}
<div class="leg">${swatch}</div>
<div class="how">Solid line: rising or overhead. Dashed line: setting or underfoot. Venus, Jupiter, Saturn and the Sun are drawn thicker. The black dot is Sioux City.</div>
<div class="cap">YOUR PART OF THE WORLD</div>
<h2>The lines that pass through the United States.</h2>${usAll}
<div class="how">A place within about 100 miles of a line feels it most. Out to about 300 miles it is milder.</div>
<div class="cap">PLACES NEAR YOUR LINES</div>
${cards.map(c=>`<div class="card"><h3><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${COL[c.pl]};margin-right:9px"></span>${c.n}</h3><div class="tag">${NAMES[c.pl].toUpperCase()} · ${c.ang.toUpperCase()} · ${c.d.toUpperCase()}</div>
<h4>WHY IT IS ON THIS LIST</h4><p>${c.why}</p><h4>WHAT IT MEANS</h4><p>${c.what}</p><h4>HOW IT MIGHT FEEL</h4><p>${c.feel}</p><h4>GOOD FOR</h4><p>${c.good}</p><h4>WATCH FOR</h4><p>${c.watch}</p></div>`).join('')}
<div class="note">Sample wording, written plainly so someone new to this can follow it. It is not checked against a reference book yet. This is astrology, so none of it is tested science.</div>
</body></html>`;
fs.writeFileSync('ac_page2.html',html2);
