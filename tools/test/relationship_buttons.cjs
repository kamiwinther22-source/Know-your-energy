// Serves the repo from disk inside Playwright (no web server), screenshots the page.
// usage: node shot.js <outDir> [path=/index.html] [tag=cur] [waitMs=3500]
const { chromium } = require('playwright');
const fs = require('fs');
const pathm = require('path');
const CACHE = (process.env.KYE_SCRATCH || '/tmp/kye-scratch') + '/fontcache'; fs.mkdirSync(CACHE,{recursive:true});
const ROOT = (process.env.KYE_REPO || process.cwd());
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.woff2':'font/woff2', '.woff':'font/woff', '.bin':'application/octet-stream', '.exr':'application/octet-stream', '.svg':'image/svg+xml' };
(async () => {
  const out = process.argv[2];
  const urlPath = process.argv[3] || '/index.html';
  const tag = process.argv[4] || 'cur';
  const wait = +(process.argv[5] || 3500);
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [name, w, h, dpr] of [['mobile', 390, 844, 2]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    const p = await ctx.newPage();
    const external = new Set();
    await p.route('**/*', route => {
      const u = new URL(route.request().url());
      if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
        const key = pathm.join(CACHE, require('crypto').createHash('md5').update(u.href).digest('hex'));
        if (!fs.existsSync(key)) {
          const r = require('child_process').spawnSync('curl', ['-s', '--max-time', '30', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', u.href], { maxBuffer: 50e6 });
          fs.writeFileSync(key, r.stdout);
        }
        let body = fs.readFileSync(key);
        const ct = u.hostname === 'fonts.googleapis.com' ? 'text/css' : 'font/woff2';
        return route.fulfill({ status: 200, contentType: ct, body, headers: { 'access-control-allow-origin': '*' } });
      }
      if (u.hostname !== 'kye.test') { external.add(u.hostname + u.pathname); return route.abort(); }
      let f = pathm.join(ROOT, decodeURIComponent(u.pathname));
      if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: 'nf' });
      route.fulfill({ status: 200, contentType: MIME[pathm.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
    });
    p.on('pageerror', e => console.log('PAGEERR', name, e.message));
    await p.goto('http://kye.test' + urlPath, { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    const st = () => p.evaluate(() => { const r = document.getElementById('relWrap'); const cs = getComputedStyle(r); const b = r.getBoundingClientRect(); return { display: cs.display, height: Math.round(b.height), mode: document.getElementById('formStep').classList.contains('is-rel') ? 'Relational' : 'Individual' }; });
    console.log('1 on load            ', JSON.stringify(await st()));
    await p.evaluate(() => { const t = document.getElementById('togPill'); t.scrollIntoView({block:'center'}); });
    await p.click('#togPill', { force: true });
    await p.waitForTimeout(600);
    console.log('2 after tap -> rel   ', JSON.stringify(await st()));
    await p.click('#togPill', { force: true });
    await p.waitForTimeout(600);
    console.log('3 after tap -> indiv ', JSON.stringify(await st()));
    await ctx.close();
  }
  await b.close();
})();
