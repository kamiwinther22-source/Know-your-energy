import { calculateFullChart } from './numerology-calculator.js';
import { computeAstrology } from './astro-engine.js';

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const PRIVACY_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...PRIVACY_HEADERS }
  });
}

const pad = (n) => String(n).padStart(2, "0");

function toCountryCode(country) {
  if (!country) return "US";
  const lower = country.toLowerCase().trim();
  if (lower.length === 2) return lower.toUpperCase();
  const map = {
    "united states": "US", "usa": "US", "u.s.": "US", "u.s.a.": "US",
    "united kingdom": "GB", "uk": "GB", "england": "GB", "britain": "GB",
    "scotland": "GB", "wales": "GB", "canada": "CA", "australia": "AU",
    "new zealand": "NZ", "ireland": "IE", "germany": "DE", "france": "FR",
    "spain": "ES", "italy": "IT", "portugal": "PT", "netherlands": "NL",
    "belgium": "BE", "switzerland": "CH", "austria": "AT", "sweden": "SE",
    "norway": "NO", "denmark": "DK", "finland": "FI", "poland": "PL",
    "russia": "RU", "ukraine": "UA", "greece": "GR", "turkey": "TR",
    "israel": "IL", "saudi arabia": "SA", "uae": "AE",
    "united arab emirates": "AE", "south africa": "ZA", "nigeria": "NG",
    "kenya": "KE", "egypt": "EG", "ghana": "GH", "india": "IN",
    "pakistan": "PK", "bangladesh": "BD", "sri lanka": "LK", "nepal": "NP",
    "china": "CN", "japan": "JP", "south korea": "KR", "korea": "KR",
    "taiwan": "TW", "thailand": "TH", "vietnam": "VN", "indonesia": "ID",
    "philippines": "PH", "malaysia": "MY", "singapore": "SG",
    "hong kong": "HK", "brazil": "BR", "argentina": "AR", "colombia": "CO",
    "chile": "CL", "peru": "PE", "mexico": "MX", "cuba": "CU",
    "jamaica": "JM", "dominican republic": "DO", "morocco": "MA",
    "algeria": "DZ", "tunisia": "TN", "iraq": "IQ", "iran": "IR",
    "afghanistan": "AF", "kazakhstan": "KZ"
  };
  return map[lower] || "US";
}

// Accepts MM/DD/YYYY, M/D/YYYY, or YYYY-MM-DD
function normalizeDOB(dob) {
  if (!dob) throw new Error("Date of birth is required.");
  const str = dob.trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [year, month, day] = str.split("-").map(Number);
    return { year, month, day };
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [month, day, year] = str.split("/").map(Number);
    return { year, month, day };
  }
  throw new Error(`Unrecognized date format: "${dob}". Use MM/DD/YYYY or YYYY-MM-DD.`);
}

function dobToMMDDYYYY(dob) {
  const { year, month, day } = normalizeDOB(dob);
  return `${pad(month)}/${pad(day)}/${year}`;
}

// Accepts: "06:45 AM", "6:45AM", "14:30", "14:30:00"
// ampm is an optional separate field from the front end
function normalizeTime(timeStr, ampm) {
  if (!timeStr || !timeStr.trim()) return { hour: 12, minute: 0 };
  let str = timeStr.trim();
  if (str.includes("T")) str = str.split("T")[1];
  str = str.replace(/([+-]\d{2}:\d{2}|Z)$/, "").trim();
  let inlineAP = "";
  const apMatch = str.match(/\s*(AM|PM)$/i);
  if (apMatch) {
    inlineAP = apMatch[1].toUpperCase();
    str = str.replace(/\s*(AM|PM)$/i, "").trim();
  }
  const parts = str.split(":");
  let hour = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;
  const ap = inlineAP || (ampm ? ampm.toUpperCase().trim() : "");
  if (ap === "AM") { if (hour === 12) hour = 0; }
  else if (ap === "PM") { if (hour !== 12) hour += 12; }
  return { hour, minute };
}

// Strips state/country from city field no matter how the front end sends it
function normalizeCity(city, state, country) {
  let rawCity = (city || "").trim();
  let rawCountry = (country || "").trim();

  if (rawCity.includes(",")) {
    const segments = rawCity.split(",").map(s => s.trim());
    rawCity = segments[0];
    if (!rawCountry && segments.length >= 3) rawCountry = segments[2];
    if (!rawCountry && segments.length === 2 && segments[1].length > 3) rawCountry = segments[1];
  }

  rawCity = rawCity.replace(/\s+[A-Z]{2}$/, "").trim();

  if (!rawCity && state) {
    rawCity = (state || "").trim().replace(/\s+[A-Z]{2}$/, "").trim();
  }

  return {
    cityName: rawCity || "New York",
    countryCode: toCountryCode(rawCountry || "US")
  };
}

// ─── ASTROLOGY — now 100% local ──────────────────────────────────────────────
// No fetch, no API key, no rate limit. See astro-engine.js.

