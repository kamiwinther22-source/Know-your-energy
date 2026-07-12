import { calculateFullChart } from './numerology-calculator.js';

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const PRIVACY_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...PRIVACY_HEADERS },
  });
}

// ─── COUNTRY NAME → ISO 2-LETTER CODE ───────────────────────────────────────
function toCountryCode(country) {
  if (!country) return 'US';
  const lower = country.toLowerCase().trim();
  if (lower.length === 2) return lower.toUpperCase();
  const map = {
    'united states':'US','usa':'US','u.s.':'US','u.s.a.':'US',
    'united kingdom':'GB','uk':'GB','england':'GB','britain':'GB','scotland':'GB','wales':'GB',
    'canada':'CA','australia':'AU','new zealand':'NZ','ireland':'IE',
    'germany':'DE','france':'FR','spain':'ES','italy':'IT','portugal':'PT',
    'netherlands':'NL','belgium':'BE','switzerland':'CH','austria':'AT',
    'sweden':'SE','norway':'NO','denmark':'DK','finland':'FI','poland':'PL',
    'russia':'RU','ukraine':'UA','czech republic':'CZ','hungary':'HU','romania':'RO',
    'greece':'GR','turkey':'TR','israel':'IL','saudi arabia':'SA','uae':'AE',
    'united arab emirates':'AE','south africa':'ZA','nigeria':'NG','kenya':'KE',
    'egypt':'EG','ghana':'GH','ethiopia':'ET','tanzania':'TZ',
    'india':'IN','pakistan':'PK','bangladesh':'BD','sri lanka':'LK','nepal':'NP',
    'china':'CN','japan':'JP','south korea':'KR','korea':'KR','taiwan':'TW',
    'thailand':'TH','vietnam':'VN','indonesia':'ID','philippines':'PH','malaysia':'MY',
    'singapore':'SG','hong kong':'HK','myanmar':'MM','cambodia':'KH',
    'brazil':'BR','argentina':'AR','colombia':'CO','chile':'CL','peru':'PE',
    'mexico':'MX','venezuela':'VE','ecuador':'EC','bolivia':'BO',
    'cuba':'CU','jamaica':'JM','haiti':'HT','dominican republic':'DO',
    'morocco':'MA','algeria':'DZ','tunisia':'TN','libya':'LY',
    'iraq':'IQ','iran':'IR','syria':'SY','jordan':'JO','lebanon':'LB',
    'afghanistan':'AF','kazakhstan':'KZ','uzbekistan':'UZ',
  };
  return map[lower] || 'US';
}

// ─── PARSE BIRTH TIME (HH:MM AM/PM → 24hr) ──────────────────────────────────
function parseTime(timeStr) {
  if (!timeStr || !timeStr.trim()) return { hour: 12, minute: 0 };
  const parts = timeStr.trim().split(' ');
  const [hStr, mStr] = parts[0].split(':');
  let hour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10) || 0;
  const ap = parts[1] ? parts[1].toUpperCase() : '';
  if (ap === 'AM') { if (hour === 12) hour = 0; }
  else if (ap === 'PM') { if (hour !== 12) hour += 12; }
  return { hour, minute };
}

// ─── PARSE DOB (MM/DD/YYYY → {year,month,day}) ──────────────────────────────
function parseDOB(dob) {
  const [month, day, year] = dob.split('/').map(Number);
  return { year, month, day };
}

// ─── PAD ─────────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');

// ─── GEOCODE (Nominatim — free, no key) ─────────────────────────────────────
// Returns {lat, lng, displayName}
async function geocode(city, state, country) {
  const parts = [city, state, country].filter(Boolean);
  if (!parts.length) throw new Error('Birth city is required.');
  const q = encodeURIComponent(parts.join(', '));
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
    { headers: { 'User-Agent': 'KnowYourEnergy/1.0 (contact@knowyourenergy.com)' } }
  );
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = await res.json();
  if (!data.length) throw new Error(`Location not found: ${parts.join(', ')}`);
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

