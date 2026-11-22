/* A jewelry-studio light setup, built as an HDR environment: large clean light panels in a dark room, the way metal and stones are photographed.
   Used by the obsidian skin in place of the photographed warehouse, so no room, ceiling lights or floor show up in the metal. */
import * as THREE from 'three';
export function studio(W=1024,H=512){
  const d=new Float32Array(W*H*4),V=(x,y,z)=>new THREE.Vector3(x,y,z).normalize();
  const panels=[   // centre direction, half-width, half-height (tangent units), brightness, [r,g,b]
    [V(0,1,.22),1.05,.55,6.5,[1,1,1]],           // overhead softbox: the broad highlight across the top of every form
    [V(-.82,.22,.52),.085,1.0,9,[1,1,1]],        // tall strip, left front: the long bright line down the side
    [V(.9,.12,.42),.05,.9,6,[1,1,1]],            // thinner strip, right
    [V(0,.12,1),1.5,.9,1.15,[1,1,1]],            // big soft front fill: keeps faces turned to the viewer light and even
    [V(.25,-.75,.6),.9,.22,1.3,[1,.16,.42]],     // low panel in deep garnet: the second colour, seen only in the metal's shadow side
  ].map(([c,hw,hh,I,col])=>{const up=Math.abs(c.y)>.95?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0);
    const r=new THREE.Vector3().crossVectors(up,c).normalize(),u=new THREE.Vector3().crossVectors(c,r).normalize();return {c,r,u,hw,hh,I,col};});
  const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);},dir=new THREE.Vector3(),p=new THREE.Vector3();
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){
    const lon=((i+.5)/W-.5)*2*Math.PI,lat=((j+.5)/H-.5)*Math.PI;dir.set(Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon));
    const g=.05+.42*ss(-.35,.95,dir.y);let R=g,G=g*.93,B=g*.96;                       // the room itself: dark, lifting smoothly toward the top
    if(dir.y<0){const f=ss(0,-.9,dir.y)*.10;R+=f;G+=f*.12;B+=f*.36;}                   // floor bounce in garnet
    for(const q of panels){const t=dir.dot(q.c);if(t<=.05)continue;p.copy(dir).multiplyScalar(1/t).sub(q.c);
      const x=Math.abs(p.dot(q.r))/q.hw,y=Math.abs(p.dot(q.u))/q.hh,m=(1-ss(.5,1,x))*(1-ss(.5,1,y));   // softbox falloff: bright core easing out, like diffused light
      if(m>0){const k=q.I*m*(.82+.18*(1-y));R+=k*q.col[0];G+=k*q.col[1];B+=k*q.col[2];}}
    const k=(j*W+i)*4;d[k]=R;d[k+1]=G;d[k+2]=B;d[k+3]=1;}
  const t=new THREE.DataTexture(d,W,H,THREE.RGBAFormat,THREE.FloatType);t.magFilter=t.minFilter=THREE.LinearFilter;t.needsUpdate=true;return t;}
