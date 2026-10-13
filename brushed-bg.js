/* ?look=final — the page's metal surface: real brushed metal, shaded per pixel, centred on the sun (.sun-cta).
   The grooves run in circles around the sun (spun/turned metal). Light is not painted on: each pixel is lit with an anisotropic (Ward) reflection model,
   so bright wedges appear exactly where a studio light's reflection runs along the grooves, and they slide as you scroll or tilt the phone.
   Layers: a CSS conic gradient (metal-background/metal-bg.css) is the fallback underneath; this WebGL canvas sits on top of it, behind everything else.
   ?bg=old skips all of this and brings back the old polished sheet. */
(function(){
  if(/[?&]bg=old\b/.test(location.search))return;
  var body=document.body,root=document.documentElement,Q=new URLSearchParams(location.search);
  var REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;
  ['metal-background/metal-bg.css','look-brushed.css'].forEach(function(h){var l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.appendChild(l);});
  var bg=document.getElementById('metalBg');if(!bg){bg=document.createElement('div');bg.id='metalBg';bg.setAttribute('aria-hidden','true');body.insertBefore(bg,body.firstChild);}
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

  /* ---------- WebGL: the shaded surface ---------- */
  var cv=null,gl=null,U={},view={x:0,y:0,tx:0,ty:0},base=null,raf=0,loop=0;
  var VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS=[
  'precision highp float;',
  'uniform vec2 uRes;uniform float uDpr;uniform vec2 uSun;uniform vec2 uView;uniform float uScroll;',
  'float h11(float p){p=fract(p*.1031);p*=p+33.33;p*=p+p;return fract(p);}',
  'float h12(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}',
  'float vn(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h11(i),h11(i+1.),f)*2.-1.;}',
  'float vn2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h12(i),h12(i+vec2(1,0)),f.x),mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),f.x),f.y)*2.-1.;}',
  // Ward anisotropic lobe: narrow across the grooves (aT), wide along the reflection streak (aB)
  'float ward(vec3 Lv,vec3 V,vec2 T,vec2 B,float aT,float aB){vec3 H=normalize(Lv+V);float ht=dot(H.xy,T),hb=dot(H.xy,B);return exp(-2.*((ht*ht)/(aT*aT)+(hb*hb)/(aB*aB))/(1.+H.z));}',
  // a studio light at infinity: azimuth (deg clockwise from the top of the screen) and elevation (deg above the sheet)
  'vec3 dir(float az,float el){float a=radians(az),e=radians(el);return vec3(sin(a)*cos(e),-cos(a)*cos(e),sin(e));}',
  'void main(){',
  ' vec2 f=vec2(gl_FragCoord.x,uRes.y*uDpr-gl_FragCoord.y)/uDpr;',
  ' vec2 d=f-uSun;float r=length(d);vec2 B=r>.001?d/r:vec2(1.,0.);vec2 T=vec2(-B.y,B.x);',   // T: along the grooves (a circle round the sun); B: across them (radial)
  ' vec3 P=vec3(f,0.);',
  ' float D=1500.;vec3 Vp=vec3(uRes*.5+uView*D+vec2(uScroll*D*.30,uScroll*D*.22),D);vec3 V=normalize(Vp-P);',
  // fine grooves: hair-thin concentric lines of slightly different roughness, plus slow uneven wear
  ' float g=vn(r*2.3)*.5+vn(r*6.1)*.22;',
  ' float wob=1.+.24*g;',
  ' float cov=smoothstep(2.,26.,r);',   // right at the sun the grooves have no direction; it is covered by the sun itself
  ' float S=0.;',
  ' S+=2.2*ward(dir(12.,52.),V,T,B,.09*wob,.60);',      // key light overhead: the vertical bright axis
  ' S+=1.2*ward(dir(-17.,40.),V,T,B,.08*wob,.55);\n S+=2.1*ward(dir(-56.,46.),V,T,B,.095*wob,.62);',    // second light upper-left: the diagonal bright axis
  ' S+=.45*ward(dir(100.,30.),V,T,B,.20*wob,.75);',      // weak low fill from the right
  ' vec3 Ls=normalize(vec3(uSun,330.)-P);',
  ' S+=1.7*ward(Ls,V,T,B,.15*wob,.21)*cov;',             // the sun itself: a hot, tight reflection that falls off with distance
  ' S*=(1.+.08*g)*(.40+.60*exp(-r/900.));',
  ' float low=vn2(f/90.)*.5+vn2(f/23.)*.25;',            // slow, uneven sheen, so it is not mathematically perfect
  // reflected sky: pale, cool, brighter toward the sun
  ' float sky=.17+.15*exp(-r/640.)+.03*low;',
  ' vec3 F0=vec3(.93,.94,.96);',
  ' vec3 c=F0*(vec3(sky*.98,sky,sky*1.03)+S*vec3(1.,1.,1.02)+.014*g);',
  ' c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);',
  ' float lum=dot(c,vec3(.299,.587,.114));c*=mix(vec3(.89,.95,1.12),vec3(1.,.997,.988),smoothstep(.10,.78,lum));',
  ' c=clamp(c,0.,1.);c=c*c*(3.-2.*c)*.22+c*.78;',          // filmic roll-off: highlights go to white without clipping flat
  ' c=pow(max(c,0.),vec3(1./2.2));',
  ' c+=(h12(gl_FragCoord.xy)-.5)/255.*1.6;',            // dither: no banding
  ' gl_FragColor=vec4(c,1.);',
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
    ['uRes','uDpr','uSun','uView','uScroll'].forEach(function(n){U[n]=gl.getUniformLocation(pr,n);});
    bg.insertBefore(cv,L.nextSibling);   // above the CSS fallback, below the 3D buttons
    return true;
  }
  function size(){
    var dpr=Math.min(2,devicePixelRatio||1),w=innerWidth,h=innerHeight;
    cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);gl.viewport(0,0,cv.width,cv.height);
    gl.uniform1f(U.uDpr,dpr);gl.uniform2f(U.uRes,w,h);
  }
  var lastW=0,lastH=0;
  function draw(){
    if(!gl)return;
    if(innerWidth!==lastW||innerHeight!==lastH){lastW=innerWidth;lastH=innerHeight;size();}
    var maxS=Math.max(1,root.scrollHeight-innerHeight);
    gl.uniform2f(U.uSun,sun.x-scrollX,sun.y-scrollY);
    gl.uniform2f(U.uView,view.x,view.y+.12);   // at rest the viewer looks from a little below, as a phone is held
    gl.uniform1f(U.uScroll,REDUCED?0:(scrollY/maxS-.5));
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  function sched(){if(!raf)raf=requestAnimationFrame(function(){raf=0;layout();});}
  function sdraw(){if(!raf)raf=requestAnimationFrame(function(){raf=0;draw();});}

  /* tilt the phone (or move the pointer on a desktop) and the viewer moves, so the highlights slide across the grooves */
  function ease(){view.x+=(view.tx-view.x)*.12;view.y+=(view.ty-view.y)*.12;draw();
    if(Math.abs(view.tx-view.x)>.0005||Math.abs(view.ty-view.y)>.0005)loop=requestAnimationFrame(ease);else loop=0;}
  function kick(){if(!loop)loop=requestAnimationFrame(ease);}
  if(!REDUCED){
    addEventListener('deviceorientation',function(e){if(e.gamma==null||e.beta==null)return;
      if(!base)base={g:e.gamma,b:e.beta};
      view.tx=Math.max(-1,Math.min(1,(e.gamma-base.g)/35))*.32;view.ty=Math.max(-1,Math.min(1,(e.beta-base.b)/35))*.32;kick();},{passive:true});
    addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;
      view.tx=(e.clientX/innerWidth-.5)*.5;view.ty=(e.clientY/innerHeight-.5)*.5;kick();},{passive:true});
  }

  var ok=false;try{ok=initGL();}catch(err){ok=false;if(window.console)console.warn('brushed-bg: WebGL unavailable, using the CSS metal',err);if(cv&&cv.parentNode)cv.parentNode.removeChild(cv);gl=null;}
  layout();
  addEventListener('resize',sched);addEventListener('load',sched);addEventListener('scroll',sdraw,{passive:true});
  new ResizeObserver(sched).observe(body);
  var sunEl=document.querySelector('.sun-cta');if(sunEl)new ResizeObserver(sched).observe(sunEl);
  document.fonts&&document.fonts.ready.then(sched);
  [400,1200,3000].forEach(function(t){setTimeout(sched,t);});   // the solar system draws a moment after load
})();
