/* ?skin=obsidian — the buttons and the toggle knob as real pink metal: cut 3D shapes rendered once, at load, under the same photographed room
   that lights the solar system (hdri/warehouse.exr), then handed to the page as images. Nothing keeps running afterwards. */
import * as THREE from 'three';
import {EXRLoader} from './vendor/loaders/EXRLoader.js';
const PINK='#f2a3b9',PR=3;
try{
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.outputColorSpace=THREE.SRGBColorSpace;
  const eq=await new EXRLoader().setDataType(THREE.FloatType).loadAsync('hdri/warehouse.exr');
  {const d=eq.image.data,n=eq.image.width*eq.image.height,ch=d.length/n;   // the room in neutral light: all colour comes from the metal itself
    for(let i=0;i<n;i++){const k=i*ch,l=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];d[k]=d[k+1]=d[k+2]=l;}eq.needsUpdate=true;}
  eq.mapping=THREE.EquirectangularReflectionMapping;
  const pm=new THREE.PMREMGenerator(renderer),env=pm.fromEquirectangular(eq).texture;
  const scene=new THREE.Scene();scene.environment=env;
  // a gentle cushion on the top face (as a normal map) so it carries a moving sweep of the room like the sphere does, instead of one flat tone
  const dome=(()=>{const N=128,d=new Uint8Array(N*N*4);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const u=x/(N-1)*2-1,v=y/(N-1)*2-1,n=new THREE.Vector3(u*.2,v*.34,1).normalize(),k=(y*N+x)*4;
      d[k]=(n.x*.5+.5)*255;d[k+1]=(n.y*.5+.5)*255;d[k+2]=(n.z*.5+.5)*255;d[k+3]=255;}
    const t=new THREE.DataTexture(d,N,N);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t;})();
  const edge=new THREE.MeshStandardMaterial({color:PINK,metalness:1,roughness:.04,envMapIntensity:1.6});   // polished, rounded cut edge
  const shot=(w,h,objs)=>{renderer.setPixelRatio(1);renderer.setSize(Math.round(w*PR),Math.round(h*PR),false);
    const D=700,cam=new THREE.PerspectiveCamera(THREE.MathUtils.radToDeg(2*Math.atan(h/2/D)),w/h,10,2000);cam.position.z=D;
    scene.clear();objs.forEach(o=>scene.add(o));renderer.setClearColor(0,0);renderer.clear();renderer.render(scene,cam);return renderer.domElement.toDataURL('image/png');};
  const hex=(w,h,c,b,col)=>{const s=new THREE.Shape(),x=w/2,y=h/2;s.moveTo(-x+c,-y);s.lineTo(x-c,-y);s.lineTo(x,0);s.lineTo(x-c,y);s.lineTo(-x+c,y);s.lineTo(-x,0);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:1,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelOffset:-b,bevelSegments:6,steps:1});g.translate(0,0,-(1+b));
    const nm=dome.clone();nm.needsUpdate=true;nm.repeat.set(1/w,1/h);nm.offset.set(.5,.5);
    const face=new THREE.MeshStandardMaterial({color:col||PINK,metalness:1,roughness:.16,envMapIntensity:1.5,normalMap:nm});   // top face: soft enough that the label stays clear
    const ed=col?new THREE.MeshStandardMaterial({color:col,metalness:1,roughness:.04,envMapIntensity:1.6}):edge;
    return new THREE.Mesh(g,[face,ed]);};
  const css=[];
  for(const [sel,w,h] of [['.rbtn',210,50],['.gen-btn',190,50]])
    css.push(`html.red.obsidian.metal-ready ${sel}{background-image:url(${shot(w,h,[hex(w,h,25,8)])}) !important}`);
  // the four relationship chips: the selected one in the bright metal, the others in a deeper tone of the same metal, all at full strength
  [116,88,80,66].forEach((w,i)=>{const q=`html.red.obsidian.metal-ready .rel-row .glow-ring-sm:nth-child(${i+1}) .rel-chip`;
    css.push(`${q}{background-image:url(${shot(w,32,[hex(w,32,9,4,'#9c4a63')])}) !important}`,`${q}.active{background-image:url(${shot(w,32,[hex(w,32,9,4)])}) !important}`);});
  const knob=shot(12,12,[new THREE.Mesh(new THREE.SphereGeometry(6,48,32),new THREE.MeshStandardMaterial({color:PINK,metalness:1,roughness:.05,envMapIntensity:1.6}))]);
  css.push(`html.red.obsidian{--kye-knob:url(${knob})}`);
  const st=document.createElement('style');st.textContent=css.join('\n');document.head.appendChild(st);
  document.documentElement.classList.add('metal-ready');
  pm.dispose();env.dispose();eq.dispose();renderer.dispose();renderer.forceContextLoss();
}catch(e){/* no WebGL: the stylesheet's plain pink-metal buttons stay */}
