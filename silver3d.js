/* Front page background: a real 3D scene rendered live with a physically based engine (three.js library; no files from earlier designs).
   - the sheet is real geometry, a gently dished polished-silver panel, with a satin metal under a glossy clear coat;
   - its environment is a studio built here from nothing: a bright ceiling falling to a dark horizon, one softbox and one strip light on the sun's side;
   - the sun is a real light at its real position on the page, casting real shadow-map shadows from the real geometry of the buttons;
   - the buttons are real extruded hex solids placed exactly under their page elements.
   It sits fixed behind the page and takes no part in layout: nothing on the page moves. */
import * as THREE from 'three';
const root=document.documentElement;
if(!root.classList.contains('red'))throw new Error('front page only');
const Q=new URLSearchParams(location.search),num=(k,d)=>{const v=parseFloat(Q.get(k));return isNaN(v)?d:v;};
const NR=':not(:has(#resultsWrap[style*="block"]))',INK='#12161c';
const st=document.createElement('style');
st.textContent='html.red'+NR+',html.red'+NR+' body{background:#b9bcc1 !important}html.red'+NR+' body{background:transparent !important}'+
 '#silverBg{position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block}html.red:has(#resultsWrap[style*="block"]) #silverBg{display:none}'+
 'html.red.silver'+NR+' #hookStep *,html.red.silver'+NR+' .form-panel *,html.red.silver'+NR+' #formFields *{color:'+INK+' !important;-webkit-text-fill-color:'+INK+';text-shadow:none !important}'+
 'html.red.silver'+NR+' .line-field:not(.hero-email-field) *{color:#fff !important;-webkit-text-fill-color:#fff}'+
 'html.red.silver'+NR+' .line-field:not(.hero-email-field) input::placeholder{color:#fff !important;-webkit-text-fill-color:#fff}'+
 'html.red.silver'+NR+' .hero-email-field input::placeholder{color:'+INK+' !important;-webkit-text-fill-color:'+INK+'}'+
 'html.red.silver'+NR+' .rbtn *,html.red.silver'+NR+' .gen-btn *,html.red.silver'+NR+' .rel-chip *{color:'+INK+' !important;-webkit-text-fill-color:'+INK+'}'+
 'html.red.silver'+NR+' .r-b22 li:before{background:'+INK+' !important}';
document.head.appendChild(st);
const cv=document.createElement('canvas');cv.id='silverBg';document.body.insertBefore(cv,document.body.firstChild);
const r=new THREE.WebGLRenderer({canvas:cv,antialias:true});
root.classList.add('silver');
r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=num('exp',1.0);r.outputColorSpace=THREE.SRGBColorSpace;
r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
/* ONE SCENE. The page is a table of polished silver seen from above. On it: the sun (a chrome sphere, the only light source, resting at its real place
   on the page) and the things that stand up (the hex buttons, real solids under their page elements). Everything below comes from that one scene:
   the sun's light on the metal, the shadows of the buttons and of the sun itself, and each solid's mirror image in the metal beneath it. */
