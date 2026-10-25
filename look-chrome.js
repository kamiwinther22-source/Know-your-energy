/* ?look=chrome — the page sits on one polished metal surface, drawn with a real reflection (WebGL): a studio with one light at the sun's
   upper-right direction. A few bumps in the metal, placed where there is no text, catch that light. Fields are recessed into the metal and
   buttons are raised from it, so their shine is the same material. Text stays plain dark ink. Results page is left alone. */
(function(){
  var root=document.documentElement,body=document.body;
  var cv=document.createElement('canvas');cv.id='chromeBg';cv.setAttribute('aria-hidden','true');body.insertBefore(cv,body.firstChild);
  var gl=cv.getContext('webgl',{preserveDrawingBuffer:false,antialias:false});if(!gl){cv.remove();return;}
  var VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS=[
  'precision highp float;',
  'uniform sampler2D uP,uS,uW;uniform vec2 res;uniform float dpr;uniform vec4 bm[8];uniform float nb;uniform vec4 gl4[6];uniform float ng;',
  'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
  'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
  'vec2 uvOf(vec2 pc){return vec2(pc.x*dpr/res.x,pc.y*dpr/res.y);}',
  'float H(vec2 pc){',
  ' float h=(vn(pc/520.+vec2(3.1,1.7))+.5*vn(pc/260.+vec2(9.2,4.4))-.75)*8.;',
 
  ' float p=texture2D(uP,uvOf(pc)).r;h*=1.-smoothstep(.2,.6,p);h-=p*4.;',
  ' h+=texture2D(uS,uvOf(pc)).r*2.+texture2D(uW,uvOf(pc)).r*6.;',
  ' return h;}',
  'vec3 env(vec3 r,vec3 S){',
  ' float a=acos(clamp(dot(r,S),-1.,1.));',
  ' float box=1.-smoothstep(.60,.612,a);float ring=1.-smoothstep(1.12,1.132,a);',
  ' vec3 boxc=mix(vec3(.70),vec3(.98,.97,.94),smoothstep(.5,.1,a));',
  ' vec3 ringc=mix(vec3(.44,.44,.45),vec3(.13,.13,.14),smoothstep(.6,1.12,a));',
  ' vec3 room=mix(vec3(.09,.09,.10),vec3(.17,.17,.18),smoothstep(-.02,.75,r.y));',
  ' float fl=smoothstep(0.,-.015,r.y);room=mix(room,mix(vec3(.12),vec3(.05),smoothstep(0.,-.8,r.y)),fl);',
  ' vec3 c=mix(room,ringc,ring);c=mix(c,boxc,box);',
  ' c+=vec3(1.7,1.65,1.5)*(1.-smoothstep(.13,.142,a));return c;}',
  'void main(){',
  ' vec2 fc=gl_FragCoord.xy;vec2 pc=vec2(fc.x,res.y-fc.y)/dpr;float e=1.;',
  ' float hx=(H(pc+vec2(e,0.))-H(pc-vec2(e,0.)))/(2.*e);float hy=(H(pc+vec2(0.,e))-H(pc-vec2(0.,e)))/(2.*e);',
  ' vec3 S=normalize(vec3(.62,.55,.56));',
  ' float pki=smoothstep(.5,.8,texture2D(uP,uvOf(pc)).r);',
  ' vec3 n=normalize(vec3(-hx+.215+.02*pki,hy+.195+.02*pki,1.));',
  ' vec3 r=reflect(vec3(0.,0.,-1.),n);',
  ' vec3 F0=vec3(.95,.94,.93);float nd=clamp(n.z,0.,1.);vec3 F=F0+(1.-F0)*pow(1.-nd,5.);',
  ' vec3 col=F*env(r,S);col=clamp(col,0.,1.);col=mix(col,col*col*(3.-2.*col),.55);col=pow(col,vec3(1./2.2));',
  ' for(int i=0;i<6;i++){if(float(i)>=ng)break;vec2 q=(pc-gl4[i].xy)/gl4[i].zw;float d=length(q);',
  ' float inside=1.-smoothstep(.97,1.,d);float core=1.-smoothstep(.0,.95,d);',
  ' vec3 g=mix(vec3(.80,.80,.79),vec3(1.,.99,.96),pow(core,.7));',
  ' float rim=smoothstep(.80,.97,d)*(.5+.5*dot(normalize(q+1e-4),normalize(vec2(-.7,-.7))));',
  ' g*=1.-.28*rim;col=mix(col,g,inside);}',
  ' col+=(hash(fc)-.5)/255.;gl_FragColor=vec4(col,1.);}'].join('\n');
  function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(o));return null;}return o;}
  var vs=sh(gl.VERTEX_SHADER,VS),fs=sh(gl.FRAGMENT_SHADER,FS);if(!vs||!fs){cv.remove();return;}
  var pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);gl.useProgram(pr);
  var bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  var U=function(n){return gl.getUniformLocation(pr,n);};
  var tex=[0,1,2].map(function(i){var t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;});
  gl.uniform1i(U('uP'),0);gl.uniform1i(U('uS'),1);gl.uniform1i(U('uW'),2);
  function visible(el,rc){
    if(el.checkVisibility&&!el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))return false;
    for(var a=el;a&&a!==body;a=a.parentElement){var cs=getComputedStyle(a);if(cs.display==='none'||+cs.opacity<.05)return false;
      if(cs.overflowY!=='visible'||cs.overflowX!=='visible'){var ar=a.getBoundingClientRect();if(ar.height<3||rc.bottom<=ar.top+1||rc.top>=ar.bottom-1)return false;}}
    return true;}
  function mk(W,H,S,draw,blur){var c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,W,H);x.filter='blur('+(blur*S)+'px)';x.fillStyle='#fff';draw(x,S);return c;}
  var raf=0;
  function render(){
    raf=0;
    if(root.querySelector('#resultsWrap[style*="block"]'))return;
    var cw=root.clientWidth,ch=Math.max(root.scrollHeight,body.scrollHeight),dpr=Math.min(2,devicePixelRatio||1);
    if(ch*dpr>4096)dpr=4096/ch;
    var sx=scrollX,sy=scrollY,W=Math.round(cw*dpr),H=Math.round(ch*dpr);
    cv.width=W;cv.height=H;cv.style.width=cw+'px';cv.style.height=ch+'px';
    var F=[],B=[],bumps=[],gl6=[];
    document.querySelectorAll('#hookStep input:not([type=checkbox]):not([type=hidden]),#formStep input:not([type=checkbox]):not([type=hidden]),#formStep select').forEach(function(e){
      var r=e.getBoundingClientRect();if(r.width>8&&r.height>8&&r.height<80&&visible(e,r))F.push([r.left+sx,r.top+sy,r.right+sx,r.bottom+sy]);});
    document.querySelectorAll('.rbtn,.gen-btn').forEach(function(e){
      var r=e.getBoundingClientRect();if(r.width>60&&r.height>20&&visible(e,r))B.push([r.left+sx,r.top+sy,r.right+sx,r.bottom+sy]);});
    var ill=document.getElementById('heroIllustration')||document.querySelector('#hookStep canvas');
    if(ill){var ir=ill.getBoundingClientRect();if(ir.width>100){
      gl6.push([ir.left+sx+Math.min(ir.width,cw)*.17,ir.top+sy+ir.height*.78,70,34]);
      gl6.push([Math.min(cw-34,ir.left+sx+ir.width*.80),ir.top+sy+ir.height*.09,46,22]);}}
    B.forEach(function(r){var cy=(r[1]+r[3])/2;gl6.push([Math.max(30,r[0]-52),cy,26,15]);if(r[2]+52<cw-12)gl6.push([r[2]+52,cy,26,15]);});
    bumps=bumps.slice(0,8);gl6=gl6.slice(0,6);
    var pc=mk(W,H,dpr,function(x,S){F.forEach(function(r){x.fillRect(r[0]*S,r[1]*S,(r[2]-r[0])*S,(r[3]-r[1])*S);});},2.6);
    function hex(blur){return mk(W,H,dpr,function(x,S){B.forEach(function(r){var h=r[3]-r[1],k=25;x.beginPath();x.moveTo((r[0]+k)*S,r[1]*S);x.lineTo((r[2]-k)*S,r[1]*S);x.lineTo(r[2]*S,(r[1]+h/2)*S);x.lineTo((r[2]-k)*S,r[3]*S);x.lineTo((r[0]+k)*S,r[3]*S);x.lineTo(r[0]*S,(r[1]+h/2)*S);x.closePath();x.fill();});},blur);}
    [pc,hex(2.4),hex(11)].forEach(function(c,i){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);});
    var flat=new Float32Array(32);bumps.forEach(function(b,i){flat.set(b,i*4);});
    gl.uniform4fv(U('bm[0]'),flat);var g6=new Float32Array(24);gl6.forEach(function(b,i){g6.set(b,i*4);});gl.uniform4fv(U('gl4[0]'),g6);gl.uniform1f(U('ng'),gl6.length);gl.uniform1f(U('nb'),bumps.length);gl.uniform2f(U('res'),W,H);gl.uniform1f(U('dpr'),dpr);
    gl.viewport(0,0,W,H);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  function queue(){if(!raf)raf=setTimeout(render,120);}
  render();
  if(window.ResizeObserver)new ResizeObserver(queue).observe(body);
  addEventListener('resize',queue);addEventListener('load',queue);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(queue);
  new MutationObserver(queue).observe(body,{attributes:true,attributeFilter:['style','class'],subtree:true});
})();
