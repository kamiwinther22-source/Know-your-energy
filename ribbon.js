/* ?look=final — the energy ribbon between Person 1 and Person 2 (visible only in the relational view). It fills the gap between the two blocks and never takes clicks. */
(function(){
  var form=document.getElementById('formStep'),p1=document.getElementById('p1Block'),p2=document.getElementById('p2Section');if(!form||!p1||!p2)return;
  var img=document.createElement('img');img.id='energyRibbon';img.alt='';img.setAttribute('aria-hidden','true');img.src='energy-ribbon.png';form.appendChild(img);
  var raf=0;
  function place(){raf=0;
    var open=p2.classList.contains('open');img.style.display=open?'block':'none';if(!open)return;
    var f=form.getBoundingClientRect(),a=p1.getBoundingClientRect(),b=p2.getBoundingClientRect();
    var top=a.bottom-f.top+4,h=Math.max(60,(b.top-f.top)-top-34);
    img.style.top=top+'px';img.style.height=h+'px';img.style.left='0px';img.style.width=f.width+'px';
  }
  function sched(){if(!raf)raf=requestAnimationFrame(place);}
  new MutationObserver(sched).observe(document.body,{attributes:true,subtree:true,attributeFilter:['class','style']});
  addEventListener('resize',sched);addEventListener('load',sched);sched();setTimeout(sched,800);
})();
