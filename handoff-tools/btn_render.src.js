import * as THREE from 'three';
const K=16,MX=90.34191131591797;
const q=new URLSearchParams(location.search),W=+q.get('w')||340,H=+q.get('h')||112,CH=+q.get('c')||36,IX=+q.get('ix')||20,IY=+q.get('iy')||12,DEP=+q.get('d')||7;
const SC=3;
async function env(){const img=new Image();img.src='warehouse-log.jpg';await img.decode();const w=img.naturalWidth,h=img.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(img,0,0);const p=g.getImageData(0,0,w,h).data,out=new Float32Array(w*h*4),L=Math.log2(1+K*MX)/255;for(let i=0,o=0;i<p.length;i+=4,o+=4){out[o]=(Math.pow(2,p[i]*L)-1)/K;out[o+1]=(Math.pow(2,p[i+1]*L)-1)/K;out[o+2]=(Math.pow(2,p[i+2]*L)-1)/K;out[o+3]=1;}
 const t=new THREE.DataTexture(out,w,h,THREE.RGBAFormat,THREE.FloatType);t.colorSpace=THREE.LinearSRGBColorSpace;t.mapping=THREE.EquirectangularReflectionMapping;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;t.flipY=false;t.needsUpdate=true;return t;}
const cv=document.createElement('canvas');document.body.appendChild(cv);
const r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});r.setPixelRatio(1);r.setSize(W*SC,H*SC);r.setClearColor(0x000000,0);
r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.0;sc0=null;
let sc0;const sc=new THREE.Scene(),pm=new THREE.PMREMGenerator(r);sc.environment=pm.fromEquirectangular(await env()).texture;
const FOV=+q.get('f')||46;const cam=new THREE.PerspectiveCamera(FOV,W/H,1,2000);cam.position.set(0,0,(H/2)/Math.tan(FOV*Math.PI/360));
const hx=(w,h,c)=>[[-w/2+c,h/2],[w/2-c,h/2],[w/2,0],[w/2-c,-h/2],[-w/2+c,-h/2],[-w/2,0]];
const O=hx(W,H,CH),I=hx(W-2*IX,H-2*IY,CH-IX*0.55);
const pos=[];const tri=(a,b,c)=>pos.push(...a,...b,...c);
const o3=O.map(p=>[p[0],p[1],0]),i3=I.map(p=>[p[0],p[1],DEP]);
for(let k=0;k<6;k++){const n=(k+1)%6;tri(o3[k],o3[n],i3[n]);tri(o3[k],i3[n],i3[k]);}
for(let k=1;k<5;k++)tri(i3[0],i3[k],i3[k+1]);
const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();
const m=new THREE.MeshPhysicalMaterial({color:0xe9edf2,metalness:1,roughness:0.16,envMapIntensity:1.25,clearcoat:0.6,clearcoatRoughness:0.05,side:THREE.DoubleSide});
sc.add(new THREE.Mesh(g,m));
r.render(sc,cam);window.__done=true;
