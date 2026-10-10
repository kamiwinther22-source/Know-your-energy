/* the solar system as real 3D silver, lit by a real photographed room (CC0 HDRI, Poly Haven via @pmndrs/assets).
   Geometry is taken 1:1 from the page's existing SVG: same centre, sun radius, ring radii, tilt, planets, orbit timing. */
import * as THREE from 'three';
import {EXRLoader} from './vendor/loaders/EXRLoader.js';
const Q=new URLSearchParams(''),ENVNAME=Q.get('env')||'warehouse',ENVROT=parseFloat(Q.get('rot')||'0.25');
const host=document.getElementById('heroIllustration');
await new Promise(r=>{const t=()=>host.querySelector('svg')?r():requestAnimationFrame(t);t();});
const svg=host.querySelector('svg');svg.style.visibility='hidden';host.style.position='relative';
// --- the page's own geometry (from index.html) ---
const cx=180,cy=100,R_SUN=46,ROT=-8,RING_RX=[64,86,108,130,152,175];
const SPECS=[[1,205,10],[2,20,10],[4,335,9],[1,15,9]],PERIOD=48;
const TILT=Math.acos(.26);
// --- renderer over the SVG box ---
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const cv=renderer.domElement;cv.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none';host.appendChild(cv);
const camera=new THREE.OrthographicCamera(-8,368,-20,-205,-2000,2000);camera.position.z=1000;
const scene=new THREE.Scene();
// --- the real room the silver reflects ---
const eq=await new EXRLoader().setDataType(THREE.FloatType).loadAsync(`hdri/${ENVNAME}.exr`);
{ // silver, not tinted: pull the room's colour most of the way to neutral
  const SAT=parseFloat(Q.get('sat')||'0.15'),d=eq.image.data,n=eq.image.width*eq.image.height,ch=d.length/n;
  for(let i=0;i<n;i++){const k=i*ch,l=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];for(let c=0;c<3;c++)d[k+c]=l+(d[k+c]-l)*SAT;}
  const BL=parseInt(Q.get('blur')||'2'),w=eq.image.width,h=eq.image.height,tmp=new Float32Array(d.length);
  for(let pass=0;pass<2;pass++){const src=pass?tmp:d,dst=pass?d:tmp;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){let r=0,g=0,b=0,c=0;
      for(let k=-BL;k<=BL;k++){const xx=pass?x:((x+k)%w+w)%w,yy=pass?Math.min(h-1,Math.max(0,y+k)):y,j=(yy*w+xx)*ch;r+=src[j];g+=src[j+1];b+=src[j+2];c++;}
      const o=(y*w+x)*ch;dst[o]=r/c;dst[o+1]=g/c;dst[o+2]=b/c;if(ch>3)dst[o+3]=src[o+3];}}
  eq.needsUpdate=true;}
eq.mapping=THREE.EquirectangularReflectionMapping;eq.wrapS=THREE.RepeatWrapping;eq.offset.x=ENVROT;
const pmrem=new THREE.PMREMGenerator(renderer);const ENV=pmrem.fromEquirectangular(eq).texture;scene.environment=ENV;

// --- organic cast-silver surface for the planets (fractal noise, no geometric shapes) ---
function cast(seed,band){const W=512,H=256,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),im=g.createImageData(W,H);
  const P=new Uint8Array(512);let s=seed;const rnd=()=>((s=(s*16807)%2147483647)/2147483647);const p=[...Array(256).keys()].sort(()=>rnd()-.5);for(let i=0;i<512;i++)P[i]=p[i&255];
  const fade=t=>t*t*t*(t*(t*6-15)+10),lerp=(a,b,t)=>a+(b-a)*t;
  const grad=(h,x,y)=>((h&1)?-x:x)+((h&2)?-y:y);
  const noise=(x,y,per)=>{const X=Math.floor(x),Y=Math.floor(y),xf=x-X,yf=y-Y,u=fade(xf),v=fade(yf);
    const xi=((X%per)+per)%per,xi1=(xi+1)%per,yi=Y&255,yi1=(Y+1)&255;
    const aa=P[P[xi]+yi],ab=P[P[xi]+yi1],ba=P[P[xi1]+yi],bb=P[P[xi1]+yi1];
    return lerp(lerp(grad(aa,xf,yf),grad(ba,xf-1,yf),u),lerp(grad(ab,xf,yf-1),grad(bb,xf-1,yf-1),u),v);};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let v=0,a=.5,f=8;
    for(let o=0;o<6;o++){v+=a*noise(x/W*f,y/H*f*.5,f);a*=.55;f*=2;}
    if(band)v+=.35*noise(0,y/H*14,1)*1.0;
    const k=(y*W+x)*4,b=Math.max(0,Math.min(255,128+v*170));im.data[k]=im.data[k+1]=im.data[k+2]=b;im.data[k+3]=255;}
  g.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.NoColorSpace;t.wrapS=THREE.RepeatWrapping;t.anisotropy=8;return t;}
