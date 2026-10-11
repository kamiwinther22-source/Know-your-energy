/* ?look=metal — one light source (the sun). The page is a lit metal surface; every raised or cut element is lit from the sun's real position. */
(function(){
  var root=document.documentElement,body=document.body;
  var bg=document.getElementById('metalBg');if(!bg){bg=document.createElement('div');bg.id='metalBg';body.insertBefore(bg,body.firstChild);}bg.setAttribute('aria-hidden','true');
  var LIT=['.brand-row','#hookStep>div[style*="292px"]','.free-reading-line','.hero-email-wrap','.hero-email-field','.hero-continue-btn','.gen-btn','.price-row','.rel-chip','.toggle-pill','.row-id','.line-field','.f','.person-tag','.pricing-panel','.state-banner-ttl','.hero-key','.section-lbl','.toggle-row'].join(',');
  var TILTED='.hero-continue-btn,.gen-btn,.price-row,.rel-chip',TILT=-12;
  // field: smooth anisotropic sheen around the sun (two bright wedges, two soft dark ones), fading toward the edges
  var Q=new URLSearchParams(location.search),num=function(k,d){var v=parseFloat(Q.get(k));return isNaN(v)?d:v;};
  var FLAT=Q.get('field')==='flat',BASE=FLAT?[.85,.84,.82]:[.86,.84,.80],LO=FLAT?1:num('lo',.50),HI=FLAT?1:num('hi',1.12),GRAIN=Q.get('grain')==='1';   // lo/hi set how light the sheen is; grain is off unless asked for
  var fc=document.createElement('canvas');fc.id='metalField';bg.appendChild(fc);
  function field(sx,sy,W,H){   // the approved smooth steel sheen, evaluated per pixel (low-res, scaled up smoothly)
    var sc=4,w=Math.ceil(W/sc),h=Math.ceil(H/sc);fc.width=w;fc.height=h;fc.style.width=W+'px';fc.style.height=H+'px';
    var g=fc.getContext('2d'),im=g.createImageData(w,h),d=im.data,x,y,i=0;
    for(y=0;y<h;y++)for(x=0;x<w;x++){
      var dx=(x+.5)*sc-sx,dy=(y+.5)*sc-sy,r=Math.hypot(dx,dy),th=Math.atan2(dy,dx);
      var wedge=Math.pow(.5+.5*Math.cos(2*(th+.7)),1.4),env=.5+.5*Math.exp(-r/500),F=LO+(HI-LO)*wedge*env;
      d[i++]=Math.min(255,BASE[0]*F*255);d[i++]=Math.min(255,BASE[1]*F*255);d[i++]=Math.min(255,BASE[2]*F*255);d[i++]=255;}
    g.putImageData(im,0,0);
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
    field(sx,sy,Math.max(document.documentElement.scrollWidth,innerWidth),Math.max(document.documentElement.scrollHeight,innerHeight));
    if(GRAIN)grain(sx,sy,Math.max(document.documentElement.scrollWidth,innerWidth),Math.max(document.documentElement.scrollHeight,innerHeight));
    var tilt=new Set(document.querySelectorAll(TILTED)),c=Math.cos(-TILT*Math.PI/180),sn=Math.sin(-TILT*Math.PI/180);
    document.querySelectorAll(LIT).forEach(function(el){
      var b=el.getBoundingClientRect();if(!b.width&&!b.height)return;
      var cx=b.left+b.width/2+scrollX,cy=b.top+b.height/2+scrollY,dx=sx-cx,dy=sy-cy,d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
      if(tilt.has(el)){var x=dx*c-dy*sn,y=dx*sn+dy*c;dx=x;dy=y;}   // light direction in the element's own (tilted) frame
      el.style.setProperty('--ux',dx.toFixed(3));el.style.setProperty('--uy',dy.toFixed(3));
      el.style.setProperty('--ang',(Math.atan2(dx,-dy)*180/Math.PI).toFixed(1)+'deg');
    });
  }
  var FREE=Q.get('free');
  if(FREE==='1'){   // offer first: the label moves into the field, the note moves under the button, the stray line goes
    var wrap=document.querySelector('.hero-email-wrap'),notes=wrap.querySelectorAll('.privacy-note'),inp=document.getElementById('heroEmail'),btn=wrap.querySelector('.hero-continue-btn');
    if(inp&&notes[0]){inp.placeholder=notes[0].textContent.trim();notes[0].style.display='none';}
    if(notes[1]&&btn){btn.insertAdjacentElement('afterend',notes[1]);}
    wrap.classList.add('free-v1');
  }
  if(FREE==='2'){   // one word carries the page
    var fl=document.querySelector('.free-reading-line');
    if(fl){fl.innerHTML='<span class="fl-s">your first reading is</span><span class="fl-b">free.</span>';fl.classList.add('free-v2');}
    var w2=document.querySelector('.hero-email-wrap'),n2=w2.querySelectorAll('.privacy-note'),i2=document.getElementById('heroEmail'),b2=w2.querySelector('.hero-continue-btn');
    if(i2&&n2[0]){i2.placeholder=n2[0].textContent.trim();n2[0].style.display='none';}
    if(n2[1]&&b2){b2.insertAdjacentElement('afterend',n2[1]);}
  }
  addEventListener('scroll',function(){root.style.setProperty('--scrollY',scrollY);},{passive:true});
  var raf=0;function sched(){if(!raf)raf=requestAnimationFrame(function(){raf=0;layout();});}
  layout();addEventListener('resize',sched);addEventListener('load',sched);
  new ResizeObserver(sched).observe(body);
  new MutationObserver(sched).observe(body,{attributes:true,subtree:true,attributeFilter:['class','style']});
})();
