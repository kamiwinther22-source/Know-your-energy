/* ?look=metal — the page as real metal. One 3D scene behind the page: a metal plate and polished metal ovals, lit by the sun's position
   and reflecting the same photographed room as the solar system. The DOM stays the interface; this only draws what is under it.
   Several real metals, used by role (a bright silver plate, warm titanium for secondary objects, an accent metal for the main actions).
   The surface answers to scroll and pointer (the plate tilts a few degrees under a fixed light, so the reflections move), buttons press in,
   and the sun drifts very slowly. Motion respects prefers-reduced-motion. URL options: cta=, chip=, price=, plate=, drift=0, full=1 (page-size canvas, for screenshots). */
import * as THREE from 'three';
const root=document.documentElement,Q=new URLSearchParams(location.search);
const num=(k,d)=>{const v=parseFloat(Q.get(k));return isNaN(v)?d:v;};
const TILT=12*Math.PI/180,FULL=Q.get('full')==='1',REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
await new Promise(r=>{let n=0;const t=()=>(window.__eq||++n>1200)?r():requestAnimationFrame(t);t();});
if(!window.__eq)throw new Error('no environment');

/* measured metals: the base colour of a metal is the colour of its reflection (F0) */
const METALS={
  aluminum:{c:0xeceeee,r:.40},silver:{c:0xfcfaf5,r:.17},titanium:{c:0xc2bbb3,r:.22},
  copper:{c:0xe9a58a,r:.20},bronze:{c:0xb68a5e,r:.24},gunmetal:{c:0x5b5f68,r:.20},black:{c:0x17171b,r:.14}};
const ROLE={plate:Q.get('plate')||'aluminum',cta:Q.get('cta')||'copper',chip:Q.get('chip')||'titanium',price:Q.get('price')||'titanium',dark:'black'};
const DARKTEXT={gunmetal:1,black:1};
const mats={};const mat=n=>mats[n]||(mats[n]=new THREE.MeshStandardMaterial({color:METALS[n].c,metalness:1,roughness:METALS[n].r,envMapIntensity:n==='aluminum'?num('env',1.0):1.2}));
root.classList.toggle('cta-dark',!!DARKTEXT[ROLE.cta]);

