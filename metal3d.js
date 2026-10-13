/* ?look=metal — the page as real metal. One 3D scene behind the page: a metal plate and polished metal ovals, lit by the sun's position
   and reflecting the same photographed room as the solar system. The DOM stays the interface; this only draws what is under it.
   Several real metals, used by role (a bright silver plate, warm titanium for secondary objects, an accent metal for the main actions).
   The surface answers to scroll and pointer (the plate tilts a few degrees under a fixed light, so the reflections move), buttons press in,
   and the sun drifts very slowly. Motion respects prefers-reduced-motion. URL options: cta=, chip=, price=, plate=, drift=0, full=1 (page-size canvas, for screenshots). */
import * as THREE from 'three';
const root=document.documentElement,Q=new URLSearchParams(location.search);
if(Q.get('look')==='final')for(const [k,v] of Object.entries({solar:'1',shape:'push',inlay:'light',shadows:'0',shade:'0',drift:'0',cam:'1500',mr:'.2',env:'3.0',exp:'2.0',bx:'0',by:'0',bw:'0',final:'1'}))if(!Q.has(k))Q.set(k,v);
const num=(k,d)=>{const v=parseFloat(Q.get(k));return isNaN(v)?d:v;};
const TILT=12*Math.PI/180,FULL=Q.get('full')==='1'||Q.get('final')==='1',REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
await new Promise(r=>{let n=0;const t=()=>(window.__eq||++n>1200)?r():requestAnimationFrame(t);t();});
if(!window.__eq)throw new Error('no environment');

/* measured metals: the base colour of a metal is the colour of its reflection (F0) */
const METALS={   // lower roughness = more mirror-like. Silver and black are polished; copper and titanium are satin, as real hardware copper is: muted, warm and soft-lit
  aluminum:{c:0xeeeeed,r:.34},silver:{c:0xfcfaf5,r:.10},titanium:{c:0xc9c2b9,r:.30},
  copper:{c:0xb4806a,r:.42},bronze:{c:0xb68a5e,r:.14},gunmetal:{c:0x5b5f68,r:.13},black:{c:0x17171b,r:.09}};
if(Q.get('cu'))METALS.copper.c=parseInt(Q.get('cu'),16);if(Q.get('cur'))METALS.copper.r=parseFloat(Q.get('cur'));   // copper colour and roughness can be tried from the address bar
METALS.chrome={c:0xfff7ec,r:0};METALS.planet={c:0xcfccc6,r:0};METALS.mirror={c:0xffffff,r:num('mr',.12)};   // chrome = exactly the solar system's sun material; planet = its planets; mirror = a polished sheet
const ROLE={plate:Q.get('plate')||'aluminum',cta:Q.get('cta')||'copper',chip:Q.get('chip')||'titanium',price:Q.get('price')||'titanium',dark:'black'};
const DARKTEXT={gunmetal:1,black:1};
const INLAY=Q.get('inlay');   // 'dark' = black polished centre, 'light' = satin silver centre
const inlayDark=new THREE.MeshStandardMaterial({color:0x050507,metalness:0,roughness:.18,envMapIntensity:.45}),inlayLight=new THREE.MeshStandardMaterial({color:0xf0f0f0,metalness:1,roughness:.5,envMapIntensity:1.1});
root.classList.toggle('inlay-dark',INLAY==='dark');
const mats={};const mat=n=>mats[n]||(mats[n]=((x)=>{if(n==='chrome'||n==='planet'){x.envMap=cubeRT.texture;}return x;})(new THREE.MeshStandardMaterial({color:METALS[n].c,metalness:1,roughness:METALS[n].r,envMapIntensity:n==='mirror'?num('env',1.8):n==='chrome'?1.6:n==='aluminum'?num('env',1.0):n==='copper'?num('cue',1.0):1.0})));
if(Q.get('solar')==='1'){ROLE.plate='mirror';ROLE.cta=ROLE.chip=ROLE.price='chrome';ROLE.dark='planet';}   // everything in the solar system's own metal
root.classList.toggle('cta-dark',!!DARKTEXT[ROLE.cta]);

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=num('exp',1.0);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const cv=renderer.domElement;cv.id='metal3d';
if(FULL){let bgEl=document.getElementById('metalBg');if(!bgEl){bgEl=document.createElement('div');bgEl.id='metalBg';document.body.insertBefore(bgEl,document.body.firstChild);}bgEl.appendChild(cv);}else{cv.classList.add('fixed');document.body.insertBefore(cv,document.body.firstChild);}
const scene=new THREE.Scene();
const cubeRT=new THREE.WebGLCubeRenderTarget(512,{type:THREE.HalfFloatType,generateMipmaps:false,minFilter:THREE.LinearFilter});
{const room=new THREE.Scene();room.background=window.__eq;const cc=new THREE.CubeCamera(1,6000,cubeRT);cc.update(renderer,room);}   // captured once, exactly as the solar system does for its sun
const pm=new THREE.PMREMGenerator(renderer);
scene.environment=pm.fromEquirectangular(window.__eq).texture;
const camera=FULL?new THREE.OrthographicCamera(0,100,0,-100,-4000,4000):new THREE.PerspectiveCamera(40,1,10,8000);camera.position.z=1000;   // a real perspective camera: every point on a polished face reflects a slightly different part of the room
/* warm sun against cool reflections: the colour contrast is what makes metal look alive */
const sunLight=new THREE.SpotLight(0xfff0de,num('sun',0.002),0,1.35,1,0);   sunLight.castShadow=Q.get('shadows')!=='0';   // practically zero intensity: no glow on the surface; it only casts shadows
sunLight.shadow.mapSize.set(2048,2048);sunLight.shadow.radius=num('soft',7);sunLight.shadow.bias=-0.0004;sunLight.shadow.normalBias=1.2;sunLight.shadow.camera.near=100;sunLight.shadow.camera.far=3200;
scene.add(sunLight,sunLight.target);
const group=new THREE.Group();scene.add(group);
function plateStudio(){const W=2048,H=1024,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');   // the sheet reflects a bright studio with clean dark-steel and white strips (defined edges, neutral silver)
  g.fillStyle='#f6f7f8';g.fillRect(0,0,W,H);
  const bar=(u,w,col)=>{const x=u*W,s=g.createLinearGradient(x-w/2,0,x+w/2,0);s.addColorStop(0,'rgba(0,0,0,0)');s.addColorStop(.18,col);s.addColorStop(.82,col);s.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=s;g.fillRect(x-w/2,0,w,H);};
  const P=[[.585,40,'#4c5258'],[.62,26,'#ffffff'],[.655,48,'#6a7077'],[.695,30,'#ffffff'],[.73,56,'#3d4349'],[.775,26,'#ffffff'],[.81,44,'#767c83'],[.85,30,'#ffffff'],[.89,40,'#565c63']];
  for(const [u,w,col] of P)bar(u,w,col);
  const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;return t;}