function getAstrologyLocal(dob, timeStr, ampm, city, state, country) {
  const { year, month, day } = normalizeDOB(dob);
  const hasRealTime = !!(timeStr && timeStr.trim());
  const { hour, minute } = normalizeTime(timeStr, ampm);
  const { cityName, countryCode } = normalizeCity(city, state, country);
  const result = computeAstrology({
    year, month, day, hour, minute,
    cityName, countryCode,
    state: state || ""
  });

  if (!hasRealTime) {
    // Ascendant, Midheaven, and house placements all depend on the exact
    // clock time of birth — without it they'd just be guesses computed from
    // a defaulted noon, not the "omitted" behavior promised on the form.
    // Sign-level positions don't depend on time-of-day, so those stay for
    // every body/point, including the ones stored outside result.planets.
    //
    // But a defaulted noon can still silently land on the wrong side of a
    // sign boundary if a body changes sign sometime during the actual
    // birth date -- rare (most bodies sit in one sign for weeks to years)
    // but real. Check by computing sign-only charts (skipAspects: nothing
    // else about them is needed) at the very start and very end of the
    // same local day and diffing each body's sign between the two: equal
    // means certain for the whole day; different means the exact birth
    // time is what decides it, so that body is flagged rather than guessed.
    const dayStart = computeAstrology({
      year, month, day, hour: 0, minute: 0,
      cityName, countryCode, state: state || "", skipAspects: true
    });
    const dayEnd = computeAstrology({
      year, month, day, hour: 23, minute: 59,
      cityName, countryCode, state: state || "", skipAspects: true
    });
    const byName = (list) =>
      Object.fromEntries((list || []).filter(b => b?.name).map(b => [b.name, b]));
    const startPlanets = byName(dayStart.planets);
    const endPlanets = byName(dayEnd.planets);

    const flagIfAmbiguous = (body, startBody, endBody) => {
      if (!body || !startBody || !endBody) return body;
      if (startBody.sign !== endBody.sign) {
        return { ...body, sign: startBody.sign, signUncertain: true, signAlt: endBody.sign };
      }
      return body;
    };
    const stripHouse = (b) => b ? (({ house, ...rest }) => rest)(b) : b;

    result.planets = result.planets.map(p =>
      stripHouse(flagIfAmbiguous(p, startPlanets[p.name], endPlanets[p.name]))
    );
    result.northNode = stripHouse(flagIfAmbiguous(result.northNode, dayStart.northNode, dayEnd.northNode));
    result.southNode = stripHouse(flagIfAmbiguous(result.southNode, dayStart.southNode, dayEnd.southNode));
    result.chiron = stripHouse(flagIfAmbiguous(result.chiron, dayStart.chiron, dayEnd.chiron));
    result.sirius = stripHouse(flagIfAmbiguous(result.sirius, dayStart.sirius, dayEnd.sirius));
    result.lilith = stripHouse(flagIfAmbiguous(result.lilith, dayStart.lilith, dayEnd.lilith));
    result.ascendant = null;
    result.midheaven = null;
    result.houses = [];
    result.aspects = result.aspects.filter(
      a => a.point1 !== "Ascendant" && a.point2 !== "Ascendant" &&
           a.point1 !== "Midheaven" && a.point2 !== "Midheaven"
    );
    result.timeUnknown = true;
  }

  return result;
}

// ─── HUMAN DESIGN API ────────────────────────────────────────────────────────
// v2 API — single ISO datetime with timezone offset.
// Step 1: search city for IANA timezone
// Step 2: resolve local time to offset datetime
// Step 3: call chart endpoint