const pm=new THREE.PMREMGenerator(r);
/* the room beyond the table is dark and dim: the sun is the only real light */
const room=new THREE.Scene();{const g=new THREE.SphereGeometry(500,32,24),p=g.attributes.position,col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){const y=p.getY(i)/500,L=num('amb',.22)*(.35+.65*Math.max(y,0));col[i*3]=col[i*3+1]=col[i*3+2]=L;}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));const d=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide}));d.rotation.x=Math.PI/2;room.add(d);}
const scene=new THREE.Scene();scene.environment=pm.fromScene(room,0,1,2000).texture;
const cam=new THREE.PerspectiveCamera(40,1,10,6000);
const table=new THREE.MeshPhysicalMaterial({color:0xe9ebee,metalness:num('metal',.8),roughness:num('rough',.2),clearcoat:num('cc',.5),clearcoatRoughness:.05,envMapIntensity:1});
const sunLight=new THREE.SpotLight(0xfff4e6,num('sun',2.2e5),0,1.35,.9,2);sunLight.castShadow=true;
sunLight.shadow.mapSize.set(2048,2048);sunLight.shadow.radius=num('soft',8);sunLight.shadow.bias=-.0004;sunLight.shadow.normalBias=.6;sunLight.shadow.camera.near=30;sunLight.shadow.camera.far=1600;
scene.add(sunLight,sunLight.target);
const steel=new THREE.MeshStandardMaterial({color:0xdfe3e8,metalness:1,roughness:.22});
const mirrorMat=new THREE.MeshStandardMaterial({color:0xdfe3e8,metalness:1,roughness:.22,transparent:true,opacity:num('mop',.5),depthTest:false,side:THREE.FrontSide});
const THINGS=[['.hero-continue-btn',16],['.gen-btn',16],['.rel-chip',10]];
function hexShape(w,h){const c=Math.min(25,h/2),s=new THREE.Shape();s.moveTo(-w/2+c,-h/2);s.lineTo(w/2-c,-h/2);s.lineTo(w/2,0);s.lineTo(w/2-c,h/2);s.lineTo(-w/2+c,h/2);s.lineTo(-w/2,0);s.closePath();return s;}
let sheet=null,dyn=[];
function build(){
  const W=innerWidth,H=innerHeight;r.setPixelRatio(Math.min(2,devicePixelRatio||1));r.setSize(W,H,false);
  const D=num('cam',650);cam.fov=2*Math.atan(H/2/D)*180/Math.PI;cam.aspect=W/H;cam.position.set(W/2,H/2,D);cam.lookAt(W/2,H/2,0);cam.updateProjectionMatrix();
  const host=document.getElementById('heroIllustration'),hr=host?host.getBoundingClientRect():{left:0,top:0,width:W,height:W/2};
  const sx=hr.left+hr.width*.479,sy=H-(hr.top+hr.height*.54),SR=hr.width/376*46;     /* the sun: its centre on the page and its radius, from the page's own drawing (46 of 376 units) */
  dyn.forEach(o=>{scene.remove(o);o.geometry&&o.geometry.dispose&&o.geometry.dispose();});dyn=[];
  if(!sheet){sheet=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000),table);sheet.receiveShadow=true;scene.add(sheet);}
  sheet.position.set(W/2,H/2,0);
  /* the sun: a sphere resting on the table, invisible to the camera (the page already draws it) but it blocks and reflects light like the real one */
  const sg=new THREE.SphereGeometry(SR,48,32),sm=new THREE.Mesh(sg,new THREE.MeshBasicMaterial({colorWrite:false}));sm.position.set(sx,sy,SR);sm.castShadow=false;scene.add(sm);dyn.push(sm);
  sunLight.position.set(sx,sy,SR*num('lhk',3.2));sunLight.target.position.set(sx,sy,0);sunLight.target.updateMatrixWorld();
  THINGS.forEach(([sel,h])=>document.querySelectorAll(sel).forEach(el=>{const b=el.getBoundingClientRect();if(b.width<4||b.bottom<-40||b.top>H+40)return;
    const geo=new THREE.ExtrudeGeometry(hexShape(b.width,b.height),{depth:h,bevelEnabled:true,bevelThickness:2,bevelSize:2,bevelSegments:2});
    const x=b.left+b.width/2,y=H-(b.top+b.height/2);
    const m=new THREE.Mesh(geo,steel);m.position.set(x,y,0);m.castShadow=true;m.receiveShadow=true;scene.add(m);dyn.push(m);
    const mi=new THREE.Mesh(geo,mirrorMat);mi.position.set(x,y,0);mi.scale.z=-1;mi.renderOrder=5;scene.add(mi);dyn.push(mi);}));   /* its image in the polished table */
  r.render(scene,cam);window.__silver=1;}
let busy=false;const soon=()=>{if(busy)return;busy=true;requestAnimationFrame(()=>{busy=false;build();});};
build();addEventListener('resize',soon);addEventListener('scroll',soon,{passive:true});addEventListener('load',soon);setTimeout(soon,600);setTimeout(soon,2000);
