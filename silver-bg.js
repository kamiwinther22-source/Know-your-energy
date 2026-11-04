/* Front page background: a polished silver sheet drawn live in WebGL (real geometry, real environment reflections, real specular highlight
   from the sun's direction, upper right). It sits behind the page, fixed, and takes no part in layout: nothing on the page moves. */
import * as THREE from 'three';
import {EXRLoader} from './vendor/loaders/EXRLoader.js';
const root=document.documentElement;
if(!root.classList.contains('red'))throw new Error('silver-bg: front page only');
const st=document.createElement('style');
st.textContent='html.red:not(:has(#resultsWrap[style*="block"])),html.red:not(:has(#resultsWrap[style*="block"])) body{background:#c9ccd1 !important}'+
 'html.red:not(:has(#resultsWrap[style*="block"])) body{background:transparent !important}'+
 '#silverBg{position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block}'+
 'html.red:has(#resultsWrap[style*="block"]) #silverBg{display:none}';
document.head.appendChild(st);
const cv=document.createElement('canvas');cv.id='silverBg';document.body.insertBefore(cv,document.body.firstChild);
const r=new THREE.WebGLRenderer({canvas:cv,antialias:true});
r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.0;r.outputColorSpace=THREE.SRGBColorSpace;
const eq=await new EXRLoader().setDataType(THREE.HalfFloatType).loadAsync('hdri/warehouse.exr');
eq.mapping=THREE.EquirectangularReflectionMapping;
const Q=new URLSearchParams(location.search),num=(k,d)=>{const v=parseFloat(Q.get(k));return isNaN(v)?d:v;};
const scene=new THREE.Scene(),pm=new THREE.PMREMGenerator(r);
scene.environment=pm.fromEquirectangular(eq).texture;scene.environmentRotation=new THREE.Euler(0,num('rot',.25),0);
const W=100,H=220,geo=new THREE.PlaneGeometry(W,H,160,320),p=geo.attributes.position;
for(let i=0;i<p.count;i++){const u=p.getX(i)/W,v=p.getY(i)/H;   // one broad, smooth dish plus a soft swell: the sheet is not a flat mirror
  p.setZ(i,num('dish',14)*(u*u*1.2+v*v*.5)+num('swell',3.2)*Math.sin(5.1*u+2.2*v+.6)*Math.cos(3.3*v-1.7*u));}
geo.computeVertexNormals();
const mat=new THREE.MeshStandardMaterial({color:0xffffff,metalness:1,roughness:num('rough',.06),envMapIntensity:num('env',1.4)});
scene.add(new THREE.Mesh(geo,mat));
const sun=new THREE.DirectionalLight(0xffffff,num('sun',2.5));sun.position.set(60,80,60);scene.add(sun);
const cam=new THREE.PerspectiveCamera(38,1,1,2000);
function size(){const w=innerWidth,h=innerHeight;r.setPixelRatio(Math.min(2,devicePixelRatio||1));r.setSize(w,h,false);cam.aspect=w/h;
  const dist=(H*.5)/Math.tan(cam.fov*Math.PI/360);cam.position.set(0,0,Math.max(dist*.55,90));cam.lookAt(0,0,0);cam.updateProjectionMatrix();r.render(scene,cam);window.__silver=1;}
size();addEventListener('resize',size);
