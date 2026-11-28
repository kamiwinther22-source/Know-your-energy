/* Results page extras: the Timeline, the Globe (astrocartography) and the passes.
   Loaded after the page. Everything heavy (transit table, land outlines, the map library) is fetched only when it is needed. */
(function () {
  "use strict";
  var MS_DAY = 864e5, MS_YEAR = 365.25 * MS_DAY;
  var TL_YEARS = 120; // the timeline runs from birth to this age
  var TL_MIN_AGE = 18; // planet bars are not shown before this age
  var PLANET_NAMES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
  var PLANET_COLOR = { sun: "#fcc419", moon: "#868e96", mercury: "#51cf66", venus: "#f783ac", mars: "#e03131", jupiter: "#fd7e14", saturn: "#7b4a1e", uranus: "#22b8cf", neptune: "#3b5bdb", pluto: "#862e9c" };
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
      "#pricesStep .xpass .s,#pricesStep .xpass .pol,#pricesStep .xpass .note,#resultsWrap .xpass .s,#resultsWrap .xcap,#resultsWrap .xpass .pol,#resultsWrap .xpass .note,#resultsWrap .device-note,#resultsWrap .device-note *,#resultsWrap .tiny-contact,#resultsWrap .site-foot{font-weight:800 !important;color:#fff !important;-webkit-text-fill-color:#fff !important;text-shadow:0 0 6px rgba(255,255,255,.35),0 1px 2px rgba(0,0,0,.75) !important}",
      ".xacts{align-items:flex-start !important;gap:6px !important}",
      ".xtlwrap{display:flex}",
      ".xacts>.fan-reading,.xacts>.xglobe,.xacts>.xtlwrap{flex:1 1 0 !important;min-width:0;max-width:150px}",
      
      ".xlinks{display:flex;gap:8px;justify-content:center;margin:18px 0 0;padding:0 8px;filter:drop-shadow(0 8px 8px rgba(0,0,0,.55))}",
      ".xlinks a{flex:1 1 0;min-width:0;position:relative;isolation:isolate;height:56px;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 6px;box-sizing:border-box;color:#000 !important;-webkit-text-fill-color:#000;text-shadow:0 1px 0 rgba(255,255,255,.6);font:800 12px/1.15 'Barlow Condensed',sans-serif;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;cursor:pointer;background:url(img/k3/rbtn.png?v=1) center/100% 100% no-repeat !important}",
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
      ".xpass .p{width:100%;min-width:0;position:relative;isolation:isolate;border:0;cursor:pointer;height:46px;padding:0 14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#000;font-family:inherit;-webkit-tap-highlight-color:transparent;background:url(img/k3/chip66.png?v=1) center/100% 100% no-repeat !important}",
      ".xpass .p .n{text-shadow:0 1px 0 rgba(255,255,255,.6);font:900 21px/1 'Fraunces',Georgia,serif;color:#000}",
      ".xpass .p .l{text-shadow:0 1px 0 rgba(255,255,255,.6);font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.1em;margin-top:3px;text-transform:uppercase;color:#000}",
      ".xpass .p .d{font:700 11px 'Barlow Condensed',sans-serif;letter-spacing:.12em;margin-top:1px;color:#000}",
      ".xpass .note{text-align:center;font:700 13px/1.4 'Fraunces',serif;min-height:18px;margin:10px 8px 0}",
      ".xpass .pol{text-align:center;font:600 11.5px/1.5 'Fraunces',serif;margin:6px 8px 0}",
      ".xpass .pol a{color:#fff}",
      /* timeline */
      ".tl{color:#000;font-family:'DM Sans',sans-serif;position:relative}",
      ".tl-day{position:relative;background:#fff;border:2.5px solid #000;border-radius:14px;padding:14px 14px 18px;margin:0 0 8px;color:#000;-webkit-overflow-scrolling:touch}",
      ".tl-day{max-height:38vh;overflow:auto}",
      ".tl-day .dt{font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.14em;text-transform:uppercase;margin:0 0 6px}",
      ".tl-day h3{font:800 20px/1.25 'DM Sans',sans-serif;margin:0 0 10px;color:#000}",
      ".tl-day p{font:500 16px/1.6 'DM Sans',sans-serif;margin:0 0 11px;color:#000}",
      ".tl-day details{margin:12px 0 4px;font:600 13px/1.5 'DM Sans',sans-serif}",
      ".tl-day details summary{cursor:pointer;font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.12em;text-transform:uppercase}",
      ".tl-day .x{float:right}",
      ".tl-ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:2px 0 8px}",
      ".tl-ctl label{font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#000}",
      ".tl-ctl input:disabled{opacity:1;background:#fff;color:#000;-webkit-text-fill-color:#000;cursor:default}",
      ".tl-ctl input{font:700 16px 'DM Sans',sans-serif;border:2px solid #000;border-radius:12px;background:#fff;color:#000;padding:4px 8px}",
      ".tl-chip{font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.1em;border:2px solid #000;border-radius:12px;background:#fff;color:#000 !important;padding:3px 12px;cursor:pointer}",
      ".tl-chip.on{background:#000 !important;color:#fff !important}",
      ".tl-info{border:2.5px solid #000;border-radius:14px;padding:9px 12px;margin:0 0 8px;font:600 15px/1.5 'DM Sans',sans-serif;max-height:40vh;overflow:auto;color:#000;background:#fff}",
      ".tl.has-day .tl-info{display:none}",
      ".tl-info .tt{font:800 13px 'DM Sans',sans-serif;display:block;margin-bottom:2px}",
      ".tl-frame{border:3px solid #000;border-radius:18px;overflow:hidden;background:#fff}",
      ".tl-head{display:flex;margin-left:38px;border-bottom:1.5px solid #000}",
      ".tl-head div{flex:1;min-width:0;height:100px;display:flex;align-items:center;justify-content:flex-start;writing-mode:vertical-rl;transform:rotate(180deg);font:800 10.5px Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#000;white-space:nowrap;padding-top:6px;box-sizing:border-box}",
      ".tl-scroll{height:15vh;min-height:110px;overflow-y:auto;position:relative;-webkit-overflow-scrolling:touch;scrollbar-width:none}",
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
 ".leaflet-popup-content{font:500 13px/1.45 'DM Sans',sans-serif;color:#000}",
      ".mt .tt{font:400 34px/1 'Alex Brush',cursive}",
      "#mapOverlay .ms{position:relative;z-index:1200;padding:0 14px 8px}","#mapEl{isolation:isolate;flex:none !important;height:44vh;min-height:250px}","#mapOverlay.open{overflow-y:auto;-webkit-overflow-scrolling:touch}","#mapOverlay>*{flex:none}",
      "#mapOverlay .ms input{width:100%;box-sizing:border-box;height:44px;border:0;border-radius:10px;padding:0 14px;font:600 16px 'DM Sans',sans-serif;color:#000;background:#fff}",
      "#mapOverlay #mapSug{position:absolute;left:14px;right:14px;top:46px;z-index:5;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 20px rgba(0,0,0,.5)}",
      "#mapOverlay #mapSug button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #ddd;background:#fff;color:#000;padding:11px 14px;font:600 15px 'DM Sans',sans-serif;cursor:pointer}",
      "#mapOverlay .ms-n{padding:11px 14px;color:#000;font:600 14px 'DM Sans',sans-serif}",
      "#mapInfo{display:none;margin:0;padding:12px 14px;background:#fff;color:#000;font:500 14px/1.45 'DM Sans',sans-serif}",
      "#mapInfo .mi-d{color:#555;font-size:13px}#mapInfo .mi-s{color:#555;font-size:13px}#mapInfo u{text-decoration:none;font-weight:700}#mapInfo p{margin:8px 0 0}#mapInfo .mi-h{font:800 15px 'DM Sans',sans-serif;margin-bottom:6px}#mapInfo .mi-l{margin:0 0 9px}#mapInfo .mi-l i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:6px;border:1px solid #000}",
      "#mapOverlay details.mleg{color:#fff;font:500 13px/1.45 'DM Sans',sans-serif;margin:4px 0}#mapOverlay details.mleg summary{cursor:pointer;font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.1em;text-transform:uppercase}#mapOverlay details.mleg p{margin:6px 0 0}",
      ".kye-lbl{white-space:nowrap;font:700 11px 'DM Sans',sans-serif;color:#4a4334;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff;transform:translate(-50%,-50%);width:auto!important;height:auto!important}",
      ".kye-lbl.kye-cty{text-transform:uppercase;letter-spacing:.08em;font-size:10px;color:#7a6f55}",
      ".kye-lbl.kye-city{transform:translate(6px,-50%)}.kye-lbl.kye-city i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#333;margin:0 4px 1px -10px}"
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
  // ---------- the map: drawn here from public-domain outlines, every name in English, no outside map server ----------
  var OCEAN = "#bcd8e8", LAND = "#f3ecd9", BORDER = "#b8ab8c";
  var CITY_LABELS = [
    ["New York",40.7,-74,1],["Los Angeles",34.05,-118.24,1],["London",51.5,-0.12,1],["Paris",48.86,2.35,1],["Tokyo",35.68,139.69,1],["Delhi",28.61,77.21,1],["Mumbai",19.08,72.88,1],["Beijing",39.9,116.4,1],["Shanghai",31.23,121.47,1],["São Paulo",-23.55,-46.63,1],["Mexico City",19.43,-99.13,1],["Cairo",30.04,31.24,1],["Moscow",55.76,37.62,1],["Sydney",-33.87,151.21,1],["Istanbul",41.01,28.98,1],["Lagos",6.52,3.38,1],["Buenos Aires",-34.6,-58.38,1],["Johannesburg",-26.2,28.05,1],["Toronto",43.65,-79.38,1],["Singapore",1.35,103.82,1],["Dubai",25.2,55.27,1],["Bangkok",13.75,100.5,1],["Jakarta",-6.2,106.85,1],["Seoul",37.57,126.98,1],
    ["Chicago",41.88,-87.63,2],["Houston",29.76,-95.37,2],["Miami",25.76,-80.19,2],["San Francisco",37.77,-122.42,2],["Seattle",47.61,-122.33,2],["Denver",39.74,-104.99,2],["Atlanta",33.75,-84.39,2],["Vancouver",49.28,-123.12,2],["Montreal",45.5,-73.57,2],["Havana",23.11,-82.37,2],["Bogotá",4.71,-74.07,2],["Lima",-12.05,-77.04,2],["Santiago",-33.45,-70.67,2],["Rio de Janeiro",-22.91,-43.17,2],["Caracas",10.48,-66.9,2],["Madrid",40.42,-3.7,2],["Rome",41.9,12.5,2],["Berlin",52.52,13.4,2],["Amsterdam",52.37,4.9,2],["Vienna",48.21,16.37,2],["Athens",37.98,23.73,2],["Stockholm",59.33,18.07,2],["Dublin",53.35,-6.26,2],["Lisbon",38.72,-9.14,2],["Kyiv",50.45,30.52,2],["Warsaw",52.23,21.01,2],["Nairobi",-1.29,36.82,2],["Addis Ababa",9.03,38.74,2],["Accra",5.6,-0.19,2],["Casablanca",33.57,-7.59,2],["Cape Town",-33.92,18.42,2],["Tehran",35.69,51.39,2],["Riyadh",24.71,46.68,2],["Baghdad",33.31,44.36,2],["Karachi",24.86,67.01,2],["Dhaka",23.81,90.41,2],["Kolkata",22.57,88.36,2],["Bangalore",12.97,77.59,2],["Hong Kong",22.32,114.17,2],["Manila",14.6,120.98,2],["Taipei",25.03,121.57,2],["Kuala Lumpur",3.14,101.69,2],["Ho Chi Minh City",10.82,106.63,2],["Melbourne",-37.81,144.96,2],["Perth",-31.95,115.86,2],["Auckland",-36.85,174.76,2],["Honolulu",21.31,-157.86,2],["Anchorage",61.22,-149.9,2],["Reykjavík",64.15,-21.94,2],["Tel Aviv",32.09,34.78,2],
    ["Boston",42.36,-71.06,3],["Washington",38.9,-77.04,3],["Dallas",32.78,-96.8,3],["Phoenix",33.45,-112.07,3],["Las Vegas",36.17,-115.14,3],["San Diego",32.72,-117.16,3],["Portland",45.52,-122.68,3],["Minneapolis",44.98,-93.27,3],["New Orleans",29.95,-90.07,3],["Detroit",42.33,-83.05,3],["Philadelphia",39.95,-75.17,3],["Calgary",51.05,-114.07,3],["Edmonton",53.55,-113.49,3],["Ottawa",45.42,-75.7,3],["Halifax",44.65,-63.57,3],["Guadalajara",20.66,-103.35,3],["Monterrey",25.69,-100.32,3],["Panama City",8.98,-79.52,3],["San Juan",18.47,-66.11,3],["Quito",-0.18,-78.47,3],["La Paz",-16.5,-68.15,3],["Montevideo",-34.9,-56.16,3],["Brasília",-15.79,-47.88,3],["Manaus",-3.12,-60.02,3],["Salvador",-12.97,-38.51,3],["Barcelona",41.39,2.17,3],["Milan",45.46,9.19,3],["Munich",48.14,11.58,3],["Zurich",47.38,8.54,3],["Brussels",50.85,4.35,3],["Copenhagen",55.68,12.57,3],["Oslo",59.91,10.75,3],["Helsinki",60.17,24.94,3],["Prague",50.08,14.44,3],["Budapest",47.5,19.04,3],["Bucharest",44.43,26.1,3],["Edinburgh",55.95,-3.19,3],["Manchester",53.48,-2.24,3],["St. Petersburg",59.93,30.34,3],["Novosibirsk",55.03,82.92,3],["Vladivostok",43.12,131.89,3],["Algiers",36.75,3.06,3],["Tunis",36.81,10.18,3],["Dakar",14.72,-17.47,3],["Kinshasa",-4.44,15.27,3],["Luanda",-8.84,13.23,3],["Dar es Salaam",-6.79,39.21,3],["Khartoum",15.5,32.56,3],["Harare",-17.83,31.05,3],["Durban",-29.86,31.02,3],["Antananarivo",-18.88,47.51,3],["Jerusalem",31.77,35.21,3],["Beirut",33.89,35.5,3],["Amman",31.95,35.93,3],["Doha",25.29,51.53,3],["Kabul",34.53,69.17,3],["Tashkent",41.3,69.24,3],["Almaty",43.24,76.89,3],["Lahore",31.55,74.34,3],["Chennai",13.08,80.27,3],["Kathmandu",27.72,85.32,3],["Colombo",6.93,79.86,3],["Yangon",16.84,96.2,3],["Hanoi",21.03,105.85,3],["Guangzhou",23.13,113.26,3],["Chengdu",30.57,104.07,3],["Osaka",34.69,135.5,3],["Sapporo",43.06,141.35,3],["Busan",35.18,129.08,3],["Ulaanbaatar",47.89,106.91,3],["Brisbane",-27.47,153.03,3],["Adelaide",-34.93,138.6,3],["Darwin",-12.46,130.84,3],["Wellington",-41.29,174.78,3],["Port Moresby",-9.44,147.18,3],["Suva",-18.14,178.44,3],["Papeete",-17.54,-149.57,3],["Nuuk",64.18,-51.72,3]
  ];
  var COUNTRY_NAMES = { "Dem. Rep. Congo": "Democratic Republic of the Congo", "Central African Rep.": "Central African Republic", "Bosnia and Herz.": "Bosnia and Herzegovina", "S. Sudan": "South Sudan", "W. Sahara": "Western Sahara", "Dominican Rep.": "Dominican Republic", "Eq. Guinea": "Equatorial Guinea", "eSwatini": "Eswatini", "Fr. S. Antarctic Lands": "French Southern Lands", "Solomon Is.": "Solomon Islands", "Falkland Is.": "Falkland Islands", "N. Cyprus": "Northern Cyprus", "United States of America": "United States", "Czechia": "Czech Republic", "Macedonia": "North Macedonia" };
  var geoPromise = null;
  function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function loadGeo() {
    if (!geoPromise) geoPromise = Promise.all([fetch("vendor/geo/countries-50m.json").then(function (r) { return r.json(); }), window.topojson ? Promise.resolve() : loadScript("vendor/geo/topojson-client.min.js")]).then(function (a) { return window.topojson.feature(a[0], a[0].objects.countries); });
    return geoPromise;
  }
  // a label point for a country: the middle of its biggest piece
  function biggestPiece(geom) {
    var polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates, best = null, bestA = -1;
    polys.forEach(function (p) { var r = p[0], mnx = 999, mxx = -999, mny = 999, mxy = -999; r.forEach(function (c) { if (c[0] < mnx) mnx = c[0]; if (c[0] > mxx) mxx = c[0]; if (c[1] < mny) mny = c[1]; if (c[1] > mxy) mxy = c[1]; }); var a = (mxx - mnx) * (mxy - mny); if (a > bestA) { bestA = a; best = { lat: (mny + mxy) / 2, lng: (mnx + mxx) / 2, area: a }; } });
    return best;
  }
  function drawBase(map, st) {
    map.getContainer().style.background = OCEAN;
    map.createPane("land").style.zIndex = 220;
    var lp = map.createPane("lbl"); lp.style.zIndex = 450; lp.style.pointerEvents = "none";
    var rend = L.canvas({ pane: "land" });
    return loadGeo().then(function (fc) {
      if (!st || st.map !== map) return;
      [-360, 0, 360].forEach(function (off) {
        L.geoJSON(fc, { pane: "land", renderer: rend, interactive: false, style: { fillColor: LAND, fillOpacity: 1, color: BORDER, weight: .7 }, coordsToLatLng: function (c) { return L.latLng(c[1], c[0] + off); } }).addTo(map);
      });
      st.labels = [];
      fc.features.forEach(function (f) {
        var bp = biggestPiece(f.geometry); if (!bp || bp.area < 2) return;
        var nm = COUNTRY_NAMES[f.properties.name] || f.properties.name, z = bp.area > 300 ? 2 : bp.area > 40 ? 3.5 : 4.5;
        st.labels.push({ z: z, m: L.marker([bp.lat, bp.lng], { pane: "lbl", interactive: false, keyboard: false, icon: L.divIcon({ className: "kye-lbl kye-cty", html: nm, iconSize: null }) }) });
      });
      CITY_LABELS.forEach(function (c) { st.labels.push({ z: c[3] === 1 ? 3 : c[3] === 2 ? 4 : 5, m: L.marker([c[1], c[2]], { pane: "lbl", interactive: false, keyboard: false, icon: L.divIcon({ className: "kye-lbl kye-city", html: '<i></i>' + c[0], iconSize: null }) }) });
      });
      var upd = function () { var z = map.getZoom(); st.labels.forEach(function (l) { var on = z >= l.z; if (on && !map.hasLayer(l.m)) l.m.addTo(map); else if (!on && map.hasLayer(l.m)) map.removeLayer(l.m); }); };
      map.on("zoomend", upd); upd();
    }).catch(function () {});
  }

  // what each planet on each line is like to live under: what you notice, what is easier, what to watch for
  var LINE_MEANING = {"sun": {"ASC": ["Your sense of self, vitality and presence are amplified here.", "Attitude: confidence that you have something to offer, and willingness to be seen. Actions: take the lead, start projects under your own name, speak first, look after your sleep and health. Result: people follow and trust you, and your energy builds.", "Attitude: needing to be admired or to be right. Actions: dominating conversations, showing off, ignoring your body until you crash. Result: others pull back, and you burn out or feel isolated."], "MC": ["Your work and public image are amplified. You are seen as a leader here.", "Attitude: take ownership of your work and responsibility for results. Actions: put your name on what you do, ask for the role you want, mentor others, stay consistent, credit your team. Result: lasting recognition and authority.", "Attitude: pride, and a need to be seen as the best. Actions: hogging credit, competing with the boss, working nonstop to prove yourself. Result: rivalry, resentment, and a reputation built on image that collapses when the image slips."], "DSC": ["You meet strong, warm, confident people who reflect your own qualities back to you.", "Attitude: secure in yourself and glad to see others shine. Actions: choose partners who respect you, share the spotlight, keep your own goals alongside theirs. Result: relationships where both of you grow.", "Attitude: looking for someone else to give you identity or admiration. Actions: deferring to a dominant partner, hiding your ambitions, competing for attention. Result: you end up in their shadow or in a constant power contest."], "IC": ["Home and family become a source of strength and pride.", "Attitude: take your place as the steady center of your own household. Actions: make home your base, host family, set clear routines, spend time at home to recharge. Result: grounded energy and a family that respects you.", "Attitude: feeling you must meet family expectations or play a role to be loved. Actions: bowing to a controlling relative, performing for family, using home to feed your ego. Result: tension with dominant family members and feeling drained at home."]}, "moon": {"ASC": ["Your feelings sit close to the surface and are easy for others to read.", "Attitude: honest about how you feel and what you need. Actions: name your mood, keep small routines for rest and food, spend time with people who feel safe, trust your hunches. Result: you stay steady and people respond to you with care.", "Attitude: letting every mood decide your day, or taking on everyone's feelings as your own. Actions: reacting immediately, skipping rest, staying around draining people. Result: mood swings, exhaustion, and being seen as unpredictable."], "MC": ["Your work and reputation connect to caring for, feeding, sheltering or serving people.", "Attitude: treat the people you serve as people. Actions: choose work that looks after others (care, hospitality, food, homes, children), be consistent, build a loyal circle. Result: loyalty and a trusted name.", "Attitude: needing work to give you emotional security. Actions: taking criticism personally, making career decisions when upset, chasing approval. Result: an unstable reputation and burnout."], "DSC": ["Your closest relationships become caring and emotionally close.", "Attitude: openness about needs, and care without keeping score. Actions: say what you need, listen, create shared routines such as meals and check-ins, allow time apart. Result: deep, loyal bonds.", "Attitude: expecting a partner to fix how you feel, or needing to be needed. Actions: clinging, caretaking until you resent it, avoiding hard topics to keep the peace. Result: dependence, moodiness, and a partner who feels smothered."], "IC": ["A deep sense of home, belonging and safety.", "Attitude: allow yourself to rest and belong. Actions: put down roots, make a comfortable home, cook, gather family and close friends, keep a steady daily rhythm. Result: real emotional security.", "Attitude: using comfort to avoid risk, or holding on to the past. Actions: staying in routine when you need to move, getting pulled into family dramas, living in nostalgia. Result: stagnation and being stuck in old emotional patterns."]}, "mercury": {"ASC": ["Your mind and speech are quicker and more visible.", "Attitude: curious, and willing to say less in order to be clear. Actions: learn, write, ask questions, take notes, finish small tasks, give your mind regular breaks. Result: you are seen as sharp and capable, and you pick things up fast.", "Attitude: needing to have a view on everything. Actions: overthinking, talking without listening, doing too many things at once, skipping sleep. Result: scattered focus, nervous tension, and being seen as unreliable."], "MC": ["Your career runs through communication, information and deals.", "Attitude: clarity over cleverness. Actions: write and speak to be understood, specialize, follow up, read every contract, publish or teach what you know. Result: a name for being smart and trustworthy.", "Attitude: letting yourself be pulled in every direction. Actions: saying yes to everything, passing on rumors or half-truths, skipping details. Result: shallow work, mistakes in paperwork, and a reputation for talk without follow-through."], "DSC": ["You meet quick, curious, talkative people, and relationships begin through conversation.", "Attitude: treat conversation as the way to build trust. Actions: negotiate openly, put agreements in writing, ask real questions, choose partners whose minds you enjoy. Result: partnerships and deals that run smoothly.", "Attitude: staying light to avoid commitment, or trying to out-talk others. Actions: talking in place of acting, arguing to win, keeping things vague. Result: relationships that stay on the surface, and people who talk circles around you."], "IC": ["Home becomes a place of thinking, learning, writing and talking.", "Attitude: make the home a place for learning. Actions: set up a study or work corner, read, write, keep family conversations going, learn your family's history. Result: a lively home that feeds your mind.", "Attitude: restless and never settled. Actions: moving often, constant screens and noise, never switching off. Result: nervous tension at home and difficulty resting."]}, "venus": {"ASC": ["You are more charming, attractive and easy to like.", "Attitude: warm, appreciative and at ease with yourself. Actions: take care of how you look and feel, make friends, make art, enjoy good company, be generous with sincere compliments. Result: people open up to you and doors open easily.", "Attitude: needing everyone to like you. Actions: pleasing people at your own expense, avoiding hard truths, over-indulging in food, shopping or comfort. Result: laziness, weight or money problems, and people-pleasing that costs you respect."], "MC": ["Your work benefits from charm, taste and likability.", "Attitude: collaborative and gracious. Actions: lead with courtesy, choose work in art, design, beauty, hospitality, diplomacy or money, build good relationships with colleagues. Result: a pleasant reputation and income that comes through people.", "Attitude: avoiding conflict at all costs. Actions: saying yes to keep the peace, relying on looks or charm instead of substance, skipping hard conversations with the team. Result: being underestimated and problems that grow quietly."], "DSC": ["The classic love and partnership line: you meet kind, attractive, affectionate people.", "Attitude: open, appreciative and honest about what you want. Actions: show affection, put in time to build the relationship, agree clear terms in business partnerships, say what you need. Result: lasting, harmonious partnerships.", "Attitude: idealizing the other person or wanting to be adored. Actions: overspending to impress, ignoring warning signs, keeping the peace instead of saying what is true. Result: disappointment when the real person appears, and resentment."], "IC": ["Home becomes comfortable, beautiful and affectionate.", "Attitude: you deserve a peaceful home. Actions: make the space beautiful, host, spend time with family, settle conflicts gently and promptly. Result: a happy, harmonious home.", "Attitude: comfort at any price. Actions: overspending on the home, avoiding difficult family conversations, staying comfortable and avoiding growth. Result: complacency and silent resentments."]}, "mars": {"ASC": ["Your energy, courage and drive are high.", "Attitude: direct, brave and willing to act. Actions: start the project, exercise hard, stand up for yourself calmly, put your energy into sport and building, rest after pushing. Result: strong momentum and confidence.", "Attitude: impatience and a need to win. Actions: snapping, rushing, picking fights, ignoring injuries or fatigue. Result: arguments, accidents and burnout."], "MC": ["Your career is fast, competitive and driven.", "Attitude: ambitious but fair. Actions: lead from the front, take on challenges others avoid, set clear goals, choose work that needs courage or speed, rest to avoid exhaustion. Result: real results and respect.", "Attitude: seeing colleagues as rivals. Actions: fighting with the boss, working nonstop, cutting corners to be first. Result: conflict at work, a combative reputation and burnout."], "DSC": ["You meet bold, assertive people, and both attraction and conflict run high.", "Attitude: honest and direct, but fair. Actions: say what you want, argue the issue and not the person, pick partners who can handle directness, use competition constructively in sport or shared projects. Result: passion and honest partnerships.", "Attitude: treating the other person as an opponent. Actions: picking fights, escalating disputes, using anger to get your way. Result: open conflict, rivals, legal disputes and relationships that break."], "IC": ["Home is busy and energetic, and tempers can run high there.", "Attitude: take charge calmly of your own space. Actions: renovate, build, fix and do physical work at home, set clear boundaries with family, keep safety measures in place. Result: a home you have made yourself, and energy released in a healthy way.", "Attitude: defensiveness and irritability. Actions: arguing with family, leaving projects half done, ignoring safety (fire, electrics, locks). Result: tension, arguments and accidents at home."]}, "jupiter": {"ASC": ["You feel optimistic, expansive and lucky.", "Attitude: generous, curious and trusting that effort pays off. Actions: say yes to opportunities, travel, study, share what you have, set bigger goals and plan for them. Result: opportunities and goodwill grow.", "Attitude: assuming luck will cover it. Actions: overpromising, overspending, overeating, skipping the details. Result: excess, weight gain, and being seen as unreliable."], "MC": ["One of the strongest lines for career growth, recognition and opportunity.", "Attitude: confident and generous. Actions: aim high, teach or publish, build relationships with mentors, say yes to the larger role and prepare for it, give credit. Result: advancement and a good reputation.", "Attitude: complacency or arrogance. Actions: overextending, taking on too much, coasting on past success, making big promises. Result: losing the opportunity and your credibility."], "DSC": ["You meet generous, helpful, well-connected people.", "Attitude: grateful and reciprocal. Actions: ask for help, offer yours, form partnerships built on shared growth, check the details before agreeing. Result: supportive partners and mutual benefit.", "Attitude: trusting without checking, or expecting to be rescued. Actions: signing on to big promises, letting others carry you, excess in the relationship. Result: disappointment and being taken advantage of."], "IC": ["Home is large, comfortable and generous, with family support.", "Attitude: be generous with your home and family. Actions: host, invest carefully in property, build a comfortable base, stay close to supportive relatives. Result: abundance and a stable base.", "Attitude: comfort without limits. Actions: overspending on the house, overcrowding it, avoiding responsibility, letting things slide. Result: debt, clutter and complacency."]}, "saturn": {"ASC": ["You feel more serious, disciplined and aware of your limits.", "Attitude: patient and responsible, and accept that results take time. Actions: set routines, commit to one thing, pace your effort, keep up sleep and exercise, ask for help early. Result: a solid reputation and a sense of mastery.", "Attitude: self-criticism and withdrawal. Actions: isolating, overworking without rest, expecting yourself to do it all. Result: low mood, loneliness and exhaustion."], "MC": ["Your career asks for long, steady effort and rewards it with lasting status.", "Attitude: patient and professional. Actions: build skills, take on responsibility, keep every commitment, accept slow promotion, document your work. Result: earned authority and a lasting career.", "Attitude: resentment of authority, or fear of failing. Actions: cutting corners, avoiding responsibility, overworking to prove yourself. Result: delays, conflict with authority and burnout."], "DSC": ["You meet serious, reserved or very responsible people, and relationships need commitment.", "Attitude: loyal and realistic. Actions: honor commitments, speak warmly and directly, agree clear terms, choose reliable partners. Result: lasting, steady relationships.", "Attitude: duty over warmth, or fear of rejection. Actions: staying in cold arrangements, withholding affection, expecting too little. Result: loneliness and relationships that feel like an obligation."], "IC": ["Home is orderly, structured and serious, and carries family duty.", "Attitude: take responsibility for your base. Actions: build or restructure the home, set up budgets and routines, care for family members in practical ways, deal with old family issues directly. Result: lasting security.", "Attitude: guilt, duty or isolation. Actions: carrying the family alone, living in a cold or cluttered house, avoiding people. Result: a heavy, gloomy home and low mood."]}, "uranus": {"ASC": ["You feel freer, more original and less predictable.", "Attitude: curious and flexible. Actions: try new things, express what is unusual about you, keep an independent routine, build in rest, plan for change. Result: personal freedom and a life that fits you.", "Attitude: restless rebellion. Actions: impulsive decisions, burning bridges, ignoring tension and poor sleep. Result: nervous exhaustion, instability and accidents."], "MC": ["Your career takes unconventional turns and suits innovation.", "Attitude: open to change, with a plan. Actions: freelance, work in technology or invention, reinvent your role, keep your skills current. Result: an original path and standout work.", "Attitude: refusing any structure or authority. Actions: quitting abruptly, picking fights with bosses, changing direction constantly. Result: an unstable career and sudden endings."], "DSC": ["You meet independent, unusual and unpredictable people.", "Attitude: respect each other's freedom. Actions: allow space, be honest about your need for independence, keep agreements flexible but clear. Result: exciting, original relationships that last.", "Attitude: fear of commitment, or thrill-seeking. Actions: acting on impulse, disappearing, demanding freedom while expecting closeness. Result: sudden breakups and unreliable connections."], "IC": ["Home life is unconventional and changeable.", "Attitude: comfortable with independence. Actions: choose flexible living (shared, rented, mobile), build your own definition of home, keep one stable anchor routine. Result: a fresh start that suits you.", "Attitude: restlessness. Actions: moving constantly, cutting off family abruptly, having no base at all. Result: no sense of stability and sudden family upsets."]}, "neptune": {"ASC": ["You become more sensitive, imaginative and compassionate, with softer boundaries.", "Attitude: gentle, and honest about your limits. Actions: create, meditate, volunteer, keep regular sleep, food and routines, decide important matters in writing and with a trusted person. Result: inspiration and deep empathy without losing yourself.", "Attitude: escape and wishful thinking. Actions: drinking, drugs or oversleeping to avoid reality, saying yes to everyone, ignoring facts. Result: confusion, low energy, and being misunderstood or taken advantage of."], "MC": ["Your career leans toward creative, healing and spiritual work.", "Attitude: serve something larger than yourself. Actions: pursue creative, care or spiritual work, get clear written agreements, set clear goals and check facts. Result: inspired work and a reputation for compassion.", "Attitude: vague dreaming. Actions: drifting without a plan, trusting promises without proof, avoiding contracts. Result: no direction, deception, scandal or a blurry reputation."], "DSC": ["You are drawn to idealized, romantic, artistic or spiritual people.", "Attitude: compassionate but clear-eyed. Actions: see the person as they are, check what they tell you, keep your own boundaries, share creative or spiritual work. Result: a soulful connection without illusion.", "Attitude: rescuing or being rescued. Actions: overlooking red flags, giving money or time without limits, hiding from the truth. Result: deception, disappointment and dependence."], "IC": ["Home is a dreamy, sanctuary-like place that can also feel vague.", "Attitude: peaceful and practical. Actions: make home a retreat, create, meditate, keep the house in good order (check for damp and leaks), keep clear agreements with family. Result: real peace and creative renewal.", "Attitude: avoidance. Actions: letting the house or paperwork drift, avoiding family truths, using quiet to hide. Result: secrets, confusion and a house that feels ungrounded."]}, "pluto": {"ASC": ["Life feels intense here, and you change deeply.", "Attitude: honest about what needs to end. Actions: face what you have been avoiding, let old habits and roles go, get support (a counselor or trusted mentor), use the intensity for focused work. Result: real reinvention and personal power.", "Attitude: control, secrecy or obsession. Actions: forcing outcomes, holding grudges, hiding what is real. Result: power struggles, crises, and feeling controlled."], "MC": ["Your career carries power, influence and big change.", "Attitude: serious, ethical and willing to do deep work. Actions: work in fields such as research, psychology, finance or crisis work, use power openly and fairly, be ready to let a role end. Result: genuine influence and reinvention.", "Attitude: control and ruthlessness. Actions: manipulating, hiding motives, clinging to a role. Result: power struggles, scrutiny and being forced out."], "DSC": ["Your relationships are intense, magnetic and transformative.", "Attitude: honesty and willingness to change. Actions: be fully truthful, share power, work on your own patterns, stay in hard conversations. Result: deep bonds that change you for the better.", "Attitude: jealousy, control or secrecy. Actions: testing, monitoring, withholding, threatening to leave. Result: power struggles, obsession and dramatic endings."], "IC": ["Deep work comes up at home and in your family history.", "Attitude: willing to look at what is underneath. Actions: talk about family patterns, get support, clear out and rebuild your home, let go of old grudges. Result: healing and a rebuilt foundation.", "Attitude: secrecy and avoidance. Actions: burying family issues, controlling the household, refusing to deal with the past. Result: crises, upheaval and heavy emotions at home."]}};
  var AREA = { ASC: "self and how you come across", MC: "career and public life", DSC: "relationships and partnerships", IC: "home and family" };
  // ---------- which lines are near a place, and what that means ----------
  var D2R = Math.PI / 180, EARTH_KM = 6371;
  function kmToMeridian(lat, lng, lon0) { var d = ((lng - lon0 + 540) % 360) - 180; if (Math.abs(d) > 90) return (90 - Math.abs(lat)) * 111.19; return Math.abs(Math.asin(Math.cos(lat * D2R) * Math.sin(d * D2R))) * EARTH_KM; }
  function kmToCurve(lat, lng, pts) {
    var best = 1e9, cl = Math.cos(lat * D2R);
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1], dl1 = ((a[1] - lng + 540) % 360) - 180, dl2 = ((b[1] - lng + 540) % 360) - 180;
      if (Math.abs(dl2 - dl1) > 90) continue;
      var ax = dl1 * cl * 111.32, ay = (a[0] - lat) * 110.57, bx = dl2 * cl * 111.32, by = (b[0] - lat) * 110.57, vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy, t = L2 ? Math.max(0, Math.min(1, -(ax * vx + ay * vy) / L2)) : 0, px = ax + t * vx, py = ay + t * vy, d = Math.sqrt(px * px + py * py);
      if (d < best) best = d;
    }
    return best;
  }
  var NEAR_KM = 700;
  function nearLines(person, lat, lng) {
    var L2 = allLines(person.acg), out = [];
    PLANET_NAMES.forEach(function (k) {
      var l = L2[k]; if (!l) return;
      [["MC", kmToMeridian(lat, lng, l.MC)], ["IC", kmToMeridian(lat, lng, l.IC)], ["ASC", kmToCurve(lat, lng, l.ASC)], ["DSC", kmToCurve(lat, lng, l.DSC)]].forEach(function (x) { if (x[1] <= NEAR_KM) out.push({ k: k, a: x[0], km: x[1] }); });
    });
    return out.sort(function (p, q) { return p.km - q.km; });
  }
  function strengthOf(km) { return km <= 150 ? "right on the line, strongest" : km <= 400 ? "close, strong" : "within range, milder"; }
  function strengthNote(km) { return km <= 150 ? "You are essentially on the line, so this is felt at full strength." : km <= 400 ? "At this distance the effect is clear but not at full strength." : "At this distance the effect is gentle. It grows the closer you get to the line."; }
  function lineTitle(k, a) { return k.charAt(0).toUpperCase() + k.slice(1) + " on your " + ANGLE[a][0] + " line · " + AREA[a]; }
  function fmtAct(t) { return esc(t).replace("Attitude:", "<b>Attitude:</b>").replace(" Actions:", "<br><b>Actions:</b>").replace(" Result:", "<br><b>Result:</b>"); }
  function lineHtml(k, a, km) {
    var m = LINE_MEANING[k][a];
    return '<p class="mi-f">' + esc(m[0]) + '</p><p><u>What works with it</u><br>' + fmtAct(m[1]) + '</p><p><u>What works against it</u><br>' + fmtAct(m[2]) + '</p>' + (km == null ? "" : '<p class="mi-s">' + esc(strengthNote(km)) + "</p>");
  }
  function togetherText(near) {
    var nm = function (k) { return k.charAt(0).toUpperCase() + k.slice(1); }, by = {}, order = [];
    near.forEach(function (n) { if (!by[n.a]) { by[n.a] = []; order.push(n.a); } by[n.a].push(n); });
    var parts = order.map(function (a) { var g = by[a]; return g.length > 1 ? g.map(function (n) { return nm(n.k); }).join(" and ") + " both act on your " + AREA[a] + ", so their effects blend there" : nm(g[0].k) + " acts on your " + AREA[a]; });
    return "Taken together: " + parts.join("; ") + ".";
  }
  function showNear(person, lat, lng, label) {
    var box = document.getElementById("mapInfo"); if (!box || !person) return;
    var near = nearLines(person, lat, lng);
    var head = '<div class="mi-h">Near ' + esc(label) + ' &middot; ' + esc(person.first) + "</div>";
    var body;
    if (!near.length) body = "<p>No line of " + esc(person.first) + "'s chart passes within " + NEAR_KM + " km of here. None of the planet effects on the map is especially strong at this place, so it is a neutral setting: your own choices and the people there matter more than the place does.</p>";
    else body = near.map(function (n) { return '<div class="mi-l"><b><i style="background:' + PLANET_COLOR[n.k] + '"></i>' + esc(lineTitle(n.k, n.a)) + "</b><br><span class=\"mi-d\">" + Math.round(n.km) + " km away (" + strengthOf(n.km) + ")</span>" + lineHtml(n.k, n.a, n.km) + "</div>"; }).join("") + (near.length > 1 ? "<p><b>" + esc(togetherText(near)) + "</b></p>" : "");
    box.innerHTML = head + body; box.style.display = "block"; try { box.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
    if (mapState && mapState.map) { if (!mapState.spot) mapState.spot = L.layerGroup().addTo(mapState.map); mapState.spot.clearLayers(); L.circleMarker([lat, lng], { radius: 8, color: "#000", weight: 3, fillColor: "#fff", fillOpacity: 1, interactive: false }).addTo(mapState.spot); setTimeout(function () { mapState.map.invalidateSize(); }, 30); }
  }
  function bindCitySearch(ov) {
    var inp = ov.querySelector("#mapCity"), sug = ov.querySelector("#mapSug"), t = null, seq = 0;
    var api = typeof W_API !== "undefined" ? W_API : "https://know-your-energy.kwdoanchor.workers.dev";
    inp.addEventListener("input", function () {
      clearTimeout(t); var q = inp.value.trim(); if (q.length < 2) { sug.innerHTML = ""; return; }
      t = setTimeout(function () {
        var my = ++seq;
        fetch(api + "/places?q=" + encodeURIComponent(q)).then(function (r) { return r.json(); }).then(function (list) {
          if (my !== seq) return; sug.innerHTML = "";
          (list || []).slice(0, 6).forEach(function (c) {
            var b = document.createElement("button"); b.type = "button"; b.textContent = c.label;
            b.onclick = function () {
              sug.innerHTML = ""; inp.value = c.label;
              if (typeof c.lat !== "number" || typeof c.lng !== "number") { sug.innerHTML = '<div class="ms-n">That city’s position is not available just now. Please try again in a minute, or tap the map.</div>'; return; }
              if (mapState && mapState.map) mapState.map.setView([c.lat, c.lng], 5);
              showNear(mapState.person, c.lat, c.lng, c.label);
            };
            sug.appendChild(b);
          });
          if (!sug.children.length) sug.innerHTML = '<div class="ms-n">No city found. Check the spelling.</div>';
        }).catch(function () { sug.innerHTML = '<div class="ms-n">The city list could not load. Please try again.</div>'; });
      }, 250);
    });
  }

  function openMap(people) {
    addStyles();
    var ov = document.getElementById("mapOverlay");
    if (!ov) {
      ov = document.createElement("div"); ov.id = "mapOverlay";
      ov.innerHTML = '<div class="mt"><div class="tt">Globe</div><button class="mx" aria-label="Close">&#10005;</button></div><div class="mp" id="mapPeople"></div><div class="ms"><input id="mapCity" type="text" placeholder="Enter a city to see which lines are near it" autocomplete="off" aria-label="City"><div id="mapSug"></div></div><div id="mapEl"></div><div id="mapInfo" aria-live="polite"></div><div class="mb"><div class="row" id="mapPl"></div><div class="row" id="mapAn"></div><details class=\"mleg\"><summary>What the lines mean</summary><p>Each colored line belongs to one planet in your birth chart. It marks the places on Earth where, at the moment you were born, that planet was exactly on one of four points of the sky. Living in, working in, or visiting a place near a line makes the effect of that planet louder in one part of your life. The effect is not good or bad on its own. For every line, the panel shows the attitudes and actions that work with the energy of that place and tend to lead to your best results, and the attitudes and actions that work against it and tend to lead to the opposite.</p><p><b>Rising (Ascendant, solid curved line):</b> the effect shows up in you: your energy, body, mood, presence and how people first see you.</p><p><b>Overhead (Midheaven, solid straight line):</b> in your career and public life: your reputation, ambitions and what you are known for.</p><p><b>Setting (Descendant, dashed curved line):</b> in your relationships: partners, clients and close friends, and the kind of people you attract.</p><p><b>Underfoot (Imum Coeli, dotted straight line):</b> in your home and family: your roots, where you settle and how safe you feel.</p><p><b>How near is near:</b> within about 150 km you are on the line and feel it fully. Out to about 400 km it is strong. Out to about 700 km it is gentle. When two or more lines are near the same place, their effects combine, and the panel says how.</p><p>The lines depend on your exact birth time and place. Like the rest of this site, this is an interpretation for reflection, not a prediction.</p></details><div class=\"hint\">Enter a city above, or tap the map or a line, to read what is near it. Zoom in to see more places.</div></div>';
      document.body.appendChild(ov); ov.querySelector(".mx").onclick = function () { ov.classList.remove("open"); }; bindCitySearch(ov);
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
        mapState.map = L.map(el, { worldCopyJump: true, minZoom: 2, maxZoom: 7, zoomSnap: .5, preferCanvas: true });
        mapState.map.attributionControl.setPrefix(false); mapState.map.attributionControl.addAttribution("Map data: Natural Earth"); drawBase(mapState.map, mapState); mapState.map.on("click", function (e) { var lng = ((e.latlng.lng + 540) % 360) - 180; showNear(mapState.person, e.latlng.lat, lng, "this spot"); });
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
      function pop(a) { return "<b>" + esc(lineTitle(k, a)) + "</b>" + lineHtml(k, a, null); }
      ["MC", "IC"].forEach(function (a) { if (!st.ang[a]) return; [-360, 0, 360].forEach(function (off) { L.polyline([[-85, l[a] + off], [85, l[a] + off]], { color: col, weight: 3, bubblingMouseEvents: false, dashArray: dash[a] }).bindPopup(pop(a)).addTo(st.group); }); });
      ["ASC", "DSC"].forEach(function (a) { if (!st.ang[a]) return; splitWrap(l[a]).forEach(function (s) { [-360, 0, 360].forEach(function (off) { L.polyline(s.map(function (p) { return [p[0], p[1] + off]; }), { color: col, weight: 3, bubblingMouseEvents: false, dashArray: dash[a] }).bindPopup(pop(a)).addTo(st.group); }); }); });
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

  // ---------- the reading for the day: requested as soon as the results page appears, kept in the browser ----------
  var DAYS_KEY = "kye_dayReadings";
  function dayKeyOf(p, iso, q) { return [p.first, p.last, p.dob].concat(q ? [q.first, q.last, q.dob] : []).concat([iso]).join("|").toLowerCase(); }
  function todayIsoLocal() { var t = new Date(); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"); }
  function readSavedDays() { try { return JSON.parse(localStorage.getItem(DAYS_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function keepDay(dkey, r) { var m = readSavedDays(); m[dkey] = r; for (;;) { try { localStorage.setItem(DAYS_KEY, JSON.stringify(m)); if (typeof renderReadingList === "function") renderReadingList(); return; } catch (e) { var ks = Object.keys(m).filter(function (k) { return k !== dkey; }); if (!ks.length) return; delete m[ks[0]]; } } }
  function passEmailNowG() { try { var f = document.getElementById("pEmail"); return ((f && f.value) || "").trim() || localStorage.getItem("kye_passEmail") || ""; } catch (e) { return ""; } }
  function eventTitle(e, birthMs) { var nm = e.pl === "northnode" ? "North Node" : e.pl.charAt(0).toUpperCase() + e.pl.slice(1), lo = Math.floor((e.a - birthMs) / MS_YEAR), hi = Math.ceil((e.b - birthMs) / MS_YEAR); return nm + " " + e.phase.toLowerCase() + " \u00b7 ages " + lo + " to " + hi + " \u00b7 " + fmtDate(e.a) + " to " + fmtDate(e.b) + " \u00b7 in " + e.sign + (e.house ? ", house " + e.house : ""); }
  window.__dayJobs = window.__dayJobs || {};
  // one request per person and day; the same request is shared by the prefetch and by the card
  function dayJob(p, iso, events, email, q, qEvents) {
    var dkey = dayKeyOf(p, iso, q); if (window.__dayJobs[dkey]) return window.__dayJobs[dkey];
    var parts = iso.split("-"), when = Date.UTC(+parts[0], +parts[1] - 1, +parts[2], 12);
    var cyclesOf = function (x, evs) { var dob = parseDob(x.dob), birthMs = Date.UTC(dob.y, dob.m - 1, dob.d); return (evs || []).filter(function (e) { return e.a <= when && when < e.b; }).map(function (e) { return eventTitle(e, birthMs); }); };
    var astOf = function (x) { var a = Object.assign({}, x.astro || {}); delete a.acg; delete a.aspects; return a; };
    var api = typeof W_API !== "undefined" ? W_API : "https://know-your-energy.kwdoanchor.workers.dev";
    var again = function () { return (typeof kyeUnlock === "function" ? kyeUnlock(true) : Promise.resolve(null)).then(function (e2) { if (!e2) throw new Error("We could not confirm your phone just now. Please try again."); return e2; }); };
    var payload = function (em) {
      var b = { passEmail: em, date: iso, person: { first: p.first, mid: p.mid, last: p.last, dob: p.dob }, astrology: astOf(p), humanDesign: p.hd || null, activeCycles: cyclesOf(p, events) };
      if (q) { b.person2 = { first: q.first, mid: q.mid, last: q.last, dob: q.dob }; b.astrology2 = astOf(q); b.humanDesign2 = q.hd || null; b.activeCycles2 = cyclesOf(q, qEvents); b.relLabel = typeof relType !== "undefined" ? relType : ""; }
      return b;
    };
    var send = function (em) { return fetch(api + "/day-reading", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload(em)) }).then(function (r) { return r.json().then(function (j) { if (!r.ok || j.error) { var er = new Error(j.error || "Something went wrong. Please try again."); er.code = j.code; throw er; } return j; }); }); };
    var timer = new Promise(function (_, rej) { setTimeout(function () { rej(new Error("This is taking longer than expected. Please try again.")); }, 150000); });
    var go = (email ? send(email) : again().then(send)).catch(function (e) { if (e && e.code === "unlock_needed") return again().then(send); throw e; });
    var job = Promise.race([go, timer]).then(function (j) { var r = j.report || {}; keepDay(dkey, r); return r; });
    job.catch(function () { delete window.__dayJobs[dkey]; });
    window.__dayJobs[dkey] = job; return job;
  }
  function prefetchDay(people) {
    try {
      var p = people && people[0], q = people && people[1] || null; if (!p || !p.numerology || !parseDob(p.dob) || (q && !parseDob(q.dob))) return;
      var email = passEmailNowG(); if (!email) return;
      var iso = todayIsoLocal(), k = dayKeyOf(p, iso, q); if (readSavedDays()[k] || window.__dayJobs[k]) return;
      loadTransits().then(function (d) { return dayJob(p, iso, computeEvents(p, d), email, q, q ? computeEvents(q, d) : null); }).catch(function () {});
    } catch (e) {}
  }

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
      body.innerHTML = '<div class="tl"><div class="tl-ctl"><label for="tlDate" id="tlDateLab">' + (me.pass ? "Type a date" : "Today") + '</label><input type="date" id="tlDate" value="' + iso + '"' + (me.pass ? "" : " disabled") + '>' + chips + (me.zoom ? '<button class="tl-chip" id="tlWhole">Whole life</button>' : "") + '</div><div class="tl-info" id="tlInfo"></div>' + '<div class="tl-frame">' + head + '<div class="tl-scroll" id="tlScroll">' + html + "</div></div></div>";
      showActive();
      var sc = document.getElementById("tlScroll"); var go = function () { sc.style.setProperty("--stk", Math.round(sc.clientHeight * 0.42) + "px"); sc.scrollTop = Math.max(0, nowY - sc.clientHeight / 2); }; go(); setTimeout(go, 120); setTimeout(go, 450);
      sc.addEventListener("click", function (e) { var bar = e.target.closest(".tl-bar"); if (!bar) return; var dd = body.querySelector(".tl-day"); if (dd) { dd.remove(); body.querySelector(".tl").classList.remove("has-day"); } var it = me.items[+bar.dataset.i]; [].forEach.call(sc.querySelectorAll(".tl-bar.sel"), function (x) { x.classList.remove("sel"); }); bar.classList.add("sel"); document.getElementById("tlInfo").innerHTML = '<span class="tt">' + esc(it.title) + "</span>" + esc(it.text || "").replace(/\n/g, "<br>"); });
      document.getElementById("tlDate").onchange = function (e) { var v = e.target.value.split("-"); if (v.length === 3) { me.selDate = Date.UTC(+v[0], +v[1] - 1, +v[2]); me.selIsNow = false; me.zoom = true; me.readAfter = true; build(); } };
      var wh = document.getElementById("tlWhole"); if (wh) wh.onclick = function () { me.zoom = false; build(); };
      me.autoFor = me.autoFor || {}; if (me.readAfter) { me.readAfter = false; readDay(false); } else if (!me.autoFor[me.idx]) { me.autoFor[me.idx] = 1; readDay(true); }
      [].forEach.call(body.querySelectorAll(".tl-chip[data-p]"), function (b) { b.onclick = function () { me.idx = +b.dataset.p; me.autoFor = {}; loadEvents(); }; });
    }
    function readDay(auto) {
      var q = people.length > 1 ? people[1] : null, p = q ? people[0] : person(), el = document.getElementById("tlDate"), host = body.querySelector(".tl"), iso = me.pass ? (el && el.value) : todayIsoLocal(); if (!iso || !host) return;
      var dk = dayKeyOf(p, iso, q), email = passEmailNowG(); if (auto && !email && !readSavedDays()[dk]) return;
      var old = host.querySelector(".tl-day"); if (old) old.remove();
      var panel = document.createElement("div"); panel.className = "tl-day"; host.insertBefore(panel, host.querySelector(".tl-info")); host.classList.add("has-day");
      var parts = iso.split("-"), lab = MONTHS[+parts[1] - 1] + " " + +parts[2] + ", " + parts[0], who = q ? p.first + " & " + q.first : p.first;
      var head = '<div class="dt">' + esc(who) + " &middot; " + esc(lab) + "</div>";
      var say = function (msg) { panel.innerHTML = head + "<p>" + esc(msg) + "</p>"; };
      var show = function (r) {
        if (!panel.parentNode) return;
        var paras = String(r.body || "").split(/\n\s*\n/).filter(function (s) { return s.trim(); });
        panel.classList.add("full"); panel.innerHTML = head + "<h3>" + esc(r.headline || "") + "</h3>" + paras.map(function (s) { return "<p>" + esc(s.trim()) + "</p>"; }).join("") + ((r.references || []).length ? "<details><summary>What this draws on</summary>" + r.references.map(function (s) { return "<div>" + esc(s) + "</div>"; }).join("") + "</details>" : "");
      };
      var have = readSavedDays()[dk]; if (have) { show(have); return; }
      say("Writing your reading for " + lab + ". This takes up to a minute.");
      loadTransits().then(function (d) { return dayJob(p, iso, computeEvents(p, d), email, q, q ? computeEvents(q, d) : null); }).then(show).catch(function (e) { if (panel.parentNode) say(e && e.message ? e.message : "Something went wrong. Please try again."); });
    }
    function showActive() {
      var info = document.getElementById("tlInfo"); if (!info) return; var d = me.selDate, act = me.items.filter(function (it) { return it.a <= d && d < it.b; });
      var dt = new Date(d), lab = MONTHS[dt.getUTCMonth()] + " " + dt.getUTCDate() + ", " + dt.getUTCFullYear();
      info.innerHTML = '<span class="tt">What is active on ' + lab + "</span>" + (act.length ? act.map(function (it) { return esc(it.title.split(" · ")[0]); }).join(" &middot; ") : "Nothing is recorded for this date.") + '<br><span style="font-weight:700">Tap any bar to read what it means. The planet bars follow traditional astrology.</span>';
    }
    var ex = document.getElementById("cardExpand"), body = document.getElementById("cardExpandBody"), ttl = document.getElementById("cardExpandTitle");
    function passEmailNow() { try { var f = document.getElementById("pEmail"); return ((f && f.value) || "").trim() || localStorage.getItem("kye_passEmail") || ""; } catch (e) { return ""; } }
    function checkPassNow() { var em = passEmailNow(); if (!em || typeof checkPassStatus !== "function") { me.pass = false; return; } checkPassStatus(em).then(function (r) { me.pass = !!(r && r.active); var d = document.getElementById("tlDate"), l = document.getElementById("tlDateLab"); if (d) d.disabled = !me.pass; if (l) l.textContent = me.pass ? "Type a date" : "Today"; }).catch(function () {}); }
    function loadEvents() {
      ttl.textContent = person().first + " · Timeline"; if (typeof setChartFrame === "function") setChartFrame("Numerology");
      body.innerHTML = '<div class="tl"><div class="tl-info">Loading your timeline&hellip;</div></div>';
      checkPassNow();
      loadTransits().then(function (d) { me.events = computeEvents(person(), d); build(); }).catch(function () { body.innerHTML = '<div class="tl"><div class="tl-info">The timeline could not load. Please check your connection and try again.</div></div>'; });
    }
    me.selIsNow = true; ex.classList.add("open"); loadEvents(); if (typeof window.rlOpenDayList === "function") window.rlOpenDayList();
  }

  // ---------- put it all on the results page ----------
  function peopleOf(p1, p2) {
    return [p1, p2].filter(Boolean).map(function (p) {
      var a = p.astro || {}, loc = a.location || {};
      return { first: p.first, mid: p.mid, last: p.last, dob: p.dob, numerology: p.numerology, astro: p.astro, hd: p.hd || null, acg: a.acg || null, birth: a.acg && loc.latitude != null ? { lat: loc.latitude, lng: loc.longitude } : null };
    });
  }
  function frameCard(cls, inner) { return '<div class="xcard ' + cls + '" role="button" tabindex="0"><i></i><b>' + inner + "</b></div>"; }
  window.kyeBuildPass = function () {
    addStyles();
    var ps = document.createElement("div"); ps.className = "xpass";
    var P = [["$11", "A week", "7 days"], ["$22", "A month", "30 days"], ["$33", "3 months", "90 days"]];
    ps.innerHTML = '<div class="h">Know Your Energy Daily!</div><div class="s">Get readings to understand relationship dynamics and how underlying cycles flow together or apart</div><div class="cols">' + P.map(function (x, i) { return '<div class="pw"><button type="button" class="p" data-pass="' + i + '"><div class="n">' + x[0] + '</div></button><div class="pl">' + x[2] + '</div></div>'; }).join("") + '</div><div class="note" id="passNote"></div><div class="pol">Never automatically charged. All sales final, no refunds. By choosing a pass you agree to the <a href="/terms.html">Terms</a>.</div>';
    [].forEach.call(ps.querySelectorAll(".p"), function (b) { b.onclick = function () { var n = ps.querySelector(".note"); n.textContent = "Passes are not on sale yet."; }; });
    return ps;
  };
  window.addExtras = function (p1, p2) {
    try {
      addStyles();
      var g = document.getElementById("mainGrid"); if (!g) return;
      prefetchDay(peopleOf(p1, p2));
      [].forEach.call(g.querySelectorAll(".xlinks,.xpass"), function (x) { x.remove(); });
      var people = peopleOf(p1, p2), withMap = people.filter(function (p) { return p.acg && p.birth; }), now = new Date(), nowLab = MONTHS[now.getMonth()] + " " + now.getDate();
      var acts = g.querySelector(".fan-actions"), names = people.map(function (p) { return p.first; }).join(" & ");
      var tl = document.createElement("div"); tl.className = "xtlwrap";
      tl.innerHTML = frameCard("xtl", '<div class="cap">TIMELINE</div><div class="sc">' + nowLab + '</div><div class="rl"></div><div class="ln">NUMEROLOGY</div><div class="rl"></div><div class="ln">ASTROLOGY</div><div class="rl"></div><div class="ln">HUMAN DESIGN</div><div class="nm">' + esc(names) + "</div>");
      tl.firstChild.onclick = function () { openTimeline(people); };
      var links = document.createElement("div"); links.className = "xlinks";
      links.innerHTML = '<a href="#" id="xRun">New reading</a><a href="#" id="xSave">Save / Print reading</a>';
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
      var ps = window.kyeBuildPass();
      g.appendChild(ps);
    } catch (e) { if (window.console) console.error("extras", e); }
  };
  if (window.__lastP) window.addExtras(window.__lastP[0], window.__lastP[1]);
})();