// ─── GET IANA TIMEZONE NAME FROM COORDINATES ─────────────────────────────────
// Uses timeapi.io — free, no key needed
async function getIANATimezone(lat, lng) {
  const res = await fetch(
    `https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lng}`,
    { headers: { 'Accept': 'application/json' } }
  );
  if (!res.ok) throw new Error(`Timezone lookup failed: ${res.status}`);
  const data = await res.json();
  if (!data.timeZone) throw new Error('Timezone not found for coordinates');
  return data.timeZone; // e.g. "America/Chicago"
}

// ─── CALCULATE UTC OFFSET STRING FOR A SPECIFIC DATE/TIME IN A TIMEZONE ──────
// Uses JS Intl — handles historical DST correctly for any birth year
// Returns string like "-06:00" or "+05:30"
function getUTCOffsetForDatetime(tzName, year, month, day, hour, minute) {
  const dt = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`);
  // Use Intl to get the offset string for this exact datetime in the given tz
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: tzName,
    timeZoneName: 'shortOffset',
    year: 'numeric',
  });
  const parts = formatter.formatToParts(dt);
  const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT+0';
  // Parse "GMT+5:30" / "GMT-6" / "GMT+0" into "+05:30" / "-06:00" / "+00:00"
  const match = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!match) return '+00:00';
  const sign = match[1];
  const h = parseInt(match[2], 10);
  const m = parseInt(match[3] || '0', 10);
  return `${sign}${pad(h)}:${pad(m)}`;
}

// ─── ASTROLOGY API (astrology-api.io v3) ────────────────────────────────────
// Uses city + country_code. The API handles its own internal geocoding.
// city is passed as "Sioux City, IA" to disambiguate.
async function getAstrology(env, dob, timeStr, city, state, country) {
  const { year, month, day } = parseDOB(dob);
  const { hour, minute } = parseTime(timeStr);
  const country_code = toCountryCode(country);
  const cityStr = [city, state].filter(Boolean).join(', ') || 'New York';

  const res = await fetch('https://api.astrology-api.io/api/v3/data/positions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.AstroKYE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: {
        birth_data: {
          year, month, day, hour, minute,
          city: cityStr,
          country_code,
        }
      }
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Astrology API ${res.status}: ${errText}`);
  }
  return await res.json();
}

// ─── HUMAN DESIGN API (humandesignhub.app v2) ───────────────────────────────
// Requires datetime WITH accurate timezone offset, e.g. "1977-11-14T18:46-06:00"
// We look up the IANA timezone from birth coordinates, then compute the exact
// historical UTC offset for that date/time (respecting DST).
async function getHumanDesign(env, dob, timeStr, lat, lng) {
  const { year, month, day } = parseDOB(dob);
  const { hour, minute } = parseTime(timeStr);

  // Get IANA timezone name from coordinates
  const tzName = await getIANATimezone(lat, lng);

  // Get the correct UTC offset for the BIRTH DATE (not today) in that timezone
  const utcOffset = getUTCOffsetForDatetime(tzName, year, month, day, hour, minute);

  const datetime = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}${utcOffset}`;

  const res = await fetch('https://api.humandesignhub.app/v2/simple-bodygraph', {
    method: 'POST',
    headers: {
      'X-API-KEY': env.HumanDesign_key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ datetime }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Human Design API ${res.status}: ${errText}`);
  }
  return await res.json();
}

