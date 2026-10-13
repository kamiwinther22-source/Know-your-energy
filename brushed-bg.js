/* ?look=final — the page's metal surface: your reference image (the light and dark radiating from one point; no lines, no grain), centred on the sun (.sun-cta),
   with stronger contrast. Light radiates only from the sun. It is fixed to the page: the top and the bottom are the same surface under the same light.
   Layers: a CSS conic gradient (metal-background/metal-bg.css) is the fallback underneath; this WebGL canvas sits on top of it, behind everything else.
   ?bg=old skips all of this and brings back the old polished sheet. */
(function(){
  if(/[?&]bg=old\b/.test(location.search))return;
  var body=document.body,root=document.documentElement;
  ['metal-background/metal-bg.css','look-brushed.css'].forEach(function(h){var l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.appendChild(l);});
  var bg=document.getElementById('metalBg');if(!bg){bg=document.createElement('div');bg.id='metalBg';bg.setAttribute('aria-hidden','true');body.insertBefore(bg,body.firstChild);}
  function adoptRefl(){var r=document.getElementById('orrRefl');if(r&&r.parentNode!==bg)bg.appendChild(r);}   // same position, but clipped at the phone's edge (a reflection wider than the screen used to make the whole page scroll sideways)
  adoptRefl();new MutationObserver(adoptRefl).observe(body,{childList:true});
  var L=document.createElement('div');L.id='brushBg';L.className='metal-layer';bg.insertBefore(L,bg.firstChild);   // CSS fallback

  var sun={x:195,y:300};   // the sun's centre in page coordinates (css px)
  function layout(){
    var s=document.querySelector('.sun-cta');if(!s)return;
    var r=s.getBoundingClientRect();if(!r.width)return;   // sun hidden (form step): keep the last position
    sun.x=r.left+r.width/2+scrollX;sun.y=r.top+r.height/2+scrollY;
    L.style.setProperty('--metal-x',sun.x.toFixed(1)+'px');L.style.setProperty('--metal-y',sun.y.toFixed(1)+'px');
    L.style.height=Math.max(root.scrollHeight,innerHeight)+'px';
    draw();
  }

  /* the light and dark around the centre, taken from the reference (angle clockwise from the top: brightness 0.79 = darkest, 0.98 = brightest),
     then pushed to real contrast: white where the light runs, deeper steel where it doesn't */
  var STOPS=[[0,.88],[30,.60],[62,.12],[95,.40],[122,.90],[150,.88],[172,.80],[202,.40],[228,.52],[255,.20],[290,.78],[315,1],[340,.55],[360,.88]];   // angle clockwise from the top, 0 = deepest steel, 1 = brightest. Below the sun it runs from steel to bright across the width of the phone.
  function col(t){   // a real steel colour: cool blue-grey in the shadows, clean silver in the middle, near-white with the faintest warmth in the light
    var D=[124,136,155],M=[190,199,212],H=[250,249,247],a,b,u;
    if(t<.5){a=D;b=M;u=t/.5;}else{a=M;b=H;u=(t-.5)/.5;}
    return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u];
  }
  function lut(){
    var out=new Uint8Array(360*4),i,k;
    for(i=0;i<360;i++){
      for(k=0;k<STOPS.length-2&&STOPS[k+1][0]<=i;k++);
      var a=STOPS[k],b=STOPS[k+1],u=(i-a[0])/(b[0]-a[0]);u=(1-Math.cos(Math.PI*Math.max(0,Math.min(1,u))))/2;
      var c=col(a[1]+(b[1]-a[1])*u);out[i*4]=Math.round(c[0]);out[i*4+1]=Math.round(c[1]);out[i*4+2]=Math.round(c[2]);out[i*4+3]=255;
    }
    return out;
  }

  /* ---------- WebGL: the surface ---------- */
  var cv=null,gl=null,U={},raf=0;
  var VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS=[
  'precision highp float;',
  'uniform vec2 uRes;uniform float uDpr;uniform vec2 uSun;uniform sampler2D uLut;',
  'float h11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}',
  'float h12(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}',
  'float vn(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h11(i),h11(i+1.),f)*2.-1.;}',
  'void main(){',
  ' vec2 f=vec2(gl_FragCoord.x,uRes.y*uDpr-gl_FragCoord.y)/uDpr;',
  ' vec2 d=f-uSun;float r=length(d);',
  ' float a=atan(d.x,-d.y)/6.2831853;a=fract(a);',                 // 0..1, clockwise from the top
  ' vec3 c=texture2D(uLut,vec2(a,.5)).rgb;',
  ' c+=(h12(gl_FragCoord.xy)-.5)/255.*1.6;',
  ' gl_FragColor=vec4(clamp(c,0.,1.),1.);',
  '}'].join('\n');

  function initGL(){
    cv=document.createElement('canvas');cv.id='brushGL';cv.setAttribute('aria-hidden','true');
    gl=cv.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false});
    if(!gl)return false;
    function sh(t,src){var s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
    if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    var buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    var loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    ['uRes','uDpr','uSun','uLut'].forEach(function(n){U[n]=gl.getUniformLocation(pr,n);});
    var tx=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tx);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,360,1,0,gl.RGBA,gl.UNSIGNED_BYTE,lut());
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.uniform1i(U.uLut,0);
    bg.insertBefore(cv,L.nextSibling);   // above the CSS fallback, below the 3D buttons
    return true;
  }
  var lastW=0,lastH=0;
  function draw(){
    if(!gl)return;
    if(innerWidth!==lastW||innerHeight!==lastH){
      lastW=innerWidth;lastH=innerHeight;var dpr=Math.min(2,devicePixelRatio||1);
      cv.width=Math.round(lastW*dpr);cv.height=Math.round(lastH*dpr);gl.viewport(0,0,cv.width,cv.height);
      gl.uniform1f(U.uDpr,dpr);gl.uniform2f(U.uRes,lastW,lastH);
    }
    gl.uniform2f(U.uSun,sun.x-scrollX,sun.y-scrollY);   // fixed to the page: the sheen scrolls with the content
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  function sched(){if(!raf)raf=requestAnimationFrame(function(){raf=0;layout();});}
  function sdraw(){if(!raf)raf=requestAnimationFrame(function(){raf=0;draw();});}

  try{initGL();}catch(err){if(window.console)console.warn('brushed-bg: WebGL unavailable, using the CSS metal',err);if(cv&&cv.parentNode)cv.parentNode.removeChild(cv);gl=null;}
  layout();
  addEventListener('resize',sched);addEventListener('load',sched);addEventListener('scroll',sdraw,{passive:true});
  new ResizeObserver(sched).observe(body);
  var sunEl=document.querySelector('.sun-cta');if(sunEl)new ResizeObserver(sched).observe(sunEl);
  document.fonts&&document.fonts.ready.then(sched);
  [400,1200,3000].forEach(function(t){setTimeout(sched,t);});   // the solar system draws a moment after load
})();
