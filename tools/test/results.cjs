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
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
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
  // loading screen
  await p.evaluate(() => { document.getElementById('hookStep').style.display = 'none'; document.getElementById('formStep').style.display = 'none'; document.getElementById('loading').style.display = 'block'; });
  await p.waitForTimeout(500); await shot('loading');
  // results (two-person)
  await p.evaluate(({ chart, report }) => {
    const mk = (first, dob, d, hd) => ({ first, mid: '', last: 'Sample', dob, time: '7:30 PM', city: 'New York', state: 'New York', country: 'United States', location: 'New York, New York', tz: 'America/New_York', numerology: d.numerology, astro: d.astrology, astroError: null, hd, hdError: null });
    const hd1 = { type: 'Manifesting Generator', profile: '3/5', authority: 'Emotional - Solar Plexus', incarnation_cross: 'Right Angle Cross of the Sphinx (13/7 | 1/2)', gates: [1,2,5,8,13,20,22,34,41,48,55,57] };
    const hd2 = { type: 'Projector', profile: '4/6', authority: 'Splenic', incarnation_cross: 'Right Angle Cross of Planning (37/40 | 9/16)', gates: [3,9,14,16,25,31,36,46,50,59,60,64] };
    const p1 = mk('Ava', '03/14/1990', chart.p1, hd1), p2 = mk('Leo', '11/29/1975', chart.p2, hd2);
    document.getElementById('loading').style.display = 'none';
    window.__p = [p1, p2];
    renderCharts(p1, p2);
    render(p1, p2, report, null, false, false, null);
  }, { chart, report });
  await p.waitForTimeout(2500);
  await shot('results-top');
  await shot('results-full', true);
  // opened cards
  const pick = {
    numerology: () => document.querySelectorAll('.fan-hand')[0].querySelectorAll('.fan-card')[1].querySelector('.quad-item') || document.querySelectorAll('.fan-hand')[0].querySelectorAll('.fan-card')[1],
    reading: () => document.querySelector('.fan-reading > .panel-auto'),
    timeline: () => document.querySelector('.xcard.xtl'),
  };
  const open = async (which, name, scrollSel) => {
    await p.evaluate(() => { const e = document.getElementById('cardExpand'); if (e) e.classList.remove('open'); });
    await p.evaluate((w) => { const f = eval('(' + w + ')'); const el = f(); el.scrollIntoView({block:'center'}); el.click(); }, pick[which].toString());
    await p.waitForTimeout(1000);
    if (scrollSel) await p.evaluate((s) => { const ex = document.getElementById('cardExpand'); const t = [...ex.querySelectorAll('.dpsec,.dprl')].find(e => e.textContent.includes(s)); if (t) t.scrollIntoView({block:'start'}); }, scrollSel);
    await p.waitForTimeout(500);
    const sizes = await p.evaluate(() => [...document.querySelectorAll('#cardExpand .dpsec')].map(e => ({ t: e.textContent.trim().slice(0, 34), from: e.dataset.fitFrom, now: Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10, lines: Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight === 'normal' ? getComputedStyle(e).fontSize : getComputedStyle(e).lineHeight)), over: e.scrollWidth > e.clientWidth + 1 })));
    console.log(name, JSON.stringify(sizes));
    await shot(name);
  };
  await open('numerology', 'card-numerology');
  await open('numerology', 'card-pinnacle', 'Pinnacle');
  await p.evaluate(() => { const ex = document.getElementById('cardExpand'); const t = [...ex.querySelectorAll('.dprl.term')].find(e => /Pinnacle 2/.test(e.textContent)); if (t) t.click(); });
  await p.waitForTimeout(600); await shot('card-pinnacle-open');
  await open('reading', 'card-reading');
  await open('timeline', 'card-timeline');
  await b.close();
})();
