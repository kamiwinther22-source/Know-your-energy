const {open}=require('./lib.js');
(async()=>{const {b,p}=await open('',{wait:2500,dsf:2});
await p.evaluate(async()=>{const {calculateFullChart}=await import('./numerology-calculator.js');
 const mk=(first,last,dob)=>({first,mid:'',last,dob,numerology:calculateFullChart({first,middle:'',last,dob,currentDate:new Date().toLocaleDateString('en-US')}),astro:null,astroError:'stub',hd:null,hdError:'stub'});
 const P=[mk('Alex','Morgan','08/14/1990'),mk('Sam','Rivera','03/02/1988')];
 render(P[0],P[1],null,'stub',false,false,'');
 const red=n=>n>9?(n===11?2:n===22?4:n===33?6:n):n;
 const BL='#1c2ca9';
 const face=(p,uid)=>{const nm=p.numerology;const yr=nm.personalYear,mo=nm.personalMonth,dy=nm.personalDay,es=nm.essenceCycle.value;
  const ang=n=>(red(n)-1)*40;
  const hand=(n,len,w,c,tail)=>`<g transform="rotate(${ang(n)})"><line x1="0" y1="${tail}" x2="0" y2="${-len}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/></g>`;
  let s=`<defs><linearGradient id="bz${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".28" stop-color="#aeb6c2"/><stop offset=".5" stop-color="#f4f6f9"/><stop offset=".72" stop-color="#8d96a3"/><stop offset="1" stop-color="#e9edf2"/></linearGradient><radialGradient id="fc${uid}" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ece6d2"/></radialGradient></defs>
  <circle r="84" fill="url(#bz${uid})"/><circle r="76" fill="#8a93a0"/><circle r="74" fill="url(#fc${uid})"/>`;
  for(let n=1;n<=9;n++){const a=(n-1)*40*Math.PI/180,x=Math.sin(a)*60,y=-Math.cos(a)*60;
   s+=`<text x="${x}" y="${y+6}" text-anchor="middle" font-size="19" fill="${BL}">${n}</text>`;
   const x1=Math.sin(a)*71,y1=-Math.cos(a)*71,x2=Math.sin(a)*67,y2=-Math.cos(a)*67;}
  // essence subdial
  s+=`<circle cx="0" cy="24" r="15" fill="none" stroke="#c9bf9c" stroke-width="1.2"/>`;
  for(let n=1;n<=9;n++){const a=(n-1)*40*Math.PI/180;s+=`<circle cx="${Math.sin(a)*12}" cy="${24-Math.cos(a)*12}" r="1.2" fill="#8a7f5a"/>`}
  s+=`<g transform="translate(0 24) rotate(${ang(es)})"><line x1="0" y1="3" x2="0" y2="-12" stroke="#b5532f" stroke-width="2.2" stroke-linecap="round"/></g><circle cx="0" cy="24" r="2.2" fill="#b5532f"/>`;
  // hands: year short thick, month medium, day long thin copper
  s+=hand(yr,34,6,BL,8)+hand(mo,50,3.6,'#3d4a8a',10)+hand(dy,66,1.8,'#b5532f',14)+`<circle r="5.5" fill="${BL}"/><circle r="2" fill="#fff"/>`;
  return `<svg width="170" height="170" viewBox="-86 -86 172 172" style="display:block;margin:0 auto;filter:drop-shadow(0 6px 8px rgba(30,40,110,.28))">${s}</svg>`};
 const card=(p,i)=>{const nm=p.numerology;return `<div class="wcard"><div class="wt">${p.first.toUpperCase()}</div>${face(p,i)}<div class="wl"><div><b style="color:${'#1c2ca9'}">${nm.personalYear}</b><span>year</span></div><div><b style="color:#3d4a8a">${nm.personalMonth}</b><span>month</span></div><div><b style="color:#b5532f">${nm.personalDay}</b><span>day</span></div></div></div>`};
 const st=document.createElement('style');st.textContent=`.wrow{display:flex;gap:8px;margin:10px 0 4px;box-sizing:border-box;width:100%;padding:0 2px}.wcard{flex:1;min-width:0;box-sizing:border-box;background:#f3edda;border:1px solid #1c2ca9;border-radius:10px;padding:10px 4px 12px}.wt{font-family:'Fraunces',Georgia,serif;font-weight:700;color:#1c2ca9;text-align:center;letter-spacing:.14em;font-size:13px;margin-bottom:6px}.wl{display:flex;justify-content:space-around;margin-top:8px;font-family:Georgia,serif}.wl div{text-align:center}.wl b{display:block;font-size:22px;line-height:1}.wl span{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#56607a}.wh{font-family:Georgia,serif;text-align:center;color:#1c2ca9;font-size:15px;margin:14px 0 0;letter-spacing:.04em}.wn{font-family:Georgia,serif;font-size:12px;color:#56607a;text-align:center;margin:6px 8px 0}`;
 document.head.appendChild(st);
 const sec=document.createElement('div');sec.innerHTML=`<div class="wh">RIGHT NOW</div><div class="wrow">${card(P[0],0)}${card(P[1],1)}</div><div class="wn">Hands pointing the same way means the same number.</div>`;
 const mg=document.querySelector('.main-grid');mg.parentElement.insertBefore(sec,mg);
});
await p.waitForTimeout(800);await p.screenshot({path:'watch.png',fullPage:true,clip:{x:0,y:0,width:390,height:520}});await b.close()})();
