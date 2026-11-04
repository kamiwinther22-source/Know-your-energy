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
var fs=[
'precision highp float;uniform vec2 R;uniform float K,SC,KEY,SEED,LO,HI,BASE,DPR,RK,LH,LR,KD,NS;uniform vec2 SUN;uniform vec4 HR;uniform sampler2D T;',
'uniform int N;uniform vec4 BX[16];uniform vec4 BC[16];',      /* BX = x,y,w,h (css px, y down); BC = colour rgb, height (negative = hex outline) */
'float hash(vec2 p){p=fract(p*vec2(123.34,456.21)+SEED);p+=dot(p,p+45.32);return fract(p.x*p.y);}',
'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',
'float H(vec2 p){vec2 w=vec2(vn(p*.7+3.1),vn(p*.7+9.7))-.5;p+=w*1.6;return vn(p)*1.0+vn(p*2.1+5.)*.32;}',
/* ray against one convex slab of space; used for every face of every standing thing */
'void pl(vec3 o,vec3 rd,vec3 n,float d,inout float tn,inout float tf,inout vec3 nn){float den=dot(n,rd),num=d-dot(n,o);',
'  if(abs(den)<1e-6){if(num<0.)tf=-1e9;return;}float t=num/den;if(den<0.){if(t>tn){tn=t;nn=n;}}else tf=min(tf,t);}',
'float hitObj(vec4 b,float ha,vec3 ro,vec3 rd,out vec3 nn){float h=abs(ha);vec2 hs=b.zw*.5;vec3 o=ro-vec3(b.xy+hs,0.);',
'  float tn=-1e9,tf=1e9;nn=vec3(0.,0.,1.);',
'  pl(o,rd,vec3(1,0,0),hs.x,tn,tf,nn);pl(o,rd,vec3(-1,0,0),hs.x,tn,tf,nn);pl(o,rd,vec3(0,1,0),hs.y,tn,tf,nn);pl(o,rd,vec3(0,-1,0),hs.y,tn,tf,nn);',
'  pl(o,rd,vec3(0,0,1),h,tn,tf,nn);pl(o,rd,vec3(0,0,-1),0.,tn,tf,nn);',
'  if(ha<0.){float cc=min(25.,hs.y);vec2 q=normalize(vec2(hs.y,cc));float d=dot(vec2(hs.x-cc,hs.y),q);',
'    pl(o,rd,vec3(q.x,q.y,0.),d,tn,tf,nn);pl(o,rd,vec3(-q.x,q.y,0.),d,tn,tf,nn);pl(o,rd,vec3(q.x,-q.y,0.),d,tn,tf,nn);pl(o,rd,vec3(-q.x,-q.y,0.),d,tn,tf,nn);}',
'  if(tn<tf&&tn>1e-3&&tf>0.)return tn;return -1.;}',
'float hitSph(vec3 ro,vec3 rd,vec3 c,float r){vec3 oc=ro-c;float b=dot(oc,rd),cc=dot(oc,oc)-r*r,d=b*b-cc;if(d<0.)return -1.;float t=-b-sqrt(d);return t>1e-3?t:-1.;}',
'bool blocked(vec3 P,vec3 Q){vec3 d=Q-P;float L=length(d);vec3 rd=d/L,nn;for(int i=0;i<16;i++){if(i>=N)break;float t=hitObj(BX[i],BC[i].a,P,rd,nn);if(t>0.&&t<L)return true;}return false;}',
/* what a ray sees when it leaves the sheet: the standing things, the sun's light, or the dim far room, brighter on the sun's side */
'vec3 world(vec3 P,vec3 rd,vec3 LP){float best=1e9;vec3 balb=vec3(-1.);vec3 bn=vec3(0.,0.,1.);vec3 nn;',
'  for(int i=0;i<16;i++){if(i>=N)break;float t=hitObj(BX[i],BC[i].a,P,rd,nn);if(t>0.&&t<best){best=t;balb=BC[i].rgb;bn=nn;}}',
'  float ts=hitSph(P,rd,LP,LR);',
'  if(ts>0.&&ts<best){float fc=clamp(dot(-rd,normalize(P+rd*ts-LP)),0.,1.);return vec3(KEY*1.5*(.12+.88*pow(fc,2.2)));}',
'  if(balb.x>=0.){vec3 Q=P+rd*best;vec3 ld=normalize(LP-Q);float dd=length(LP-Q);float e=KEY*.5*LR*LR/(dd*dd);',
'    float df=max(dot(bn,ld),0.);float sp=exp((dot(reflect(rd,bn),ld)-1.)*40.);if(blocked(Q+bn*.6,LP))df*=.15;',
'    vec3 al=balb;return al*(.14+KD*.25*e*df*8.)+vec3(KEY*.5*sp*min(e*60.,1.));}',
'  vec2 sd=normalize(SUN-P.xy+1e-3);float f=dot(normalize(rd.xy+1e-4),sd)*.5+.5;',
'  return mix(vec3(LO),vec3(HI),pow(clamp(rd.z,0.,1.),.6))*mix(.5,1.,f);}',
'void main(){vec2 cs=vec2(gl_FragCoord.x,R.y-gl_FragCoord.y)/DPR;vec2 p=vec2(cs.x/(R.y/DPR),1.-cs.y/(R.y/DPR))*SC;float e=.002*SC;',
'  float h=H(p),hx=H(p+vec2(e,0.))-h,hy=H(p+vec2(0.,e))-h;vec2 sl=vec2(-hx,hy)/e*K;sl=sl/(1.+length(sl)*1.5);vec3 n=normalize(vec3(sl,1.));',     /* image y is down, so the slope in y flips */
'  vec3 v=vec3(0.,0.,1.);vec3 r=2.*dot(n,v)*n-v;float c=clamp(dot(n,v),0.,1.);',
'  vec3 F0=vec3(.972,.960,.915);vec3 F=F0+(1.-F0)*pow(1.-c,5.);',
'  vec3 P=vec3(cs,0.);vec3 LP=vec3(SUN,LH);',
'  vec3 refl=world(P+vec3(0.,0.,.01),normalize(r),LP);',
/* the sun as an area light: its light on the satin of the sheet, with soft shadows from everything that stands up */
'  float rot=hash(gl_FragCoord.xy)*6.2831;vec3 tl=normalize(LP-P);vec3 ax=normalize(cross(tl,vec3(0.,0.,1.)));vec3 ay=cross(ax,tl);float lit=0.;',
'  for(int s=0;s<12;s++){float fr=(float(s)+.5)/12.,ph=rot+float(s)*2.39996;vec3 Q=LP+(ax*cos(ph)+ay*sin(ph))*LR*sqrt(fr);',
'    vec3 ld=normalize(Q-P);float cs2=max(ld.z,0.);if(cs2>0.&&!blocked(P+vec3(0.,0.,.4),Q))lit+=cs2;}lit/=12.;',
'  float dd=length(LP-P);float E=KEY*.5*LR*LR/(dd*dd);',
'  vec3 col=F*refl+vec3(.62,.63,.65)*KD*E*lit*8.;',
/* the sun and its rings, mirrored */
'  float dist=cs.y-BASE;',
'  if(dist>0.){vec2 m=vec2(cs.x,BASE-dist)+n.xy*(18.+dist*.12);float bl=.35+dist*.012;vec4 acc=vec4(0.);',
'    for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 q=m+vec2(cos(a),sin(a))*bl*(i<4?.5:1.);vec2 u2=(q-HR.xy)/HR.zw;',
'      if(u2.x>0.&&u2.x<1.&&u2.y>0.&&u2.y<1.)acc+=texture2D(T,u2);}',
'    acc/=8.;float fade=RK*exp(-dist/105.)*(.55+.45*c);col=col*(1.-acc.a*fade)+acc.rgb*fade*1.1;}',
'  col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);',
'  gl_FragColor=vec4(pow(clamp(col,0.,1.),vec3(1./2.2)),1.);}'
].join('\n');
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
 gl.uniform2f(U('R'),w,h);gl.uniform1f(U('K'),num('k',1.8));gl.uniform1f(U('SC'),num('sc',.9));gl.uniform1f(U('KEY'),num('key',6));
 gl.uniform1f(U('LO'),num('lo',.14));gl.uniform1f(U('HI'),num('hi',.55));gl.uniform1f(U('SEED'),num('seed',.55));gl.uniform1f(U('LR'),num('lr',70));gl.uniform1f(U('KD'),num('kd',.4));
 gl.uniform1f(U('DPR'),d);gl.uniform1f(U('LH'),num('lh',140));gl.uniform1f(U('RK'),have?num('refl',1.0):0);gl.uniform1i(U('T'),0);
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
