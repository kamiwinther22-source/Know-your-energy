/* Front page background: a polished silver sheet, computed per pixel (own shader, no image files, nothing from old files).
   The only light is the sun, a point just above the page at the sphere. The things that stand up on the page (buttons, fields) are
   measured from the live page; each one casts a shadow away from the sun (length from its height and its distance from the sun) and
   shows a reflection of itself in the metal beneath it. The sun and rings are reflected live through the page's own hook.
   It sits fixed behind the page and takes no part in layout: nothing on the page moves. */
(function(){
if(!document.documentElement.classList.contains('red'))return;
var st=document.createElement('style');
st.textContent='html.red:not(:has(#resultsWrap[style*="block"])),html.red:not(:has(#resultsWrap[style*="block"])) body{background:#b9bcc1 !important}'+
 'html.red:not(:has(#resultsWrap[style*="block"])) body{background:transparent !important}'+
 '#silverBg{position:fixed;left:0;top:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block}'+
 'html.red:has(#resultsWrap[style*="block"]) #silverBg{display:none}';
var NR=':not(:has(#resultsWrap[style*="block"]))',INK='#12161c';
/* on the silver page the lettering is dark ink; the dark cut-in fields keep their own light lettering */
st.textContent+='html.red.silver'+NR+' #hookStep *,html.red.silver'+NR+' .form-panel *,html.red.silver'+NR+' #formFields *{color:'+INK+' !important;-webkit-text-fill-color:'+INK+';text-shadow:none !important}'+
 'html.red.silver'+NR+' .line-field:not(.hero-email-field) *{color:#fff !important;-webkit-text-fill-color:#fff}'+
 'html.red.silver'+NR+' .line-field:not(.hero-email-field) input::placeholder{color:#fff !important;-webkit-text-fill-color:#fff}'+
 'html.red.silver'+NR+' .hero-email-field input::placeholder{color:'+INK+' !important;-webkit-text-fill-color:'+INK+'}'+
 'html.red.silver'+NR+' .rbtn *,html.red.silver'+NR+' .gen-btn *,html.red.silver'+NR+' .rel-chip *{color:'+INK+' !important;-webkit-text-fill-color:'+INK+'}';
st.textContent+='html.red.silver'+NR+' .r-b22 li:before{background:'+INK+' !important}';
document.head.appendChild(st);
var cv=document.createElement('canvas');cv.id='silverBg';document.body.insertBefore(cv,document.body.firstChild);
var gl=cv.getContext('webgl',{antialias:false});if(!gl)return;document.documentElement.classList.add('silver');
var Q=new URLSearchParams(location.search),num=function(k,d){var v=parseFloat(Q.get(k));return isNaN(v)?d:v;};
var NB=16;
var vs='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
var fs='precision highp float;uniform vec2 R;uniform float K,SC,KEY,SEED,LO,HI,BASE,DPR,RK,LH,PW,SH;uniform vec2 SUN;uniform vec4 HR;uniform sampler2D T;\n'+
'uniform int N;uniform vec4 BX['+NB+'];uniform vec4 BC['+NB+'];\n'+      /* BX = x,y,w,h in css px; BC = reflection colour (rgb) and height (a) */
'float hash(vec2 p){p=fract(p*vec2(123.34,456.21)+SEED);p+=dot(p,p+45.32);return fract(p.x*p.y);}\n'+
'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}\n'+
'float H(vec2 p){vec2 w=vec2(vn(p*.7+3.1),vn(p*.7+9.7))-.5;p+=w*1.6;return vn(p)*1.0+vn(p*2.1+5.)*.32;}\n'+
'float sdb(vec2 p,vec4 b,float hex){vec2 c=b.xy+b.zw*.5,hs=b.zw*.5,a=abs(p-c);float bx=max(a.x-hs.x,a.y-hs.y);if(hex>.5){float cc=min(25.,hs.y);vec2 A=vec2(hs.x-cc,hs.y);vec2 nn=normalize(vec2(hs.y,cc));bx=max(bx,dot(a-A,nn));}return bx;}\n'+
'void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=vec2(uv.x*R.x/R.y,uv.y)*SC;float e=.002*SC;\n'+
'  float h=H(p),hx=H(p+vec2(e,0.))-h,hy=H(p+vec2(0.,e))-h;vec3 n=normalize(vec3(-hx/e*K,-hy/e*K,1.));\n'+
'  vec3 v=vec3(0.,0.,1.);vec3 r=2.*dot(n,v)*n-v;\n'+
'  float c=clamp(dot(n,v),0.,1.);vec3 F0=vec3(.972,.960,.915);vec3 F=F0+(1.-F0)*pow(1.-c,5.);\n'+
'  vec2 cs=vec2(gl_FragCoord.x,R.y-gl_FragCoord.y)/DPR;\n'+
/* the sun: a point light just above the page at the sphere */
'  vec3 tl=vec3(SUN-cs,LH);vec3 Ld=normalize(vec3(tl.x,-tl.y,tl.z));float dl=length(tl.xy);\n'+
'  float al=clamp(dot(r,Ld),0.,1.);float sp=exp((al-1.)*PW)*3.2+exp((al-1.)*PW*.18)*.7+exp((al-1.)*2.5)*.12;\n'+
'  float att=1./(1.+pow(dl/(R.y/DPR*.5),2.));\n'+
/* shadows: march from this point toward the sun; anything standing up on the way blocks it, softer the higher the ray is */
'  float occ=0.;\n'+
'  for(int s=1;s<10;s++){float t=float(s)/10.;vec2 q=mix(cs,SUN,t);float z=LH*t;\n'+
'    for(int i=0;i<'+NB+';i++){if(i>=N)break;float bh=abs(BC[i].a);if(z<bh){float d=sdb(q,BX[i],BC[i].a<0.?1.:0.);occ=max(occ,1.-smoothstep(-1.,1.5+z*SH,d));}}}\n'+
/* the metal: dark where it reflects the far, unlit room; bright where the sun's light is thrown back */
'  float up=clamp(r.y*.5+.5,0.,1.);vec3 envc=mix(vec3(LO),vec3(HI),smoothstep(.15,.95,up))*mix(.45,1.,att);\n'+
'  vec3 col=F*envc*(1.-.45*occ)+F*KEY*sp*att*(1.-occ);\n'+
/* a reflection of each standing thing in the metal below it */
'  for(int i=0;i<'+NB+';i++){if(i>=N)break;vec4 b=BX[i];float rl=min(abs(BC[i].a)*2.2,34.);float cch=BC[i].a<0.?min(25.,b.w*.5):0.;float dy=cs.y-(b.y+b.w);\n'+
'    if(dy>0.&&dy<rl){float inx=smoothstep(b.x+cch-1.,b.x+cch+3.,cs.x)*(1.-smoothstep(b.x+b.z-cch-3.,b.x+b.z-cch+1.,cs.x));float k=pow(1.-dy/rl,1.6)*.6*inx;col=mix(col,BC[i].rgb*(.55+.45*sp),k);}}\n'+
/* the sun and its rings, mirrored */
'  float dist=cs.y-BASE;\n'+
'  if(dist>0.){vec2 m=vec2(cs.x,BASE-dist)+n.xy*(18.+dist*.12);float bl=.35+dist*.012;vec4 acc=vec4(0.);\n'+
'    for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 q=m+vec2(cos(a),sin(a))*bl*(i<4?.5:1.);vec2 u2=(q-HR.xy)/HR.zw;\n'+
'      if(u2.x>0.&&u2.x<1.&&u2.y>0.&&u2.y<1.)acc+=texture2D(T,u2);}\n'+
'    acc/=8.;float fade=RK*exp(-dist/105.)*(.55+.45*c);col=col*(1.-acc.a*fade)+acc.rgb*fade*1.1;}\n'+
'  col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);\n'+
'  gl_FragColor=vec4(pow(clamp(col,0.,1.),vec3(1./2.2)),1.);}';
function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS)){console.log(gl.getShaderInfoLog(o));}return o;}
var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
var a=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
var U=function(n){return gl.getUniformLocation(pr,n);};
var tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));
var host=null,have=false,lastKey='';
/* what stands up on the page: [selector, height in px, reflected colour] */
var THINGS=[['.hero-continue-btn',-16,[.80,.82,.86]],['.gen-btn',-16,[.80,.82,.86]],['.rel-chip',-10,[.80,.82,.86]],['.hero-email-field',7,[.07,.06,.07]],['.line-field',7,[.07,.06,.07]]];
function things(){var bx=[],bc=[],vh=innerHeight;
  THINGS.forEach(function(t){document.querySelectorAll(t[0]).forEach(function(el){if(bx.length>=NB*4)return;var r=el.getBoundingClientRect();
    if(r.width<4||r.height<4||r.bottom<-40||r.top>vh+40)return;bx.push(r.left,r.top,r.width,r.height);bc.push(t[2][0],t[2][1],t[2][2],t[1]);});});
  var n=Math.min(NB,bx.length/4);return {n:n,bx:new Float32Array(bx.slice(0,n*4).concat(new Array(NB*4-n*4).fill(0))),bc:new Float32Array(bc.slice(0,n*4).concat(new Array(NB*4-n*4).fill(0)))};}