let plate=null,items=[],last='',page={W:0,H:0,sx:0,sy:0},tilt={x:0,y:0,tx:0,ty:0},drift=0,needs=true;
function sun(){const s=document.querySelector('.sun-cta');if(!s)return[0,0];const r=s.getBoundingClientRect();return[r.left+r.width/2+scrollX,r.top+r.height/2+scrollY];}
const plateZ=(u,v)=>num('bx',26)*Math.pow(2*u,2)+num('by',70)*Math.pow(2*v,2)+num('bw',10)*Math.sin(6.283*(u*.8+v*1.2)+.6);
function build(){
  const W=Math.max(root.scrollWidth,innerWidth),H=Math.max(root.scrollHeight,innerHeight),[sx,sy]=sun();
  const els=Q.get('nobtn')==='1'?[]:[...document.querySelectorAll('.hero-continue-btn,.gen-btn,.price-row,.rel-chip')].filter(e=>e.getBoundingClientRect().width>0);
  const specs=els.map(e=>{const b=e.getBoundingClientRect();return[Math.round(b.left+b.width/2+scrollX),Math.round(b.top+b.height/2+scrollY),e.offsetWidth,e.offsetHeight,e.classList.contains('active')?1:0].join()}).join('|');
  const key=[W,H,Math.round(sx),Math.round(sy),specs].join('/');if(key===last)return;last=key;page={W,H,sx,sy};
  const vw=FULL?W:innerWidth,vh=FULL?H:innerHeight;
  renderer.setPixelRatio(Math.max(1,Math.min(2,devicePixelRatio||1,4096/Math.max(vh,1))));renderer.setSize(vw,vh,false);cv.style.width=vw+'px';cv.style.height=vh+'px';
  if(plate){plate.geometry.dispose();group.remove(plate);}
  items.forEach(i=>{i.mesh.traverse(o=>{if(o.geometry)o.geometry.dispose();});group.remove(i.mesh);if(i.mir){group.remove(i.mir);}});items=[];
  group.position.set(W/2,-H/2,0);
  const g=new THREE.PlaneGeometry(W,H,96,96),p=g.attributes.position;
  for(let i=0;i<p.count;i++)p.setZ(i,plateZ(p.getX(i)/W,p.getY(i)/H));
  {const n=g.attributes.normal,P=g.attributes.position,k=num('tilt',.42);   // the sheet's surface tilts smoothly across the page, so each part reflects a different strip of the studio
  for(let i=0;i<n.count;i++){const u=P.getX(i)/W+.5,v=P.getY(i)/H+.5;
    const nx=k*Math.sin(6.283*(u*.55+v*.95)+.4)+k*.5*Math.sin(6.283*(u*1.3-v*.4)+1.7),ny=k*.8*Math.sin(6.283*(v*.7-u*.45)+2.1);
    const l=Math.hypot(nx,ny,1);n.setXYZ(i,nx/l,ny/l,1/l);}n.needsUpdate=true;}
const pmat=mat(ROLE.plate).clone();if(Q.get('final')==='1'){pmat.envMap=pm.fromEquirectangular(plateStudio()).texture;pmat.envMapIntensity=num('penv',1.35);}plate=new THREE.Mesh(g,pmat);if(Q.get('final')==='1'){plate.material=new THREE.MeshBasicMaterial({color:0xe4e7ea,transparent:true,opacity:num('pop',.62),depthWrite:true});}group.add(plate);
  const sh=new THREE.Mesh(g,new THREE.ShadowMaterial({opacity:num('shade',.26)}));sh.position.z=.6;sh.receiveShadow=true;plate.add(sh);   // shadow-only layer
  els.forEach(e=>{
    const w=e.offsetWidth,h=e.offsetHeight,b=e.getBoundingClientRect(),cx=b.left+b.width/2+scrollX,cy=b.top+b.height/2+scrollY,bev=Math.min(16,h*.27),T=Q.get('shape')==='push'?10:6;
    const DOME=Q.get('solar')==='1'&&Q.get('shape')!=='push';   // a domed (sphere-like) surface, so it reflects the whole room the way the solar system's sphere does
    let geo,topH=14;
    if(DOME){topH=h*num('dome',.55);geo=new THREE.SphereGeometry(1,128,64);geo.scale(w/2,h/2,topH);}
    else{const sh=new THREE.Shape();sh.absellipse(0,0,w/2-bev,h/2-bev,Math.PI/2,Math.PI/2+Math.PI*2,false,0);
      geo=new THREE.ExtrudeGeometry(sh,{depth:T,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:22,curveSegments:120});}
    const role=e.classList.contains('active')?'dark':e.classList.contains('price-row')?'price':e.classList.contains('rel-chip')?'chip':'cta';
    const dome=new THREE.Mesh(geo,mat(ROLE[role]));dome.castShadow=true;dome.receiveShadow=true;
    const m=new THREE.Group();m.add(dome);
    if(INLAY&&role!=='dark'){   // the calm centre: flat, so the lettering never sits on a moving reflection
      const PUSH=Q.get('shape')==='push',R=PUSH?.8:.62,ish=new THREE.Shape();ish.absellipse(0,0,w/2*R,h/2*R,0,Math.PI*2,false,0);
      const ig=new THREE.ExtrudeGeometry(ish,{depth:1.6,bevelEnabled:true,bevelThickness:.7,bevelSize:.7,bevelSegments:1,curveSegments:96});
      const inl=new THREE.Mesh(ig,INLAY==='dark'?inlayDark:inlayLight);inl.position.z=PUSH?(T+bev-.8):topH*Math.sqrt(1-R*R)-1.0;inl.receiveShadow=true;m.add(inl);}
    const lx=cx-W/2,ly=-(cy-H/2),lz=plateZ((cx-W/2)/W,(H/2-cy)/H)+(DOME?0:bev+num('lift',10));
    m.position.set(lx,ly,lz);m.rotation.z=TILT;group.add(m);
    let mir=null;if(Q.get('final')==='1'){mir=m.clone(true);mir.scale.z=-1;mir.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.side=THREE.DoubleSide;}o.castShadow=false;o.receiveShadow=false;});mir.rotation.z=TILT;mir.position.set(lx,ly,-lz);mir.userData.h=h;group.add(mir);}
    const it={mesh:m,mir,el:e,z:lz,press:0,target:0,lx,ly,top:(Q.get('shape')==='push'?T+bev:topH)};items.push(it);
    if(!e._m3){e._m3=1;const set=v=>{const i=items.find(q=>q.el===e);if(i){i.target=v;needs=true;}};
      e.addEventListener('pointerenter',()=>set(-1));e.addEventListener('pointerleave',()=>set(0));e.addEventListener('pointercancel',()=>set(0));
      e.addEventListener('pointerdown',()=>set(-8));e.addEventListener('pointerup',()=>set(-1));e.addEventListener('focus',()=>set(-3));e.addEventListener('blur',()=>set(0));}
  });
  needs=true;root.classList.add('m3d');
}
function frame(t){
  build();
  let moving=false;
  const D=num('cam',1100),vh=innerHeight,ccx=innerWidth/2-page.W/2,ccy=-(scrollY+vh/2)+page.H/2;   // camera centre, in the plate's own coordinates
  items.forEach(i=>{const d=i.target-i.press;if(Math.abs(d)>.05){i.press+=d*.25;moving=true;}else i.press=i.target;i.mesh.position.z=i.z+i.press;
    if(!FULL){const k=(D-(i.z+i.press+i.top))/D;   // a raised top face is magnified by perspective: pull it in so it lands exactly under its page element
      i.mesh.position.x=ccx+(i.lx-ccx)*k;i.mesh.position.y=ccy+(i.ly-ccy)*k;i.mesh.scale.set(k,k,1);}
    if(FULL){const pr=Math.max(0,-i.press),s=1-pr*.0105;i.mesh.scale.set(s,s,1);i.mesh.position.y=i.ly-pr*.8;}   // pressed = sunk and slightly smaller
    if(i.mir){const pr=FULL?Math.max(0,-i.press):0;i.mir.position.set(i.mesh.position.x,i.mesh.position.y-i.mir.userData.h*.62*(FULL?1:(i.mesh.scale.x||1))+pr*.9,-(i.z+i.press)*.5);i.mir.scale.set(i.mesh.scale.x,i.mesh.scale.y*.7,-.5);}});
  tilt.x+=(tilt.tx-tilt.x)*.06;tilt.y+=(tilt.ty-tilt.y)*.06;if(Math.abs(tilt.tx-tilt.x)>.0002||Math.abs(tilt.ty-tilt.y)>.0002)moving=true;
  group.rotation.set(tilt.x,tilt.y,0);
  const d=(drift&&!REDUCED)?Math.sin(t/9000)*1:0,sx=page.sx+d*70,sy=page.sy+Math.cos(t/11000)*(drift?1:0)*40;
  sunLight.position.set(sx,-sy,num('sunz',650));sunLight.target.position.set(page.W/2,-page.H/2,0);sunLight.target.updateMatrixWorld();
  if(!FULL){const vw=innerWidth,vh=innerHeight,D=num('cam',1100),cy=-(scrollY+vh/2);   // the page plane maps 1:1 onto CSS pixels
    camera.fov=2*Math.atan(vh/2/D)*180/Math.PI;camera.aspect=vw/vh;camera.position.set(vw/2,cy,D);camera.lookAt(vw/2,cy,0);}
  else{camera.left=0;camera.right=page.W;camera.top=0;camera.bottom=-page.H;}
  camera.updateProjectionMatrix();
  renderer.render(scene,camera);
  window.__m3d={W:page.W,H:page.H,n:items.length,roles:ROLE,mirrors:items.filter(i=>i.mir).length,groupKids:group.children.length,kinds:group.children.map(c=>c.type+(c.userData&&c.userData.h?'M':''))};
}
/* render on demand, plus a very slow ambient drift of the sun (about 12 frames a second) */
drift=(Q.get('drift')==='0'||REDUCED)?0:1;
let lastDraw=0;
function loop(t){requestAnimationFrame(loop);if(document.hidden)return;
  const idleDue=drift&&t-lastDraw>83;
  if(needs||idleDue||Math.abs(tilt.tx-tilt.x)>.0002||Math.abs(tilt.ty-tilt.y)>.0002||items.some(i=>Math.abs(i.target-i.press)>.05)){lastDraw=t;needs=false;frame(t);}}
requestAnimationFrame(loop);
const need=()=>{needs=true;};
addEventListener('resize',need);addEventListener('load',need);
if(Q.get('final')!=='1')addEventListener('scroll',()=>{tilt.ty=((scrollY/Math.max(1,page.H-innerHeight))-.5)*.05;need();},{passive:true});
if(!REDUCED&&Q.get('final')!=='1'){addEventListener('pointermove',e=>{tilt.tx=(e.clientY/innerHeight-.5)*-.035;tilt.ty=(e.clientX/innerWidth-.5)*.045;},{passive:true});
  addEventListener('deviceorientation',e=>{if(e.gamma==null)return;tilt.ty=Math.max(-.5,Math.min(.5,e.gamma/45))*.045;tilt.tx=Math.max(-.5,Math.min(.5,(e.beta-45)/60))*-.035;},{passive:true});}
new ResizeObserver(need).observe(document.body);
new MutationObserver(need).observe(document.body,{attributes:true,childList:true,subtree:true,attributeFilter:['class','style']});
document.fonts&&document.fonts.ready.then(need);