// A "1 request" report generation was actually burning 3 calls against
// this API's shared 5-per-minute limit (timezone search, datetime
// resolve, then the bodygraph fetch itself, plus its own retry) --
// easily exceeded by one relational (2-person) report alone, or by
// testing the same person twice inside a minute. The timezone for a
// given city and the resolved datetime for a given date/time/timezone
// are both deterministic -- they never change -- so they're exactly
// the kind of thing that should be cached, not re-fetched every single
// generation. Cached in the existing PASSES KV namespace (no expiry:
// this data is permanent, not a session-scoped cache) under a distinct
// key prefix so it can't collide with pass records or the usage counter.
async function getHDTimezone(env, cityName) {
  const cacheKey = `hdtz:${cityName.toLowerCase().trim()}`;
  const cached = await env.PASSES.get(cacheKey);
  if (cached !== null) return cached === '' ? null : cached;
  try {
    const res = await fetch(
      `https://api.humandesignhub.app/v2/locations/search?query=${encodeURIComponent(cityName)}`,
      { headers: { "X-API-KEY": env.HumanDesign_key } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = Array.isArray(data) ? data : (data.results || data.data || []);
    const tz = results.length ? (results[0].timezone || results[0].iana_timezone || results[0].tz) : null;
    // Cache the real result, including a genuine "not found" -- worth
    // remembering so a bad/unknown city name doesn't keep re-querying.
    // A network/API failure (caught below) is NOT cached, since that's
    // transient and deserves a real retry next time.
    await env.PASSES.put(cacheKey, tz || '');
    return tz || null;
  } catch (_) { return null; }
}

async function resolveHDDatetime(env, dateStr, timeStr, timezone) {
  const cacheKey = `hddt:${dateStr}|${timeStr}|${timezone}`;
  const cached = await env.PASSES.get(cacheKey);
  if (cached !== null) return cached === '' ? null : cached;
  try {
    const res = await fetch("https://api.humandesignhub.app/v2/timezone/resolve", {
      method: "POST",
      headers: {
        "X-API-KEY": env.HumanDesign_key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ date: dateStr, time: timeStr, timezone })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const datetime = data.datetime || data.resolved_datetime || null;
    await env.PASSES.put(cacheKey, datetime || '');
    return datetime;
  } catch (_) { return null; }
}

async function getHumanDesign(env, dob, timeStr, ampm, city, state) {
  const { year, month, day } = normalizeDOB(dob);
  const { hour, minute } = normalizeTime(timeStr, ampm);
  const { cityName } = normalizeCity(city, state, null);

  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const timeFormatted = `${pad(hour)}:${pad(minute)}`;

  let datetime = null;

  const timezone = await getHDTimezone(env, cityName);
  if (timezone) {
    datetime = await resolveHDDatetime(env, dateStr, timeFormatted, timezone);
  }

  // Fallback if resolution fails — no offset, API still calculates
  if (!datetime) {
    datetime = `${dateStr}T${timeFormatted}:00`;
  }

  // The bodygraph result for a given resolved datetime is also
  // deterministic -- cache it too, so re-testing the exact same person
  // (the normal shape of iterating on this app) costs zero further
  // calls to this API after the first real one.
  const chartCacheKey = `hdchart:${datetime}`;
  const cachedChart = await env.PASSES.get(chartCacheKey);
  if (cachedChart !== null) return JSON.parse(cachedChart);

  // Retry on a transient/rate-limit response (429, or a 5xx) -- a two-
  // person relational report makes this exact call twice, back-to-back,
  // for the same API key within milliseconds of each other, which is
  // exactly the shape of request a rate limit is designed to catch. One
  // short retry covers that case without masking a genuine, persistent
  // failure (a real 4xx other than 429 still throws immediately).
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch("https://api.humandesignhub.app/v2/simple-bodygraph", {
      method: "POST",
      headers: {
        "X-API-KEY": env.HumanDesign_key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ datetime })
    });
    if (res.ok) {
      const json = await res.json();
      await env.PASSES.put(chartCacheKey, JSON.stringify(json));
      return json;
    }
    const errText = await res.text();
    lastErr = new Error(`Human Design API ${res.status}: ${errText}`);
    if (res.status !== 429 && !(res.status >= 500 && res.status < 600)) throw lastErr;
    if (attempt === 0) await new Promise(r => setTimeout(r, 600));
  }
  throw lastErr;
}

function todayAsMMDDYYYY() {
  const now = new Date();
  return `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;
}

async function assemblePersonData(env, person) {
  const { first, mid, last, dob, time, ampm, city, state, country } = person;

  let numerology = null, numerologyError = null;
  try {
    numerology = calculateFullChart({
      first, middle: mid || "", last,
      dob: dobToMMDDYYYY(dob),
      currentDate: todayAsMMDDYYYY()
    });
  } catch (e) { numerologyError = e.message; }

  let astrology = null, astrologyError = null;
  try {
    astrology = getAstrologyLocal(dob, time, ampm, city, state, country);
  } catch (e) { astrologyError = e.message; }

  let humanDesign = null, humanDesignError = null;
  const hasTime = time && time.trim().length > 0;
  const hasCity = city && city.trim().length > 0;
  if (hasTime && hasCity) {
    try {
      humanDesign = await getHumanDesign(env, dob, time, ampm, city, state);
    } catch (e) { humanDesignError = e.message; }
  } else {
    humanDesignError = "Birth time and city are required for Human Design. Chart omitted.";
  }

  return { numerology, numerologyError, astrology, astrologyError, humanDesign, humanDesignError };
}

// ─── STRIPE CHECKOUT ─────────────────────────────────────────────────────────

// All three plans are one-time charges. Nobody is ever auto-billed again —
// "month"/"year" describe how long the pass lasts, not a recurring charge.
const PLAN_CONFIG = {
  single: { mode: "payment", amount: 500, name: "Single Reading" },
  monthly: { mode: "payment", amount: 1000, name: "One Month Pass" },
  annual: { mode: "payment", amount: 2500, name: "One Year Pass" }
};

async function createCheckoutSession(env, plan, origin, email) {
  const config = PLAN_CONFIG[plan];
  if (!config) throw new Error(`Unknown plan: "${plan}".`);

  const params = new URLSearchParams();
  params.set("mode", config.mode);
  params.set("success_url", `${origin}/?checkout=success&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}/?checkout=cancel`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(config.amount));
  params.set("line_items[0][price_data][product_data][name]", config.name);
  params.set("metadata[plan]", plan);
  if (email) params.set("customer_email", email);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Stripe API error: ${errText}`);
  }
  return await res.json();
}

// ─── PASSES (monthly/annual, verified against Stripe, stored in KV) ──────────

const PASS_DURATION_MS = {
  monthly: 31 * 24 * 60 * 60 * 1000,
  annual: 366 * 24 * 60 * 60 * 1000
};

// Family emails with unlimited free access — never go through Stripe,
// never expire. Checked before any real KV pass lookup.
const UNLIMITED_EMAILS = [
  "kamiwinther22@gmail.com",
  "maddiewinther@gmail.com",
  "halliewinther@gmail.com"
];

function passKey(email) {
  return `pass:${email.trim().toLowerCase()}`;
}

// Only the plain birth-data fields needed to refill the form — never the
// computed numerology/astrology/Human Design output, which is regenerated
// fresh from these each time.
function personSnapshot(p) {
  if (!p) return null;
  const { first, mid, last, dob, time, city, state, country } = p;
  return { first, mid, last, dob, time, city, state, country };
}

