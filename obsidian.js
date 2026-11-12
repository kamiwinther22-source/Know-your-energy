/* ?skin=obsidian — the buttons and the toggle knob as real pink metal: cut 3D shapes rendered once, at load, under the same studio light
   as the solar system (studio-env.js), then handed to the page as images. Nothing keeps running afterwards. */
import * as THREE from 'three';
import {studio} from './studio-env.js';
const PINK='#f2a3b9',PR=3;
try{
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.outputColorSpace=THREE.SRGBColorSpace;
  const eq=studio();eq.mapping=THREE.EquirectangularReflectionMapping;   // the same jewelry-studio light that the solar system sits in
  const pm=new THREE.PMREMGenerator(renderer),env=pm.fromEquirectangular(eq).texture;
  const scene=new THREE.Scene();scene.environment=env;
  const shot=(w,h,objs)=>{renderer.setPixelRatio(1);renderer.setSize(Math.round(w*PR),Math.round(h*PR),false);
    const D=700,cam=new THREE.PerspectiveCamera(THREE.MathUtils.radToDeg(2*Math.atan(h/2/D)),w/h,10,2000);cam.position.z=D;
    scene.clear();objs.forEach(o=>scene.add(o));renderer.setClearColor(0,0);renderer.clear();renderer.render(scene,cam);return renderer.domElement.toDataURL('image/png');};
  // each button is a cut hexagonal stone of polished metal, domed up from its outline to a centre point so every facet catches a different part of the room
  const GARNET='#8a2f52';
  const hex=(w,h,c,H,col)=>{w-=2;h-=2;const x=w/2,y=h/2,P=[[-x+c,-y],[x-c,-y],[x,0],[x-c,y],[-x+c,y],[-x,0]],pts=[],M=48,pos=[],idx=[];
    for(let i=0;i<6;i++){const a=P[i],b=P[(i+1)%6];for(let k=0;k<40;k++)pts.push([a[0]+(b[0]-a[0])*k/40,a[1]+(b[1]-a[1])*k/40]);}
    const n=pts.length;for(let k=0;k<=M;k++){const s=1-k/M,z=H*(1-s*s);for(const q of pts)pos.push(q[0]*s,q[1]*s,z-H);}
    for(let k=0;k<M;k++)for(let i=0;i<n;i++){const a=k*n+i,b=k*n+(i+1)%n,c2=a+n,d=b+n;idx.push(a,b,c2,b,d,c2);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
    return new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:col||GARNET,metalness:1,roughness:.05,envMapIntensity:1.6}));};
  const css=[];
  for(const [sel,w,h] of [['.rbtn',210,50],['.gen-btn',190,50]])
    css.push(`html.red.obsidian.metal-ready ${sel}{background-image:url(${shot(w,h,[hex(w,h,25,14)])}) !important}`);
  // the four relationship chips: the selected one in the bright pink metal, the others in the garnet of the buttons, all at full strength
  [116,88,80,66].forEach((w,i)=>{const q=`html.red.obsidian.metal-ready .rel-row .glow-ring-sm:nth-child(${i+1}) .rel-chip`;
    css.push(`${q}{background-image:url(${shot(w,32,[hex(w,32,9,9)])}) !important}`,`${q}.active{background-image:url(${shot(w,32,[hex(w,32,9,9,PINK)])}) !important}`);});
  const knob=shot(22,22,[new THREE.Mesh(new THREE.SphereGeometry(11,64,48),new THREE.MeshStandardMaterial({color:PINK,metalness:1,roughness:.05,envMapIntensity:1.6}))]);
  css.push(`html.red.obsidian{--kye-knob:url(${knob})}`);
  const st=document.createElement('style');st.textContent=css.join('\n');document.head.appendChild(st);
  document.documentElement.classList.add('metal-ready');
  pm.dispose();env.dispose();eq.dispose();renderer.dispose();renderer.forceContextLoss();
}catch(e){/* no WebGL: the stylesheet's plain pink-metal buttons stay */}