// --- objects ---
const outer=new THREE.Group();outer.position.set(cx,-cy,0);outer.rotation.z=THREE.MathUtils.degToRad(-ROT);scene.add(outer);
const plane=new THREE.Group();plane.rotation.x=-TILT;outer.add(plane);
const sun=new THREE.Mesh(new THREE.SphereGeometry(R_SUN,160,120),new THREE.MeshStandardMaterial({color:0xfff7ec,metalness:1,roughness:0,envMapIntensity:parseFloat(Q.get('sunI')||'1.6')}));
sun.position.set(cx,-cy,0);sun.castShadow=true;scene.add(sun);
const ringMat=new THREE.MeshStandardMaterial({color:new THREE.Color(Q.get('ring')||'#dfe2e7'),metalness:1,roughness:0,envMapIntensity:parseFloat(Q.get('ringI')||'1.25')});
for(const rx of RING_RX)plane.add(new THREE.Mesh(new THREE.TorusGeometry(rx,1.65,24,400),ringMat));
const planets=SPECS.map(([ri,a0,pr],i)=>{
  const m=new THREE.Mesh(new THREE.SphereGeometry(pr,128,96),new THREE.MeshStandardMaterial({color:0xcfccc6,metalness:1,roughness:0}));
  m.castShadow=true;plane.add(m);return {m,ri,a0};});
// contact shadows on the ring plane (the "table")
const nW=new THREE.Vector3(0,0,1).applyQuaternion(plane.getWorldQuaternion(new THREE.Quaternion()));
const key=new THREE.DirectionalLight(0xffffff,.35);key.position.set(cx,-cy,0).addScaledVector(nW,900).add(new THREE.Vector3(-60,0,120));key.target.position.set(cx,-cy,0);
key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.radius=9;key.shadow.blurSamples=20;
Object.assign(key.shadow.camera,{left:-320,right:320,top:320,bottom:-320,near:1,far:2000});scene.add(key,key.target);
const catcher=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.ShadowMaterial({opacity:.28}));catcher.position.set(0,0,-10.5);catcher.receiveShadow=true;plane.add(catcher);
// live reflections: the sun shows the planets and rings, each planet shows the sun
const cubeRT=new THREE.WebGLCubeRenderTarget(256,{type:THREE.HalfFloatType,generateMipmaps:false,minFilter:THREE.LinearFilter});
const cubeCam=new THREE.CubeCamera(1,6000,cubeRT);cubeCam.position.copy(sun.position);scene.add(cubeCam);sun.material.envMap=cubeRT.texture;
const pCubes=planets.map(p=>{const rt=new THREE.WebGLCubeRenderTarget(96,{type:THREE.HalfFloatType,generateMipmaps:false,minFilter:THREE.LinearFilter});
  const cc=new THREE.CubeCamera(1,6000,rt);scene.add(cc);p.m.material.envMap=rt.texture;return {p,cc};});
function capture(cc,hide){hide.visible=false;catcher.visible=false;scene.background=eq;cc.update(renderer,scene);scene.background=null;hide.visible=true;catcher.visible=true;}
let pi=0;
var place=function(t){for(const p of planets){const a=THREE.MathUtils.degToRad(p.a0+360*t/PERIOD),rx=RING_RX[p.ri];
  p.m.position.set(rx*Math.cos(a),-rx*Math.sin(a),0);}}

function size(){const r=svg.getBoundingClientRect();const w=svg.clientWidth||svg.parentNode.clientWidth,h=svg.clientHeight||w*185/376;
  renderer.setPixelRatio(Math.min(4,(devicePixelRatio||1)*Math.max(1,r.width/(w||1))));renderer.setSize(w,h,false);}
new ResizeObserver(size).observe(host);size();
const still=matchMedia('(prefers-reduced-motion: reduce)').matches,t0=performance.now();let first=true;
function frame(now){place(still?0:(now-t0)/1000);
  if(first){first=false;for(const q of pCubes){q.p.m.getWorldPosition(q.cc.position);capture(q.cc,q.p.m);}}
  capture(cubeCam,sun);const q=pCubes[pi=(pi+1)%pCubes.length];q.p.m.getWorldPosition(q.cc.position);capture(q.cc,q.p.m);
  renderer.render(scene,camera);if(!still)requestAnimationFrame(frame);}
requestAnimationFrame(frame);
