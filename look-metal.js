/* ?look=metal — one light source (the sun). The page is a lit metal surface; every raised or cut element is lit from the sun's real position. */
(function(){
  var root=document.documentElement,body=document.body;
  var bg=document.createElement('div');bg.id='metalBg';bg.setAttribute('aria-hidden','true');body.insertBefore(bg,body.firstChild);
  var LIT=['.brand-row','#hookStep>div[style*="292px"]','.free-reading-line','.hero-email-wrap','.hero-email-field','.hero-continue-btn','.gen-btn','.price-row','.rel-chip','.toggle-pill','.row-id','.line-field','.f','.person-tag','.pricing-panel','.state-banner-ttl','.hero-key','.section-lbl','.toggle-row'].join(',');
  var TILTED='.hero-continue-btn,.gen-btn,.price-row,.rel-chip',TILT=-12;
  // field: smooth anisotropic sheen around the sun (two bright wedges, two soft dark ones), fading toward the edges
  var BASE=[.88,.875,.86],LO=.68,HI=1.26,FAR=.90;
  function conic(sx,sy){
    var st=[];for(var a=0;a<=360;a+=15){var t=(a-90)*Math.PI/180,w=.5+.5*Math.cos(2*(t+.7)),F=LO+(HI-LO)*w;
      st.push('rgb('+BASE.map(function(c){return Math.round(Math.min(1,c*F)*255);}).join(',')+') '+a+'deg');}
    var lo='rgba('+BASE.map(function(c){return Math.round(c*FAR*255);}).join(',')+',.55)';
    return 'radial-gradient(circle 1500px at '+sx+'px '+sy+'px,rgba(0,0,0,0) 0%,'+lo+' 100%),conic-gradient(from 0deg at '+sx+'px '+sy+'px,'+st.join(',')+')';
  }
  var cv=document.createElement('canvas');cv.id='metalGrain';bg.appendChild(cv);var gKey='';
  function grain(sx,sy,W,H){
    var key=[sx|0,sy|0,W|0,H|0,devicePixelRatio].join();if(key===gKey)return;gKey=key;
    var dpr=Math.min(2,devicePixelRatio||1);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.width=W+'px';cv.style.height=H+'px';
    var g=cv.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,W,H);
    var R=Math.hypot(Math.max(sx,W-sx),Math.max(sy,H-sy))+4,st=.5,n=Math.ceil(R/st),a=new Float32Array(n),s=1234567,v1=0,v2=0,i,sum=0,sq=0;
    function rnd(){s=(s*16807)%2147483647;return s/2147483647;}
    for(i=0;i<n;i++){v1=v1*.8+(rnd()-.5);v2=v2*.99+(rnd()-.5)*.18;a[i]=v1+v2*1.2;sum+=a[i];}
    var m=sum/n;for(i=0;i<n;i++){a[i]-=m;sq+=a[i]*a[i];}var sd=Math.sqrt(sq/n)||1,AMP=.10;
    g.lineWidth=.7;
    for(i=1;i<n;i++){var v=a[i]/sd*AMP;if(Math.abs(v)<.01)continue;g.strokeStyle=v>0?'rgba(255,255,255,'+Math.min(.5,v)+')':'rgba(0,0,0,'+Math.min(.5,-v)+')';g.beginPath();g.arc(sx,sy,i*st,0,6.2832);g.stroke();}
  }
  function layout(){
    var s=document.querySelector('.sun-cta');if(!s)return;
    var r=s.getBoundingClientRect(),sx=r.left+r.width/2+scrollX,sy=r.top+r.height/2+scrollY;
    root.style.setProperty('--sx',sx+'px');root.style.setProperty('--sy',sy+'px');
    bg.style.height=Math.max(document.documentElement.scrollHeight,innerHeight)+'px';bg.style.width=Math.max(document.documentElement.scrollWidth,innerWidth)+'px';
    bg.style.backgroundImage=conic(sx,sy);
    grain(sx,sy,Math.max(document.documentElement.scrollWidth,innerWidth),Math.max(document.documentElement.scrollHeight,innerHeight));
    var tilt=new Set(document.querySelectorAll(TILTED)),c=Math.cos(-TILT*Math.PI/180),sn=Math.sin(-TILT*Math.PI/180);
    document.querySelectorAll(LIT).forEach(function(el){
      var b=el.getBoundingClientRect();if(!b.width&&!b.height)return;
      var cx=b.left+b.width/2+scrollX,cy=b.top+b.height/2+scrollY,dx=sx-cx,dy=sy-cy,d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
      if(tilt.has(el)){var x=dx*c-dy*sn,y=dx*sn+dy*c;dx=x;dy=y;}   // light direction in the element's own (tilted) frame
      el.style.setProperty('--ux',dx.toFixed(3));el.style.setProperty('--uy',dy.toFixed(3));
      el.style.setProperty('--ang',(Math.atan2(dx,-dy)*180/Math.PI).toFixed(1)+'deg');
    });
  }
  var raf=0;function sched(){if(!raf)raf=requestAnimationFrame(function(){raf=0;layout();});}
  layout();addEventListener('resize',sched);addEventListener('load',sched);
  new ResizeObserver(sched).observe(body);
  new MutationObserver(sched).observe(body,{attributes:true,subtree:true,attributeFilter:['class','style']});
})();
