/* Front page background: polished silver. A physically based reflection computed per pixel (own shader, no image files):
   a smooth curved silver sheet, its surface normal from the sheet's height, the reflection of a studio with ONE key light on the
   sun's side (upper right) and dark surroundings, silver's own reflectance (Fresnel), a tone curve. It sits fixed behind the page and
   takes no part in layout: nothing on the page moves. */
(function(){
if(!document.documentElement.classList.contains('red'))return;
var st=document.createElement('style');
st.textContent='html.red:not(:has(#resultsWrap[style*="block"])),html.red:not(:has(#resultsWrap[style*="block"])) body{background:#b9bcc1 !important}'+
 'html.red:not(:has(#resultsWrap[style*="block"])) body{background:transparent !important}'+
 '#silverBg{position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block}'+
 'html.red:has(#resultsWrap[style*="block"]) #silverBg{display:none}';
document.head.appendChild(st);
var cv=document.createElement('canvas');cv.id='silverBg';document.body.insertBefore(cv,document.body.firstChild);
var gl=cv.getContext('webgl',{antialias:false,preserveDrawingBuffer:false});if(!gl)return;
var Q=new URLSearchParams(location.search),num=function(k,d){var v=parseFloat(Q.get(k));return isNaN(v)?d:v;};
var vs='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
var fs='precision highp float;uniform vec2 R;uniform float K,SC,KEY,SEED;\n'+
'float hash(vec2 p){p=fract(p*vec2(123.34,456.21)+SEED);p+=dot(p,p+45.32);return fract(p.x*p.y);}\n'+
'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}\n'+
'float H(vec2 p){vec2 w=vec2(vn(p*.7+3.1),vn(p*.7+9.7))-.5;p+=w*1.6;return vn(p)*1.0+vn(p*2.1+5.)*.32;}\n'+
'vec3 env(vec3 r){vec3 s=normalize(vec3(.55,.62,.56));\n'+
'  float up=r.y;vec3 c=mix(vec3(.34,.35,.37),vec3(.86,.88,.91),smoothstep(-.3,.9,up));\n'+
'  c*=mix(.78,1.,smoothstep(-.9,.4,r.x));\n'+                       /* dark to the left, away from the sun */
'  float d=acos(clamp(dot(r,s),-1.,1.));\n'+
'  c+=KEY*vec3(1.,.99,.97)*(1.-smoothstep(.20,.30,d));\n'+         /* the key light: one large softbox on the sun side */
'  c+=KEY*2.2*vec3(1.)*(1.-smoothstep(.05,.075,d));\n'+            /* its hot core */
'  float st=abs(r.x-.86)*7.+abs(r.y-.1)*.7;c+=KEY*.9*(1.-smoothstep(.0,.55,st))*step(-.4,r.y)*step(r.y,.7);\n'+  /* tall strip light, right */
'  return c;}\n'+
'void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=vec2(uv.x*R.x/R.y,uv.y)*SC;float e=.002*SC;\n'+
'  float h=H(p),hx=H(p+vec2(e,0.))-h,hy=H(p+vec2(0.,e))-h;vec3 n=normalize(vec3(-hx/e*K,-hy/e*K,1.));\n'+
'  vec3 v=vec3(0.,0.,1.);vec3 r=2.*dot(n,v)*n-v;\n'+
'  float c=clamp(dot(n,v),0.,1.);vec3 F0=vec3(.972,.960,.915);vec3 F=F0+(1.-F0)*pow(1.-c,5.);\n'+   /* silver reflectance */
'  vec3 col=F*env(r);\n'+
'  col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);\n'+          /* filmic tone curve */
'  gl_FragColor=vec4(pow(clamp(col,0.,1.),vec3(1./2.2)),1.);}';
function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){console.log(gl.getShaderInfoLog(o));}return o;}
var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
var a=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
var U=function(n){return gl.getUniformLocation(pr,n);};
function draw(){var d=Math.min(2,devicePixelRatio||1),w=Math.round(innerWidth*d),h=Math.round(innerHeight*d);cv.width=w;cv.height=h;gl.viewport(0,0,w,h);
 gl.uniform2f(U('R'),w,h);gl.uniform1f(U('K'),num('k',.8));gl.uniform1f(U('SC'),num('sc',.75));gl.uniform1f(U('KEY'),num('key',3.0));gl.uniform1f(U('SEED'),num('seed',.37));
 gl.drawArrays(gl.TRIANGLE_STRIP,0,4);window.__silver=1;}
draw();addEventListener('resize',draw);
})();
