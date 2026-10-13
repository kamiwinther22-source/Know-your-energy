/* ?look=final — the solar system reflected in the polished sheet directly beneath it: a vertical mirror about its lowest visible point, faded out */
(function(){
  var host=document.getElementById('heroIllustration');if(!host)return;
  var rc=document.createElement('canvas');rc.id='orrRefl';document.body.insertBefore(rc,document.body.firstChild);
  var tmp=document.createElement('canvas'),ROT=22*Math.PI/180,SC=1.28,dpr=Math.min(2,devicePixelRatio||1),yb=null,sk=0;
  window.__reflHook=function(src){
    var w=host.offsetWidth,h=host.offsetHeight;if(!w||!h)return;
    var b=host.getBoundingClientRect(),L=b.left+scrollX,T=b.top+scrollY,bw=Math.ceil(b.width),bh=Math.ceil(b.height);
    if(tmp.width!==bw||tmp.height!==bh){tmp.width=bw;tmp.height=bh;yb=null;}
    var t=tmp.getContext('2d');t.setTransform(1,0,0,1,0,0);t.clearRect(0,0,bw,bh);
    t.translate(bw/2,bh/2);t.rotate(ROT);t.scale(SC,SC);t.drawImage(src,-w/2,-h/2,w,h);   // the solar system exactly as it appears on the page (untransformed by the page's own CSS)
    if(yb===null||(++sk%90)===0){var d=t.getImageData(0,0,bw,bh).data,y=bh-1;t.setTransform(1,0,0,1,0,0);
      outer:for(;y>=0;y--){for(var x=0;x<bw;x+=2){if(d[(y*bw+x)*4+3]>40)break outer;}}
      yb=Math.max(10,y);}
    var Hh=Math.round(yb*.42),cw=Math.round(bw*dpr),ch=Math.round(Hh*dpr);
    if(rc.width!==cw||rc.height!==ch){rc.width=cw;rc.height=ch;}
    rc.style.left=L+'px';rc.style.top=(T+yb)+'px';rc.style.width=bw+'px';rc.style.height=Hh+'px';
    var g=rc.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,rc.width,rc.height);
    g.setTransform(dpr,0,0,dpr,0,0);g.scale(1,-1);g.translate(0,-yb);g.drawImage(tmp,0,0);
  };
})();
