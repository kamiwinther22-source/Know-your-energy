/* ?skin=obsidian — the comet of light that runs the frame of the email field.
   Drawn as strokes on the frame's own outline, so it moves at one steady speed along every side; a white head, a long pink tail that fades, and a bloom that travels with it. */
(()=>{const f=document.querySelector('.hero-email-field');if(!f||f.querySelector('.kye-comet'))return;
  const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('class','kye-comet');svg.setAttribute('aria-hidden','true');f.appendChild(svg);
  const P=1000,draw=()=>{const w=f.clientWidth,h=f.clientHeight;if(!w)return;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const r=`x=".75" y=".75" width="${w-1.5}" height="${h-1.5}" rx="6" fill="none" pathLength="${P}"`;
    // tail: stacked strokes, each shorter and brighter, all ending at the same head
    const tail=[[300,'#f5b6c7',1.7],[235,'#f8c6d3',1.9],[175,'#fbd7e0',2.1],[120,'#fde6ec',2.4],[70,'#fff3f6',2.7],[32,'#fff',3]];
    const dash=(L,c,sw,o)=>`<rect ${r} class="c" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${L} ${P-L}" stroke-dashoffset="${L+o}" style="--end:${L+o-P}"/>`;
    const comet=o=>`<g filter="url(#kyeBloom)">`+dash(240,'#ff4f8c',8,o)+dash(90,'#ffd0dd',7,o)+`</g>`+tail.map(([L,c,sw])=>dash(L,c,sw,o)).join('');
    svg.innerHTML=`<defs><filter id="kyeBloom" x="-20%" y="-150%" width="140%" height="400%" filterUnits="objectBoundingBox"><feGaussianBlur stdDeviation="5"/></filter></defs>`+
      `<rect ${r} stroke="#f1a9bd" stroke-width="1.5"/>`+comet(0)+comet(500);};
  draw();new ResizeObserver(draw).observe(f);})();

/* pressing: a glint as the stone springs back, and a short tick on phones that can vibrate */
document.addEventListener('pointerup',e=>{const b=e.target.closest&&e.target.closest('.rbtn,.gen-btn,.rel-chip,.toggle-pill');if(!b)return;
  if(navigator.vibrate)navigator.vibrate(12);b.classList.remove('kye-hit');void b.offsetWidth;b.classList.add('kye-hit');},{passive:true});

/* the energy ribbon between two people: fine strands of the page's own metals, woven round one rising line.
   It starts low in the space to the left of Person 2, crosses the gap between the two, and climbs the space to the right of Person 1. */
(()=>{const col=document.querySelector('.form-col'),p1=document.getElementById('p1Block'),p2=document.getElementById('p2Section');if(!col||!p1||!p2)return;
  const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('class','kye-ribbon');svg.setAttribute('aria-hidden','true');col.appendChild(svg);
  const draw=()=>{const c=col.getBoundingClientRect(),a=p1.getBoundingClientRect(),b=p2.getBoundingClientRect();
    if(!p2.classList.contains('open')||b.height<200){svg.innerHTML='';return;}
    svg.setAttribute('viewBox',`0 0 ${c.width} ${c.height}`);
    const L=a.left-c.left,R=b.right-c.left,sl=(b.left-c.left)-L,sr=R-(a.right-c.left);            // the two free spaces
    const gt=a.bottom-c.top,gb=b.top-c.top,gm=(gt+gb)/2,xl=L+sl*.5,xr=R-sr*.5,t1=a.top-c.top,b2=b.bottom-c.top;
    const bl=b.left-c.left,ar=a.right-c.left,W=[[L+5,gb+178],[L+20,gb+108],[bl-20,gb+36],[bl+6,gm+7],[(L+R)/2,gm],[ar-6,gm-7],[ar+20,gt-36],[R-20,gt-108],[R-5,gt-178]];
    const cr=(p0,p1,p2,p3,t)=>{const t2=t*t,t3=t2*t;return [0,1].map(k=>.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3));};
    const raw=[];for(let i=0;i<W.length-1;i++)for(let k=0;k<24;k++)raw.push(cr(W[Math.max(0,i-1)],W[i],W[i+1],W[Math.min(W.length-1,i+2)],k/24));raw.push(W[W.length-1]);
    const cum=[0];for(let i=1;i<raw.length;i++)cum.push(cum[i-1]+Math.hypot(raw[i][0]-raw[i-1][0],raw[i][1]-raw[i-1][1]));
    const N=260,tot=cum[cum.length-1],pts=[];for(let i=0,k=1;i<=N;i++){const d=tot*i/N;while(k<cum.length-1&&cum[k]<d)k++;const f=(d-cum[k-1])/((cum[k]-cum[k-1])||1);pts.push([raw[k-1][0]+(raw[k][0]-raw[k-1][0])*f,raw[k-1][1]+(raw[k][1]-raw[k-1][1])*f]);}
    const nor=pts.map((p,i)=>{const q=pts[Math.min(N,i+1)],r=pts[Math.max(0,i-1)],x=q[0]-r[0],y=q[1]-r[1],m=Math.hypot(x,y)||1;return [-y/m,x/m];});
    const strand=(amp,cyc,ph,col,w)=>{let d='';for(let i=0;i<=N;i++){const t=i/N,o=amp*Math.pow(Math.sin(Math.PI*t),.75)*Math.sin(2*Math.PI*cyc*t+ph);d+=(i?'L':'M')+(pts[i][0]+nor[i][0]*o).toFixed(1)+' '+(pts[i][1]+nor[i][1]*o).toFixed(1);}
      return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;};
    let h=strand(9,3.5,4,'#8a2f52',1)+strand(8,5,1,'#b8476c',1)+strand(6,7,0,'#f1a9bd',1.2)+strand(6,7,Math.PI,'#fff',1.2)+strand(3.5,10,2.2,'#f9c9d6',.9);
    for(const u of [.2,.5,.8]){const p=pts[Math.round(N*u)],r=5,w=.9;h+=`<path d="M${p[0]} ${p[1]-r}L${p[0]+w} ${p[1]-w}L${p[0]+r} ${p[1]}L${p[0]+w} ${p[1]+w}L${p[0]} ${p[1]+r}L${p[0]-w} ${p[1]+w}L${p[0]-r} ${p[1]}L${p[0]-w} ${p[1]-w}Z" fill="#fff"/>`;}
    svg.innerHTML=h;};
  draw();const ro=new ResizeObserver(draw);ro.observe(col);ro.observe(p2);ro.observe(p1);})();
