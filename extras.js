/* Results page extras: the Timeline, the Globe (astrocartography) and the passes.
   Loaded after the page. Everything heavy (transit table, land outlines, the map library) is fetched only when it is needed. */
(function () {
  "use strict";
  var MS_DAY = 864e5, MS_YEAR = 365.25 * MS_DAY;
  var TL_YEARS = 120; // the timeline runs from birth to this age
  var TL_MIN_AGE = 18; // planet bars are not shown before this age
  var PLANET_NAMES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
  var PLANET_COLOR = { sun: "#e0a800", moon: "#6b7a99", mercury: "#2e9e5b", venus: "#d6336c", mars: "#e8590c", jupiter: "#c27c0e", saturn: "#495057", uranus: "#0c8599", neptune: "#3b5bdb", pluto: "#862e9c" };
  var PLANET_THEME = {
    sun: "your core self and vitality", moon: "your feelings, needs and sense of safety", mercury: "thinking, talking, learning and deals",
    venus: "love, pleasure, money and taste", mars: "drive, courage, conflict and desire", jupiter: "growth, luck, optimism and expansion",
    saturn: "discipline, limits, duty and long effort", uranus: "change, freedom, surprise and independence",
    neptune: "imagination, ideals, blur and sensitivity", pluto: "intensity, power, transformation and obsession"
  };
  var ANGLE = {
    ASC: ["Ascendant", "rising", "in you: your presence, body and the way people first meet you"],
    MC: ["Midheaven", "overhead", "in your public life: career, reputation and what you are known for"],
    DSC: ["Descendant", "setting", "in other people: partners, clients and close relationships, who tend to carry this energy"],
    IC: ["Imum Coeli", "underfoot", "in your private life: home, family, roots and inner security"]
  };
  var SILVER = "linear-gradient(135deg,#ffffff 0%,#d9dee4 10%,#8c959f 24%,#4a525c 38%,#8f98a2 50%,#eef1f4 60%,#ffffff 66%,#aeb6bf 78%,#6a737d 90%,#3f4650 100%)";
  var CH = "background:linear-gradient(180deg,#ffffff 0%,#eef1f5 46%,#dfe4ea 54%,#ffffff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 7px rgba(255,255,255,.32))";

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function norm360(x) { return ((x % 360) + 360) % 360; }
  function norm180(x) { return ((x + 180) % 360 + 360) % 360 - 180; }
  function parseDob(s) { var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s || "").trim()); return m ? { m: +m[1], d: +m[2], y: +m[3] } : null; }
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(ms) { var d = new Date(ms); return MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear(); }

  // ---------- one-time styles ----------
  function addStyles() {
    if (document.getElementById("extrasCss")) return;
    var s = document.createElement("style"); s.id = "extrasCss";
    s.textContent = [
      "@keyframes kyeSweep{0%,55%{background-position:160% 0}100%{background-position:-60% 0}}",
      ".fan-card>.quad-item::after,.fan-reading>.panel-auto::after,.xcard::after,.xpass .p::after,.xlinks a::after{content:'';position:absolute;inset:0;z-index:5;pointer-events:none;background:linear-gradient(104deg,rgba(255,255,255,0) 38%,rgba(255,255,255,.95) 49%,rgba(255,255,255,0) 60%) no-repeat;background-size:260% 100%;background-position:160% 0;animation:kyeSweep 6s ease-in-out infinite;mix-blend-mode:overlay}",
      ".fan-card:nth-child(2)>.quad-item::after{animation-delay:.5s}.fan-card:nth-child(3)>.quad-item::after{animation-delay:1s}.xcard::after{animation-delay:1.6s}.xlinks a:nth-child(2)::after{animation-delay:.6s}.xpass .pw:nth-child(2) .p::after{animation-delay:.5s}.xpass .pw:nth-child(3) .p::after{animation-delay:1s}",
      ".xpass .p::after,.xlinks a::after{clip-path:polygon(18px 0,calc(100% - 18px) 0,100% 50%,calc(100% - 18px) 100%,18px 100%,0 50%)}",
      "@media (prefers-reduced-motion:reduce){.fan-card>.quad-item::after,.fan-reading>.panel-auto::after,.xcard::after,.xpass .p::after,.xlinks a::after{animation:none}}",
      "#resultsWrap .fan-name,#resultsWrap .ttl,.xpass .h,.xglobe .gl{color:#fff !important;-webkit-text-fill-color:#fff !important;-webkit-text-stroke:.8px #fff;text-shadow:0 0 12px rgba(255,255,255,.6),0 0 2px #fff,0 2px 3px rgba(0,0,0,.6) !important}",
      "#resultsWrap .xpass .s,#resultsWrap .xcap,#resultsWrap .xpass .pol,#resultsWrap .xpass .note,#resultsWrap .device-note,#resultsWrap .device-note *,#resultsWrap .tiny-contact,#resultsWrap .site-foot{font-weight:800 !important;color:#fff !important;-webkit-text-fill-color:#fff !important;text-shadow:0 0 6px rgba(255,255,255,.35),0 1px 2px rgba(0,0,0,.75) !important}",
      ".xacts{align-items:flex-start !important;gap:6px !important}",
      ".xtlwrap{display:flex}",
      ".xacts>.fan-reading,.xacts>.xglobe,.xacts>.xtlwrap{flex:1 1 0 !important;min-width:0;max-width:150px}",
      
      ".xlinks{display:flex;gap:8px;justify-content:center;margin:18px 0 0;padding:0 8px;filter:drop-shadow(0 8px 8px rgba(0,0,0,.55))}",
      ".xlinks a{flex:1 1 0;min-width:0;position:relative;isolation:isolate;height:56px;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 6px;box-sizing:border-box;color:#000 !important;-webkit-text-fill-color:#000;text-shadow:0 1px 0 rgba(255,255,255,.6);font:800 12px/1.15 'Barlow Condensed',sans-serif;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;cursor:pointer;background:url(img/btn-wide-k2.webp) center/100% 100% no-repeat !important}",
      ".xacts .fan-reading>.panel-auto,.xacts .fan-reading>.panel-error{min-height:200px !important}",
      ".xcard .nm{font:400 clamp(17px,5vw,22px)/1 'Alex Brush',cursive;color:#000;margin-top:6px;overflow-wrap:anywhere}",
      ".xcard{position:relative;width:100%;height:200px;cursor:pointer;filter:drop-shadow(0 8px 8px rgba(0,0,0,.5));-webkit-tap-highlight-color:transparent}",
      ".xcard>i{position:absolute;inset:0;background:" + SILVER + ";clip-path:polygon(18px 0,calc(100% - 18px) 0,100% 18px,100% calc(100% - 18px),calc(100% - 18px) 100%,18px 100%,0 calc(100% - 18px),0 18px)}",
      ".xcard>b{display:block;position:relative;margin:9px;height:182px;overflow:hidden;box-sizing:border-box;background:#fff;color:#000;font-weight:400;padding:8px 8px 6px;text-align:center;clip-path:polygon(11px 0,calc(100% - 11px) 0,100% 11px,100% calc(100% - 11px),calc(100% - 11px) 100%,11px 100%,0 calc(100% - 11px),0 11px)}",
      ".xcard .cap{font:800 10px 'Barlow Condensed',sans-serif;letter-spacing:.14em;text-align:left;margin-left:4px;color:#000}",
      ".xcard .rl{border-top:2px solid #000;margin:4px 0 3px}",
      ".xcard .sc{font:400 clamp(22px,7vw,30px)/1.1 'Alex Brush',cursive;color:#000;white-space:nowrap}",
      ".xcard .ln{font:800 10.5px 'Barlow Condensed',sans-serif;letter-spacing:.12em;color:#000}",
      ".xglobe{text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent}",
      ".xglobe canvas{display:block;margin:0 auto;width:100%;max-width:150px;aspect-ratio:1;filter:drop-shadow(0 0 12px rgba(255,255,255,.35)) drop-shadow(0 8px 8px rgba(0,0,0,.5))}",
      ".xglobe .gl{font:400 30px/1 'Alex Brush',cursive;color:#fff;margin-top:6px}",
      ".xcap{margin:4px auto 0;text-align:center;font:700 12px/1.35 'Fraunces',Georgia,serif;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.7)}",
      ".xpass{max-width:390px;margin:28px auto 0;font-family:'Fraunces',Georgia,serif;color:#fff}",
      ".xpass .h{text-align:center;font:400 36px/1 'Alex Brush',cursive;margin-bottom:6px}",
      ".xpass .s{text-align:center;font:600 13px/1.4 'Fraunces',serif;margin:0 6px 18px}",


      ".xpass .cols{display:flex;gap:8px;padding:0 8px;filter:drop-shadow(0 8px 8px rgba(0,0,0,.55))}",
      ".xpass .pw{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:8px}",
      ".xpass .pl{font:700 14px 'Fraunces',Georgia,serif;color:#fff;text-align:center}",
      ".xpass .p{width:100%;min-width:0;position:relative;isolation:isolate;border:0;cursor:pointer;height:46px;padding:0 14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#000;font-family:inherit;-webkit-tap-highlight-color:transparent;background:url(img/btn-short-k2.webp) center/100% 100% no-repeat !important}",
      ".xpass .p .n{text-shadow:0 1px 0 rgba(255,255,255,.6);font:900 21px/1 'Fraunces',Georgia,serif;color:#000}",
      ".xpass .p .l{text-shadow:0 1px 0 rgba(255,255,255,.6);font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.1em;margin-top:3px;text-transform:uppercase;color:#000}",
      ".xpass .p .d{font:700 11px 'Barlow Condensed',sans-serif;letter-spacing:.12em;margin-top:1px;color:#000}",
      ".xpass .note{text-align:center;font:700 13px/1.4 'Fraunces',serif;min-height:18px;margin:10px 8px 0}",
      ".xpass .pol{text-align:center;font:600 11.5px/1.5 'Fraunces',serif;margin:6px 8px 0}",
      ".xpass .pol a{color:#fff}",
      /* timeline */
      ".tl{color:#000;font-family:'DM Sans',sans-serif;position:relative}",
      ".tl-day{position:absolute;left:0;right:0;top:0;bottom:0;z-index:6;background:#fff;border:2.5px solid #000;border-radius:14px;padding:14px 14px 18px;overflow:auto;color:#000;-webkit-overflow-scrolling:touch}",
      ".tl-day .dt{font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.14em;text-transform:uppercase;margin:0 0 6px}",
      ".tl-day h3{font:800 20px/1.25 'DM Sans',sans-serif;margin:0 0 10px;color:#000}",
      ".tl-day p{font:500 15px/1.6 'DM Sans',sans-serif;margin:0 0 11px;color:#000}",
      ".tl-day details{margin:12px 0 4px;font:600 13px/1.5 'DM Sans',sans-serif}",
      ".tl-day details summary{cursor:pointer;font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.12em;text-transform:uppercase}",
      ".tl-day .x{float:right}",
      ".tl-ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:2px 0 8px}",
      ".tl-ctl label{font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#000}",
      ".tl-ctl input:disabled{opacity:1;background:#fff;color:#000;-webkit-text-fill-color:#000;cursor:default}",
      ".tl-ctl input{font:700 15px 'DM Sans',sans-serif;border:2px solid #000;border-radius:12px;background:#fff;color:#000;padding:4px 8px}",
      ".tl-chip{font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.1em;border:2px solid #000;border-radius:12px;background:#fff;color:#000 !important;padding:3px 12px;cursor:pointer}",
      ".tl-chip.on{background:#000 !important;color:#fff !important}",
      ".tl-info{border:2.5px solid #000;border-radius:14px;padding:9px 12px;margin:0 0 8px;font:600 13.5px/1.45 'DM Sans',sans-serif;min-height:84px;max-height:176px;overflow:auto;color:#000;background:#fff}",
      ".tl-info .tt{font:800 13px 'DM Sans',sans-serif;display:block;margin-bottom:2px}",
      ".tl-frame{border:3px solid #000;border-radius:18px;overflow:hidden;background:#fff}",
      ".tl-head{display:flex;margin-left:38px;border-bottom:1.5px solid #000}",
      ".tl-head div{flex:1;height:86px;display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;transform:rotate(180deg);font:800 10.5px Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#000;text-align:center}",
      ".tl-scroll{height:46vh;min-height:280px;overflow-y:auto;position:relative;-webkit-overflow-scrolling:touch;scrollbar-width:none}",
      ".tl-body{position:relative;margin-left:38px}",
      ".tl-tick{position:absolute;left:-38px;width:34px;text-align:right;font:700 10px Arial,sans-serif;color:#000;transform:translateY(-6px)}",
      ".tl-tick.yr{font-size:11px;font-weight:800}",
      ".tl-bar{position:absolute;display:flex;justify-content:center;align-items:center;border-radius:9px;box-sizing:border-box;cursor:pointer;font:800 19px 'Fraunces',Georgia,serif;overflow:visible}",
      ".tl-bar.tall{align-items:flex-start;font-size:24px}",
      ".tl-bar.nolab span{display:none}",
      ".tl-bar.n2{box-shadow:inset 0 0 0 2px #000}",
      ".tl-bar.ev{border-radius:8px;font:800 11px/1.15 Arial,sans-serif}",
      ".tl-bar span{display:block;white-space:pre-line;text-align:center;line-height:1}",
      ".tl-bar.tall span{position:sticky;top:var(--stk,120px)}",
      ".tl-bar.ev span{writing-mode:vertical-rl;transform:rotate(180deg)}",
      ".tl-bar.out span{position:absolute;bottom:100%;margin-bottom:3px;top:auto;color:#000 !important}",
      "#cardExpand .tl .tl-bar.wt span{color:#fff !important}",
      ".tl-bar.sel{outline:3px solid #000;outline-offset:1px}",
      ".tl-now{position:absolute;left:-38px;right:0;height:3px;background:#0b0b10;z-index:5;pointer-events:none}",
      /* map overlay */
      "#mapOverlay{position:fixed;inset:0;z-index:99999;background:linear-gradient(180deg,#bd224b 0%,#6a0e28 14%,#340513 46%,#4b0a1d 80%,#8b1d3d 100%);display:none;flex-direction:column;isolation:isolate}",
      "#mapOverlay.open{display:flex}",
      "#mapOverlay .mt{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;color:#fff}",
      "#mapOverlay .mt .tt{font:400 34px/1 'Alex Brush',cursive}",
      "#mapOverlay .mx{width:42px;height:42px;border-radius:50%;border:0;background:" + SILVER + ";color:#000;font:800 18px sans-serif;cursor:pointer}",
      "#mapOverlay .mp{display:flex;gap:8px;padding:0 14px 8px}",
      "#mapEl{flex:1;min-height:0;background:#e9e4dc}",
      "#mapOverlay .mb{padding:8px 10px 12px;background:#14080d;color:#fff}",
      "#mapOverlay .row{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:3px 0}",
      "#mapOverlay .ch{font:800 11px 'Barlow Condensed',sans-serif;letter-spacing:.08em;text-transform:uppercase;border:2px solid #fff;background:#000;color:#fff;padding:3px 9px;cursor:pointer;display:flex;align-items:center;gap:5px}",
      "#mapOverlay .ch i{width:11px;height:11px;border-radius:50%;display:inline-block;border:1px solid #fff}",
      "#mapOverlay .ch.off{opacity:.38}",
      "#mapOverlay .hint{text-align:center;font:600 11px 'DM Sans',sans-serif;color:#fff;margin-top:4px}",
      ".leaflet-popup-content{font:500 13px/1.45 'DM Sans',sans-serif;color:#000}"
    ].join("\n");
    document.head.appendChild(s);
  }

  // ---------- astrocartography math (same as the checked demo) ----------
  function bodyLines(raDeg, decDeg, gmst) {
    var base = raDeg - gmst, tanDec = Math.tan(decDeg * Math.PI / 180), asc = [], dsc = [];
    for (var lat = -84; lat <= 84; lat += 2) {
      var c = -Math.tan(lat * Math.PI / 180) * tanDec;
      if (c < -1 || c > 1) continue;
      var H = Math.acos(c) * 180 / Math.PI;
      asc.push([lat, norm180(base - H)]); dsc.push([lat, norm180(base + H)]);
    }
    return { MC: norm180(base), IC: norm180(base + 180), ASC: asc, DSC: dsc };
  }
  function allLines(acg) { var o = {}; PLANET_NAMES.forEach(function (k) { if (acg.bodies[k]) o[k] = bodyLines(acg.bodies[k].ra, acg.bodies[k].dec, acg.gmst); }); return o; }
  function splitWrap(pts) { var segs = [], cur = []; pts.forEach(function (p) { if (cur.length && Math.abs(p[1] - cur[cur.length - 1][1]) > 180) { segs.push(cur); cur = []; } cur.push(p); }); if (cur.length) segs.push(cur); return segs; }

  // ---------- globe: a lit silver sphere drawn from the person's own lines ----------
  var landPromise = null;
  function loadLand() { if (!landPromise) landPromise = fetch("data/land.json").then(function (r) { return r.json(); }); return landPromise; }
  function drawGlobe(canvas, acg, birth) {
    return loadLand().then(function (rings) {
      var W = 1440, H = 720, eq = document.createElement("canvas"); eq.width = W; eq.height = H;
      var g = eq.getContext("2d"), X = function (lo) { return (lo + 180) / 360 * W; }, Y = function (la) { return (90 - la) / 180 * H; };
      g.fillStyle = "#1b0712"; g.fillRect(0, 0, W, H);
      g.fillStyle = "#e9ecf1"; g.strokeStyle = "#ffffff"; g.lineWidth = 1.6;
      rings.forEach(function (r) { var x = r[0], y = r[1]; if (y < -600) return; var ex0 = r[0], ey0 = r[1], mnx = ex0, mxx = ex0, mny = ey0, mxy = ey0; for (var q = 2; q < r.length; q += 2) { ex0 += r[q]; ey0 += r[q + 1]; if (ex0 < mnx) mnx = ex0; if (ex0 > mxx) mxx = ex0; if (ey0 < mny) mny = ey0; if (ey0 > mxy) mxy = ey0; } if (mxx - mnx > 3000 && mxy - mny < 60) return; g.beginPath(); g.moveTo(X(x / 10), Y(y / 10)); for (var i = 2; i < r.length; i += 2) { x += r[i]; y += r[i + 1]; g.lineTo(X(x / 10), Y(y / 10)); } g.closePath(); g.fill(); g.stroke(); });
      if (birth) { g.fillStyle = "#ffffff"; g.beginPath(); g.arc(X(birth.lng), Y(birth.lat), 9, 0, 7); g.fill(); g.strokeStyle = "#ffffff"; g.lineWidth = 3; g.beginPath(); g.arc(X(birth.lng), Y(birth.lat), 18, 0, 7); g.stroke(); }
      var src = g.getImageData(0, 0, W, H).data, S = canvas.width, c = canvas.getContext("2d"), out = c.createImageData(S, S), od = out.data;
      var lam0 = (birth ? birth.lng : -96) * Math.PI / 180, phi0 = 20 * Math.PI / 180, R = S / 2 - 6, sp = Math.sin(phi0), cp = Math.cos(phi0);
      for (var py = 0; py < S; py++) for (var px = 0; px < S; px++) {
        var nx = (px + .5 - S / 2) / R, ny = (S / 2 - py - .5) / R, rho2 = nx * nx + ny * ny, k = (py * S + px) * 4;
        if (rho2 > 1) continue;
        var rho = Math.sqrt(rho2), cc = Math.asin(rho), sc = Math.sin(cc), co = Math.cos(cc), lat, lon;
        if (rho < 1e-9) { lat = phi0; lon = lam0; } else { lat = Math.asin(co * sp + ny * sc * cp / rho); lon = lam0 + Math.atan2(nx * sc, rho * cp * co - ny * sp * sc); }
        var u = ((lon * 180 / Math.PI + 180) % 360 + 360) % 360 / 360 * W, v = (90 - lat * 180 / Math.PI) / 180 * H, i = ((Math.min(H - 1, Math.max(0, v | 0))) * W + (u | 0) % W) * 4;
        var z = co, shade = .38 + .62 * Math.pow(Math.max(0, z), .6), lx = nx + .45, ly = ny - .5, spec = Math.pow(Math.max(0, 1 - Math.sqrt(lx * lx + ly * ly) / 1.15), 3) * 130;
        od[k] = Math.min(255, src[i] * shade + spec); od[k + 1] = Math.min(255, src[i + 1] * shade + spec); od[k + 2] = Math.min(255, src[i + 2] * shade + spec); od[k + 3] = 255;
      }
      c.putImageData(out, 0, 0);
      var rg = c.createRadialGradient(S * .34, S * .28, S * .02, S * .34, S * .28, S * .5); rg.addColorStop(0, "rgba(255,255,255,.55)"); rg.addColorStop(1, "rgba(255,255,255,0)");
      c.globalCompositeOperation = "source-atop"; c.fillStyle = rg; c.fillRect(0, 0, S, S); c.globalCompositeOperation = "source-over";
      c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 2.5; c.beginPath(); c.arc(S / 2, S / 2, R, 0, 7); c.stroke();
    });
  }

  // ---------- map overlay (library loaded only when asked for) ----------
  var leafletPromise = null, mapState = null;
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (!leafletPromise) leafletPromise = new Promise(function (res, rej) {
      var l = document.createElement("link"); l.rel = "stylesheet"; l.href = "vendor/leaflet/leaflet.css"; document.head.appendChild(l);
      var s = document.createElement("script"); s.src = "vendor/leaflet/leaflet.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
    return leafletPromise;
  }
  function openMap(people) {
    addStyles();
    var ov = document.getElementById("mapOverlay");
    if (!ov) {
      ov = document.createElement("div"); ov.id = "mapOverlay";
      ov.innerHTML = '<div class="mt"><div class="tt">Globe</div><button class="mx" aria-label="Close">&#10005;</button></div><div class="mp" id="mapPeople"></div><div id="mapEl"></div><div class="mb"><div class="row" id="mapPl"></div><div class="row" id="mapAn"></div><div class="hint">Zoom in to see the cities along each line. Tap a line to read what it means.</div></div>';
      document.body.appendChild(ov); ov.querySelector(".mx").onclick = function () { ov.classList.remove("open"); };
    }
    ov.classList.add("open");
    var avail = people.filter(function (p) { return p.acg; });
    mapState = { person: avail[0], on: {}, ang: { ASC: 1, MC: 1, DSC: 1, IC: 1 }, layers: {} };
    PLANET_NAMES.forEach(function (k) { mapState.on[k] = true; });
    var peopleEl = ov.querySelector("#mapPeople"); peopleEl.innerHTML = "";
    if (avail.length > 1) avail.forEach(function (p) { var b = document.createElement("button"); b.className = "tl-chip" + (p === mapState.person ? " on" : ""); b.textContent = p.first; b.onclick = function () { mapState.person = p; [].forEach.call(peopleEl.children, function (c) { c.classList.toggle("on", c === b); }); drawLines(); }; peopleEl.appendChild(b); });
    var pl = ov.querySelector("#mapPl"); pl.innerHTML = "";
    PLANET_NAMES.forEach(function (k) { var b = document.createElement("button"); b.className = "ch"; b.innerHTML = '<i style="background:' + PLANET_COLOR[k] + '"></i>' + k; b.onclick = function () { mapState.on[k] = !mapState.on[k]; b.classList.toggle("off", !mapState.on[k]); drawLines(); }; pl.appendChild(b); });
    var an = ov.querySelector("#mapAn"); an.innerHTML = "";
    Object.keys(ANGLE).forEach(function (a) { var b = document.createElement("button"); b.className = "ch"; b.textContent = a + " " + (a === "ASC" || a === "MC" ? "(solid)" : a === "DSC" ? "(dashed)" : "(dotted)"); b.onclick = function () { mapState.ang[a] = mapState.ang[a] ? 0 : 1; b.classList.toggle("off", !mapState.ang[a]); drawLines(); }; an.appendChild(b); });
    loadLeaflet().then(function () {
      var el = document.getElementById("mapEl");
      if (!mapState.map) {
        if (el._leaflet_id) { el._leaflet_id = null; el.innerHTML = ""; }
        mapState.map = L.map(el, { worldCopyJump: true, minZoom: 2, zoomSnap: .5 });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(mapState.map);
        mapState.group = L.layerGroup().addTo(mapState.map);
      }
      drawLines(true); setTimeout(function () { mapState.map.invalidateSize(); }, 60);
    }).catch(function () { var el = document.getElementById("mapEl"); if (el) el.innerHTML = '<div style="padding:24px;font:600 14px sans-serif;color:#000">The map could not load. Please check your connection and try again.</div>'; });
  }
  function drawLines(fit) {
    var st = mapState; if (!st || !st.map) return; st.group.clearLayers();
    var L2 = allLines(st.person.acg), dash = { ASC: null, MC: null, DSC: "9 7", IC: "2 7" };
    PLANET_NAMES.forEach(function (k) {
      if (!st.on[k] || !L2[k]) return; var l = L2[k], col = PLANET_COLOR[k];
      function pop(a) { var nm = k.charAt(0).toUpperCase() + k.slice(1); return "<b>" + nm + " " + a + "</b><br><i>" + ANGLE[a][0] + " line</i><br>" + nm + " is " + ANGLE[a][1] + " here. Its themes (" + PLANET_THEME[k] + ") show up " + ANGLE[a][2] + "."; }
      ["MC", "IC"].forEach(function (a) { if (!st.ang[a]) return; [-360, 0, 360].forEach(function (off) { L.polyline([[-85, l[a] + off], [85, l[a] + off]], { color: col, weight: 3, dashArray: dash[a] }).bindPopup(pop(a)).addTo(st.group); }); });
      ["ASC", "DSC"].forEach(function (a) { if (!st.ang[a]) return; splitWrap(l[a]).forEach(function (s) { [-360, 0, 360].forEach(function (off) { L.polyline(s.map(function (p) { return [p[0], p[1] + off]; }), { color: col, weight: 3, dashArray: dash[a] }).bindPopup(pop(a)).addTo(st.group); }); }); });
    });
    if (st.person.birth) L.circleMarker([st.person.birth.lat, st.person.birth.lng], { radius: 7, color: "#fff", weight: 2, fillColor: "#000", fillOpacity: 1 }).bindPopup("Birthplace").addTo(st.group);
    if (fit && st.person.birth) st.map.setView([st.person.birth.lat, st.person.birth.lng], 3);
  }

  // ---------- timeline ----------
  var transitsPromise = null;
  function loadTransits() {
    if (!transitsPromise) transitsPromise = Promise.all([fetch("data/transits.bin").then(function (r) { return r.arrayBuffer(); }), fetch("data/timeline-milestones.json").then(function (r) { return r.json(); }), fetch("data/timeline-houses.json").then(function (r) { return r.json(); })]).then(function (a) {
      var b = a[0], dv = new DataView(b), n = dv.getUint32(10, true), np = dv.getUint8(14), step = dv.getUint16(8, true), start = dv.getInt32(4, true);
      var u = new Uint16Array(b, 16, n * np), names = ["jupiter", "saturn", "uranus", "neptune", "pluto", "northnode", "chiron"], t = { start: start, step: step, n: n, lon: {} };
      names.forEach(function (nm, j) { t.lon[nm] = u.subarray(j * n, (j + 1) * n); });
      return { t: t, ms: a[1], hs: a[2] };
    });
    return transitsPromise;
  }
  function natalOf(p) {
    var a = p.astro || {}, SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"], absOf = function (x) { if (!x) return null; if (typeof x.absoluteDegrees === "number") return x.absoluteDegrees; var i = SIGNS.indexOf(x.sign), d = parseFloat(x.degreesInSign); return i >= 0 && isFinite(d) ? i * 30 + d : null; }, get = function (nm) { var x = (a.planets || []).filter(function (q) { return q.name === nm; })[0]; return x && !x.signUncertain ? x.absoluteDegrees : null; };
    var hasTime = !(a.timeUnknown || a.locationUnknown);
    var cusps = hasTime ? (a.houses || []).filter(function (x) { return typeof x.absoluteDegrees === "number" && typeof x.house === "number"; }).sort(function (x, y) { return x.house - y.house; }) : [];
    var hOf = function (nm) { var x = (a.planets || []).filter(function (q) { return q.name === nm; })[0]; return hasTime && x && typeof x.house === "number" ? x.house : null; };
    return { hasTime: hasTime, sun: get("Sun"), moon: hasTime ? get("Moon") : null, asc: hasTime && a.ascendant ? a.ascendant.absoluteDegrees : null, jupiter: get("Jupiter"), saturn: get("Saturn"), uranus: get("Uranus"), neptune: get("Neptune"), pluto: get("Pluto"), northnode: absOf(a.northNode), chiron: absOf(a.chiron), cusps: cusps.length === 12 ? cusps.map(function (x) { return x.absoluteDegrees; }) : null, house: { jupiter: hOf("Jupiter"), saturn: hOf("Saturn"), uranus: hOf("Uranus"), neptune: hOf("Neptune"), pluto: hOf("Pluto"), chiron: hasTime && a.chiron && typeof a.chiron.house === "number" ? a.chiron.house : null, northnode: hasTime && a.northNode && typeof a.northNode.house === "number" ? a.northNode.house : null } };
  }
  // The planet bars: one bar for each turning point of a planet's cycle (square, opposition, return) at your own birth position.
  var SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  var CYCLE_RULES = {
    saturn: { orb: 8, dir: 1, keep: function (k) { return k <= 16; }, idx: function (k) { return k; } },
    jupiter: { orb: 15, dir: 1, keep: function (k) { return k % 4 === 0; }, idx: function (k) { return k / 4; } },
    uranus: { orb: 5, dir: 1, keep: function (k) { return k <= 5; }, idx: function (k) { return k; } },
    neptune: { orb: 4, dir: 1, keep: function (k) { return k <= 2; }, idx: function (k) { return k; } },
    pluto: { orb: 3, dir: 1, keep: function (k) { return k <= 2; }, idx: function (k) { return k; } },
    chiron: { orb: 5, dir: 1, keep: function (k) { return k >= 2 && k <= 8; }, idx: function (k) { return k; } },
    northnode: { orb: 10, dir: -1, keep: function (k) { return k % 2 === 0; }, idx: function (k) { return k; } }
  };
  var HOUSE_AREA = { 1: "you, your body and identity", 2: "money and what you value", 3: "communication and learning", 4: "home and family", 5: "creativity, romance and children", 6: "work routine and health", 7: "close partnership", 8: "shared money, intimacy and endings", 9: "beliefs, study and travel", 10: "career and public standing", 11: "friends, groups and hopes", 12: "the hidden side of life" };
  function ordinal(n) { return n + (n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"); }
  function fmtDay(ms) { var d = new Date(ms); return MONTHS[d.getUTCMonth()] + " " + d.getUTCDate() + ", " + d.getUTCFullYear(); }
  function explainEvent(pl, phase) {
    var nm = pl === "northnode" ? "The North Node" : pl.charAt(0).toUpperCase() + pl.slice(1);
    if (phase === "Return") return nm + " is back at the position it held when you were born.";
    if (phase === "Opposition") return nm + " is halfway around its cycle, directly opposite the position it held when you were born, which brings the matter into view from the other side.";
    return nm + " is a quarter turn from the position it held when you were born, a right angle called a square, which brings pressure.";
  }
  function houseAt(lon, cusps) { if (!cusps) return null; for (var i = 0; i < 12; i++) { var s = cusps[i], e = cusps[(i + 1) % 12]; if (((lon - s) % 360 + 360) % 360 < ((e - s) % 360 + 360) % 360) return i + 1; } return null; }
  function leadOf(txt) { var m = /^(.*?\.)(\s|$)/.exec(txt || ""); return m ? m[1] : (txt || ""); }
  function phaseName(k) { return k % 4 === 0 ? "Return" : k % 4 === 2 ? "Opposition" : "Square"; }
  function computeEvents(p, data) {
    var nat = natalOf(p), dob = parseDob(p.dob); if (!dob) return [];
    var birthMs = Date.UTC(dob.y, dob.m - 1, dob.d), endMs = birthMs + TL_YEARS * MS_YEAR, t = data.t, out = [];
    var i0 = Math.floor((birthMs / MS_DAY - t.start) / t.step), i1 = Math.min(t.n - 1, Math.ceil((endMs / MS_DAY - t.start) / t.step));
    if (i0 < 0) return out;
    Object.keys(CYCLE_RULES).forEach(function (pl) {
      var rule = CYCLE_RULES[pl], target = nat[pl], arr = t.lon[pl]; if (target == null || !arr) return;
      var x0 = rule.dir * arr[i0] / 100, cum = norm180(x0 - rule.dir * target), prev = x0, win = {}, exact = {};
      for (var i = i0 + 1; i <= i1; i++) {
        var pc = cum, x = rule.dir * arr[i] / 100; cum += norm180(x - prev); prev = x;
        var kk = Math.round((pc + cum) / 2 / 90);
        if (kk >= 1 && rule.keep(kk) && Math.abs(cum - 90 * kk) <= rule.orb && (pc - 90 * kk) * (cum - 90 * kk) <= 0 && pc !== cum) { (exact[kk] = exact[kk] || []).push((t.start + (i - 1 + (90 * kk - pc) / (cum - pc)) * t.step) * MS_DAY); }
        var k = Math.round(cum / 90); if (k < 1 || Math.abs(cum - 90 * k) > rule.orb || !rule.keep(k)) continue;
        if (!win[k]) win[k] = { a: i, b: i }; else win[k].b = i;
      }
      Object.keys(win).forEach(function (ks) {
        var k = +ks, w = win[k], a = (t.start + w.a * t.step) * MS_DAY - t.step * MS_DAY / 2, b = (t.start + w.b * t.step) * MS_DAY + t.step * MS_DAY / 2;
        if (b < birthMs || a > endMs) return;
        if (((a + b) / 2 - birthMs) / MS_YEAR < TL_MIN_AGE) return;
        var mid = Math.round((w.a + w.b) / 2), isRet = phaseName(k) === "Return", sign = SIGN_NAMES[Math.floor((isRet ? target : arr[mid] / 100) / 30) % 12];
        var txt = (((data.ms.milestones || {})[pl] || {})[String(rule.idx(k))] || ""), sg = (((data.ms.signs || {})[pl] || {})[sign] || "");
        var ph = phaseName(k).toLowerCase(), house = ph === "return" ? nat.house[pl] : houseAt(arr[mid] / 100, nat.cusps), ht = house ? ((data.hs || {})[pl + "." + ph + "." + house] || "") : "", nh = nat.house[pl], link = ht && ph !== "return" && nh ? (" It also touches your natal " + (pl === "northnode" ? "North Node" : pl.charAt(0).toUpperCase() + pl.slice(1)) + ", which is in your " + ordinal(nh) + " house (" + HOUSE_AREA[nh] + "), so that area is involved too.") : "";
        var ex = (exact[k] || []).filter(function (m) { return m >= birthMs && m <= endMs; }), exTxt = ex.length ? (" " + (ex.length === 1 ? "It is exact on " + fmtDay(ex[0]) + "." : "It is exact on " + ex.slice(0, -1).map(fmtDay).join(", ") + " and " + fmtDay(ex[ex.length - 1]) + ", because the planet moves back and forth over the point.")) : "";
        out.push({ col: pl, k: k, a: Math.max(a, birthMs), b: Math.min(b, endMs), text: (ht ? (leadOf(txt) + " " + explainEvent(pl, phaseName(k)) + " " + ht + link) : (txt + (sg ? "\n" + sg : ""))).trim() + (exTxt ? (ht ? " " : "\n") + exTxt.trim() : ""), pl: pl, phase: phaseName(k), house: ht ? house : null, sign: sign });
      });
    });
    return out;
  }
  // numerology timeline values (ported exactly from the calculator)
  function redMaster(n) { while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = String(n).split("").reduce(function (s, d) { return s + +d; }, 0); return n; }
  function personalYear(dob, year) { return redMaster(String(dob.m + dob.d + year).split("").reduce(function (s, d) { return s + +d; }, 0)); }
  var LV = { A: 1, J: 1, S: 1, B: 2, K: 2, T: 2, C: 3, L: 3, U: 3, D: 4, M: 4, V: 4, E: 5, N: 5, W: 5, F: 6, O: 6, X: 6, G: 7, P: 7, Y: 7, H: 8, Q: 8, Z: 8, I: 9, R: 9 };
  function activeLetter(name, age) { var L = String(name || "").toUpperCase().replace(/[^A-Z]/g, "").split(""); if (!L.length) return 0; var rem = age, i = 0; for (var g = 0; g < 5000; g++) { var d = LV[L[i % L.length]]; if (rem < d) return d; rem -= d; i++; } return 0; }
  function essenceAt(p, age) { var parts = [p.first, p.mid, p.last].filter(function (s) { return s && String(s).trim(); }); if (!parts.length) return null; return redMaster(parts.reduce(function (s, n) { return s + activeLetter(n, age); }, 0)); }
  function rangeAges(str) { var m = /^(birth|\d+)\D+(onward|\d+)$/.exec(String(str || "").replace(/[–—-]/, "–")); if (!m) { var r = String(str || "").split("–"); return { lo: r[0] === "birth" ? 0 : +r[0], hi: r[1] === "onward" ? 999 : +r[1] }; } return { lo: m[1] === "birth" ? 0 : +m[1], hi: m[2] === "onward" ? 999 : +m[2] }; }

  function openTimeline(people) {
    addStyles();
    var nowD = new Date(), me = { idx: 0, data: null, sel: null, selDate: Date.UTC(nowD.getFullYear(), nowD.getMonth(), nowD.getDate()) };
    function person() { return people[me.idx]; }
    function build() {
      var p = person(), dob = parseDob(p.dob), num = p.numerology; if (!dob || !num) return;
      var NC = { 1: ["#ff9c1a", "#1a1200"], 2: ["#94b2ff", "#1a1200"], 3: ["#fefe8b", "#1a1200"], 4: ["#0b0b10", "#fff"], 5: ["#41a476", "#fff"], 6: ["#ffa3ff", "#1a1200"], 7: ["#a345bf", "#fff"], 8: ["#935734", "#fff"], 9: ["#d10000", "#fff"] };
      NC[11] = NC[2]; NC[22] = NC[4]; NC[33] = NC[6];
      var PC = { saturn: ["#14141f", "#fff"], jupiter: ["#d9a400", "#1a1200"], uranus: ["#2b7bff", "#fff"], neptune: ["#d11fb5", "#fff"], pluto: ["#ff1f5a", "#fff"], chiron: ["#6f4cff", "#fff"], northnode: ["#00b8c4", "#0b0b10"] };
      var birthMs = Date.UTC(dob.y, dob.m - 1, dob.d), years = TL_YEARS, endMs = birthMs + years * MS_YEAR, PX = me.zoom ? 264 : 40, total = PX * years;
      var ypos = function (ms) { return Math.max(0, Math.min(total, (endMs - ms) / MS_YEAR * PX)); };
      var COLS = ["Personal Year", "Essence", "Pinnacle", "Challenge", "Period", "Saturn", "Jupiter", "Uranus", "Neptune", "Pluto", "Chiron", "North Node"], KEYS = ["py", "es", "pin", "ch", "per", "saturn", "jupiter", "uranus", "neptune", "pluto", "chiron", "northnode"];
      var items = [];
      for (var y = dob.y; y <= dob.y + years; y++) items.push({ col: "py", a: Math.max(Date.UTC(y, 0, 1), birthMs), b: Date.UTC(y + 1, 0, 1), label: personalYear(dob, y), n: personalYear(dob, y), title: "Personal Year " + personalYear(dob, y) + " · " + y, text: (NUM_DEFS.personalyear || {})[personalYear(dob, y)] || "" });
      var es = []; for (var a = 0; a <= years; a++) { var v = essenceAt(p, a); if (v == null) break; var l = es[es.length - 1]; if (l && l.v === v) l.hi = a; else es.push({ v: v, lo: a, hi: a }); }
      es.forEach(function (e) { items.push({ col: "es", a: birthMs + e.lo * MS_YEAR, b: birthMs + (e.hi + 1) * MS_YEAR, label: e.v, n: e.v, title: "Essence " + e.v + " · ages " + e.lo + " to " + e.hi, text: (NUM_DEFS.essence || {})[e.v] || "" }); });
      var pins = num.pinnacles || {}, chs = num.challengeNumbers || {};
      [1, 2, 3, 4].forEach(function (n) { var pn = pins["pinnacle" + n]; if (!pn) return; var r = rangeAges(pn.ageRange), hiAge = r.hi >= 999 ? years : r.hi, a2 = birthMs + r.lo * MS_YEAR, b2 = birthMs + (hiAge + 1) * MS_YEAR, rng = "ages " + r.lo + (r.hi >= 999 ? " onward" : " to " + r.hi);
        items.push({ col: "pin", a: a2, b: b2, label: pn.value, n: pn.value, title: "Pinnacle " + pn.value + " · " + rng, text: (NUM_DEFS.pinnacle || {})[pn.value] || "" });
        var cv = chs["challenge" + n]; if (cv != null) items.push({ col: "ch", a: a2, b: b2, label: cv, n: cv, title: "Challenge " + cv + " · " + rng, text: (NUM_DEFS.challenge || {})[cv] || "" }); });
      var pers = num.periodCycles || {}; [1, 2, 3].forEach(function (n) { var pe = pers["period" + n]; if (!pe) return; var r = rangeAges(pe.ageRange), hiAge = r.hi >= 999 ? years : r.hi; items.push({ col: "per", a: birthMs + r.lo * MS_YEAR, b: birthMs + (hiAge + 1) * MS_YEAR, label: pe.value, n: pe.value, title: "Period " + pe.value + " · ages " + r.lo + (r.hi >= 999 ? " onward" : " to " + r.hi), text: (NUM_DEFS.periodcycle || {})[pe.value] || "" }); });
      (me.events || []).forEach(function (e) { var nm = e.pl === "northnode" ? "North Node" : e.pl.charAt(0).toUpperCase() + e.pl.slice(1), lo = Math.floor((e.a - birthMs) / MS_YEAR), hi = Math.ceil((e.b - birthMs) / MS_YEAR);
        items.push({ col: e.col, a: e.a, b: e.b, label: nm + " " + e.phase, ev: true, title: nm + " " + e.phase.toLowerCase() + " · ages " + lo + " to " + hi + " · " + fmtDate(e.a) + " to " + fmtDate(e.b) + " · in " + e.sign + (e.house ? ", house " + e.house : ""), text: e.text }); });
      var colW = 100 / COLS.length, html = '<div class="tl-body" style="height:' + total + 'px">';
      if (me.zoom) { var c0 = new Date(me.selDate), my = c0.getUTCFullYear() * 12 + c0.getUTCMonth(); for (var mm = my - 36; mm <= my + 36; mm++) { var yr = Math.floor(mm / 12), mo = mm % 12, t0 = Date.UTC(yr, mo, 1), t1 = Date.UTC(yr, mo + 1, 1); if (t1 <= birthMs || t0 >= endMs) continue; html += '<div class="tl-tick' + (mo === 0 ? " yr" : "") + '" style="top:' + (ypos((t0 + t1) / 2)) + 'px">' + (mo === 0 ? yr : MONTHS[mo]) + "</div>"; } }
      else for (var yy = dob.y + 1; yy <= dob.y + years; yy++) html += '<div class="tl-tick yr" style="top:' + ypos(Date.UTC(yy, 0, 1)) + 'px">' + yy + "</div>";
      items.forEach(function (it, ix) { var ci = KEYS.indexOf(it.col); if (ci < 0) return; var top = ypos(it.b), h = Math.max(5, ypos(it.a) - top - 3), c = it.ev ? PC[it.col] : (NC[it.n] || NC[8]), cls = "tl-bar" + (it.ev ? " ev" : "") + (!it.ev && (it.n === 2 || it.n === 11) ? " n2" : "") + (it.ev && h < 78 ? (me.zoom ? " out" : " nolab") : "") + (h >= 160 ? " tall" : "") + (c[1] === "#fff" && !(it.ev && h < 78) ? " wt" : "");
        html += '<div class="' + cls + '" data-i="' + ix + '" style="left:calc(' + ci * colW + '% + 2px);width:calc(' + colW + '% - 4px);top:' + top + 'px;height:' + h + 'px;background:' + c[0] + ";color:" + c[1] + '"><span>' + esc(it.label) + "</span></div>"; });
      var nowY = ypos(me.selDate); html += '<div class="tl-now" id="tlNow" style="top:' + nowY + 'px"></div></div>';
      me.items = items; me.birthMs = birthMs;
      var head = '<div class="tl-head">' + COLS.map(function (c) { return "<div>" + c + "</div>"; }).join("") + "</div>";
      var chips = people.length > 1 ? people.map(function (q, i) { return '<button class="tl-chip' + (i === me.idx ? " on" : "") + '" data-p="' + i + '">' + esc(q.first) + "</button>"; }).join("") : "";
      var ds = new Date(me.selDate), iso = ds.getUTCFullYear() + "-" + String(ds.getUTCMonth() + 1).padStart(2, "0") + "-" + String(ds.getUTCDate()).padStart(2, "0");
      body.innerHTML = '<div class="tl"><div class="tl-ctl"><label for="tlDate" id="tlDateLab">' + (me.pass ? "Type a date" : "Today") + '</label><input type="date" id="tlDate" value="' + iso + '"' + (me.pass ? "" : " disabled") + '><button class="tl-chip" id="tlRead">' + (me.pass ? "Read this day" : "Read today") + '</button>' + chips + (me.zoom ? '<button class="tl-chip" id="tlWhole">Whole life</button>' : "") + '</div><div class="tl-info" id="tlInfo"></div>' + '<div class="tl-frame">' + head + '<div class="tl-scroll" id="tlScroll">' + html + "</div></div></div>";
      showActive();
      var sc = document.getElementById("tlScroll"); var go = function () { sc.style.setProperty("--stk", Math.round(sc.clientHeight * 0.42) + "px"); sc.scrollTop = Math.max(0, nowY - sc.clientHeight / 2); }; go(); setTimeout(go, 120); setTimeout(go, 450);
      sc.addEventListener("click", function (e) { var bar = e.target.closest(".tl-bar"); if (!bar) return; var it = me.items[+bar.dataset.i]; [].forEach.call(sc.querySelectorAll(".tl-bar.sel"), function (x) { x.classList.remove("sel"); }); bar.classList.add("sel"); document.getElementById("tlInfo").innerHTML = '<span class="tt">' + esc(it.title) + "</span>" + esc(it.text || "").replace(/\n/g, "<br>"); });
      document.getElementById("tlDate").onchange = function (e) { var v = e.target.value.split("-"); if (v.length === 3) { me.selDate = Date.UTC(+v[0], +v[1] - 1, +v[2]); me.selIsNow = false; me.zoom = true; build(); } };
      var wh = document.getElementById("tlWhole"); if (wh) wh.onclick = function () { me.zoom = false; build(); };
      var rd = document.getElementById("tlRead"); if (rd) rd.onclick = readDay;
      [].forEach.call(body.querySelectorAll(".tl-chip[data-p]"), function (b) { b.onclick = function () { me.idx = +b.dataset.p; loadEvents(); }; });
    }
    function readDay() {
      var p = person(), el = document.getElementById("tlDate"), host = body.querySelector(".tl"), t0 = new Date(), todayIso = t0.getFullYear() + "-" + String(t0.getMonth() + 1).padStart(2, "0") + "-" + String(t0.getDate()).padStart(2, "0"), iso = me.pass ? (el && el.value) : todayIso; if (!iso || !host) return;
      var old = host.querySelector(".tl-day"); if (old) old.remove();
      var panel = document.createElement("div"); panel.className = "tl-day"; host.appendChild(panel);
      var parts = iso.split("-"), when = Date.UTC(+parts[0], +parts[1] - 1, +parts[2], 12), lab = MONTHS[+parts[1] - 1] + " " + +parts[2] + ", " + parts[0];
      var close = '<button class="tl-chip x" id="tlDayX">Close</button>';
      var say = function (msg) { panel.innerHTML = close + '<div class="dt">' + esc(p.first) + " &middot; " + esc(lab) + "</div><p>" + esc(msg) + "</p>"; document.getElementById("tlDayX").onclick = function () { panel.remove(); }; };
      // a day reading is kept on the visitor's own device, with no expiry; it opens from there and the visitor alone can clear it
      var dkey = "kye_day|" + [p.first, p.last, p.dob, iso].join("|").toLowerCase();
      var show = function (r) {
        var paras = String(r.body || "").split(/\n\s*\n/).filter(function (s) { return s.trim(); });
        panel.innerHTML = close + '<div class="dt">' + esc(p.first) + " &middot; " + esc(lab) + "</div><h3>" + esc(r.headline || "") + "</h3>" + paras.map(function (s) { return "<p>" + esc(s.trim()) + "</p>"; }).join("") + ((r.references || []).length ? "<details><summary>What this draws on</summary>" + r.references.map(function (s) { return "<div>" + esc(s) + "</div>"; }).join("") + "</details>" : "");
        document.getElementById("tlDayX").onclick = function () { panel.remove(); };
      };
      try { var kept = localStorage.getItem(dkey); if (kept) { show(JSON.parse(kept)); return; } } catch (e) {}
      var email = ""; try { var f = document.getElementById("pEmail"); email = ((f && f.value) || "").trim() || localStorage.getItem("kye_passEmail") || ""; } catch (e) {}
      if (!email) { say("Enter the email address of your pass on the first page, then open this again."); return; }
      say("Writing your reading for " + lab + ". This takes up to a minute.");
      var ast = Object.assign({}, p.astro || {}); delete ast.acg; delete ast.aspects;
      var cycles = (me.items || []).filter(function (it) { return it.ev && it.a <= when && when < it.b; }).map(function (it) { return it.title; });
      var api = typeof W_API !== "undefined" ? W_API : "https://know-your-energy.kwdoanchor.workers.dev";
      var timer = new Promise(function (_, rej) { setTimeout(function () { rej(new Error("This is taking longer than expected. Please try again.")); }, 150000); });
      Promise.race([fetch(api + "/day-reading", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passEmail: email, date: iso, person: { first: p.first, mid: p.mid, last: p.last, dob: p.dob }, astrology: ast, humanDesign: p.hd || null, activeCycles: cycles }) }).then(function (r) { return r.json().then(function (j) { if (!r.ok || j.error) throw new Error(j.error || "Something went wrong. Please try again."); return j; }); }), timer]).then(function (j) {
        var r = j.report || {};
        try { localStorage.setItem(dkey, JSON.stringify(r)); } catch (e) {}
        show(r);
      }).catch(function (e) { say(e && e.message ? e.message : "Something went wrong. Please try again."); });
    }
    function showActive() {
      var info = document.getElementById("tlInfo"); if (!info) return; var d = me.selDate, act = me.items.filter(function (it) { return it.a <= d && d < it.b; });
      var dt = new Date(d), lab = MONTHS[dt.getUTCMonth()] + " " + dt.getUTCDate() + ", " + dt.getUTCFullYear();
      info.innerHTML = '<span class="tt">What is active on ' + lab + "</span>" + (act.length ? act.map(function (it) { return esc(it.title.split(" · ")[0]); }).join(" &middot; ") : "Nothing is recorded for this date.") + '<br><span style="font-weight:700">Tap any bar to read what it means. The planet bars follow traditional astrology.</span>';
    }
    var ex = document.getElementById("cardExpand"), body = document.getElementById("cardExpandBody"), ttl = document.getElementById("cardExpandTitle");
    function passEmailNow() { try { var f = document.getElementById("pEmail"); return ((f && f.value) || "").trim() || localStorage.getItem("kye_passEmail") || ""; } catch (e) { return ""; } }
    function checkPassNow() { var em = passEmailNow(); if (!em || typeof checkPassStatus !== "function") { me.pass = false; return; } checkPassStatus(em).then(function (r) { me.pass = !!(r && r.active); var b = document.getElementById("tlRead"), d = document.getElementById("tlDate"), l = document.getElementById("tlDateLab"); if (b) b.textContent = me.pass ? "Read this day" : "Read today"; if (d) d.disabled = !me.pass; if (l) l.textContent = me.pass ? "Type a date" : "Today"; }).catch(function () {}); }
    function loadEvents() {
      ttl.textContent = person().first + " · Timeline"; if (typeof setChartFrame === "function") setChartFrame("Numerology");
      body.innerHTML = '<div class="tl"><div class="tl-info">Loading your timeline&hellip;</div></div>';
      checkPassNow();
      loadTransits().then(function (d) { me.events = computeEvents(person(), d); build(); }).catch(function () { body.innerHTML = '<div class="tl"><div class="tl-info">The timeline could not load. Please check your connection and try again.</div></div>'; });
    }
    me.selIsNow = true; ex.classList.add("open"); loadEvents();
  }

  // ---------- put it all on the results page ----------
  function peopleOf(p1, p2) {
    return [p1, p2].filter(Boolean).map(function (p) {
      var a = p.astro || {}, loc = a.location || {};
      return { first: p.first, mid: p.mid, last: p.last, dob: p.dob, numerology: p.numerology, astro: p.astro, hd: p.hd || null, acg: a.acg || null, birth: a.acg && loc.latitude != null ? { lat: loc.latitude, lng: loc.longitude } : null };
    });
  }
  function frameCard(cls, inner) { return '<div class="xcard ' + cls + '" role="button" tabindex="0"><i></i><b>' + inner + "</b></div>"; }
  window.addExtras = function (p1, p2) {
    try {
      addStyles();
      var g = document.getElementById("mainGrid"); if (!g) return;
      [].forEach.call(g.querySelectorAll(".xlinks,.xpass"), function (x) { x.remove(); });
      var people = peopleOf(p1, p2), withMap = people.filter(function (p) { return p.acg && p.birth; }), now = new Date(), nowLab = MONTHS[now.getMonth()] + " " + now.getDate();
      var acts = g.querySelector(".fan-actions"), names = people.map(function (p) { return p.first; }).join(" & ");
      var tl = document.createElement("div"); tl.className = "xtlwrap";
      tl.innerHTML = frameCard("xtl", '<div class="cap">TIMELINE</div><div class="sc">' + nowLab + '</div><div class="rl"></div><div class="ln">NUMEROLOGY</div><div class="rl"></div><div class="ln">ASTROLOGY</div><div class="rl"></div><div class="ln">HUMAN DESIGN</div><div class="nm">' + esc(names) + "</div>");
      tl.firstChild.onclick = function () { openTimeline(people); };
      var links = document.createElement("div"); links.className = "xlinks";
      links.innerHTML = '<a href="#" id="xRun">Run another reading</a><a href="#" id="xSave">Save / Print reading</a>';
      links.querySelector("#xRun").onclick = function (e) { e.preventDefault(); resetToForm(); };
      links.querySelector("#xSave").onclick = function (e) { e.preventDefault(); savePrintReading(); };
      if (acts) {
        [].forEach.call(acts.querySelectorAll(".side-btn"), function (x) { x.remove(); });
        acts.classList.add("xacts");
        var gl = document.createElement("div"); gl.className = "xglobe"; gl.setAttribute("role", "button");
        var capTxt = withMap.length ? "Where each planet\'s energy is strongest for you." : "Add a birth city and time to see where each planet\'s energy is strongest for you.";
        gl.innerHTML = '<canvas width="300" height="300"></canvas><div class="gl">Globe</div><div class="xcap">' + capTxt + '</div>';
        acts.appendChild(gl);
        if (withMap.length) { gl.onclick = function () { openMap(withMap); }; drawGlobe(gl.querySelector("canvas"), withMap[0].acg, withMap[0].birth).catch(function () {}); }
        else { drawGlobe(gl.querySelector("canvas"), null, null).catch(function () {}); }
        acts.appendChild(tl);
      } else { g.appendChild(tl); }
      g.appendChild(links);
      var ps = document.createElement("div"); ps.className = "xpass";
      var P = [["$11", "A week", "7 days"], ["$22", "A month", "30 days"], ["$33", "3 months", "90 days"]];
      ps.innerHTML = '<div class="h">Know Your Energy Daily!</div><div class="s">Get readings to understand relationship dynamics and how underlying cycles flow together or apart</div><div class="cols">' + P.map(function (x, i) { return '<div class="pw"><button type="button" class="p" data-pass="' + i + '"><div class="n">' + x[0] + '</div></button><div class="pl">' + x[2] + '</div></div>'; }).join("") + '</div><div class="note" id="passNote"></div><div class="pol">Never automatically charged. All sales final, no refunds. By choosing a pass you agree to the <a href="/terms.html">Terms</a>.</div>';
      g.appendChild(ps);
      [].forEach.call(ps.querySelectorAll(".p"), function (b) { b.onclick = function () { var n = document.getElementById("passNote"); n.textContent = "Passes are not on sale yet."; }; });
    } catch (e) { if (window.console) console.error("extras", e); }
  };
  if (window.__lastP) window.addExtras(window.__lastP[0], window.__lastP[1]);
})();