// ─── TODAY'S DATE AS MM/DD/YYYY ──────────────────────────────────────────────
function todayAsMMDDYYYY() {
  const now = new Date();
  return `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;
}

// ─── ASSEMBLE ONE PERSON'S FULL DATA ────────────────────────────────────────
async function assemblePersonData(env, person) {
  const { first, mid, last, dob, time, city, state, country } = person;

  // Numerology runs locally — always first, always succeeds
  const numerology = calculateFullChart({
    first,
    middle: mid || '',
    last,
    dob,
    currentDate: todayAsMMDDYYYY(),
  });

  // Geocode once — needed for Human Design timezone lookup
  const coords = await geocode(city, state, country);

  // Astrology and Human Design run in parallel
  const [astrology, humanDesign] = await Promise.all([
    getAstrology(env, dob, time, city, state, country),
    getHumanDesign(env, dob, time, coords.lat, coords.lng),
  ]);

  return { numerology, astrology, humanDesign };
}

// ─── CLAUDE REPORT ───────────────────────────────────────────────────────────
async function callClaude(env, prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: 'You are an expert astrology, numerology, and Human Design reader. Work ONLY from the real data provided. Never invent or guess. Never give advice. Describe what is. Respond ONLY with valid JSON — no markdown, no backticks, no preamble.',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API ${res.status}: ${errText}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(`Claude error: ${JSON.stringify(data.error)}`);
  const raw = (data.content || []).map((c) => c.text || '').join('').trim();
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Claude returned invalid JSON: ${cleaned.slice(0, 300)}`);
  }
}

// ─── BUILD CLAUDE PROMPT ──────────────────────────────────────────────────────
function buildPrompt(rtype, relLabel, p1Info, p1Data, p2Info, p2Data) {
  const n1 = [p1Info.first, p1Info.last].filter(Boolean).join(' ');

  if (rtype === 'two-person') {
    const n2 = [p2Info.first, p2Info.last].filter(Boolean).join(' ');
    return `You are an expert reader. Use all three systems from the data below. Be specific to this actual data. Nothing generic. No advice. Describe what is.

RELATIONSHIP TYPE: ${relLabel}

PERSON 1: ${n1}
Numerology: ${JSON.stringify(p1Data.numerology)}
Astrology: ${JSON.stringify(p1Data.astrology)}
Human Design: ${JSON.stringify(p1Data.humanDesign)}

PERSON 2: ${n2}
Numerology: ${JSON.stringify(p2Data.numerology)}
Astrology: ${JSON.stringify(p2Data.astrology)}
Human Design: ${JSON.stringify(p2Data.humanDesign)}

Return ONLY this JSON:
{"headline":"string","sections":[{"eyebrow":"string","title":"string","tag":"resonant|complex|intense|foundational","body":"2-4 paragraphs separated by \\n\\n"}],"signature":"one sentence — the single most defining feature of this relationship's energy"}`;
  }

  return `You are an expert reader. Use all three systems from the data below. Be specific to this actual data. Nothing generic. No advice. Describe what is.

PERSON: ${n1}
Numerology: ${JSON.stringify(p1Data.numerology)}
Astrology: ${JSON.stringify(p1Data.astrology)}
Human Design: ${JSON.stringify(p1Data.humanDesign)}

Return ONLY this JSON:
{"headline":"string","sections":[{"eyebrow":"string","title":"string","tag":"resonant|complex|intense|foundational","body":"2-4 paragraphs separated by \\n\\n"}],"signature":"one sentence — the single most defining quality of this person's energy"}`;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...CORS_HEADERS, ...PRIVACY_HEADERS } });
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: { ...CORS_HEADERS, ...PRIVACY_HEADERS } });
    }
    const url = new URL(request.url);
    if (url.pathname !== '/report') {
      return jsonResponse({ error: 'Unknown endpoint' }, 404);
    }
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ error: 'Invalid request body.' }, 400);
    }
    try {
      const p1Data = await assemblePersonData(env, body.p1);
      const p2Data = body.p2 ? await assemblePersonData(env, body.p2) : null;
      const prompt = buildPrompt(body.rtype, body.relLabel, body.p1, p1Data, body.p2, p2Data);
      const report = await callClaude(env, prompt);
      return jsonResponse({ p1: p1Data, p2: p2Data, report });
    } catch (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  },
};
