/* ?look=chrome — the page sits on one polished metal surface, curved like a large dome across the whole page, reflecting a studio with one
   light at the sun's upper-right direction. The light is a hard-edged near-white reflection against darker steel. Fields are recessed into
   the metal and buttons are raised from it, so they are the same material. Text is plain ink. The results page is left alone. */
(function(){
  var root=document.documentElement,body=document.body;
  var cv=document.createElement('canvas');cv.id='chromeBg';cv.setAttribute('aria-hidden','true');body.insertBefore(cv,body.firstChild);
  var gl=cv.getContext('webgl',{antialias:false});if(!gl){cv.remove();return;}
  var VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS=['precision highp float;uniform sampler2D uP,uS,uW;uniform vec2 res;uniform float dpr;',
  'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
  'vec2 uvOf(vec2 pc){return vec2(pc.x*dpr/res.x,pc.y*dpr/res.y);}',
  'float H(vec2 pc){float h=-texture2D(uP,uvOf(pc)).r*4.;h+=texture2D(uS,uvOf(pc)).r*2.+texture2D(uW,uvOf(pc)).r*6.;return h;}',
  'void main(){',
  ' vec2 fc=gl_FragCoord.xy;vec2 pc=vec2(fc.x,res.y-fc.y)/dpr;float e=1.;',
  ' float hx=(H(pc+vec2(e,0.))-H(pc-vec2(e,0.)))/(2.*e);float hy=(H(pc+vec2(0.,e))-H(pc-vec2(0.,e)))/(2.*e);',
  ' vec2 t=vec2(.26,.23)+vec2(-hx,hy);',
  ' vec3 n=normalize(vec3(t,1.));',
  ' vec3 L=normalize(vec3(.62,.55,.56));vec3 Hh=normalize(L+vec3(0.,0.,1.));',
  ' float diff=.5+.5*dot(n,L);',
  ' vec3 base=vec3(.79,.79,.79)*(.78+.34*diff);',
  ' float nh=max(dot(n,Hh),0.);float spec=pow(nh,260.)*1.5+pow(nh,3000.)*3.;',
  ' vec2 cell=floor(pc/2.6);vec2 r2=vec2(hash(cell+3.1),hash(cell+7.7))-.5;',
  ' vec3 nf=normalize(vec3(vec2(.26,.23)+r2*1.0,1.));',
  ' float sp=pow(max(dot(nf,Hh),0.),500.)*1.5;',
  ' vec2 cell2=floor(pc/9.);vec2 q2=vec2(hash(cell2+1.7),hash(cell2+5.3))-.5;vec2 f2=fract(pc/9.)-.5;',
  ' vec3 nf2=normalize(vec3(vec2(.26,.23)+q2*1.1,1.));',
  ' float big=pow(max(dot(nf2,Hh),0.),350.)*1.6*(1.-smoothstep(.18,.34,length(f2-(vec2(hash(cell2+9.1),hash(cell2+2.9))-.5)*.3)));',
  ' sp+=big;',
 ' vec3 col=base+vec3(1.,.99,.97)*(spec+sp);',
  ' col=clamp(col,0.,1.);col+=(hash(fc)-.5)/255.;gl_FragColor=vec4(col,1.);}'].join('\n');
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
  function render(){raf=0;
    if(root.querySelector('#resultsWrap[style*="block"]'))return;
    var cw=root.clientWidth,ch=Math.max(root.scrollHeight,body.scrollHeight),dpr=Math.min(2,devicePixelRatio||1);if(ch*dpr>4096)dpr=4096/ch;
    var sx=scrollX,sy=scrollY,W=Math.round(cw*dpr),H=Math.round(ch*dpr);cv.width=W;cv.height=H;cv.style.width=cw+'px';cv.style.height=ch+'px';
    var F=[],B=[];
    document.querySelectorAll('#hookStep input:not([type=checkbox]):not([type=hidden]),#formStep input:not([type=checkbox]):not([type=hidden]),#formStep select').forEach(function(e){
      var r=e.getBoundingClientRect();if(r.width>8&&r.height>8&&r.height<80&&visible(e,r))F.push([r.left+sx,r.top+sy,r.right+sx,r.bottom+sy]);});
    document.querySelectorAll('.rbtn,.gen-btn').forEach(function(e){
      var r=e.getBoundingClientRect();if(r.width>60&&r.height>20&&visible(e,r))B.push([r.left+sx,r.top+sy,r.right+sx,r.bottom+sy]);});
    var pc=mk(W,H,dpr,function(x,S){F.forEach(function(r){x.fillRect(r[0]*S,r[1]*S,(r[2]-r[0])*S,(r[3]-r[1])*S);});},2.4);
    function hex(blur){return mk(W,H,dpr,function(x,S){B.forEach(function(r){var h=r[3]-r[1],k=25;x.beginPath();x.moveTo((r[0]+k)*S,r[1]*S);x.lineTo((r[2]-k)*S,r[1]*S);x.lineTo(r[2]*S,(r[1]+h/2)*S);x.lineTo((r[2]-k)*S,r[3]*S);x.lineTo((r[0]+k)*S,r[3]*S);x.lineTo(r[0]*S,(r[1]+h/2)*S);x.closePath();x.fill();});},blur);}
    [pc,hex(2.2),hex(10)].forEach(function(c,i){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);});
    gl.uniform2f(U('res'),W,H);gl.uniform1f(U('dpr'),dpr);gl.viewport(0,0,W,H);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}
  function queue(){if(!raf)raf=setTimeout(render,120);}
  render();
  if(window.ResizeObserver)new ResizeObserver(queue).observe(body);
  addEventListener('resize',queue);addEventListener('load',queue);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(queue);
  new MutationObserver(queue).observe(body,{attributes:true,attributeFilter:['style','class'],subtree:true});
})();