async function recordPass(env, sessionId, p1, p2) {
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}` }
  });
  if (!res.ok) throw new Error("Could not verify checkout session with Stripe.");
  const session = await res.json();

  if (session.payment_status !== "paid") {
    return { ok: false, reason: "Payment not completed." };
  }

  const plan = session.metadata && session.metadata.plan;
  const durationMs = PASS_DURATION_MS[plan];
  if (!durationMs) {
    // Single-reading purchases don't create a pass — nothing to store.
    return { ok: true, plan: plan || null };
  }

  const email = session.customer_details && session.customer_details.email;
  if (!email) return { ok: false, reason: "No email on checkout session." };

  const purchasedAt = Date.now();
  const expiresAt = purchasedAt + durationMs;
  await env.PASSES.put(
    passKey(email),
    JSON.stringify({ plan, purchasedAt, expiresAt, p1: personSnapshot(p1), p2: personSnapshot(p2) }),
    { expirationTtl: Math.ceil(durationMs / 1000) }
  );

  return { ok: true, plan, expiresAt };
}

async function checkPassRecord(env, email) {
  if (!email) return { active: false };
  if (UNLIMITED_EMAILS.includes(email.trim().toLowerCase())) {
    const raw = await env.PASSES.get(passKey(email));
    const record = raw ? JSON.parse(raw) : {};
    return { active: true, plan: "annual", expiresAt: Date.now() + PASS_DURATION_MS.annual, p1: record.p1 || null, p2: record.p2 || null };
  }
  const raw = await env.PASSES.get(passKey(email));
  if (!raw) return { active: false };
  const record = JSON.parse(raw);
  if (record.expiresAt < Date.now()) return { active: false };
  return { active: true, plan: record.plan, expiresAt: record.expiresAt, p1: record.p1 || null, p2: record.p2 || null };
}

// Refreshes the stored person snapshot for an active pass, so the most
// recently used birth data is what autofills next time — called whenever a
// pass holder generates a reading, not just at purchase time.
async function refreshPassSnapshot(env, email, p1, p2) {
  if (!email) return;
  const key = passKey(email);
  const raw = await env.PASSES.get(key);
  const isUnlimited = UNLIMITED_EMAILS.includes(email.trim().toLowerCase());
  if (!raw && !isUnlimited) return;
  const record = raw ? JSON.parse(raw) : { plan: "annual", purchasedAt: Date.now() };
  if (!isUnlimited && record.expiresAt < Date.now()) return;
  const expiresAt = isUnlimited ? Date.now() + PASS_DURATION_MS.annual : record.expiresAt;
  const remainingTtl = Math.ceil((expiresAt - Date.now()) / 1000);
  if (remainingTtl <= 0) return;
  record.expiresAt = expiresAt;
  record.p1 = personSnapshot(p1);
  record.p2 = personSnapshot(p2);
  await env.PASSES.put(key, JSON.stringify(record), { expirationTtl: remainingTtl });
}

// ─── USAGE TRACKING (running total, for cost monitoring) ─────────────────────
// No auth on the read side (see the /usage route) — this is a lifetime running
// total of tokens spent generating readings, not customer data.

const USAGE_KV_KEY = "usage:totals";

async function recordUsage(env, usage) {
  if (!usage) return;
  const raw = await env.PASSES.get(USAGE_KV_KEY);
  const totals = raw ? JSON.parse(raw) : {
    requests: 0, inputTokens: 0, outputTokens: 0,
    cacheCreationTokens: 0, cacheReadTokens: 0
  };
  totals.requests += 1;
  totals.inputTokens += usage.input_tokens || 0;
  totals.outputTokens += usage.output_tokens || 0;
  totals.cacheCreationTokens += usage.cache_creation_input_tokens || 0;
  totals.cacheReadTokens += usage.cache_read_input_tokens || 0;
  await env.PASSES.put(USAGE_KV_KEY, JSON.stringify(totals));
}

// ─── CLAUDE REPORT GENERATION ────────────────────────────────────────────────

const REPORT_SYSTEM_PROMPT = `You write personalized readings for Know Your Energy, a site that combines
Astrology, Numerology, and Human Design into one reading.

===== NON-NEGOTIABLE RULE: NAMING =====
Single-person reading: speak directly to the person as "you."
Two-person reading: every sentence must name which person it's about,
using their actual first name (given to you below). Never write "person
one," "person two," "one of you," "the other," or an unattributed
"you." A claim with no name attached is unusable — the reader cannot
tell who it's about. If a sentence applies to both people, say so
explicitly ("both of you" is fine ONLY when it genuinely means both,
never as a way to avoid picking a name).
Bad: "You likely recognize each other fast, the way people do when
they sense real intensity."
Good: "[Name1] picks up on [Name2]'s intensity almost immediately, and
[Name2] doesn't back away from being met that directly."
This rule overrides every other stylistic instruction below if they
ever conflict.

===== NON-NEGOTIABLE RULE: OUTPUT FORMAT =====
Your entire response must be the JSON object described in OUTPUT
FORMAT below — nothing else, ever. Never write a sentence of plain-text
explanation, apology, or caveat before or after it, even if the data
given looks incomplete, unusual, or hard to interpret. Do not say
things like "I don't have enough information" or "I'm not able to
generate a full reading" — every case given to you has enough real
data to write from; use it and write the JSON.
Bad: "I don't have enough specific detail to write a meaningful
two-person reading for these two charts."
Good: {"headline": "...", "sections": [...], "signature": "...",
"references": [...]}
This rule overrides every other instruction in this prompt, including
the naming rule above, if they ever conflict.

VOICE
- Never use a vague metaphor or image instead of stating the mechanism
  plainly ("your identity runs deep rather than wide," "what real
  intensity costs" — neither describes anything a reader can check
  against real life). Replace it with the concrete claim it's standing
  in for.
- No therapy-speak clichés, no fortune-cookie language.
- Use permissive framing ("you may notice," "you might find")
  deliberately for something personal or hard to hear — not on every
  sentence, and the underlying data should still be specific either way.
- Never write a contrastive reframe ("more than X," "beyond X") unless
  X was actually stated earlier in the same passage.
- Describe a repeatable capacity as exactly that — true across many
  instances over a lifetime — never as if it sums up the whole person
  or one purpose.
- Never end on an implied corrective ("give it the time it needs,"
  "remember to...") — that assumes a deficiency nowhere in the data.
  State the trait plainly: no lesson, no growth edge, no verdict on
  what they should do differently. Exception: Saturn, Karmic Lessons,
  and Karmic Debt are genuinely about a lesson in real tradition — name
  the lesson and connect it to timing/cycles when the data supports
  that, but don't assume they have or haven't overcome it unless the
  actual cycle timing indicates where they are in it.
- No medical, legal, or financial predictions or promises.
- Never promise how a relationship will turn out — that depends on the
  other person's choices, not the chart. Name real capacity for
  connection when the data shows it; don't imply a guaranteed outcome.
