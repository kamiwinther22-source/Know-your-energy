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

      /* The relief. Several octaves so the surface has both broad mottling
         and fine tooth, the way a deep lacquer or a stone slab does. One
         scale alone reads as noise; several read as material. */
      '<feTurbulence type="fractalNoise" baseFrequency="0.0032 0.0041" ' +
                    'numOctaves="5" seed="11" result="relief"/>' +

      /* A real point light at the sun, lighting that relief. */
      '<feDiffuseLighting in="relief" surfaceScale="9" diffuseConstant="1.0" ' +
                         'lighting-color="#ffd2de" result="lit">' +
        '<fePointLight x="' + sx + '" y="' + sy + '" z="' + z + '"/>' +
      '</feDiffuseLighting>' +

      /* Lift the floor so the far end of the page keeps its colour instead
         of crushing to black, and keep some ceiling so highlights do not
         blow out to white. */
      '<feComponentTransfer in="lit" result="shaped">' +
        '<feFuncR type="linear" slope="0.78" intercept="0.30"/>' +
        '<feFuncG type="linear" slope="0.78" intercept="0.26"/>' +
        '<feFuncB type="linear" slope="0.78" intercept="0.27"/>' +
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
      '<feTurbulence type="fractalNoise" baseFrequency="0.0075 0.0092" ' +
                    'numOctaves="3" seed="4" result="grain"/>' +
      '<feSpecularLighting in="grain" surfaceScale="4" specularConstant="0.62" ' +
                          'specularExponent="22" lighting-color="#fff0f4">' +
        '<fePointLight x="' + sx + '" y="' + sy + '" z="' + Math.round(z * 0.52) + '"/>' +
      '</feSpecularLighting>' +
    '</filter>' +
  '</defs>' +

  '<rect width="' + w + '" height="' + h + '" fill="#6A1230" filter="url(#kyeLit)"/>' +
  '<rect width="' + w + '" height="' + h + '" filter="url(#kyeSheen)" ' +
        'style="mix-blend-mode:screen;opacity:.42"/>' +
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
    el.innerHTML = surfaceSVG(w, h, sx, sy);
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