function draw(){var d=Math.min(1.5,devicePixelRatio||1),w=Math.round(innerWidth*d),h=Math.round(innerHeight*d);
 if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}gl.viewport(0,0,w,h);
 gl.uniform2f(U('R'),w,h);gl.uniform1f(U('K'),num('k',2.3));gl.uniform1f(U('SC'),num('sc',.9));gl.uniform1f(U('KEY'),num('key',4));
 gl.uniform1f(U('LO'),num('lo',.14));gl.uniform1f(U('HI'),num('hi',.85));gl.uniform1f(U('SEED'),num('seed',.37));gl.uniform1f(U('PW'),num('pw',160));gl.uniform1f(U('SH'),num('sh',.7));
 gl.uniform1f(U('DPR'),d);gl.uniform1f(U('LH'),num('lh',90));gl.uniform1f(U('RK'),have?num('refl',1.0):0);gl.uniform1i(U('T'),0);
 host=host||document.getElementById('heroIllustration');var hr=host?host.getBoundingClientRect():{left:0,top:0,width:1,height:1};
 gl.uniform4f(U('HR'),hr.left,hr.top,hr.width,hr.height);gl.uniform2f(U('SUN'),hr.left+hr.width*num('sx',.479),hr.top+hr.height*num('sy',.54));gl.uniform1f(U('BASE'),hr.top+hr.height*num('base',.79));
 var th=things();gl.uniform1i(U('N'),th.n);gl.uniform4fv(U('BX[0]'),th.bx);gl.uniform4fv(U('BC[0]'),th.bc);
 gl.drawArrays(gl.TRIANGLE_STRIP,0,4);window.__silver=1;}
var busy=false;function soon(){if(busy)return;busy=true;requestAnimationFrame(function(){busy=false;draw();});}
var lastHook=0;
/* the page's own hook: called right after each frame of the solar system is drawn, with its canvas; the silver page reflects it live */
window.__reflHook=function(c){var t=performance.now();if(t-lastHook<80)return;lastHook=t;try{gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);have=true;draw();}catch(e){}};
draw();addEventListener('resize',soon);addEventListener('scroll',soon,{passive:true});addEventListener('load',soon);setTimeout(soon,600);setTimeout(soon,2000);
})();
