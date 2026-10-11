/* ?look=deep — starfield (3 depth layers), nebula, grain, pointer parallax. Static draws; motion is compositor-only CSS. */
(function(){
  if(document.getElementById('lookBg'))return;
  var bg=document.createElement('div');bg.id='lookBg';bg.setAttribute('aria-hidden','true');
  bg.innerHTML='<div class="neb"></div>';
  var layers=[{n:70,r:[.4,.9],a:.55,cls:'s1',par:6},{n:45,r:[.7,1.3],a:.8,cls:'s2',par:14},{n:16,r:[1.2,2.0],a:1,cls:'',par:28}];
  var cvs=layers.map(function(L){
    var c=document.createElement('canvas');c.width=1000;c.height=1000;if(L.cls)c.className=L.cls;
    var g=c.getContext('2d');
    for(var i=0;i<L.n;i++){
      var x=Math.random()*1000,y=Math.random()*1000,r=L.r[0]+Math.random()*(L.r[1]-L.r[0]);
      var hue=Math.random();var col=hue<.6?'255,255,255':hue<.85?'170,205,255':'255,226,196';
      var gr=g.createRadialGradient(x,y,0,x,y,r*3.2);
      gr.addColorStop(0,'rgba('+col+','+L.a+')');gr.addColorStop(.35,'rgba('+col+','+(L.a*.35)+')');gr.addColorStop(1,'rgba('+col+',0)');
      g.fillStyle=gr;g.beginPath();g.arc(x,y,r*3.2,0,6.2832);g.fill();
    }
    bg.appendChild(c);return c;});
  ['grain','vig'].forEach(function(k){var d=document.createElement('div');d.className=k;bg.appendChild(d);});
  document.body.insertBefore(bg,document.body.firstChild);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var tx=0,ty=0,raf=0;
  function apply(){raf=0;cvs.forEach(function(c,i){c.style.transform='translate3d('+(-tx*layers[i].par)+'px,'+(-ty*layers[i].par)+'px,0)';});}
  function set(x,y){tx=x;ty=y;if(!raf)raf=requestAnimationFrame(apply);}
  addEventListener('pointermove',function(e){set(e.clientX/innerWidth-.5,e.clientY/innerHeight-.5);},{passive:true});
  addEventListener('scroll',function(){set(tx,Math.min(1,scrollY/innerHeight)-.5);},{passive:true});
  addEventListener('deviceorientation',function(e){if(e.gamma==null)return;set(Math.max(-.5,Math.min(.5,e.gamma/60)),Math.max(-.5,Math.min(.5,(e.beta-45)/90)));},{passive:true});
})();