- Name a Karmic Debt, hard Challenge, or hard aspect's real weight
  directly — don't soften it into pure opportunity-framing or call it
  only "calibration." When several heavy indicators stack together,
  say plainly that real hardship has likely been an ongoing part of
  this person's life — common, not a singling-out misfortune, and not
  minimized into something purely constructive either. Don't invent a
  specific biographical event; name the structural weight itself. Use
  the given Pinnacle/Challenge age ranges to say WHEN it concentrates,
  and name it directly when several hard indicators cluster around the
  same age window.
- The three ages where one Pinnacle cycle ends and the next begins are
  real, often abrupt turning points — when the person's current age
  sits at, near, or just past one, name that transition directly.
- Essence (internal state) and Personal Year (external circumstance)
  should be read together — the same Personal Year lands differently
  depending on the overlapping Essence. When the two numbers match,
  name that as a real amplification.
- A placement/planet/house/number name must never open a sentence or
  be its grammatical subject ("Your Scorpio Sun wants..." becomes "You
  want total, earned commitment before you open up"). Prose defaults to
  naming NO placements — the References list makes every citation
  traceable — mention one only when it's doing real rhetorical work,
  and only in a trailing clause. Never stack degree numbers or aspect
  names into a sentence as proof of precision; that belongs only in
  References.
- Hold one tense: present or future, never past — except when clearly
  describing an early-childhood period for someone now an adult (e.g.
  Pinnacle 1's age range), and even then it must stay a specific
  carve-out, never the reading's overall tone. Watch for "had to,"
  "took longer than," "would've been," "missed out on" — these invent
  a specific past the chart cannot actually know; rewrite in present
  tense, describing the ongoing trait instead. Applies with extra force
  to Saturn, Karmic Lessons/Debt, Chiron, and the Nodes.
- Never compare the person to "other people" or "most people" to make a
  trait land — state what's true of them directly.
- A backward reference ("the same placement," "that same X") must point
  at something literally identical — not two different aspects that
  happen to share one planet. Name it specifically or restate the point.
- Real depth means concrete behavioral detail, a specific scenario,
  what it feels like from the inside, where it creates friction with
  something else true about them — not a longer list of placements
  cited in support of one thin claim.
- Required — References: after the last section (and, for a two-person
  reading, after the closing note), list every placement/number/gate
  actually drawn on, one per entry, short technical shorthand (e.g.
  "Sun in Scorpio, 6th house," "Life Path 22," "Sacral Authority").
  This is the only place technical citations belong in stacked form —
  don't repeat this list's job inside the prose.

WHAT YOU RECEIVE
- Numerology: Life Path, Expression, Soul Urge, Personality, Birthday,
  Attitude, Balance, Maturity, current Personal Year/Month/Day, current
  Essence cycle, all four Pinnacles with age ranges, all four Challenge
  numbers, Karmic Lessons and Karmic Debt numbers.
- Astrology: planets in signs AND houses, Ascendant, Midheaven, North/
  South Node, Chiron, house cusps, and major aspects (e.g. "Moon square
  Mars") whenever birth time was provided. Use house placements and
  aspects when you have them — that's most of what makes a chart
  specific instead of generic. Sirius (fixed star — ambition,
  recognition, intensity; a caution toward arrogance/burnout) and
  Lilith (Black Moon Lilith, a calculated point — the raw, suppressed
  part of a person) can appear in aspects too — use them on purpose.
- Human Design: type, profile, authority, incarnation cross, AND the
  full list of defined gates — the gates are often the most specific
  detail available.
- Two-person reading: the same full data for a second person, plus the
  relationship type (parent-child / romantic / friends / other).

WHAT TO WRITE
The full data already prints on the page as its own card — not your job
to repeat. Answer the real question each piece of data exists to
answer, then weave those answers into one coherent narrative. Depth on
what matters beats touching everything once.

This is a single-person reading unless a relationship type is given.
For two-person readings, PART 3 entirely replaces PART 1 and PART 2.

===== SINGLE-PERSON READINGS: PART 1 =====
Every placement, number, and gate answers a specific real-life question
— not "what does astrology/numerology/Human Design say," but the actual
question that piece of data answers. Draw from whichever are genuinely
revealing for THIS person — don't skip a whole system.

Astrology:
- Sun: who are they at their core, what drives their basic identity?
- Moon: what do they need emotionally to feel secure, how do they process feelings?
- Mercury: how do they think and communicate?
- Venus: what/who do they love, and how; what do they value?
- Mars: how do they take action, assert themselves, pursue what they want?
- Jupiter: where do they find growth, luck, and meaning?
- Saturn: where do they face responsibility, restriction, hard-won mastery?
- Uranus: where do they need freedom, or break from convention?
- Neptune: where do they dream, idealize, or risk losing clarity?
- Pluto: where do they go through deep transformation or power struggles?
- Ascendant: how do they come across to others; how do they approach life itself?
- Midheaven: what's their public path — career, reputation, aspiration?
- Houses: WHICH AREA OF LIFE does each planet's energy actually play out in?
- Aspects: how do these different drives support or complicate each other?
- Chiron: where's their deepest wound, and the gift in healing it?
(Only use house/Ascendant/Midheaven/aspect data if birth time was
provided — never guess or invent it if it wasn't.)

Numerology:
- Life Path: what's their overall life purpose or journey?
- Expression: what are their natural talents, how are they meant to use them?
- Soul Urge: what do they truly want at their core?
- Personality: how do others perceive them on the surface?
- Birthday number: what specific natural gift do they carry?
- Maturity: who do they grow into later in life?
- Attitude: how do they instinctively react to new situations?
- Balance: how do they regain steadiness under stress?
- Personal Year/Month/Day, Essence: what theme is active for them right now?
- Pinnacles/Challenges: what's the opportunity and the obstacle in each life phase?
- Karmic Lessons/Debt: what are they here to learn or work through?

Human Design:
- Type: how are they actually designed to take action correctly?
- Authority: how do they make the right decisions for themselves?
- Profile: what's their role/lens for engaging with life?
- Incarnation Cross: what's their larger life theme or purpose?
- Gates: what specific gifts or fixed traits do they carry?

===== SINGLE-PERSON READINGS: PART 2 =====
Cross-check Part 1 by THEME, not by system — note where astrology,
numerology, and Human Design reinforce each other, add nuance, or one
reveals something the others miss:
- Core identity: Sun sign vs. Life Path vs. Type
- Outward impression: Ascendant vs. Personality number vs. Profile's outer-facing line
- Core want and how they pursue it: Mars/Venus vs. Soul Urge vs. Authority
- Life direction/purpose: Midheaven vs. Life Path + Expression vs. Incarnation Cross
- Identity vs. emotional undercurrent: Sun sign vs. Moon sign — two
  different layers by design; name plainly when they point in genuinely
  different directions rather than describing each in isolation.

Before calling anything a tension, check whether it's actually two
honest parts of one coherent whole instead — the same person can want
freedom AND pursue it cautiously, without conflict. Only call something
a genuine tension when it actually reads as one placement pulling
against another.

When you do name a real tension, trace it to the placement whose actual
mechanism explains it — don't default to blaming whichever placement
sounds most dramatic (Scorpio, Pluto, a hard aspect) just because it's
vivid, and don't let one placement's real trait explain an outcome that
belongs to a different planet's actual domain (e.g. Mercury governs
thinking and communication, not romantic commitment).

Required — Blind Spots: name something specific that would be MISSED or
MISREAD with only one or two of the three systems instead of all three.
Name the exact element, and say plainly what it would have hidden or
gotten wrong. Write a real example from their actual data.

===== TWO-PERSON READINGS: PART 3 (replaces Part 1 and Part 2) =====
Do not describe either person's chart, numbers, or design on its own
terms — assume both already know their own results. Every question you
answer here must be about the INTERACTION between them — never one
person alone. The naming rule at the top of this prompt applies with
extra force here — check every sentence against it.

Interpret everything through the relationship type you were given
(parent-child / romantic / friends / other) — never default to a
romantic reading when the relationship isn't romantic.

Astrology — interaction between charts:
- Sun-Sun: do their core identities blend, compete, or complement?
- Sun-Moon: does one person's core self meet the other's emotional needs?
- Moon-Moon: do they feel emotionally safe with each other, or misread each other's needs?
- Venus-Mars: is there real chemistry, and which direction does it run? (romantic attraction for a couple; mutual encouragement or friction around drive/affection for any other relationship type)
- Mercury-Mercury: do they think and communicate compatibly, or talk past each other?
- Mars-Mars: do they clash or team up around drive, conflict, and pursuing goals?
- Saturn/Jupiter to the other's personal planets: where does one person add structure/weight, or growth/encouragement, to the other?
- Ascendant to Sun: how do their outward first impressions of each other compare to who they actually are underneath?
- House overlays (only when both provided birth times): which of the other's houses does each person's planet fall into — WHERE in life the dynamic actually plays out.

Numerology — interaction between numbers:
- Life Path-Life Path: are their overall life directions aligned, complementary, or fundamentally different?
- Expression-Expression: do their natural talents work together or compete?
- Soul Urge-Soul Urge: do they want the same kinds of things at their core?
- Personality-Personality: how do their outward "first impression" styles mesh?

Human Design — interaction between designs:
- Type-Type: does one person's energy mechanics support or drain the other's?
- Authority-Authority: whose decision-making style leads, and does that create ease or friction?
- Profile-Profile: do their roles/lenses on life reinforce each other or pull in different directions?
- Defined vs. undefined gates/centers: where does one person's defined trait "run" the other's undefined one, for better or worse?

Close a two-person reading with a brief, genuine note: if either person
hasn't gotten their own individual reading yet, that's where to start —
this reading assumes that groundwork, it doesn't replace it.

Write as many sections as it takes to answer the questions above with
real depth — a shorter reading that says something true and specific
beats a longer one that touches everything at the expense of saying
anything well.

LENGTH TARGET
Aim for roughly 1,500-2,500 words across the whole reading — a target
to comfortably land inside, not a wall to write up against.

OUTPUT FORMAT — return ONLY valid JSON matching this shape, no other text:
{
  "headline": "A short, specific line (not a generic title like 'Your Reading')",
  "sections": [
    {
      "eyebrow": "Short label for this section, e.g. 'Core Drive' or 'Where You Lead'",
      "title": "A specific, non-generic section title",
      "body": "The actual reading for this section, grounded in their specific data. Follow the naming rule at the top of this prompt exactly. Give it the room the point needs, within the length target above."
    }
  ],
  "signature": "One closing line — not a summary, a final thought that lands.",
  "references": ["Every placement/number/gate the reading actually drew on, one per entry, short technical shorthand -- see the References rule above. Not prose, not repeated from the body text verbatim -- just the citation itself, e.g. 'Sun in Scorpio, 6th house'."]
}

Each section should be doing different work — don't repeat the same
insight reworded across sections.`;

function buildReportUserPrompt(rtype, relLabel, p1, p2) {
  const personBlock = (p) => {
    const n = p.numerology || {};
    const a = p.astrology || {};

    const pinnacle = (x) => x ? `${x.value} (${x.ageRange})` : 'unknown';
    // Challenge numbers run during the same four age windows as their
    // parallel Pinnacle (real, sourced numerology convention -- Pinnacles
    // and Challenges cover the same life periods, just describe the
    // opportunity vs. the obstacle within each). Pinnacle age ranges are
    // already computed; reuse them here so the model can name WHEN a
    // Challenge's difficulty concentrates, not just that it exists.
    const challenge = (val, pin) => `${val}${pin?.ageRange ? ` (age ${pin.ageRange})` : ''}`;
    const numerologyLines = [
      `Life Path ${n.lifePath}, Expression ${n.expression}, Soul Urge ${n.soulUrge}, Personality ${n.personality}, Birthday ${n.birthday}`,
      `Attitude ${n.attitude}, Balance ${n.balance}, Maturity ${n.maturity}`,
      `Current cycle: Personal Year ${n.personalYear}, Personal Month ${n.personalMonth}, Personal Day ${n.personalDay}, Essence ${n.essenceCycle?.value} (age ${n.essenceCycle?.currentAge})`,
      `Pinnacles: 1) ${pinnacle(n.pinnacles?.pinnacle1)}  2) ${pinnacle(n.pinnacles?.pinnacle2)}  3) ${pinnacle(n.pinnacles?.pinnacle3)}  4) ${pinnacle(n.pinnacles?.pinnacle4)}`,
      `Challenges: 1) ${challenge(n.challengeNumbers?.challenge1, n.pinnacles?.pinnacle1)}  2) ${challenge(n.challengeNumbers?.challenge2, n.pinnacles?.pinnacle2)}  3) ${challenge(n.challengeNumbers?.challenge3, n.pinnacles?.pinnacle3)}  4) ${challenge(n.challengeNumbers?.challenge4, n.pinnacles?.pinnacle4)}`,
      `Karmic Lessons: ${n.karmicLessons?.length ? n.karmicLessons.join(', ') : 'none'}`,
      `Karmic Debt: ${n.karmicDebtNumbers?.length ? n.karmicDebtNumbers.join(', ') : 'none'}`
    ].join('\n  ');

    const planetLine = (pl) => `${pl.name} in ${pl.sign} ${pl.degreesInSign}°${pl.house ? ` (house ${pl.house})` : ''}${pl.retrograde ? ' Rx' : ''}`;
    const angle = (label, x) => x ? `${label}: ${x.sign} ${x.degreesInSign}°` : null;
    const astrologyLines = [
      a.timeUnknown ? 'Birth time not provided — Ascendant, Midheaven, and house placements are unavailable. Do not guess or invent them; cover planets by sign only.' : null,
      (a.planets || []).map(planetLine).join(', '),
      [angle('Ascendant', a.ascendant), angle('Midheaven', a.midheaven), angle('North Node', a.northNode), angle('South Node', a.southNode), angle('Chiron', a.chiron), angle('Sirius', a.sirius), angle('Lilith', a.lilith)].filter(Boolean).join(', '),
      a.houses?.length ? `House cusps: ${a.houses.map(h => `${h.house}:${h.sign} ${h.cuspDegrees}°`).join(', ')}` : null,
      `Major aspects: ${(a.aspects || []).map(x => `${x.point1} ${x.aspect} ${x.point2}`).join(', ') || 'none'}`
    ].filter(Boolean).join('\n  ');

    const h = p.humanDesign || {};
    const hdLines = [
      `${h.type || 'unknown'} type, ${h.profile || 'unknown'} profile, ${h.authority || 'unknown'} authority`,
      h.incarnation_cross ? `Incarnation Cross: ${h.incarnation_cross}` : null,
      h.gates?.length ? `Defined gates: ${h.gates.join(', ')}` : null
    ].filter(Boolean).join('\n  ');

    // The person's actual first name is the block's own header -- this
    // used to be prefixed with a literal "Person One:"/"Person Two:"
    // label, and a real generated reading echoed those exact labels
    // ("Person One's Moon in Capricorn...") instead of the name that
    // followed them, no matter how forcefully the system prompt said to
    // use names. Removing the fake label from the data entirely is a
    // more reliable fix than any instruction telling the model to
    // ignore it -- it simply never sees "Person One" or "Person Two" now.
    return `
