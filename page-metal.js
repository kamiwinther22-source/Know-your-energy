/* ?look=pagemetal — the page sits on a real 3D polished metal sheet (three.js, metalness 1, low roughness) reflecting the real photographed room
   the solar system already uses (hdri/warehouse.exr). The sheet has a gentle, slow curve, so wherever it tips toward a real light in the room it
   catches a true glint. Fields are recessed and buttons raised in the same sheet, so they are the same material. Results page is left alone. */
import * as THREE from 'three';
import {EXRLoader} from './vendor/loaders/EXRLoader.js';
(async function(){
  const root=document.documentElement,body=document.body;
  const cv=document.createElement('canvas');cv.id='pmBg';cv.setAttribute('aria-hidden','true');body.insertBefore(cv,body.firstChild);
  const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true});
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.outputColorSpace=THREE.SRGBColorSpace;
  const eq=await new EXRLoader().setDataType(THREE.FloatType).loadAsync('hdri/warehouse.exr');
  {const SAT=.15,d=eq.image.data,n=eq.image.width*eq.image.height,ch=d.length/n;   // silver, not tinted: pull the room's colour most of the way to neutral
   for(let i=0;i<n;i++){const k=i*ch,l=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];for(let c=0;c<3;c++)d[k+c]=l+(d[k+c]-l)*SAT;}eq.needsUpdate=true;}
  eq.mapping=THREE.EquirectangularReflectionMapping;
  const pm=new THREE.PMREMGenerator(renderer);const env=pm.fromEquirectangular(eq).texture;
  const scene=new THREE.Scene();scene.environment=env;
  const mat=new THREE.MeshStandardMaterial({color:0xffffff,metalness:1,roughness:.10});
  const sun=new THREE.PointLight(0xffffff,4,0,0);scene.add(sun);   // the sun: placed where the big chrome sphere really is on the page; the only light; the glints are its specular reflection
  let mesh=null,camera=null,raf=0;
  const CELL=2;
  function visible(el,rc){
    if(el.checkVisibility&&!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))return false;
    for(let a=el;a&&a!==body;a=a.parentElement){const cs=getComputedStyle(a);if(cs.display==='none'||+cs.opacity<.05)return false;
      if(cs.overflowY!=='visible'||cs.overflowX!=='visible'){const ar=a.getBoundingClientRect();if(ar.height<3||rc.bottom<=ar.top+1||rc.top>=ar.bottom-1)return false;}}
    return true;}
  function maskCanvas(gw,gh,draw,blurCss){const c=document.createElement('canvas');c.width=gw;c.height=gh;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,gw,gh);x.filter='blur('+(blurCss/CELL)+'px)';x.fillStyle='#fff';draw(x);return x.getImageData(0,0,gw,gh).data;}
  function render(){
    raf=0;
    if(root.querySelector('#resultsWrap[style*="block"]'))return;
    const W=root.clientWidth,H=Math.max(root.scrollHeight,body.scrollHeight);
    let dpr=Math.min(2,devicePixelRatio||1);if(H*dpr>4096)dpr=4096/H;
    renderer.setPixelRatio(dpr);renderer.setSize(W,H,false);cv.style.width=W+'px';cv.style.height=H+'px';
    const sx=scrollX,sy=scrollY,PADX=80,PADY=160,GW=W+2*PADX,GH=H+2*PADY,gw=Math.ceil(GW/CELL)+1,gh=Math.ceil(GH/CELL)+1;
    const F=[],B=[];
    document.querySelectorAll('#hookStep input:not([type=checkbox]):not([type=hidden]),#formStep input:not([type=checkbox]):not([type=hidden]),#formStep select').forEach(e=>{
      const r=e.getBoundingClientRect();if(r.width>8&&r.height>8&&r.height<80&&visible(e,r))F.push([r.left+sx,r.top+sy,r.right+sx,r.bottom+sy]);});
    document.querySelectorAll('.rbtn,.gen-btn').forEach(e=>{
      const r=e.getBoundingClientRect();if(r.width>60&&r.height>20&&visible(e,r))B.push([r.left+sx,r.top+sy,r.right+sx,r.bottom+sy]);});
    const O=r=>[r[0]+PADX,r[1]+PADY,r[2]+PADX,r[3]+PADY];F.forEach((r,i)=>F[i]=O(r));B.forEach((r,i)=>B[i]=O(r));
    const pk=maskCanvas(gw,gh,x=>F.forEach(r=>x.fillRect(r[0]/CELL,r[1]/CELL,(r[2]-r[0])/CELL,(r[3]-r[1])/CELL)),2.4);
    const hex=blur=>maskCanvas(gw,gh,x=>B.forEach(r=>{const h=r[3]-r[1],k=25;x.beginPath();x.moveTo((r[0]+k)/CELL,r[1]/CELL);x.lineTo((r[2]-k)/CELL,r[1]/CELL);x.lineTo(r[2]/CELL,(r[1]+h/2)/CELL);x.lineTo((r[2]-k)/CELL,r[3]/CELL);x.lineTo((r[0]+k)/CELL,r[3]/CELL);x.lineTo(r[0]/CELL,(r[1]+h/2)/CELL);x.closePath();x.fill();}),blur);
    const bs=hex(2.2),bw=hex(10);
    const geo=new THREE.PlaneGeometry(GW,GH,gw-1,gh-1);const p=geo.attributes.position;
    const A=70,TAU=Math.PI*2;
    for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){
      const k=j*gw+i,x=i*CELL,y=j*CELL;
      const dx=x-PADX,dy=y-PADY;let z=A*(Math.sin(TAU*dx/1100+1.1)*Math.sin(TAU*dy/1500+.4)+.6*Math.sin(TAU*(dx/900+dy/1300)+2.2));
      z+=.25*(GH/2-j*CELL)-pk[k*4]/255*4+bs[k*4]/255*2+bw[k*4]/255*6;
      p.setXYZ(k,i*CELL-GW/2,GH/2-j*CELL,z);}
    p.needsUpdate=true;geo.computeVertexNormals();
    if(mesh){scene.remove(mesh);mesh.geometry.dispose();}
    mesh=new THREE.Mesh(geo,mat);scene.add(mesh);
    camera=new THREE.OrthographicCamera(-W/2,W/2,H/2,-H/2,1,6000);camera.position.z=3000;
    {const ill=document.getElementById('heroIllustration')||document.querySelector('#hookStep canvas');let sxp=294,syp=200;
     if(ill){const ir=ill.getBoundingClientRect();if(ir.width>100){sxp=ir.left+sx+ir.width*.507;syp=ir.top+sy+ir.height*.43;}}
     sun.position.set(sxp-W/2,H/2-syp,260);}
    renderer.render(scene,camera);
  }
  const queue=()=>{if(!raf)raf=setTimeout(render,150);};
  render();
  if(window.ResizeObserver)new ResizeObserver(queue).observe(body);
  addEventListener('resize',queue);addEventListener('load',queue);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(queue);
  window.__pmDone=true;
})();
