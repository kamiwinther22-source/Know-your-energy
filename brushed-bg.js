/* ?look=final — puts the brushed-metal background (metal-background/metal-bg.css) behind the page, centred on the sun (.sun-cta).
   ?bg=old skips it and brings back the old polished sheet. */
(function(){
  if(/[?&]bg=old\b/.test(location.search))return;
  var body=document.body,root=document.documentElement;
  ['metal-background/metal-bg.css','look-brushed.css'].forEach(function(h){var l=document.createElement('link');l.rel='stylesheet';l.href=h;document.head.appendChild(l);});
  var bg=document.getElementById('metalBg');if(!bg){bg=document.createElement('div');bg.id='metalBg';bg.setAttribute('aria-hidden','true');body.insertBefore(bg,body.firstChild);}
  var L=document.createElement('div');L.id='brushBg';L.className='metal-layer';bg.insertBefore(L,bg.firstChild);
  function layout(){
    var s=document.querySelector('.sun-cta');if(!s)return;
    var r=s.getBoundingClientRect();if(!r.width)return;   // sun hidden (form step): keep the last position
    L.style.setProperty('--metal-x',(r.left+r.width/2+scrollX).toFixed(1)+'px');
    L.style.setProperty('--metal-y',(r.top+r.height/2+scrollY).toFixed(1)+'px');
    L.style.height=Math.max(root.scrollHeight,innerHeight)+'px';
  }
  var raf=0;function sched(){if(!raf)raf=requestAnimationFrame(function(){raf=0;layout();});}
  layout();addEventListener('resize',sched);addEventListener('load',sched);
  new ResizeObserver(sched).observe(body);
  var sun=document.querySelector('.sun-cta');if(sun)new ResizeObserver(sched).observe(sun);
  document.fonts&&document.fonts.ready.then(sched);
  [400,1200,3000].forEach(function(t){setTimeout(sched,t);});   // the solar system draws a moment after load
})();