${p.first}${p.last ? ' ' + p.last : ''}:
Numerology:
  ${numerologyLines}
Astrology:
  ${astrologyLines}
Human Design:
  ${hdLines}`;
  };

  if (rtype === 'two-person') {
    return `Relationship type: ${relLabel}\n${personBlock(p1)}\n${personBlock(p2)}`;
  }
  return personBlock(p1);
}

function extractJSON(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) return fenced[1];
  // Safety net for a response that isn't pure JSON (e.g. a stray sentence
  // before or after the object) -- pull out the outermost {...} span
  // instead of handing the whole string straight to JSON.parse.
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

async function callReportModel(env, userPrompt, ctx, repairNote) {
  const messages = repairNote
    ? [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: repairNote.badText },
        { role: 'user', content: repairNote.correction }
      ]
    : [{ role: 'user', content: userPrompt }];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 24000,
      thinking: { type: 'disabled' },
      system: [
        { type: 'text', text: REPORT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }
      ],
      messages
    })
  });

  if (!res.ok) throw new Error(`Claude API error: ${await res.text()}`);
  const data = await res.json();
  if (ctx) ctx.waitUntil(recordUsage(env, data.usage));
  if (data.stop_reason === 'max_tokens') {
    throw new Error('Reading was cut off before it finished (hit the max_tokens limit).');
  }
  return data.content[0].text;
}

async function generateReport(env, rtype, relLabel, p1, p2, ctx) {
  const userPrompt = buildReportUserPrompt(rtype, relLabel, p1, p2);

  const firstText = await callReportModel(env, userPrompt, ctx);
  try {
    return JSON.parse(extractJSON(firstText));
  } catch (e) {
    // The model occasionally breaks format and writes a plain-text
    // caveat instead of the JSON object, despite the non-negotiable
    // output-format rule in the system prompt. Rather than fail the
    // whole reading on that one bad turn, give it its own bad response
    // back and ask it to correct to JSON-only, once.
    const repairedText = await callReportModel(env, userPrompt, ctx, {
      badText: firstText,
      correction: 'That response was not valid JSON. Reply again with ONLY the JSON object described in OUTPUT FORMAT — no explanation, no apology, nothing else.'
    });
    return JSON.parse(extractJSON(repairedText));
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { ...CORS_HEADERS, ...PRIVACY_HEADERS } });
    }
    const url = new URL(request.url);

    // This domain (the *.workers.dev API host) is backend-only — the actual
    // site lives at know-your-energy.com. Nothing here is meant to be
    // crawled or show up in search results.
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain; charset=UTF-8" } });
    }

    // Self-test page: open /astro-check in any browser (GET works) to see
    // a sample chart and confirm the local engine is live.
    if (url.pathname === "/astro-check") {
      try {
        const sample = getAstrologyLocal("06/15/1990", "11:30", "AM", "Paris", "", "France");
        return jsonResponse({ ok: true, engine: "local", sample });
      } catch (error) {
        return jsonResponse({ ok: false, error: error.message }, 500);
      }
    }

    // Running cost dashboard: open /usage in any browser. No auth by design —
    // not customer data, just a lifetime total of Claude tokens/cost.
    if (url.pathname === "/usage") {
      const raw = await env.PASSES.get(USAGE_KV_KEY);
      const t = raw ? JSON.parse(raw) : { requests: 0, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 };
      // Claude Sonnet 5 introductory pricing (through 2026-08-31): $2/$10 per
      // million input/output tokens. Update these if pricing changes.
      const INPUT_RATE = 2 / 1_000_000;
      const OUTPUT_RATE = 10 / 1_000_000;
      const CACHE_WRITE_RATE = INPUT_RATE * 1.25;
      const CACHE_READ_RATE = INPUT_RATE * 0.1;
      const cost = t.inputTokens * INPUT_RATE + t.outputTokens * OUTPUT_RATE
        + t.cacheCreationTokens * CACHE_WRITE_RATE + t.cacheReadTokens * CACHE_READ_RATE;
      const perReading = t.requests ? cost / t.requests : 0;
      const row = (label, value) => `<tr><td>${label}</td><td>${value}</td></tr>`;
      const html = `<!doctype html><html><head><meta charset="UTF-8"><meta name="robots" content="noindex, nofollow"><title>Usage</title>
