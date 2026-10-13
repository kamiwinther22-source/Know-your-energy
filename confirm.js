/* ?look=final — notes and the relationship confirmation.
   1) "* choose type of relationship" above the four choices (relational view only).
   2) Calculate in the relational view opens a small confirmation first; the page's own generate() runs only on Confirm. */
(function(){
  var relWrap=document.getElementById('relWrap');
  // ---- the note ----
  if(relWrap){
    var note=document.createElement('div');note.id='relNote';note.textContent='* choose type of relationship';
    relWrap.parentNode.insertBefore(note,relWrap);
    var sync=function(){note.style.display=(relWrap.style.display&&relWrap.style.display!=='none')?'block':'none';};
    new MutationObserver(sync).observe(relWrap,{attributes:true,attributeFilter:['style']});sync();
  }
  // ---- the confirmation ----
  var orig=window.generate;if(typeof orig!=='function')return;
  var dlg=null,lastFocus=null;
  function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
  function close(){if(dlg){dlg.remove();dlg=null;document.removeEventListener('keydown',onKey,true);}if(lastFocus&&lastFocus.focus)lastFocus.focus();}
  function onKey(e){if(e.key==='Escape'){e.preventDefault();close();}}
  function relLabel(){var a=document.querySelector('.rel-chip.active');return a?a.textContent.replace(/\s+/g,' ').trim():'';}
  function val(id){var x=document.getElementById(id);return x?x.value.trim():'';}
  function ready(){   // same checks generate() makes, so the window never appears over an error
    try{if(!val('p1f')||!val('p1l')||!vd(val('p1d')))return false;if(!val('p2f')||!val('p2l')||!vd(val('p2d')))return false;return true;}catch(e){return false;}
  }
  window.generate=function(){
    var rel=false;try{rel=isRelational;}catch(e){}
    if(!rel||!ready()||dlg)return orig.apply(this,arguments);
    lastFocus=document.activeElement;
    dlg=el('div','kye-scrim');dlg.setAttribute('role','dialog');dlg.setAttribute('aria-modal','true');dlg.setAttribute('aria-labelledby','kyeTitle');
    var card=el('div','kye-card');
    card.appendChild(el('div','kye-kicker','Confirm relationship type'));
    var t=el('div','kye-type',relLabel());t.id='kyeTitle';card.appendChild(t);
    card.appendChild(el('div','kye-names',val('p1f')+'  &  '+val('p2f')));
    card.appendChild(el('div','kye-note','Your free reading will be made for this type of relationship.'));
    var row=el('div','kye-row');
    var change=el('button','kye-btn kye-change','Change');change.type='button';
    var ok=el('button','kye-btn kye-ok','Confirm');ok.type='button';
    row.appendChild(change);row.appendChild(ok);card.appendChild(row);dlg.appendChild(card);document.body.appendChild(dlg);
    document.addEventListener('keydown',onKey,true);
    change.addEventListener('click',close);
    dlg.addEventListener('click',function(e){if(e.target===dlg)close();});
    ok.addEventListener('click',function(){
      var args=arguments;close();
      if(window.__noSubmit){var n=el('div','kye-toast','Preview: your reading would start here.');document.body.appendChild(n);setTimeout(function(){n.remove();},2600);return;}
      orig();
    });
    setTimeout(function(){ok.focus();},30);
  };
})();
