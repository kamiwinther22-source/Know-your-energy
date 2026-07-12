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

async function geocode(city, state, country) {
  const parts = [city, state, country].filter(Boolean);
  if (!parts.length) throw new Error('Birth city is required for a full reading.');
  const q = encodeURIComponent(parts.join(', '));
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
    { headers: { 'User-Agent': 'KnowYourEnergy/1.0' } }
  );
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = await res.json();
  if (!data.length) throw new Error(`Location not found: ${parts.join(', ')}`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
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

async function getAstrology(env, dob, timeStr, lat, lng) {
  const { year, month, day } = parseDOB(dob);
  const { hour, minute } = parseTime(timeStr);
  const res = await fetch('https://api.astrology-api.io/api/v3/data/positions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.AstroKYE}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subject: { day, month, year, hour, minute, latitude: lat, longitude: lng } }),
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

// Runs geocode, astrology, and human design in parallel to minimize total time
async function assemblePersonData(env, person) {
  const { first, mid, last, dob, time, city, state, country } = person;

  const numerology = calculateFullChart({
    first,
    middle: mid || '',
    last,
    dob,
    currentDate: todayAsMMDDYYYY(),
  });

  // Geocode first — astrology needs the coordinates
  const coords = await geocode(city, state, country);

  // Astrology and Human Design in parallel
  const [astrology, humanDesign] = await Promise.all([
    getAstrology(env, dob, time, coords.lat, coords.lng),
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
