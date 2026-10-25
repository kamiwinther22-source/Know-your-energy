/* ?look=chrome — the page background is one polished metal surface, curved like a large dome across the whole page, reflecting a studio with
   one light at the sun's upper-right direction. The curve makes the reflection sweep across the page in large crisp shapes. Only the background
   is drawn; every field, button and picture on the page is the page's own. The results page is left alone. */
(function(){
  var root=document.documentElement,body=document.body;
  var cv=document.createElement('canvas');cv.id='chromeBg';cv.setAttribute('aria-hidden','true');body.insertBefore(cv,body.firstChild);
  var gl=cv.getContext('webgl',{antialias:false});if(!gl){cv.remove();return;}
  var VS='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var FS=['precision highp float;uniform vec2 res;uniform float dpr;',
  'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
  'vec3 env(vec3 r,vec3 S){',
  ' float a=acos(clamp(dot(r,S),-1.,1.));',
  ' float box=1.-smoothstep(.60,.612,a);float ring=1.-smoothstep(1.12,1.132,a);',
  ' vec3 boxc=mix(vec3(.74),vec3(.98,.97,.94),smoothstep(.5,.1,a));',
  ' vec3 ringc=mix(vec3(.50,.50,.51),vec3(.30,.30,.31),smoothstep(.6,1.12,a));',
  ' vec3 room=mix(vec3(.26,.26,.27),vec3(.34,.34,.35),smoothstep(-.02,.75,r.y));',
  ' float fl=smoothstep(0.,-.015,r.y);room=mix(room,mix(vec3(.30),vec3(.22),smoothstep(0.,-.8,r.y)),fl);',
  ' vec3 c=mix(room,ringc,ring);c=mix(c,boxc,box);',
  ' c+=vec3(1.7,1.65,1.5)*(1.-smoothstep(.13,.142,a));return c;}',
  'void main(){',
  ' vec2 fc=gl_FragCoord.xy;vec2 pc=vec2(fc.x,res.y-fc.y)/dpr;',
  ' vec2 u=vec2((pc.x-res.x/dpr*.5)/(res.x/dpr*.5),(pc.y-res.y/dpr*.5)/(res.y/dpr*.5));',
  ' float tx=.20+.55*u.x,ty=.19-.46*u.y;',
  ' vec3 n=normalize(vec3(tx,ty,1.));',
  ' vec3 S=normalize(vec3(.62,.55,.56));',
  ' vec3 r=reflect(vec3(0.,0.,-1.),n);',
  ' vec3 F0=vec3(.95,.94,.93);float nd=clamp(n.z,0.,1.);vec3 F=F0+(1.-F0)*pow(1.-nd,5.);',
  ' vec3 col=clamp(F*env(r,S),0.,1.);col=mix(col,col*col*(3.-2.*col),.5);col=pow(col,vec3(1./2.2));',
  ' col+=(hash(fc)-.5)/255.;gl_FragColor=vec4(col,1.);}'].join('\n');
  function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(o));return null;}return o;}
  var vs=sh(gl.VERTEX_SHADER,VS),fs=sh(gl.FRAGMENT_SHADER,FS);if(!vs||!fs){cv.remove();return;}
  var pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);gl.useProgram(pr);
  var bf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  var al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  var raf=0;
  function render(){raf=0;
    if(root.querySelector('#resultsWrap[style*="block"]'))return;
    var cw=root.clientWidth,ch=Math.max(root.scrollHeight,body.scrollHeight),dpr=Math.min(2,devicePixelRatio||1);if(ch*dpr>4096)dpr=4096/ch;
    var W=Math.round(cw*dpr),H=Math.round(ch*dpr);cv.width=W;cv.height=H;cv.style.width=cw+'px';cv.style.height=ch+'px';
    gl.uniform2f(gl.getUniformLocation(pr,'res'),W,H);gl.uniform1f(gl.getUniformLocation(pr,'dpr'),dpr);
    gl.viewport(0,0,W,H);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}
  function queue(){if(!raf)raf=setTimeout(render,120);}
  render();
  if(window.ResizeObserver)new ResizeObserver(queue).observe(body);
  addEventListener('resize',queue);addEventListener('load',queue);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(queue);
})();
