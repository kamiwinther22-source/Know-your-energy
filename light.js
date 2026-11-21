/* light.js — the page has one light: the sun in the hero illustration.
 *
 * Two jobs.
 *
 * 1. THE SURFACE. The page is not a colour, it is a material: a fine
 *    mottled relief, lit by a real point light sitting where the sun
 *    actually is. Where the relief tilts toward the sun it catches light,
 *    where it tilts away it falls dark, and the whole thing dims with
 *    distance the way a lamp close to a wall does. That is what gives the
 *    background its variation. It is not a glow painted over a flat colour.
 *
 * 2. THE OBJECTS. Every raised and recessed thing on the page is shaded
 *    from its own position relative to that same light. For an element
 *    centred at E and the light at S:
 *      v = E - S      direction the light travels to reach it
 *      u = v / |v|    unit vector, used for every offset
 *      I = 1/(1 + (d/D0)^2)   inverse-square falloff
 *    A raised face takes its highlight on the edge turned toward the sun
 *    and throws its cast shadow the other way. A recessed well is the
 *    inverse: its sun-side inner wall is occluded by its own lip. Cast
 *    shadows lengthen with distance, and they do not all run the same way,
 *    because the light is a place on this page and not a direction at
 *    infinity.
 *
 * JS publishes the primitives; the look is composed in CSS.
 */
