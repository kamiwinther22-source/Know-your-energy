import worker from (process.env.KYE_SCRATCH || '/tmp/kye-scratch') + '/wrun/worker.js';
const p = (first, last, dob, time, city, state, country, tz) => ({ first, mid: '', last, dob, time, city, state, country, location: city + ', ' + state, tz });
const body = { p1: p('Ava', 'Sample', '03/14/1990', '7:30 PM', 'New York', 'New York', 'United States', 'America/New_York'),
               p2: p('Leo', 'Sample', '11/29/1975', '4:15 AM', 'Chicago', 'Illinois', 'United States', 'America/Chicago') };
const req = new Request('https://know-your-energy.workers.dev/chart-data', { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://know-your-energy.com' }, body: JSON.stringify(body) });
const res = await worker.fetch(req, { PASSES: { get: async () => null, put: async () => {}, list: async () => ({ keys: [], list_complete: true }), delete: async () => {} } }, { waitUntil() {} });
const txt = await res.text();
console.log(res.status, txt.length);
import fs from 'fs';
fs.writeFileSync(process.argv[2], txt);
const j = JSON.parse(txt);
console.log(Object.keys(j), j.p1 && Object.keys(j.p1), j.error || '');