const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=num('exp',1.0);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const cv=renderer.domElement;cv.id='metal3d';
if(FULL){let bgEl=document.getElementById('metalBg');if(!bgEl){bgEl=document.createElement('div');bgEl.id='metalBg';document.body.insertBefore(bgEl,document.body.firstChild);}bgEl.appendChild(cv);}else{cv.classList.add('fixed');document.body.insertBefore(cv,document.body.firstChild);}
const scene=new THREE.Scene();
const pm=new THREE.PMREMGenerator(renderer);
scene.environment=pm.fromEquirectangular(window.__eq).texture;
const camera=new THREE.OrthographicCamera(0,100,0,-100,-4000,4000);camera.position.z=1000;
/* warm sun against cool reflections: the colour contrast is what makes metal look alive */
const sunLight=new THREE.SpotLight(0xfff0de,num('sun',2.4),0,1.35,1,0);sunLight.castShadow=true;
sunLight.shadow.mapSize.set(2048,2048);sunLight.shadow.radius=num('soft',7);sunLight.shadow.bias=-0.0004;sunLight.shadow.normalBias=1.2;sunLight.shadow.camera.near=100;sunLight.shadow.camera.far=3200;
scene.add(sunLight,sunLight.target);
const group=new THREE.Group();scene.add(group);
let plate=null,items=[],last='',page={W:0,H:0,sx:0,sy:0},tilt={x:0,y:0,tx:0,ty:0},drift=0,needs=true;
function sun(){const s=document.querySelector('.sun-cta');if(!s)return[0,0];const r=s.getBoundingClientRect();return[r.left+r.width/2+scrollX,r.top+r.height/2+scrollY];}
const plateZ=(u,v)=>num('bx',26)*Math.pow(2*u,2)+num('by',70)*Math.pow(2*v,2)+num('bw',10)*Math.sin(6.283*(u*.8+v*1.2)+.6);
function build(){
  const W=Math.max(root.scrollWidth,innerWidth),H=Math.max(root.scrollHeight,innerHeight),[sx,sy]=sun();
  const els=[...document.querySelectorAll('.hero-continue-btn,.gen-btn,.price-row,.rel-chip')].filter(e=>e.getBoundingClientRect().width>0);
  const specs=els.map(e=>{const b=e.getBoundingClientRect();return[Math.round(b.left+b.width/2+scrollX),Math.round(b.top+b.height/2+scrollY),e.offsetWidth,e.offsetHeight,e.classList.contains('active')?1:0].join()}).join('|');
  const key=[W,H,Math.round(sx),Math.round(sy),specs].join('/');if(key===last)return;last=key;page={W,H,sx,sy};
  const vw=FULL?W:innerWidth,vh=FULL?H:innerHeight;
  renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.setSize(vw,vh,false);cv.style.width=vw+'px';cv.style.height=vh+'px';
  if(plate){plate.geometry.dispose();group.remove(plate);}
  items.forEach(i=>{i.mesh.geometry.dispose();group.remove(i.mesh);});items=[];
  group.position.set(W/2,-H/2,0);
  const g=new THREE.PlaneGeometry(W,H,96,96),p=g.attributes.position;
  for(let i=0;i<p.count;i++)p.setZ(i,plateZ(p.getX(i)/W,p.getY(i)/H));
  g.computeVertexNormals();plate=new THREE.Mesh(g,mat(ROLE.plate));plate.receiveShadow=true;group.add(plate);
  els.forEach(e=>{
    const w=e.offsetWidth,h=e.offsetHeight,b=e.getBoundingClientRect(),cx=b.left+b.width/2+scrollX,cy=b.top+b.height/2+scrollY,bev=Math.min(16,h*.27),T=6;
    const sh=new THREE.Shape();sh.absellipse(0,0,w/2-bev,h/2-bev,0,Math.PI*2,false,0);
    const geo=new THREE.ExtrudeGeometry(sh,{depth:T,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:22,curveSegments:120});
    const role=e.classList.contains('active')?'dark':e.classList.contains('price-row')?'price':e.classList.contains('rel-chip')?'chip':'cta';
    const m=new THREE.Mesh(geo,mat(ROLE[role]));m.castShadow=true;m.receiveShadow=true;
    const lx=cx-W/2,ly=-(cy-H/2),lz=plateZ((cx-W/2)/W,(H/2-cy)/H)+bev+num('lift',10);
    m.position.set(lx,ly,lz);m.rotation.z=TILT;group.add(m);
    const it={mesh:m,el:e,z:lz,press:0,target:0};items.push(it);
    if(!e._m3){e._m3=1;const set=v=>{const i=items.find(q=>q.el===e);if(i){i.target=v;needs=true;}};
      e.addEventListener('pointerenter',()=>set(-3));e.addEventListener('pointerleave',()=>set(0));
      e.addEventListener('pointerdown',()=>set(-7));e.addEventListener('pointerup',()=>set(-3));e.addEventListener('focus',()=>set(-3));e.addEventListener('blur',()=>set(0));}
  });
  needs=true;root.classList.add('m3d');
}
function frame(t){
  build();
  let moving=false;
  items.forEach(i=>{const d=i.target-i.press;if(Math.abs(d)>.05){i.press+=d*.25;moving=true;}else i.press=i.target;i.mesh.position.z=i.z+i.press;});
  tilt.x+=(tilt.tx-tilt.x)*.06;tilt.y+=(tilt.ty-tilt.y)*.06;if(Math.abs(tilt.tx-tilt.x)>.0002||Math.abs(tilt.ty-tilt.y)>.0002)moving=true;
  group.rotation.set(tilt.x,tilt.y,0);
  const d=(drift&&!REDUCED)?Math.sin(t/9000)*1:0,sx=page.sx+d*70,sy=page.sy+Math.cos(t/11000)*(drift?1:0)*40;
  sunLight.position.set(sx,-sy,num('sunz',650));sunLight.target.position.set(page.W/2,-page.H/2,0);sunLight.target.updateMatrixWorld();
  if(!FULL){camera.left=0;camera.right=innerWidth;camera.top=-scrollY;camera.bottom=-(scrollY+innerHeight);}
  else{camera.left=0;camera.right=page.W;camera.top=0;camera.bottom=-page.H;}
  camera.updateProjectionMatrix();
  renderer.render(scene,camera);
  window.__m3d={W:page.W,H:page.H,n:items.length,roles:ROLE};
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
addEventListener('scroll',()=>{tilt.ty=((scrollY/Math.max(1,page.H-innerHeight))-.5)*.05;need();},{passive:true});
if(!REDUCED){addEventListener('pointermove',e=>{tilt.tx=(e.clientY/innerHeight-.5)*-.035;tilt.ty=(e.clientX/innerWidth-.5)*.045;},{passive:true});
  addEventListener('deviceorientation',e=>{if(e.gamma==null)return;tilt.ty=Math.max(-.5,Math.min(.5,e.gamma/45))*.045;tilt.tx=Math.max(-.5,Math.min(.5,(e.beta-45)/60))*-.035;},{passive:true});}
new ResizeObserver(need).observe(document.body);
new MutationObserver(need).observe(document.body,{attributes:true,childList:true,subtree:true,attributeFilter:['class','style']});
document.fonts&&document.fonts.ready.then(need);
