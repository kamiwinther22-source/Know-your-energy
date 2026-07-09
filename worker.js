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
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...PRIVACY_HEADERS,
    },
  });
}

// ---------- ASTROLOGY (astrology-api.io) ----------
async function getAstrology(env, birthDetails) {
  const astroResponse = await fetch("https://astrology-api.io/api/v3/data/positions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.AstroKYE}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(birthDetails)
  });
  if (!astroResponse.ok) {
    throw new Error(`Astrology API returned ${astroResponse.status}`);
  }
  return await astroResponse.json();
}

// ---------- HUMAN DESIGN (humandesignhub.app) ----------
async function getHumanDesign(env, datetime) {
  const hdResponse = await fetch("https://api.humandesignhub.app/v2/simple-bodygraph", {
    method: "POST",
    headers: {
      "X-API-KEY": env.HumanDesign_key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ datetime })
  });
  if (!hdResponse.ok) {
    throw new Error(`Human Design API returned ${hdResponse.status}`);
  }
  return await hdResponse.json();
}

function buildDatetime(dob, time) {
  const [month, day, year] = dob.split("/").map(Number);
  let hour = 12, minute = 0;
  if (time && time.trim()) {
    const [hm, ap] = time.split(" ");
    let [h, m] = hm.split(":").map(Number);
    h = h % 12;
    if (ap === "PM") h += 12;
    hour = h;
    minute = m;
  }
  const pad = (n) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;
}

function todayAsMMDDYYYY() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;
}

async function assemblePersonData(env, person) {
  const { first, mid, last, dob, time, city, country } = person;

  const numerology = calculateFullChart({
    first,
    middle: mid || "",
    last,
    dob,
    currentDate: todayAsMMDDYYYY()
  });

  let astrology;
  try {
    astrology = await getAstrology(env, {
      name: [first, mid, last].filter(Boolean).join(" "),
      dob, time, city, country
    });
  } catch (e) {
    astrology = { error: e.message };
  }

  let humanDesign;
  try {
    const datetime = buildDatetime(dob, time);
    humanDesign = await getHumanDesign(env, datetime);
  } catch (e) {
    humanDesign = { error: e.message };
  }

  return { numerology, astrology, humanDesign };
}

async function callClaude(env, prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: "Expert astrology, numerology, and Human Design reader. Precise, non-repetitive, grounded only in the real data provided. Never give advice. Respond ONLY with valid JSON, no markdown fences.",
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await res.json();
  const raw = data.content?.map((c) => c.text || "").join("") || "";
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

function describeAvailableData(personData, label) {
  const parts = [];
  parts.push(`Numerology (calculated): ${JSON.stringify(personData.numerology)}`);

  if (personData.astrology && !personData.astrology.error) {
    parts.push(`Astrology data: ${JSON.stringify(personData.astrology)}`);
  } else {
    parts.push(`Astrology data: NOT AVAILABLE (${personData.astrology?.error || "unknown error"}) — do not reference astrology for ${label}.`);
  }

  if (personData.humanDesign && !personData.humanDesign.error) {
    parts.push(`Human Design data: ${JSON.stringify(personData.humanDesign)}`);
  } else {
    parts.push(`Human Design data: NOT AVAILABLE (${personData.humanDesign?.error || "unknown error"}) — do not reference Human Design for ${label}.`);
  }

  return parts.join("\n");
}

function buildPrompt(rtype, relLabel, p1Info, p1Data, p2Info, p2Data) {
  const n1 = [p1Info.first, p1Info.last].filter(Boolean).join(" ");

  if (rtype === "two-person") {
    const n2 = [p2Info.first, p2Info.last].filter(Boolean).join(" ");
    return `You are an expert reader working ONLY from the real data provided below — never invent, guess, or reference any system whose data is marked NOT AVAILABLE.

RELATIONSHIP TYPE: ${relLabel}

PERSON 1: ${n1}
${describeAvailableData(p1Data, n1)}

PERSON 2: ${n2}
${describeAvailableData(p2Data, n2)}

Describe the cross-person dynamics using only the data sources marked available for BOTH people. If a system is unavailable for either person, omit it entirely from that comparison rather than guessing. Be specific to the actual data — no generic statements that could apply to anyone. No advice. Describe what is.

Return ONLY valid JSON: {"headline":"string","sections":[{"eyebrow":"string","title":"string","tag":"resonant|complex|intense|foundational","body":"2-4 paragraphs separated by \\n\\n"}],"signature":"one sentence — the single most defining feature of this relationship's energy"}`;
  }

  return `You are an expert reader working ONLY from the real data provided below — never invent, guess, or reference any system whose data is marked NOT AVAILABLE.

PERSON: ${n1}
${describeAvailableData(p1Data, n1)}

Describe who this person is using only the data sources marked available. If a system is unavailable, omit it entirely rather than guessing. Be specific to the actual data. No advice. Describe what is.

Return ONLY valid JSON: {"headline":"string","sections":[{"eyebrow":"string","title":"string","tag":"resonant|complex|intense|foundational","body":"2-4 paragraphs separated by \\n\\n"}],"signature":"one sentence — the single most defining quality of this person's energy"}`;
}

// ---------- ROUTES ----------
export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { ...CORS_HEADERS, ...PRIVACY_HEADERS } });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: { ...CORS_HEADERS, ...PRIVACY_HEADERS } });
    }

    const url = new URL(request.url);

    try {
      if (url.pathname === "/report") {
        const body = await request.json();
        const p1Data = await assemblePersonData(env, body.p1);
        const p2Data = body.p2 ? await assemblePersonData(env, body.p2) : null;

        const prompt = buildPrompt(
          body.rtype,
          body.relLabel,
          body.p1,
          p1Data,
          body.p2,
          p2Data
        );

        const report = await callClaude(env, prompt);

        return jsonResponse({ p1: p1Data, p2: p2Data, report });
      }

      return jsonResponse({ error: "Unknown endpoint" }, 404);

    } catch (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  },
};
