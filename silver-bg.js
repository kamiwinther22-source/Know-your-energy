/* Front page background: polished silver. One smooth, gently dished metal sheet (no noise), reflecting a defined studio:
   a bright ceiling easing to a mid-grey horizon, and one softbox on the sun's side (up and to the right). Silver's measured reflectance.
   Computed per pixel; no image files. Fixed behind the page; nothing on the page moves. */
(function(){
var html=document.documentElement;if(!html.classList.contains('red'))return;
var Q=new URLSearchParams(location.search),num=function(k,d){var v=parseFloat(Q.get(k));return isNaN(v)?d:v;};
var NR=':not(:has(#resultsWrap[style*="block"]))',INK='#12161c';
var st=document.createElement('style');
st.textContent='html.red'+NR+',html.red'+NR+' body{background:#b9bcc1 !important}html.red'+NR+' body{background:transparent !important}'+
 '#silverBg{position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block}html.red:has(#resultsWrap[style*="block"]) #silverBg{display:none}'+
 'html.red.silver'+NR+' #hookStep *,html.red.silver'+NR+' .form-panel *,html.red.silver'+NR+' #formFields *{color:'+INK+' !important;-webkit-text-fill-color:'+INK+';text-shadow:none !important}'+
 'html.red.silver'+NR+' .line-field:not(.hero-email-field) *{color:#fff !important;-webkit-text-fill-color:#fff}'+
 'html.red.silver'+NR+' .line-field:not(.hero-email-field) input::placeholder{color:#fff !important;-webkit-text-fill-color:#fff}'+
 'html.red.silver'+NR+' .hero-email-field input::placeholder{color:'+INK+' !important;-webkit-text-fill-color:'+INK+'}'+
 'html.red.silver'+NR+' .rbtn *,html.red.silver'+NR+' .gen-btn *,html.red.silver'+NR+' .rel-chip *{color:'+INK+' !important;-webkit-text-fill-color:'+INK+'}'+
 'html.red.silver'+NR+' .r-b22 li:before{background:'+INK+' !important}';
document.head.appendChild(st);
var cv=document.createElement('canvas');cv.id='silverBg';document.body.insertBefore(cv,document.body.firstChild);
var gl=cv.getContext('webgl');if(!gl)return;html.classList.add('silver');
var F0=[.972,.960,.915];
var fs='precision highp float;uniform vec2 R;uniform vec3 F0;uniform vec2 SUN;uniform float FLOOR,KEY;\n'+
'float box(float a,float b,float ca,float cb,float ha,float hb,float s){return (1.-smoothstep(ha-s,ha+s,abs(a-ca)))*(1.-smoothstep(hb-s,hb+s,abs(b-cb)));}\n'+
'vec3 env(vec3 r){float zen=acos(clamp(r.z,-1.,1.));float az=atan(r.y,r.x);\n'+
'  float L=FLOOR+(1.-FLOOR)*(1.-smoothstep(.15,1.2,zen));\n'+
'  L+=KEY*box(az,degrees(zen),radians(42.),30.,radians(26.),13.,.03);\n'+
'  return vec3(L);}\n'+
'void main(){vec2 p=gl_FragCoord.xy;vec2 d=p-vec2(SUN.x,R.y-SUN.y);float k=.62/length(R)*1.9;\n'+
'  vec3 n=normalize(vec3(d*k,1.));vec3 v=vec3(0.,0.,1.);vec3 r=2.*dot(n,v)*n-v;float c=dot(n,v);vec3 F=F0+(1.-F0)*pow(1.-c,5.);\n'+
'  vec3 col=F*env(r);col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);gl_FragColor=vec4(pow(clamp(col,0.,1.),vec3(1./2.2)),1.);}';
function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.log(gl.getShaderInfoLog(o));return o;}
var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);var a=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
var U=function(n){return gl.getUniformLocation(pr,n);};
function draw(){var d=Math.min(1.5,devicePixelRatio||1),w=Math.round(innerWidth*d),h=Math.round(innerHeight*d);cv.width=w;cv.height=h;gl.viewport(0,0,w,h);
 gl.uniform2f(U('R'),w,h);gl.uniform3f(U('F0'),F0[0],F0[1],F0[2]);gl.uniform1f(U('FLOOR'),num('floor',.22));gl.uniform1f(U('KEY'),num('key',3));
 var host=document.getElementById('heroIllustration'),hr=host?host.getBoundingClientRect():{left:0,top:0,width:innerWidth,height:innerWidth/2};
 gl.uniform2f(U('SUN'),(hr.left+hr.width*.479)*d,(hr.top+hr.height*.54)*d);
 gl.drawArrays(gl.TRIANGLE_STRIP,0,4);window.__silver=1;}
var busy=false;function soon(){if(busy)return;busy=true;requestAnimationFrame(function(){busy=false;draw();});}
draw();addEventListener('resize',soon);addEventListener('scroll',soon,{passive:true});addEventListener('load',soon);setTimeout(soon,800);
})();
