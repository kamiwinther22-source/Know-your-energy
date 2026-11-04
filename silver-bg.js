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
var fs='precision highp float;uniform vec2 R;uniform float K,SC,KEY,SEED,LO,HI,BASE,DPR,RK;uniform vec4 HR;uniform sampler2D T;\n'+
'float hash(vec2 p){p=fract(p*vec2(123.34,456.21)+SEED);p+=dot(p,p+45.32);return fract(p.x*p.y);}\n'+
'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}\n'+
'float H(vec2 p){vec2 w=vec2(vn(p*.7+3.1),vn(p*.7+9.7))-.5;p+=w*1.6;return vn(p)*1.0+vn(p*2.1+5.)*.32;}\n'+
'float pane(float a,float b,float ca,float cb,float ha,float hb){return (1.-smoothstep(ha-.012,ha+.012,abs(a-ca)))*(1.-smoothstep(hb-.012,hb+.012,abs(b-cb)));}\n'+
'vec3 env(vec3 r){vec3 s=normalize(vec3(.55,.62,.56));\n'+
'  float up=r.y;vec3 c=mix(vec3(LO),vec3(HI),smoothstep(-.3,.9,up));\n'+
'  c*=mix(.5,1.,smoothstep(-.9,.4,r.x));\n'+                       /* dark to the left, away from the sun */
'  float d=acos(clamp(dot(r,s),-1.,1.));\n'+
'  float th=atan(r.x,r.z),ph=asin(clamp(r.y,-1.,1.));\n'+
'  c+=KEY*1.3*vec3(1.)*pane(th,ph,.80,.45,.34,.22)+KEY*1.1*pane(th,ph,.38,.80,.10,.30)+KEY*.9*pane(th,ph,1.15,.05,.07,.45)+KEY*.7*pane(th,ph,.05,.55,.30,.08);\n'+
'  c+=KEY*.35*vec3(1.)*(1.-smoothstep(.20,.34,d));\n'+         /* the key light: one large softbox on the sun side */
'  c+=KEY*2.2*vec3(1.)*(1.-smoothstep(.05,.075,d));\n'+            /* its hot core */
'  float st=abs(r.x-.86)*7.+abs(r.y-.1)*.7;c+=KEY*.9*(1.-smoothstep(.0,.55,st))*step(-.4,r.y)*step(r.y,.7);\n'+  /* tall strip light, right */
'  return c;}\n'+
'void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=vec2(uv.x*R.x/R.y,uv.y)*SC;float e=.002*SC;\n'+
'  float h=H(p),hx=H(p+vec2(e,0.))-h,hy=H(p+vec2(0.,e))-h;vec3 n=normalize(vec3(-hx/e*K,-hy/e*K,1.));\n'+
'  vec3 v=vec3(0.,0.,1.);vec3 r=2.*dot(n,v)*n-v;\n'+
'  float c=clamp(dot(n,v),0.,1.);vec3 F0=vec3(.972,.960,.915);vec3 F=F0+(1.-F0)*pow(1.-c,5.);\n'+   /* silver reflectance */
'  vec3 col=F*env(r);\n'+
'  vec2 css=vec2(gl_FragCoord.x,R.y-gl_FragCoord.y)/DPR;float dist=css.y-BASE;\n'+
'  if(dist>0.){vec2 m=vec2(css.x,BASE-dist)+n.xy*(18.+dist*.12);float bl=.35+dist*.012;vec4 acc=vec4(0.);\n'+
'    for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 q=m+vec2(cos(a),sin(a))*bl*(i<4?.5:1.);vec2 uv=(q-HR.xy)/HR.zw;\n'+
'      if(uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.)acc+=texture2D(T,uv);}\n'+
'    acc/=8.;float fade=RK*exp(-dist/105.)*(.55+.45*c);col=col*(1.-acc.a*fade)+acc.rgb*fade*1.1;}\n'+
'  col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);\n'+          /* filmic tone curve */
'  gl_FragColor=vec4(pow(clamp(col,0.,1.),vec3(1./2.2)),1.);}';
function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){console.log(gl.getShaderInfoLog(o));}return o;}
var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
var a=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
var U=function(n){return gl.getUniformLocation(pr,n);};
var tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
var host=null,have=false;
function draw(){var d=Math.min(2,devicePixelRatio||1),w=Math.round(innerWidth*d),h=Math.round(innerHeight*d);cv.width=w;cv.height=h;gl.viewport(0,0,w,h);
 gl.uniform2f(U('R'),w,h);gl.uniform1f(U('K'),num('k',1.5));gl.uniform1f(U('SC'),num('sc',.9));gl.uniform1f(U('KEY'),num('key',4));gl.uniform1f(U('LO'),num('lo',.2));gl.uniform1f(U('HI'),num('hi',.92));gl.uniform1f(U('SEED'),num('seed',.37));
 gl.uniform1i(U('T'),0);gl.uniform1f(U('DPR'),d);gl.uniform1f(U('RK'),have?num('refl',1.0):0);
 host=host||document.getElementById('heroIllustration');var hr=host?host.getBoundingClientRect():{left:0,top:0,width:1,height:1};
 gl.uniform4f(U('HR'),hr.left,hr.top,hr.width,hr.height);gl.uniform1f(U('BASE'),hr.top+hr.height*num('base',.79));
 gl.drawArrays(gl.TRIANGLE_STRIP,0,4);window.__silver=1;}
/* the page's own hook: called right after each frame of the solar system is drawn, with its canvas; the silver page reflects it live */
window.__reflHook=function(c){try{gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);have=true;draw();}catch(e){}};
draw();addEventListener('resize',draw);
})();