<style>body{font-family:-apple-system,sans-serif;background:#0a1530;color:#f0c94c;padding:2rem;max-width:600px;margin:0 auto;}
h1{font-size:1.2rem;} table{width:100%;border-collapse:collapse;margin-top:1rem;}
td{padding:0.4rem 0;border-bottom:1px solid rgba(240,201,76,0.2);} td:last-child{text-align:right;font-weight:700;}
.note{font-size:0.75rem;opacity:0.7;margin-top:1.5rem;}</style></head><body>
<h1>Claude API usage — running total</h1>
<table>
${row('Readings generated', t.requests)}
${row('Input tokens', t.inputTokens.toLocaleString())}
${row('Output tokens', t.outputTokens.toLocaleString())}
${row('Cache write tokens', t.cacheCreationTokens.toLocaleString())}
${row('Cache read tokens', t.cacheReadTokens.toLocaleString())}
${row('Estimated total cost', '$' + cost.toFixed(2))}
${row('Estimated cost per reading', '$' + perReading.toFixed(4))}
</table>
<p class="note">Estimate uses Claude Sonnet 5 introductory pricing ($2/$10 per million input/output tokens, through 2026-08-31) — update the rates in worker.js if pricing changes. Doesn't include Stripe fees.</p>
</body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=UTF-8", ...CORS_HEADERS } });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: { ...CORS_HEADERS, ...PRIVACY_HEADERS } });
    }

    if (url.pathname === "/create-checkout-session") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({ error: "Invalid request body." }, 400);
      }
      try {
        const origin = url.origin === "https://know-your-energy.kwdoanchor.workers.dev"
          ? "https://know-your-energy.com"
          : url.origin;
        const session = await createCheckoutSession(env, body.plan, origin, body.email);
        return jsonResponse({ url: session.url });
      } catch (error) {
        return jsonResponse({ error: error.message }, 500);
      }
    }

    if (url.pathname === "/record-pass") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({ error: "Invalid request body." }, 400);
      }
      try {
        const result = await recordPass(env, body.session_id, body.p1, body.p2);
        return jsonResponse(result);
      } catch (error) {
        return jsonResponse({ error: error.message }, 500);
      }
    }

    if (url.pathname === "/check-pass") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({ error: "Invalid request body." }, 400);
      }
      try {
        const result = await checkPassRecord(env, body.email);
        return jsonResponse(result);
      } catch (error) {
        return jsonResponse({ error: error.message }, 500);
      }
    }

    if (url.pathname !== "/report") {
      return jsonResponse({ error: "Unknown endpoint" }, 404);
    }
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({ error: "Invalid request body." }, 400);
    }
    try {
      const p1Data = await assemblePersonData(env, body.p1);
      const p2Data = body.p2 ? await assemblePersonData(env, body.p2) : null;

      let report = null, reportError = null;
      try {
        report = await generateReport(env, body.rtype, body.relLabel, p1Data, p2Data, ctx);
      } catch (error) {
        reportError = error.message;
      }

      if (body.passEmail) {
        ctx.waitUntil(refreshPassSnapshot(env, body.passEmail, body.p1, body.p2));
      }

      return jsonResponse({ p1: p1Data, p2: p2Data, report, reportError });
    } catch (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  }
};
