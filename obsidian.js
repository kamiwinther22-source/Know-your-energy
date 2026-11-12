/* ?skin=obsidian — the comet of light that runs the frame of the email field.
   Drawn as strokes on the frame's own outline, so it moves at one steady speed along every side; a white head, a long pink tail that fades, and a bloom that travels with it. */
(()=>{const f=document.querySelector('.hero-email-field');if(!f||f.querySelector('.kye-comet'))return;
  const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('class','kye-comet');svg.setAttribute('aria-hidden','true');f.appendChild(svg);
  const P=1000,draw=()=>{const w=f.clientWidth,h=f.clientHeight;if(!w)return;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const r=`x=".75" y=".75" width="${w-1.5}" height="${h-1.5}" rx="6" fill="none" pathLength="${P}"`;
    // tail: stacked strokes, each shorter and brighter, all ending at the same head
    const tail=[[300,'#f5b6c7',1.7],[235,'#f8c6d3',1.9],[175,'#fbd7e0',2.1],[120,'#fde6ec',2.4],[70,'#fff3f6',2.7],[32,'#fff',3]];
    const dash=(L,c,sw,o)=>`<rect ${r} class="c" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${L} ${P-L}" stroke-dashoffset="${L+o}" style="--end:${L+o-P}"/>`;
    const comet=o=>`<g filter="url(#kyeBloom)">`+dash(240,'#ff4f8c',8,o)+dash(90,'#ffd0dd',7,o)+`</g>`+tail.map(([L,c,sw])=>dash(L,c,sw,o)).join('');
    svg.innerHTML=`<defs><filter id="kyeBloom" x="-20%" y="-150%" width="140%" height="400%" filterUnits="objectBoundingBox"><feGaussianBlur stdDeviation="5"/></filter></defs>`+
      `<rect ${r} stroke="#f1a9bd" stroke-width="1.5"/>`+comet(0)+comet(500);};
  draw();new ResizeObserver(draw).observe(f);})();
