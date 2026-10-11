/* ?look=metal — the page as real metal. One 3D scene behind the page: a satin metal plate and polished metal ovals, lit by the sun's position
   and reflecting the same photographed room as the solar system. The DOM stays the interface; this only draws what is under it. */
import * as THREE from 'three';
const root=document.documentElement,Q=new URLSearchParams(location.search);
const num=(k,d)=>{const v=parseFloat(Q.get(k));return isNaN(v)?d:v;};
const TILT=12*Math.PI/180;
await new Promise(r=>{let n=0;const t=()=>(window.__eq||++n>1200)?r():requestAnimationFrame(t);t();});
if(!window.__eq)throw new Error('no environment');
const bg=document.getElementById('metalBg');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:false});
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=num('exp',1.0);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const cv=renderer.domElement;cv.id='metal3d';bg.appendChild(cv);
const scene=new THREE.Scene();
const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromEquirectangular(window.__eq).texture;
const camera=new THREE.OrthographicCamera(0,100,0,-100,-4000,4000);camera.position.z=1000;
const sunLight=new THREE.SpotLight(0xffffff,num('sun',2.4),0,1.35,1,0);sunLight.castShadow=true;
sunLight.shadow.mapSize.set(2048,2048);sunLight.shadow.radius=num('soft',7);sunLight.shadow.bias=-0.0004;sunLight.shadow.normalBias=1.2;sunLight.shadow.camera.near=100;sunLight.shadow.camera.far=3000;
scene.add(sunLight,sunLight.target);
const plateMat=new THREE.MeshStandardMaterial({color:new THREE.Color(Q.get('plate')||'#f1eee8'),metalness:1,roughness:num('rough',.42),envMapIntensity:num('env',1.0)});
const btnMat=new THREE.MeshStandardMaterial({color:0xf3f1ec,metalness:1,roughness:num('brough',.17),envMapIntensity:num('benv',1.2)});
const darkMat=new THREE.MeshStandardMaterial({color:0x16161a,metalness:1,roughness:.14,envMapIntensity:1.0});
let plate=null,buttons=[],last='';
function sun(){const s=document.querySelector('.sun-cta');if(!s)return[0,0];const r=s.getBoundingClientRect();return[r.left+r.width/2+scrollX,r.top+r.height/2+scrollY];}
function build(){
  const W=Math.max(root.scrollWidth,innerWidth),H=Math.max(root.scrollHeight,innerHeight),[sx,sy]=sun();
  const els=[...document.querySelectorAll('.hero-continue-btn,.gen-btn,.price-row,.rel-chip')].filter(e=>e.getBoundingClientRect().width>0);
  const specs=els.map(e=>{const b=e.getBoundingClientRect(),w=e.offsetWidth,h=e.offsetHeight;return[Math.round(b.left+b.width/2+scrollX),Math.round(b.top+b.height/2+scrollY),w,h,e.classList.contains('active')?1:0].join()}).join('|');
  const key=[W,H,Math.round(sx),Math.round(sy),specs].join('/');if(key===last)return;last=key;
  const dpr=Math.min(2,devicePixelRatio||1);renderer.setPixelRatio(dpr);renderer.setSize(W,H,false);cv.style.width=W+'px';cv.style.height=H+'px';
  camera.left=0;camera.right=W;camera.top=0;camera.bottom=-H;camera.updateProjectionMatrix();
  if(plate){plate.geometry.dispose();scene.remove(plate);}
  const plateZ=(u,v)=>num('bx',26)*Math.pow(2*u,2)+num('by',70)*Math.pow(2*v,2)+num('bw',10)*Math.sin(6.283*(u*.8+v*1.2)+.6);   // a very gently bowed sheet, so the room reflects differently across it
  const g=new THREE.PlaneGeometry(W,H,96,96),p=g.attributes.position;
  for(let i=0;i<p.count;i++)p.setZ(i,plateZ(p.getX(i)/W,p.getY(i)/H));
  g.computeVertexNormals();plate=new THREE.Mesh(g,plateMat);plate.position.set(W/2,-H/2,0);plate.receiveShadow=true;scene.add(plate);
  sunLight.position.set(sx,-sy,num('sunz',650));sunLight.target.position.set(W/2,-H/2,0);sunLight.target.updateMatrixWorld();
  buttons.forEach(m=>{m.geometry.dispose();scene.remove(m);});buttons=[];
  els.forEach(e=>{
    const b=e.getBoundingClientRect(),w=e.offsetWidth,h=e.offsetHeight,cx=b.left+b.width/2+scrollX,cy=b.top+b.height/2+scrollY,bev=Math.min(16,h*.27),T=6;
    const sh=new THREE.Shape();sh.absellipse(0,0,w/2-bev,h/2-bev,0,Math.PI*2,false,0);
    const geo=new THREE.ExtrudeGeometry(sh,{depth:T,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:22,curveSegments:120});
    const m=new THREE.Mesh(geo,e.classList.contains('active')?darkMat:btnMat);m.castShadow=true;m.receiveShadow=true;
    m.position.set(cx,-cy,plateZ((cx-W/2)/W,(H/2-cy)/H)+bev+num('lift',10));m.rotation.z=TILT;scene.add(m);buttons.push(m);});
  renderer.render(scene,camera);root.classList.add('m3d');window.__m3d={W,H,n:buttons.length,pos:buttons.map(b=>[Math.round(b.position.x),Math.round(b.position.y),Math.round(b.position.z)]),specs};
}
let raf=0;const sched=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;build();});};
build();addEventListener('resize',sched);addEventListener('load',sched);
new ResizeObserver(sched).observe(document.body);
new MutationObserver(sched).observe(document.body,{attributes:true,childList:true,subtree:true,attributeFilter:['class','style']});
document.fonts&&document.fonts.ready.then(sched);