(function () {
  "use strict";

  var SUN_EL   = ".hero-illustration";
  var D0       = 460;
  var RIM_MAX  = 2.2;
  var RIM_MIN  = 0.9;
  var CAST_MAX = 16;
  var CAST_MIN = 4;

  var RAISED = [".rbtn", ".gen-btn", ".rel-chip"].join(",");
  var VECTOR_ONLY = [".r-h1", ".r-free"].join(",");
  var RECESSED = [
    ".line-field", ".ampm-field", ".toggle-pill", ".chk-box", ".loc-list"
  ].join(",");

  var root = document.documentElement;
  var queued = false;
  var writing = false;
  var last = { w: 0, h: 0, sx: -1, sy: -1 };

  function sun() {
    var el = document.querySelector(SUN_EL);
    if (!el) return null;
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) return null;
    return {
      x: r.left + r.width / 2 + window.scrollX,
      y: r.top + r.height / 2 + window.scrollY
    };
  }

  /* ---------------------------------------------------------------- *
   *  The lit surface
   * ---------------------------------------------------------------- */

  /* ---- A: RAKED SHEET -------------------------------------------------
     No pattern at all. The page is one sheet of polished stone and the
     light rakes across it from the sun's side, so the brightness travels in
     a straight direction rather than spreading out of a point. Smooth, deep,
     nothing to notice — the opposite of a texture.                      */
  function surfaceRaked(w, h, sx, sy) {
    /* the rake runs from the sun across the page, so its angle is the
       direction from the sun to the page's centre */
    var cx = w / 2, cy = h * 0.55;
    var vx = cx - sx, vy = cy - sy;
    var d = Math.sqrt(vx * vx + vy * vy) || 1;
    var ux = vx / d, uy = vy / d;
    /* a gradient line long enough to cross the whole page on that heading */
    var span = Math.abs(ux) * w + Math.abs(uy) * h;
    var x1 = sx - ux * span * 0.18, y1 = sy - uy * span * 0.18;
    var x2 = sx + ux * span * 1.05, y2 = sy + uy * span * 1.05;

    return '' +
'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" ' +
     'viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="display:block">' +
  '<defs>' +
    '<linearGradient id="kyeRake" gradientUnits="userSpaceOnUse" ' +
      'x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" ' +
      'x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '">' +
      '<stop offset="0"    stop-color="#A82B55"/>' +
      '<stop offset=".10"  stop-color="#8E1A3E"/>' +
      '<stop offset=".26"  stop-color="#6E1030"/>' +
      '<stop offset=".48"  stop-color="#520A22"/>' +
      '<stop offset=".72"  stop-color="#49091F"/>' +
      '<stop offset="1"    stop-color="#2E0512"/>' +
    '</linearGradient>' +
    /* the sheet's own edges turn away, the way a thick polished slab does */
    '<linearGradient id="kyeEdge" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0"    stop-color="#1A0309" stop-opacity=".55"/>' +
      '<stop offset=".14"  stop-color="#1A0309" stop-opacity="0"/>' +
      '<stop offset=".86"  stop-color="#1A0309" stop-opacity="0"/>' +
      '<stop offset="1"    stop-color="#1A0309" stop-opacity=".55"/>' +
    '</linearGradient>' +
  '</defs>' +
  '<rect width="' + w + '" height="' + h + '" fill="url(#kyeRake)"/>' +
  '<rect width="' + w + '" height="' + h + '" fill="url(#kyeEdge)"/>' +
'</svg>';
  }

  /* ---- B: ENGINE TURNING ---------------------------------------------
     All pattern. Fine rays struck out from the sun and fine rings around
     it, the way a watch dial or a silver case is engine-turned. Each line
     is a cut in the surface, so it catches light on the side facing the sun
     and goes dark on the other. The figure radiates from the sun because
     the sun is literally its centre.                                     */
  function surfaceTurned(w, h, sx, sy) {
    var far = Math.sqrt(Math.max(sx, w - sx) * Math.max(sx, w - sx) +
                        Math.max(sy, h - sy) * Math.max(sy, h - sy));
    return '' +
'<div style="position:absolute;inset:0;overflow:hidden;' +
  'background:' +
    /* the rays: a fine comb struck out from the sun */
    'repeating-conic-gradient(from 0deg at ' + sx + 'px ' + sy + 'px,' +
      'rgba(255,228,238,.085) 0deg .22deg,' +
      'rgba(20,2,9,.16) .22deg .52deg,' +
      'rgba(255,228,238,.02) .52deg .78deg,' +
      'rgba(20,2,9,.06) .78deg 1.1deg),' +
    /* the rings: concentric cuts, crossing the rays */
    'repeating-radial-gradient(circle at ' + sx + 'px ' + sy + 'px,' +
      'rgba(255,228,238,.055) 0 2px,' +
      'rgba(20,2,9,.10) 2px 5px,' +
      'rgba(255,228,238,.012) 5px 7px,' +
      'rgba(20,2,9,.035) 7px 11px),' +
    /* the metal under the engraving, deepening with distance from the sun */
    'radial-gradient(' + Math.round(far * 1.15) + 'px ' + Math.round(far * 1.5) + 'px' +
      ' at ' + sx + 'px ' + sy + 'px,' +
      '#99244C 0%,#7E1A3C 16%,#64112E 34%,#4C0B22 56%,#350716 78%,#20040D 100%);' +
  '"></div>';
  }

  function surfaceSVG(w, h, sx, sy) {
    /* The light's height above the page. Low puts a tight pool under the
       sun; high spreads it. This is the single number that decides how
       dramatic the page reads. */
    var z = Math.round(Math.max(w, 560) * 0.62);

    return '' +
'<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" ' +
     'viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" ' +
     'style="display:block">' +
  '<defs>' +
    '<filter id="kyeLit" x="0" y="0" width="100%" height="100%" ' +
            'filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +

      /* The relief. Fine tooth, not cloud: a coarse, high-amplitude noise
         reads as a stain or a blotch. Tight frequency and few octaves give
         the surface a grain you feel rather than a pattern you notice. */
      '<feTurbulence type="fractalNoise" baseFrequency="0.019 0.023" ' +
                    'numOctaves="3" seed="11" result="relief"/>' +

      /* A real point light at the sun, lighting that relief. The grain is
         shallow, so most of the variation across the page comes from the
         light's own falloff rather than from the texture. */
      '<feDiffuseLighting in="relief" surfaceScale="2.4" diffuseConstant="1.0" ' +
                         'lighting-color="#ffd7e2" result="lit">' +
        '<fePointLight x="' + sx + '" y="' + sy + '" z="' + z + '"/>' +
      '</feDiffuseLighting>' +

      /* Lift the floor so the far end of the page keeps its colour instead
         of crushing to black, and hold the ceiling so highlights near the
         sun do not blow out. */
      '<feComponentTransfer in="lit" result="shaped">' +
        '<feFuncR type="linear" slope="0.62" intercept="0.52"/>' +
        '<feFuncG type="linear" slope="0.62" intercept="0.46"/>' +
        '<feFuncB type="linear" slope="0.62" intercept="0.48"/>' +
      '</feComponentTransfer>' +

      /* Multiply the garnet by the light. */
      '<feComposite in="shaped" in2="SourceGraphic" operator="arithmetic" ' +
                   'k1="1" k2="0" k3="0" k4="0"/>' +
    '</filter>' +

    /* A sheen pass: the same relief, same light, but specular rather than
       diffuse, so the surface has a wet depth near the sun and goes matte
       further off. */
    '<filter id="kyeSheen" x="0" y="0" width="100%" height="100%" ' +
            'filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.03 0.035" ' +
                    'numOctaves="2" seed="4" result="grain"/>' +
      '<feSpecularLighting in="grain" surfaceScale="1.6" specularConstant="0.5" ' +
                          'specularExponent="22" lighting-color="#fff0f4">' +
        '<fePointLight x="' + sx + '" y="' + sy + '" z="' + Math.round(z * 0.52) + '"/>' +
      '</feSpecularLighting>' +
    '</filter>' +
  '</defs>' +

  '<rect width="' + w + '" height="' + h + '" fill="#6A1230" filter="url(#kyeLit)"/>' +
  '<rect width="' + w + '" height="' + h + '" filter="url(#kyeSheen)" ' +
        'style="mix-blend-mode:screen;opacity:.30"/>' +
'</svg>';
  }

  function paintSurface(S) {
    var w = root.clientWidth;
    var h = Math.max(root.scrollHeight, window.innerHeight);
    var sx = Math.round(S.x), sy = Math.round(S.y);

    if (w === last.w && h === last.h && sx === last.sx && sy === last.sy) return;
    last = { w: w, h: h, sx: sx, sy: sy };

    var el = document.getElementById("kyeSurface");
    if (!el) {
      el = document.createElement("div");
      el.id = "kyeSurface";
      el.setAttribute("aria-hidden", "true");
      document.body.insertBefore(el, document.body.firstChild);
    }
    el.style.cssText =
      "position:absolute;top:0;left:0;width:100%;height:" + h + "px;" +
      "z-index:0;pointer-events:none;overflow:hidden;";

    var which = (/[?&]bg=([a-z]+)/.exec(location.search) || [])[1] || "turned";
    if (which === "raked")       el.innerHTML = surfaceRaked(w, h, sx, sy);
    else if (which === "noise")  el.innerHTML = surfaceSVG(w, h, sx, sy);
    else                         el.innerHTML = surfaceTurned(w, h, sx, sy);
  }

  /* ---------------------------------------------------------------- *
   *  The objects
   * ---------------------------------------------------------------- */

  function shade(el, S, recessed) {
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;

    var ex = r.left + r.width / 2 + window.scrollX;
    var ey = r.top + r.height / 2 + window.scrollY;

    var vx = ex - S.x, vy = ey - S.y;
    var d = Math.sqrt(vx * vx + vy * vy);

    var ux = d < 0.5 ? 0 : vx / d;
    var uy = d < 0.5 ? 1 : vy / d;

    var k = d / D0;
    var I = 1 / (1 + k * k);

    /* The same direction as a CSS gradient angle: a CSS angle t runs toward
       (sin t, -cos t) in screen axes. */
    var ang = Math.atan2(ux, -uy) * 180 / Math.PI;

    var s = el.style;
    s.setProperty("--ux", ux.toFixed(4));
    s.setProperty("--uy", uy.toFixed(4));
    s.setProperty("--ang", ang.toFixed(2) + "deg");
    s.setProperty("--I", I.toFixed(4));
    s.setProperty("--d", Math.round(d) + "px");
    s.setProperty("--rim",  (RIM_MIN  + (RIM_MAX  - RIM_MIN)  * I).toFixed(2) + "px");
    s.setProperty("--cast", (CAST_MIN + (CAST_MAX - CAST_MIN) * (1 - I)).toFixed(2) + "px");

    if (recessed === null) {
      s.setProperty("--mark-ang", ang.toFixed(2) + "deg");
      return;
    }
    el.setAttribute("data-lit", recessed ? "recess" : "raise");
  }

  function apply() {
    queued = false;
    var S = sun();
    if (!S) return;

    writing = true;
    root.style.setProperty("--sun-x", Math.round(S.x) + "px");
    root.style.setProperty("--sun-y", Math.round(S.y) + "px");
    root.classList.add("lit");

    paintSurface(S);

    var i, els;
    els = document.querySelectorAll(RAISED);
    for (i = 0; i < els.length; i++) shade(els[i], S, false);
    els = document.querySelectorAll(RECESSED);
    for (i = 0; i < els.length; i++) shade(els[i], S, true);
    els = document.querySelectorAll(VECTOR_ONLY);
    for (i = 0; i < els.length; i++) shade(els[i], S, null);
    writing = false;
  }

  function schedule() {
    if (queued || writing) return;
    queued = true;
    requestAnimationFrame(apply);
  }

  /* Page coordinates are scroll-invariant, so scrolling needs no relight. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }
  window.addEventListener("load", schedule);
  window.addEventListener("resize", schedule);

  if (window.ResizeObserver) {
    var ro = new ResizeObserver(schedule);
    var hero = document.querySelector(SUN_EL);
    if (hero) ro.observe(hero);
    if (document.body) ro.observe(document.body);
  }
  if (window.MutationObserver) {
    new MutationObserver(function (recs) {
      if (writing) return;
      for (var i = 0; i < recs.length; i++) {
        var t = recs[i].target;
        if (t && t.closest && t.closest("#kyeSurface")) return;
      }
      schedule();
    }).observe(document.documentElement, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ["style", "class", "hidden"]
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);

  window.__relight = apply;
})();
