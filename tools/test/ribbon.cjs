// Renders the site's real results screens with sample data. usage: node results.js <outDir> <tag> [root]
const { chromium } = require('playwright');
const fs = require('fs'), pathm = require('path');
const out = process.argv[2], tag = process.argv[3] || 'r', ROOT = process.argv[4] || (process.env.KYE_REPO || process.cwd());
const S = (process.env.KYE_SCRATCH || '/tmp/kye-scratch');
const CACHE = S + '/fontcache';
const chart = JSON.parse(fs.readFileSync(S + '/chart.json', 'utf8'));
const MIME = { '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.bin':'application/octet-stream' };
const report = { sections: [
  { eyebrow: 'Sample text', title: 'The two of you', body: 'This is placeholder reading text, used only to show how the reading card looks. It stands in for the written reading, which is generated for each person at the time of the reading.' },
  { eyebrow: 'Sample text', title: 'Where your two charts agree, and where they pull in different directions', body: 'A second placeholder paragraph, long enough to wrap onto several lines so the spacing, line length and contrast of the reading text can be judged on a phone screen.' },
  { eyebrow: 'Sample text', title: 'What to watch', body: 'A third placeholder paragraph. The real reading brings astrology, numerology and Human Design together into one piece.' } ],
  signature: 'Placeholder signature', references: ['Sample reference one', 'Sample reference two'] };
const P = (first, dob, d) => ({ first, mid: '', last: 'Sample', dob, time: '7:30 PM', city: 'New York', state: 'New York', country: 'United States', location: 'New York, New York', tz: 'America/New_York',
  numerology: d.numerology, astro: d.astrology, astroError: null, hdError: null });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 4 });
  const p = await ctx.newPage();
  await p.route('**/*', route => {
    const u = new URL(route.request().url());
    if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
      const key = pathm.join(CACHE, require('crypto').createHash('md5').update(u.href).digest('hex'));
      if (!fs.existsSync(key)) { const r = require('child_process').spawnSync('curl', ['-s', '--max-time', '30', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', u.href], { maxBuffer: 50e6 }); fs.writeFileSync(key, r.stdout); }
      return route.fulfill({ status: 200, contentType: u.hostname === 'fonts.googleapis.com' ? 'text/css' : 'font/woff2', body: fs.readFileSync(key), headers: { 'access-control-allow-origin': '*' } });
    }
    if (u.hostname !== 'kye.test') return route.abort();
    let f = pathm.join(ROOT, decodeURIComponent(u.pathname));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: 'nf' });
    route.fulfill({ status: 200, contentType: MIME[pathm.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('http://kye.test/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(2000);
  const shot = async (name, full) => { await p.screenshot({ path: `${out}/${tag}-${name}.png`, fullPage: !!full }); console.log('saved', name); };
  // ribbon diagnostic: relational form, strands coloured and numbered
  await p.evaluate(() => { document.getElementById('hookStep').style.display = 'none'; document.getElementById('formStep').style.display = 'block'; if (typeof setMode === 'function') setMode(true); });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { if (typeof drawFlow === 'function') drawFlow(); });
  await p.waitForTimeout(800);
  await p.evaluate(() => { const f = document.getElementById('enr'); f.scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(500);
  await p.addStyleTag({ content: '.rel-row,.rel-row *,.person-tag,.r-note{visibility:hidden !important}' });
  const box = await p.evaluate(() => { const r = document.getElementById('enr').getBoundingClientRect(); return { x: Math.max(0, r.x - 20), y: Math.max(0, r.y - 20), w: Math.min(390, r.width + 40), h: r.height + 40 }; });
  console.log(JSON.stringify(box));
  for (let k = 8; k <= 8; k++) {
    await p.evaluate((k) => {
      const svg = document.getElementById('flowArt');
      svg.querySelectorAll('path[stroke^="url(#sg"]').forEach(pa => { const id = parseInt(pa.getAttribute('stroke').replace(/\D/g, ''), 10); const base = Math.min(...[...svg.querySelectorAll('path[stroke^="url(#sg"]')].map(q => parseInt(q.getAttribute('stroke').replace(/\D/g, ''), 10))); const idx = id - base; pa.style.opacity = (k === 8) ? 1 : (idx === k ? 1 : (idx === 8 ? 0.35 : 0)); });
      svg.querySelectorAll('g[filter="url(#hot)"][opacity]').forEach(g => g.style.display = k === 8 ? '' : 'none');
    }, k);
    await p.waitForTimeout(150);
    await p.screenshot({ path: out + '/' + tag + '-strand' + k + '.png', clip: { x: box.x, y: box.y, width: box.w, height: box.h } });
  }
  await b.close();
})();
