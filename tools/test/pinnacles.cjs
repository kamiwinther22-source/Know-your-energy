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
    await p.waitForTimeout(1500);
    for (const dob of ['03/14/1990', '11/29/1975']) {
      const res = await p.evaluate(async (dob) => {
        const { calculateFullChart } = await import('./numerology-calculator.js');
        const chart = calculateFullChart({ first: 'Test', middle: '', last: 'Person', dob, currentDate: '11/23/2026' });
        const box = document.createElement('div'); box.innerHTML = nr(chart);
        const rows = [...box.querySelectorAll('.dprow')].filter(r => r.querySelector('.stage-range'));
        const out = rows.map(r => ({ range: r.querySelector('.stage-range').textContent, cols: [...r.querySelectorAll('.pc-col')].map(c => ({ label: c.querySelector('.dprl')?.textContent, value: c.querySelector('.dprv')?.textContent, def: [...c.querySelectorAll('.dpdef p')].map(p => p.textContent) })) }));
        const ex = document.createElement('div'); ex.innerHTML = dateExplorerRows(chart, 40, dob);
        const exp = [...ex.querySelectorAll('.pc-col')].filter(c => /Pinnacle/.test(c.textContent.slice(0, 12))).map(c => ({ label: c.querySelector('.dprl')?.textContent, defParas: c.querySelectorAll('.dpdef p').length }));
        return { rows: out.slice(0, 4), explorer: exp };
      }, dob);
      console.log('=== DOB', dob);
      res.rows.slice(0,4).forEach((r, i) => { const c = r.cols[0]; console.log(`P${i+1} [${r.range}] value ${c.value} | paragraphs: ${c.def.length}`); c.def.forEach((t, k) => console.log('   ' + (k+1) + ') ' + t.slice(0, 110) + (t.length > 110 ? '...' : ''))); });
      console.log('explorer (age 40):', JSON.stringify(res.explorer));
    }
    await ctx.close();
  }
  await b.close();
})();
