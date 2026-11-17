/* Results page extras: the Timeline, the Globe (astrocartography) and the passes.
   Loaded after the page. Everything heavy (transit table, land outlines, the map library) is fetched only when it is needed. */
(function () {
  "use strict";
  var MS_DAY = 864e5, MS_YEAR = 365.25 * MS_DAY;
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
      ".xrow{display:flex;gap:18px;justify-content:center;align-items:flex-start;margin:22px auto 0;max-width:420px}",
      ".xcard{position:relative;width:150px;height:100px;margin-top:22px;cursor:pointer;filter:drop-shadow(0 8px 8px rgba(0,0,0,.5));-webkit-tap-highlight-color:transparent}",
      ".xcard>i{position:absolute;inset:0;background:" + SILVER + ";clip-path:polygon(18px 0,calc(100% - 18px) 0,100% 18px,100% calc(100% - 18px),calc(100% - 18px) 100%,18px 100%,0 calc(100% - 18px),0 18px)}",
      ".xcard>b{position:absolute;inset:9px;background:#fff;color:#000;font-weight:400;padding:8px 8px 6px;text-align:center;clip-path:polygon(11px 0,calc(100% - 11px) 0,100% 11px,100% calc(100% - 11px),calc(100% - 11px) 100%,11px 100%,0 calc(100% - 11px),0 11px)}",
      ".xcard .cap{font:800 10px 'Barlow Condensed',sans-serif;letter-spacing:.14em;text-align:left;margin-left:4px;color:#000}",
      ".xcard .rl{border-top:2px solid #000;margin:4px 0 3px}",
      ".xcard .sc{font:400 30px/1.1 'Alex Brush',cursive;color:#000}",
      ".xcard .ln{font:800 10.5px 'Barlow Condensed',sans-serif;letter-spacing:.12em;color:#000}",
      ".xglobe{width:150px;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent}",
      ".xglobe canvas{display:block;margin:0 auto;width:150px;height:150px;filter:drop-shadow(0 0 12px rgba(255,255,255,.35)) drop-shadow(0 8px 8px rgba(0,0,0,.5))}",
      ".xglobe .gl{font:400 30px/1 'Alex Brush',cursive;color:#fff;margin-top:6px}",
      ".xcap{max-width:300px;margin:8px auto 0;text-align:center;font:500 12px/1.4 'DM Sans',sans-serif;color:#fff}",
      ".xpass{max-width:390px;margin:28px auto 0;font-family:'Fraunces',Georgia,serif;color:#fff}",
      ".xpass .h{text-align:center;font:400 36px/1 'Alex Brush',cursive;margin-bottom:6px}",
      ".xpass .s{text-align:center;font:600 13px/1.4 'Fraunces',serif;margin:0 6px 18px}",
      ".xpass .cols{display:flex;padding:0 6px}",
      ".xpass .p{flex:1;text-align:center;padding:6px 0;cursor:pointer;-webkit-tap-highlight-color:transparent;background:none;border:0;color:#fff;font-family:inherit}",
      ".xpass .p+.p{border-left:1px solid rgba(236,240,245,.55)}",
      ".xpass .p .n{font:italic 900 44px/1 'Playfair Display',Georgia,serif;" + CH + "}",
      ".xpass .p .l{font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.16em;margin-top:8px;text-transform:uppercase}",
      ".xpass .p .d{font:700 9px 'Barlow Condensed',sans-serif;letter-spacing:.14em;margin-top:2px}",
      ".xpass .note{text-align:center;font:700 13px/1.4 'Fraunces',serif;min-height:18px;margin:10px 8px 0}",
      ".xpass .pol{text-align:center;font:600 11.5px/1.5 'Fraunces',serif;margin:6px 8px 0}",
      ".xpass .pol a{color:#fff}",
      /* timeline */
      ".tl{color:#000;font-family:'DM Sans',sans-serif}",
      ".tl-ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:2px 0 8px}",
      ".tl-ctl label{font:800 11px 'Barlow Condensed',sans-serif;letter-spacing:.12em;text-transform:uppercase}",
      ".tl-ctl input{font:700 14px 'DM Sans',sans-serif;border:0;border-bottom:2px solid #000;background:#fff;color:#000;padding:2px 2px}",
      ".tl-chip{font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.1em;border:2px solid #000;background:#fff;color:#000;padding:2px 10px;cursor:pointer}",
      ".tl-chip.on{background:#000 !important;color:#fff !important}.tl-chip{color:#000 !important;background:#fff}",
      ".tl-info{border:2px solid #000;padding:8px 10px;margin:0 0 8px;font:500 13px/1.45 'DM Sans',sans-serif;min-height:92px;max-height:150px;overflow:auto;color:#000;background:#fff}",
      ".tl-info b{font-weight:800}",
      ".tl-info .tt{font:800 12px 'Barlow Condensed',sans-serif;letter-spacing:.1em;text-transform:uppercase;display:block;margin-bottom:2px}",
      ".tl-head{display:flex;margin-left:34px;border-bottom:2px solid #000}",
      ".tl-head div{flex:1;height:78px;display:flex;align-items:center;justify-content:center;writing-mode:vertical-rl;transform:rotate(180deg);font:800 9.5px 'Barlow Condensed',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#000}",
      ".tl-scroll{height:44vh;min-height:260px;overflow-y:auto;position:relative;border-bottom:2px solid #000;-webkit-overflow-scrolling:touch}",
      ".tl-body{position:relative;margin-left:34px}",
      ".tl-col{position:absolute;top:0;bottom:0;border-left:1px solid #b9bec6}",
      ".tl-tick{position:absolute;left:-34px;width:30px;text-align:right;font:700 9px 'DM Sans',sans-serif;color:#000;transform:translateY(-5px)}",
      ".tl-gl{position:absolute;left:0;right:0;border-top:1px solid #dfe3e8}",
      ".tl-bar{position:absolute;display:flex;justify-content:center;align-items:flex-start;overflow:hidden;font:800 12px 'DM Sans',sans-serif;border:1px solid #000;box-sizing:border-box;cursor:pointer}",
      ".tl-bar.k{background:#000 !important;color:#fff !important}.tl-bar.s{background:#fff !important;color:#000 !important}.tl-bar span{color:inherit !important}",
      ".tl-bar span{display:block;padding-top:3px;position:sticky;top:3px}",
      ".tl-bar.v span{writing-mode:vertical-rl;transform:rotate(180deg);font-size:8.5px;letter-spacing:.02em;white-space:nowrap;padding-top:0;position:static;margin-top:2px}",
      ".tl-bar.sel{outline:3px solid #bd224b;outline-offset:-3px}",
      "#cardExpand .tl .tl-bar.k,#cardExpand .tl .tl-bar.k *,#cardExpand .tl .tl-chip.on,#cardExpand .tl .tl-now i{color:#fff !important}",
      ".tl-now{position:absolute;left:-30px;right:0;border-top:3px solid #000;z-index:5;pointer-events:none}",
      ".tl-now i{position:absolute;left:0;top:-13px;background:#000;color:#fff;font:800 8px 'Barlow Condensed',sans-serif;letter-spacing:.1em;padding:1px 4px;font-style:normal}",
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
      g.fillStyle = "#07070a"; g.fillRect(0, 0, W, H);
      g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1.4;
      for (var lo = -180; lo <= 180; lo += 30) { g.beginPath(); g.moveTo(X(lo), 0); g.lineTo(X(lo), H); g.stroke(); }
      for (var la = -60; la <= 60; la += 30) { g.beginPath(); g.moveTo(0, Y(la)); g.lineTo(W, Y(la)); g.stroke(); }
      g.fillStyle = "#e9ecf1"; g.strokeStyle = "#ffffff"; g.lineWidth = 1.6;
      rings.forEach(function (r) { var x = r[0], y = r[1]; g.beginPath(); g.moveTo(X(x / 10), Y(y / 10)); for (var i = 2; i < r.length; i += 2) { x += r[i]; y += r[i + 1]; g.lineTo(X(x / 10), Y(y / 10)); } g.closePath(); g.fill(); g.stroke(); });
      var L = allLines(acg);
      PLANET_NAMES.forEach(function (k) {
        var l = L[k]; if (!l) return; g.lineWidth = 3.2;
        [["MC", [], l.MC], ["IC", [14, 12], l.IC]].forEach(function (a) { g.setLineDash(a[1]); g.strokeStyle = a[0] === "MC" ? "#ffffff" : "#d8dde4"; [-360, 0, 360].forEach(function (off) { g.beginPath(); g.moveTo(X(a[2] + off), 0); g.lineTo(X(a[2] + off), H); g.stroke(); }); });
        [["ASC", [], l.ASC], ["DSC", [14, 12], l.DSC]].forEach(function (a) { g.setLineDash(a[1]); g.strokeStyle = a[0] === "ASC" ? "#ffffff" : "#d8dde4"; splitWrap(a[2]).forEach(function (s) { g.beginPath(); s.forEach(function (p, i) { i ? g.lineTo(X(p[1]), Y(p[0])) : g.moveTo(X(p[1]), Y(p[0])); }); g.stroke(); }); });
        g.setLineDash([]);
      });
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
    if (!transitsPromise) transitsPromise = Promise.all([fetch("data/transits.bin").then(function (r) { return r.arrayBuffer(); }), fetch("data/timeline-meanings.json").then(function (r) { return r.json(); })]).then(function (a) {
      var b = a[0], dv = new DataView(b), n = dv.getUint32(10, true), np = dv.getUint8(14), step = dv.getUint16(8, true), start = dv.getInt32(4, true);
      var u = new Uint16Array(b, 16, n * np), names = ["jupiter", "saturn", "uranus", "neptune", "pluto", "northnode"], t = { start: start, step: step, n: n, lon: {} };
      names.forEach(function (nm, j) { t.lon[nm] = u.subarray(j * n, (j + 1) * n); });
      return { t: t, meanings: a[1].events };
    });
    return transitsPromise;
  }
  function natalOf(p) {
    var a = p.astro || {}, get = function (nm) { var x = (a.planets || []).filter(function (q) { return q.name === nm; })[0]; return x && !x.signUncertain ? x.absoluteDegrees : null; };
    var hasTime = !(a.timeUnknown || a.locationUnknown);
    return { hasTime: hasTime, sun: get("Sun"), moon: hasTime ? get("Moon") : null, asc: hasTime && a.ascendant ? a.ascendant.absoluteDegrees : null, jupiter: get("Jupiter"), saturn: get("Saturn"), uranus: get("Uranus"), neptune: get("Neptune"), pluto: get("Pluto"), northnode: a.northNode ? a.northNode.absoluteDegrees : null };
  }
  function computeEvents(p, data) {
    var nat = natalOf(p), dob = parseDob(p.dob); if (!dob) return [];
    var birthMs = Date.UTC(dob.y, dob.m - 1, dob.d), endMs = birthMs + 95 * MS_YEAR, t = data.t, out = [], ASP = { Conjunction: 0, Return: 0, Square: 90, Opposition: 180 };
    Object.keys(data.meanings).forEach(function (key) {
      var parts = key.split("."), pl = parts[0], asp = parts[1], tg = parts[2] || "Own", col = pl === "nn" ? "northnode" : pl, arr = t.lon[col]; if (!arr) return;
      var target = tg === "Sun" ? nat.sun : tg === "Moon" ? nat.moon : tg === "Ascendant" ? nat.asc : nat[col];
      if (target == null) return;
      var offs = ASP[asp] === 0 ? [0] : ASP[asp] === 180 ? [180] : [90, -90], i0 = Math.max(0, Math.floor((birthMs / MS_DAY - t.start) / t.step) - 1), i1 = Math.min(t.n - 1, Math.ceil((endMs / MS_DAY - t.start) / t.step) + 1), run = null, runs = [];
      for (var i = i0; i <= i1; i++) {
        var lon = arr[i] / 100, d = 999; offs.forEach(function (o) { d = Math.min(d, Math.abs(norm180(lon - (target + o)))); });
        var ms = (t.start + i * t.step) * MS_DAY;
        if (d <= 2) { if (!run) run = { a: ms - t.step * MS_DAY / 2, b: ms }; run.b = ms + t.step * MS_DAY / 2; } else if (run) { runs.push(run); run = null; }
      }
      if (run) runs.push(run);
      var merged = []; runs.forEach(function (r) { var l = merged[merged.length - 1]; if (l && r.a - l.b < 60 * MS_DAY) l.b = r.b; else merged.push({ a: r.a, b: r.b }); });
      merged.forEach(function (r) { if (r.b < birthMs || r.a > endMs) return; out.push({ col: col, key: key, a: Math.max(r.a, birthMs), b: Math.min(r.b, endMs), text: data.meanings[key], pl: pl, asp: asp, tg: tg }); });
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
    var me = { idx: 0, data: null, sel: null, selDate: Date.now() };
    function person() { return people[me.idx]; }
    function build() {
      var p = person(), dob = parseDob(p.dob), num = p.numerology; if (!dob || !num) return;
      var birthMs = Date.UTC(dob.y, dob.m - 1, dob.d), PX = 46, years = 90, total = PX * years, tpx = function (ms) { return Math.max(0, Math.min(total, (ms - birthMs) / MS_YEAR * PX)); };
      var COLS = ["Year", "Essence", "Pinnacle", "Challenge", "Period", "Saturn", "Jupiter", "Uranus", "Neptune", "Pluto", "N. Node"], KEYS = ["py", "es", "pin", "ch", "per", "saturn", "jupiter", "uranus", "neptune", "pluto", "northnode"];
      var items = []; // {col, a, b, label, title, text, cls}
      for (var y = dob.y; y <= dob.y + years; y++) items.push({ col: "py", a: Date.UTC(y, 0, 1), b: Date.UTC(y + 1, 0, 1), label: personalYear(dob, y), title: "Personal Year " + personalYear(dob, y) + " · " + y, text: (NUM_DEFS.personalyear || {})[personalYear(dob, y)] || "" });
      var es = []; for (var a = 0; a <= years; a++) { var v = essenceAt(p, a); if (v == null) break; var l = es[es.length - 1]; if (l && l.v === v) l.hi = a; else es.push({ v: v, lo: a, hi: a }); }
      es.forEach(function (e) { items.push({ col: "es", a: birthMs + e.lo * MS_YEAR, b: birthMs + (e.hi + 1) * MS_YEAR, label: e.v, title: "Essence " + e.v + " · ages " + e.lo + " to " + e.hi, text: (NUM_DEFS.essence || {})[e.v] || "" }); });
      var pins = num.pinnacles || {}, chs = num.challengeNumbers || {};
      [1, 2, 3, 4].forEach(function (n) { var pn = pins["pinnacle" + n]; if (!pn) return; var r = rangeAges(pn.ageRange), hiAge = r.hi >= 999 ? years : r.hi, a2 = birthMs + r.lo * MS_YEAR, b2 = birthMs + (hiAge + 1) * MS_YEAR, rng = "ages " + r.lo + (r.hi >= 999 ? " onward" : " to " + r.hi);
        items.push({ col: "pin", a: a2, b: b2, label: pn.value, title: "Pinnacle " + pn.value + " · " + rng, text: (NUM_DEFS.pinnacle || {})[pn.value] || "" });
        var cv = chs["challenge" + n]; if (cv != null) items.push({ col: "ch", a: a2, b: b2, label: cv, title: "Challenge " + cv + " · " + rng, text: (NUM_DEFS.challenge || {})[cv] || "" }); });
      var pers = num.periodCycles || {}; [1, 2, 3].forEach(function (n) { var pe = pers["period" + n]; if (!pe) return; var r = rangeAges(pe.ageRange), hiAge = r.hi >= 999 ? years : r.hi; items.push({ col: "per", a: birthMs + r.lo * MS_YEAR, b: birthMs + (hiAge + 1) * MS_YEAR, label: pe.value, title: "Period " + pe.value + " · ages " + r.lo + (r.hi >= 999 ? " onward" : " to " + r.hi), text: (NUM_DEFS.periodcycle || {})[pe.value] || "" }); });
      (me.events || []).forEach(function (e) { var nm = e.pl === "nn" ? "North Node" : e.pl.charAt(0).toUpperCase() + e.pl.slice(1), asp = e.asp === "Return" ? "return" : e.asp.toLowerCase(), tgt = e.tg === "Own" ? (e.asp === "Return" ? "" : "your own " + nm) : "your " + e.tg;
        var lab = e.asp === "Return" ? "return" : (e.asp === "Conjunction" ? "conj." : e.asp === "Square" ? "sq." : "opp.") + " " + (e.tg === "Own" ? "own" : e.tg === "Ascendant" ? "Asc" : e.tg);
        items.push({ col: e.col, a: e.a, b: e.b, label: lab, v: true, title: nm + " " + asp + (tgt ? " " + tgt : "") + " · " + fmtDate(e.a) + " to " + fmtDate(e.b), text: e.text }); });
      var colW = 100 / COLS.length, html = '<div class="tl-body" style="height:' + total + 'px">';
      for (var yy = 0; yy <= years; yy += 1) html += '<div class="tl-gl" style="top:' + yy * PX + 'px"></div><div class="tl-tick" style="top:' + yy * PX + 'px">' + yy + '</div>';
      KEYS.forEach(function (k, i) { html += '<div class="tl-col" style="left:' + i * colW + '%;width:' + colW + '%"></div>'; });
      var shades = {}; items.forEach(function (it, ix) { var ci = KEYS.indexOf(it.col); if (ci < 0) return; var top = tpx(it.a), h = Math.max(4, tpx(it.b) - top); shades[it.col] = (shades[it.col] || 0) + 1;
        html += '<div class="tl-bar ' + (it.v ? "v " : "") + (shades[it.col] % 2 ? "k" : "s") + '" data-i="' + ix + '" style="left:calc(' + ci * colW + '% + 1px);width:calc(' + colW + '% - 2px);top:' + top + 'px;height:' + h + 'px"><span>' + esc(it.label) + '</span></div>'; });
      var nowY = tpx(me.selDate); html += '<div class="tl-now" id="tlNow" style="top:' + nowY + 'px"><i>' + (me.selIsNow ? "NOW" : "DATE") + '</i></div></div>';
      me.items = items; me.tpx = tpx; me.birthMs = birthMs;
      var head = '<div class="tl-head">' + COLS.map(function (c) { return "<div>" + c + "</div>"; }).join("") + "</div>";
      var chips = people.length > 1 ? people.map(function (q, i) { return '<button class="tl-chip' + (i === me.idx ? " on" : "") + '" data-p="' + i + '">' + esc(q.first) + "</button>"; }).join("") : "";
      var ds = new Date(me.selDate), iso = ds.getUTCFullYear() + "-" + String(ds.getUTCMonth() + 1).padStart(2, "0") + "-" + String(ds.getUTCDate()).padStart(2, "0");
      body.innerHTML = '<div class="tl"><div class="tl-ctl"><label for="tlDate">Check a date</label><input type="date" id="tlDate" value="' + iso + '">' + chips + '</div><div class="tl-info" id="tlInfo"></div>' + head + '<div class="tl-scroll" id="tlScroll">' + html + "</div></div>";
      showActive();
      var sc = document.getElementById("tlScroll"); var go = function () { sc.scrollTop = Math.max(0, nowY - sc.clientHeight / 2); }; go(); setTimeout(go, 120); setTimeout(go, 450);
      sc.addEventListener("click", function (e) { var bar = e.target.closest(".tl-bar"); if (!bar) return; var it = me.items[+bar.dataset.i]; [].forEach.call(sc.querySelectorAll(".tl-bar.sel"), function (x) { x.classList.remove("sel"); }); bar.classList.add("sel"); document.getElementById("tlInfo").innerHTML = '<span class="tt">' + esc(it.title) + "</span>" + esc(it.text || "").replace(/\n/g, "<br>"); });
      document.getElementById("tlDate").onchange = function (e) { var v = e.target.value.split("-"); if (v.length === 3) { me.selDate = Date.UTC(+v[0], +v[1] - 1, +v[2]); me.selIsNow = false; build(); } };
      [].forEach.call(body.querySelectorAll(".tl-chip"), function (b) { b.onclick = function () { me.idx = +b.dataset.p; loadEvents(); }; });
    }
    function showActive() {
      var info = document.getElementById("tlInfo"); if (!info) return; var d = me.selDate, act = me.items.filter(function (it) { return it.a <= d && d < it.b; });
      var dt = new Date(d), lab = MONTHS[dt.getUTCMonth()] + " " + dt.getUTCDate() + ", " + dt.getUTCFullYear();
      info.innerHTML = '<span class="tt">What is active on ' + lab + "</span>" + (act.length ? act.map(function (it) { return esc(it.title.split(" · ")[0]); }).join(" &middot; ") : "Nothing is recorded for this date.") + '<br><span style="font-weight:700">Tap any bar to read what it means.</span>';
    }
    var ex = document.getElementById("cardExpand"), body = document.getElementById("cardExpandBody"), ttl = document.getElementById("cardExpandTitle");
    function loadEvents() {
      ttl.textContent = person().first + " · Timeline"; if (typeof setChartFrame === "function") setChartFrame("Numerology");
      body.innerHTML = '<div class="tl"><div class="tl-info">Loading your timeline&hellip;</div></div>';
      loadTransits().then(function (d) { me.events = computeEvents(person(), d); build(); }).catch(function () { body.innerHTML = '<div class="tl"><div class="tl-info">The timeline could not load. Please check your connection and try again.</div></div>'; });
    }
    me.selIsNow = true; ex.classList.add("open"); loadEvents();
  }

  // ---------- put it all on the results page ----------
  function peopleOf(p1, p2) {
    return [p1, p2].filter(Boolean).map(function (p) {
      var a = p.astro || {}, loc = a.location || {};
      return { first: p.first, mid: p.mid, last: p.last, dob: p.dob, numerology: p.numerology, astro: p.astro, acg: a.acg || null, birth: a.acg && loc.latitude != null ? { lat: loc.latitude, lng: loc.longitude } : null };
    });
  }
  function frameCard(cls, inner) { return '<div class="xcard ' + cls + '" role="button" tabindex="0"><i></i><b>' + inner + "</b></div>"; }
  window.addExtras = function (p1, p2) {
    try {
      addStyles();
      var g = document.getElementById("mainGrid"); if (!g) return;
      [].forEach.call(g.querySelectorAll(".xrow,.xcap,.xpass"), function (x) { x.remove(); });
      var people = peopleOf(p1, p2), withMap = people.filter(function (p) { return p.acg && p.birth; }), now = new Date(), nowLab = MONTHS[now.getMonth()] + " " + now.getDate();
      var row = document.createElement("div"); row.className = "xrow";
      row.innerHTML = frameCard("xtl", '<div class="cap">TIMELINE</div><div class="rl"></div><div class="sc">' + nowLab + '</div><div class="rl"></div>');
      var gl = null;
      if (withMap.length) { gl = document.createElement("div"); gl.className = "xglobe"; gl.setAttribute("role", "button"); gl.innerHTML = '<canvas width="300" height="300"></canvas><div class="gl">Globe</div>'; row.insertBefore(gl, row.firstChild); }
      g.appendChild(row);
      row.querySelector(".xtl").onclick = function () { openTimeline(people); };
      var cap = null;
      if (gl) { cap = document.createElement("div"); cap.className = "xcap"; cap.textContent = "A map of the world drawn from the moment you were born. It shows where on Earth each planet's energy is strongest for you."; g.appendChild(cap); gl.onclick = function () { openMap(withMap); }; drawGlobe(gl.querySelector("canvas"), withMap[0].acg, withMap[0].birth).catch(function () {}); }
      var ps = document.createElement("div"); ps.className = "xpass";
      var P = [["$11", "A week", "7 days"], ["$22", "A month", "30 days"], ["$33", "3 months", "90 days"]];
      ps.innerHTML = '<div class="h">Your energy, every day</div><div class="s">Read anyone, compare any two people, and check in on your day and your friends\' days.</div><div class="cols">' + P.map(function (x, i) { return '<button type="button" class="p" data-pass="' + i + '"><div class="n">' + x[0] + '</div><div class="l">' + x[1] + '</div><div class="d">' + x[2].toUpperCase() + "</div></button>"; }).join("") + '</div><div class="note" id="passNote"></div><div class="pol">One payment per pass. Never automatically charged. All sales final, no refunds. By choosing a pass you agree to the <a href="/terms.html">Terms</a>.</div>';
      g.appendChild(ps);
      [].forEach.call(ps.querySelectorAll(".p"), function (b) { b.onclick = function () { var n = document.getElementById("passNote"); n.textContent = "Passes are not on sale yet."; }; });
    } catch (e) { if (window.console) console.error("extras", e); }
  };
  if (window.__lastP) window.addExtras(window.__lastP[0], window.__lastP[1]);
})();
