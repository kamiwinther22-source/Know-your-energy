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

// Convert full country name to ISO 2-letter code
function toCountryCode(country) {
  const map = {
    'united states': 'US', 'usa': 'US', 'us': 'US', 'u.s.': 'US', 'u.s.a.': 'US',
    'united kingdom': 'GB', 'uk': 'GB', 'england': 'GB', 'britain': 'GB',
    'canada': 'CA', 'australia': 'AU', 'new zealand': 'NZ',
    'germany': 'DE', 'france': 'FR', 'spain': 'ES', 'italy': 'IT',
    'netherlands': 'NL', 'sweden': 'SE', 'norway': 'NO', 'denmark': 'DK',
    'finland': 'FI', 'switzerland': 'CH', 'austria': 'AT', 'belgium': 'BE',
    'portugal': 'PT', 'ireland': 'IE', 'poland': 'PL', 'russia': 'RU',
    'japan': 'JP', 'china': 'CN', 'india': 'IN', 'brazil': 'BR',
    'mexico': 'MX', 'argentina': 'AR', 'south africa': 'ZA',
    'nigeria': 'NG', 'kenya': 'KE', 'egypt': 'EG',
    'south korea': 'KR', 'korea': 'KR', 'thailand': 'TH',
    'indonesia': 'ID', 'philippines': 'PH', 'vietnam': 'VN',
    'malaysia': 'MY', 'singapore': 'SG', 'pakistan': 'PK',
    'bangladesh': 'BD', 'sri lanka': 'LK', 'nepal': 'NP',
  };
  if (!country) return 'US';
  const lower = country.toLowerCase().trim();
  // If already a 2-letter code
  if (lower.length === 2) return lower.toUpperCase();
  return map[lower] || 'US';
}

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

function parseDOB(dob) {
  const [month, day, year] = dob.split('/').map(Number);
  return { year, month, day };
}

async function getAstrology(env, dob, timeStr, city, state, country) {
  const { year, month, day } = parseDOB(dob);
  const { hour, minute } = parseTime(timeStr);
  const country_code = toCountryCode(country);
  const res = await fetch('https://api.astrology-api.io/api/v3/data/positions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.AstroKYE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: {
        birth_data: {
          year,
          month,
          day,
          hour,
          minute,
          city: [city, state].filter(Boolean).join(", ") || "New York",
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

async function getHumanDesign(env, dob, timeStr) {
  const { year, month, day } = parseDOB(dob);
  const { hour, minute } = parseTime(timeStr);
  const pad = (n) => String(n).padStart(2, '0');
  const datetime = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
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

function todayAsMMDDYYYY() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;
}

async function assemblePersonData(env, person) {
  const { first, mid, last, dob, time, city, state, country } = person;

  const numerology = calculateFullChart({
    first,
    middle: mid || '',
    last,
    dob,
    currentDate: todayAsMMDDYYYY(),
  });

  // Astrology and Human Design in parallel — no geocoding needed
  const [astrology, humanDesign] = await Promise.all([
    getAstrology(env, dob, time, city, state, country),
    getHumanDesign(env, dob, time),
  ]);

  return { numerology, astrology, humanDesign };
}

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
      return jsonResponse({ error: 'Invalid request.' }, 400);
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
