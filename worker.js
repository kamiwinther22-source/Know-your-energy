import { calculateFullChart } from './numerology-calculator.js';
import { computeAstrology } from './astro-engine.js';

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  // /report exposes its job ID via X-Job-Id so index.html can fall back to
  // polling /report-status by job ID if the streamed connection drops
  // mid-generation -- without this, a cross-origin fetch() can't read any
  // response header it wasn't explicitly told it may read.
  "Access-Control-Expose-Headers": "X-Job-Id"
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

  // A "fallback-default" location means cities.js matched nothing at all
  // -- not even the built-in major-city list -- and silently substituted
  // New York's coordinates. Ascendant, Midheaven, and every house cusp
  // are latitude/longitude-sensitive, so silently computing them for the
  // wrong place on Earth produces a confidently wrong chart with no sign
  // anything went wrong. A customer paying for this deserves a clear
  // "we couldn't find your city" over a wrong chart that looks correct.
  if (result.location.source === "fallback-default") {
    throw new Error(
      `Could not find "${city}" as a recognized city. Please check the spelling, or try the nearest larger city -- your chart depends on the exact birth location, so it can't be computed without a real match.`
    );
  }

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

  // No silent fallback here anymore: an un-zoned datetime string used to
  // get sent to the bodygraph API as-is, letting it assume some default
  // offset for the local time we actually gave it in a real timezone --
  // a wrong UTC moment computed with total confidence, which can flip
  // gates, Type, even Authority, with no sign anything went wrong. A
  // customer paying for this deserves a clear "couldn't resolve your
  // timezone" over a wrong chart that looks correct.
  if (!datetime) {
    throw new Error(
      `Could not resolve a timezone for "${cityName}". Human Design needs the exact UTC moment of birth, so the chart can't be safely computed without it.`
    );
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

  // first/last must be returned here -- this is the exact object that
  // gets passed into generateReport() as p1/p2, and both the real AI
  // prompt (buildReportUserPrompt) and the guaranteed fallback
  // (buildFallbackReading) read p.first directly off of it. Without
  // this, every reading -- AI-generated or fallback -- was building its
  // person-identifying text from `undefined`, not the real name. This
  // is almost certainly the actual root cause of the earlier "Partner
  // A"/"Partner B" bug: the model wasn't breaking the naming rule, it
  // never received a real name to use in the first place, and
  // improvised a placeholder because "undefined" so plainly wasn't one.
  return { first, mid, last, numerology, numerologyError, astrology, astrologyError, humanDesign, humanDesignError };
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

function jobKey(jobId) {
  return `job:${jobId}`;
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
// Individual per-request entries are kept only this long (90 days) so KV
// storage doesn't grow forever -- the lifetime totals above (and the
// per-type totals nested in them) are the permanent record; these are
// just for seeing recent activity, not historical accounting.
const USAGE_LOG_TTL_SECONDS = 90 * 24 * 60 * 60;

function bumpUsageBucket(bucket, usage) {
  bucket.requests = (bucket.requests || 0) + 1;
  bucket.inputTokens = (bucket.inputTokens || 0) + (usage.input_tokens || 0);
  bucket.outputTokens = (bucket.outputTokens || 0) + (usage.output_tokens || 0);
  bucket.cacheCreationTokens = (bucket.cacheCreationTokens || 0) + (usage.cache_creation_input_tokens || 0);
  bucket.cacheReadTokens = (bucket.cacheReadTokens || 0) + (usage.cache_read_input_tokens || 0);
}

// type is 'individual' / 'two-person' / 'hd-only' (see generateReport) --
// used to split the running totals by reading type, and tagged onto the
// per-request log entry below, so /usage can show both a per-type
// breakdown and a list of recent individual requests, not just one grand
// total with no way to tell what it was actually spent on.
async function recordUsage(env, usage, type) {
  if (!usage) return;
  const raw = await env.PASSES.get(USAGE_KV_KEY);
  const totals = raw ? JSON.parse(raw) : {
    requests: 0, inputTokens: 0, outputTokens: 0,
    cacheCreationTokens: 0, cacheReadTokens: 0, byType: {}
  };
  if (!totals.byType) totals.byType = {};
  bumpUsageBucket(totals, usage);
  if (!totals.byType[type]) totals.byType[type] = {};
  bumpUsageBucket(totals.byType[type], usage);
  await env.PASSES.put(USAGE_KV_KEY, JSON.stringify(totals));

  // Reverse-timestamp key prefix so KV's only sort order (ascending,
  // lexicographic) lists the most recent request first without having
  // to fetch and sort every entry client-side. Stays a fixed 13 digits
  // (safe until the year 2286) so lexicographic order matches numeric
  // order. Value is unused -- everything needed lives in metadata, which
  // list() returns directly, avoiding a second get() per entry.
  const logKey = `usagelog:${String(9999999999999 - Date.now()).padStart(13, '0')}:${crypto.randomUUID().slice(0, 8)}`;
  await env.PASSES.put(logKey, '1', {
    expirationTtl: USAGE_LOG_TTL_SECONDS,
    metadata: {
      time: new Date().toISOString(),
      type,
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cacheCreationTokens: usage.cache_creation_input_tokens || 0,
      cacheReadTokens: usage.cache_read_input_tokens || 0
    }
  });
}

// ─── CLAUDE REPORT GENERATION ────────────────────────────────────────────────

const REPORT_SYSTEM_PROMPT = `Check the person's current age before writing anything about love, dating, or sex. Under 18: none of it, ever.

### ROLE
You are an expert astrologer and numerologist writing for someone who wants to actually understand their chart, not language that sounds mystical or profound. Draw on your full, deep knowledge of both systems -- never a shortened or generic version. State what a person does, feels, or experiences in plain, practical language -- never a term dressed up to sound deep.

### COVERAGE
- Thorough means depth on what the data actually supports, not length for its own sake.
- Don't omit anything the data indicates due to political correctness: family relationships, intimate or sexual patterns, work, social life, education, public life, or anything else the data supports.
- Cover what's important to them, how they handle closeness, what drives them, how they experience change, and any other theme the data supports.
- Build every point around BOTH astrology and numerology together, never one system alone. If both point at the same trait, say it once, using both as evidence.
- Weight each point by how much the actual data weighs toward it, not evenly.
- Parent/child reading: name what parental actions the chart data indicates would break the bond with the child, and what approach maintains it instead.

### RELATIONAL READINGS (two-person)
Before writing, find the connection points between the two charts -- not everything technically present, only what two people would actually notice or feel between them.
- Astrology: Sun-Moon cross-aspects, Venus-Mars, Moon-Moon, any tight conjunction from one person's planet onto the other's planet, angle, or Chiron. Also check whether either person's active astrological return (see Cycles & Timing below) lands on a placement in the other person's chart.
- Numerology: using the raw data and your own full training knowledge, find the data points with the biggest relational influence and state exactly what the interaction produces in practical language -- detailed enough that nothing is left as a theme or category to interpret further.
- Connection comes first: establish what draws the two people together before covering friction or self-protection.
- A section describing friction, withdrawal, or a gap can't end there -- state what each person would actually need to feel reconnected, as an observational fact about that one person, never a formula and never advice. Don't claim the other person can meet that need unless the data supports it -- state what they're actually most likely to do instead.
- Describe the relationship itself, not each person's individual process.

### HOW TO WRITE
- Describe the person, not the chart. Every sentence is "you" (or, in a two-person reading, their first name).
- A placement, number, aspect, or shared pattern can prove a claim true -- it is never the claim itself. State what the person does, wants, or feels; the data is the reason why.
- Naming one placement or number and explaining it in the same sentence is correct. Never stack two or more of them back-to-back with nothing but punctuation between ("Sun in Scorpio, 6th house, square Mars in Leo, 9th house") -- each one belongs inside its own explained sentence.
- Use the full depth of established tradition for every placement or number. Ask what it actually means for this person, then write that answer, not the first surface-level thing that comes to mind. Most carry several distinct traits -- naming only one is incomplete.
- Depth includes chart position -- the same Karmic Debt means something different in a Life Path than in a Birthday number.
- Include faith, spirituality, or a higher power when a placement's established tradition actually includes it. Accuracy, not political correctness, is the goal.
- Fill the writing with the actual information derived from the data, not the names of the data points themselves.
- State each fact once. There's no target length -- don't pad or reword to fill space. The more directly something is stated, the more content fits.
- Never parrot this prompt's own instructions back in the reading.

### CYCLES & TIMING
- Big cycles (Personal Year, Essence, Pinnacle, Period Cycle) plus any active astrological return describe ONE life stage, not separate facts -- combine them into a single explanation of where this person stands right now. Name each cycle and its time span, then state what the combination means together (a Personal Year 1 reads differently inside a Pinnacle 3 than inside a Pinnacle 9). Give concrete examples grounded in the full chart(s): what it's likely to be experienced as, what changes on entering the next phase, and what the next big cycles will ask of them.
- Personal Month and Day are a separate, much shorter timescale -- never merge them into the life-stage picture above. Mention them only when there's something significant to say.
- Two-person: explain how each person's current cycles affect how the two of them experience each other right now.
- You're given astrology and numerology data only, no transit data. If birth time is missing, Ascendant/Midheaven/houses are missing with it -- leave them out, don't guess. Named astrological returns -- Saturn Return (~29, 58, or 87), Jupiter Return (~every 12 years), Uranus Opposition (~40-42), Chiron Return (~50) -- apply only when the person's current age is inside that window.

### ASTROLOGY DATA RULES
- Weigh a planet's major aspects before its sign -- a tight conjunction, square, or opposition outweighs the sign; a wide trine or sextile barely changes it.
- Use a planet's actual house, never the house tied to its ruling sign.
- State what an aspect actually produces in behavior, not that it's "easy" or "tense."
- You already know what every placement and aspect means -- no definitions needed here. Read the data provided and report what you see, clearly and concisely.

### NON-NEGOTIABLE
- Single reading: "you" only, never a name or third-person pronoun. Two-person: first names, every time.
- Return only a single JSON object. No markdown, no text outside it.

### OUTPUT FORMAT
{
  "headline": "One short, specific line for the whole reading. No system names, placement names, or numbers, except a numerology cycle's actual number.",
  "sections": [
    {
      "eyebrow": "Short label for this section",
      "title": "A specific title for this section",
      "body": "Prose made of separate, specific claims -- not narrated as one continuous flow. Same naming restriction as headline."
    }
  ],
  "references": ["Every placement and number actually used, short technical shorthand, one per entry."]
}
Divide the reading into as many sections as the content naturally requires -- no fixed topic list, no fixed section count. Give each section its own specific title and eyebrow.`;

// TEMPORARY, experimental: lets her see what a relational reading built
// entirely from Human Design data (no astrology, no numerology) actually
// produces, so HD's value on its own can be judged -- separate from
// whether it's redundant with what astrology/numerology already cover
// (see INCLUDE_HUMAN_DESIGN_IN_REPORT above). Remove this prompt,
// buildHDOnlyRelationalPrompt below, and the /report hdOnly branch
// together once the test is done.
const HD_ONLY_RELATIONAL_SYSTEM_PROMPT = `Check the person's current age before writing anything about love, dating, or sex. Under 18: none of it, ever.

You are an expert in Human Design. This reading is a deliberate experiment: it uses ONLY Human Design data for two people -- no astrology, no numerology -- so its value can be judged on its own. Draw on your own extensive knowledge of the Human Design system, not a shortened version of it, to explain what each person's Type, Strategy, Authority, Profile, Centers, and Gates/Channels actually mean for them individually and for how these two people affect each other.

You are given each person's full raw Human Design chart data, whatever fields the source returned. Use whatever is actually present; do not invent a field that isn't there.

For the relational content specifically: state what pulls these two people together before covering friction -- connection comes first. Look specifically for whether one person's defined Center consistently fills the other's undefined one (a distinct Human Design relational mechanism -- state what that produces for each of them, not just that it exists), any Channel completed between the two charts using one gate from each person, and how their two Types/Strategies/Authorities interact when they try to make a decision or take action together.

A relational section that describes friction or a gap between the two people can't end there -- state what each person would actually need in order to feel reconnected, as an observational fact about that one person, never as advice and never as a formula. Don't claim the other person is capable of meeting that need unless the data actually supports it.

Describe the two people, not the chart. Every sentence uses their first names. A Type, Center, Gate, or Channel can prove a claim true -- it can never be the claim itself. State what each person does, wants, or feels; the Human Design detail is the reason why, not the claim.

State each fact once. Be as direct and concise as the depth allows -- no padding, no repeating the same point reworded.

### NON-NEGOTIABLE
- First names, every time -- never a label like "Person One."
- Describe the relationship itself, not each person's individual process alone.

### OUTPUT FORMAT
Return only a single JSON object. No markdown, no text outside it:
{
  "headline": "One short, specific line for the whole reading. No system names or Human Design jargon (Type/Gate/Channel names), stated as plain fact instead.",
  "sections": [
    {
      "eyebrow": "Short label for this section",
      "title": "A specific title for this section",
      "body": "Prose made of separate, specific claims -- not narrated as one continuous flow. Same naming restriction as headline."
    }
  ],
  "references": ["Every Human Design detail actually used (Type, Authority, Profile, Center, Gate, Channel), short technical shorthand, one per entry."]
}
Divide the reading into as many sections as the content naturally requires.`;

// TEMPORARY, experimental -- see HD_ONLY_RELATIONAL_SYSTEM_PROMPT above.
// Hands over each person's full raw Human Design JSON rather than a
// hand-picked subset of fields, specifically so this test isn't limited
// by whatever fields the normal combined-reading prompt happens to
// surface (that prompt deliberately omits Gates for cost/relevance
// reasons that don't apply to this test).
function buildHDOnlyRelationalPrompt(relLabel, p1, p2) {
  const hdBlock = (p) => `${p.first}${p.last ? ' ' + p.last : ''}:\n${p.humanDesign ? JSON.stringify(p.humanDesign) : 'No Human Design chart available.'}`;
  return `Relationship type: ${relLabel}\n${hdBlock(p1)}\n${hdBlock(p2)}`;
}

// Guaranteed last resort -- no API call, so it cannot fail the way an
// AI generation can. This used to rebuild a shorter reading straight
// from Sun sign / Life Path / HD Type -- real content, but per direct
// instruction that's gone now: it looked enough like a real reading
// that people mistook it for one and stopped there instead of trying
// again, which defeated the entire point of a "backup." There's no
// honest shorter version of a real reading. This just says plainly
// what happened and sends them back to actually get the real thing.
function buildFallbackReading(rtype, p1, p2) {
  const names = rtype === 'two-person' ? `${p1.first} and ${p2.first}'s` : `${p1.first}'s`;
  return {
    headline: 'Please Try Again',
    sections: [{
      eyebrow: 'Reading',
      title: 'Please Try Again',
      body: `${names} full chart data is above, but the reading itself didn't generate this time. There's no honest shorter version of a real reading -- please run it again for the real, full reading.`
    }],
    references: []
  };
}

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
      // Period Cycles are a distinct technique from Pinnacles: each comes
      // from ONE raw piece of the birthdate on its own (month/day/year,
      // each reduced separately) rather than a blended sum of two parts,
      // and covers 3 long chapters instead of 4 -- a background current
      // running under the whole chapter, not the specific opportunity a
      // Pinnacle describes.
      `Period Cycles (3 long background chapters, each from one raw birthdate component -- distinct from Pinnacles above): 1) ${pinnacle(n.periodCycles?.period1)}  2) ${pinnacle(n.periodCycles?.period2)}  3) ${pinnacle(n.periodCycles?.period3)}`,
      `Karmic Lessons: ${n.karmicLessons?.length ? n.karmicLessons.join(', ') : 'none'}`,
      `Karmic Debt: ${n.karmicDebtNumbers?.length ? n.karmicDebtNumbers.join(', ') : 'none'}`
    ].join('\n  ');

    const planetLine = (pl) => `${pl.name} in ${pl.sign} ${pl.degreesInSign}°${pl.house ? ` (house ${pl.house})` : ''}${pl.retrograde ? ' Rx' : ''}`;
    const angle = (label, x) => x ? `${label}: ${x.sign} ${x.degreesInSign}°` : null;
    const astrologyLines = [
      a.timeUnknown ? 'Birth time not provided — Ascendant, Midheaven, and house placements are unavailable. Do not guess or invent them; cover planets by sign only.' : null,
      (a.planets || []).map(planetLine).join(', '),
      [angle('Ascendant', a.ascendant), angle('Midheaven', a.midheaven), angle('North Node', a.northNode), angle('South Node', a.southNode), angle('Chiron', a.chiron), angle('Lilith', a.lilith)].filter(Boolean).join(', '),
      a.houses?.length ? `House cusps: ${a.houses.map(h => `${h.house}:${h.sign} ${h.cuspDegrees}°`).join(', ')}` : null,
      // Sirius is deliberately excluded here (and everywhere else in the
      // app) -- removed per direct instruction, not just hidden from
      // the visible chart, so it can't surface in a generated reading either.
      `Major aspects: ${(a.aspects || []).filter(x => x.point1 !== 'Sirius' && x.point2 !== 'Sirius').map(x => `${x.point1} ${x.aspect} ${x.point2}`).join(', ') || 'none'}`
    ].filter(Boolean).join('\n  ');

    // hasHD gates the whole block on a real chart actually having come
    // back -- p.humanDesign stays null not just when time/city are
    // missing, but also when the HD API call itself failed (rate limit,
    // timeout, bad key). Previously this fell through to `|| 'unknown'`
    // and still printed a full "Human Design:" section reading "unknown
    // type, unknown profile, unknown authority" -- real-looking input
    // text the system prompt's own coverage rule never told the model
    // how to handle (that rule only anticipates missing time/city, where
    // it says to omit HD entirely). Gating on hasHD makes every no-chart
    // case -- missing time/city or a failed API call alike -- actually
    // omit the section, instead of handing the model a fake chart to
    // guess at.
    const h = p.humanDesign || {};
    // Set aside entirely for now, to test whether astrology + numerology
    // alone can produce quality, thorough readings before deciding
    // whether Human Design earns a place back in -- not a permanent
    // removal. Flip this back to `!!h.type` to restore it; nothing else
    // about the HD pipeline (fetching, assemblePersonData) changed.
    const INCLUDE_HUMAN_DESIGN_IN_REPORT = false;
    const hasHD = INCLUDE_HUMAN_DESIGN_IN_REPORT && !!h.type;
    // Gates (individual and channel-paired alike) were cut entirely --
    // real, sourced grounding data for them didn't make them worth the
    // added generation time for what they were adding to the reading.
    // Type/Authority/Profile stay: that's the "operating system" layer
    // THE METHOD already treats as load-bearing, not gate-level detail.
    const hdLines = hasHD ? [
      `${h.type} type, ${h.profile || 'unknown'} profile, ${h.authority || 'unknown'} authority`,
      h.incarnation_cross ? `Incarnation Cross: ${h.incarnation_cross}` : null
    ].filter(Boolean).join('\n  ') : null;

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
Current age: ${n.essenceCycle?.currentAge ?? 'unknown'}
Numerology:
  ${numerologyLines}
Astrology:
  ${astrologyLines}${hasHD ? `
Human Design:
  ${hdLines}` : ''}`;
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

async function callReportModel(env, userPrompt, systemPrompt = REPORT_SYSTEM_PROMPT) {
  const messages = [{ role: 'user', content: userPrompt }];

  // Nothing here previously bounded how long a single attempt could take
  // if the connection to Anthropic stalled -- no timeout on the fetch, no
  // timeout on the SSE read loop. A real live case sat on "Failed to
  // fetch" for minutes even after the browser-side keep-alive fix, which
  // only prevents the connection from LOOKING idle to an intermediary; it
  // does nothing if the upstream request to Anthropic itself never
  // completes. This aborts a stalled attempt after real silence, not a
  // fixed ceiling on the whole call -- any actual data (a thinking delta
  // included, not just text) resets the clock, so a legitimately slow
  // high-effort generation that's still actively streaming is never cut
  // short; only a connection that's gone genuinely quiet is.
  const controller = new AbortController();
  const STALL_MS = 45000;
  let stallTimer;
  const armStallTimer = () => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => controller.abort(), STALL_MS);
  };
  armStallTimer();

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      // Thinking disabled was tried and rejected: it produced noticeably
      // worse readings. Thinking enabled (adaptive) is the agreed setting.
      // Effort was tried at low to speed generation up, then reverted back
      // to medium on direct instruction: the reading quality this app has
      // shipped at is the accepted floor, not negotiable against speed --
      // any change that risks thinning it out gets reverted on sight, no
      // exceptions, without needing to spend usage confirming the loss
      // first. Effort stays the one still-open lever for a future speed
      // attempt, but only alongside real before/after quality comparison,
      // not swapped in on its own again.
      // max_tokens raised 48000 -> 72000: a two-person reading hit the
      // fallback after a prompt addition (per-item recall, thematic
      // cross-system synthesis) made a relational reading -- combining two
      // full charts, not one -- generate enough thinking + output to risk
      // hitting the old ceiling mid-generation, which fails JSON
      // validation and (before MAX_REPORT_ATTEMPTS was cut to 1) burned a
      // retry. This is headroom, not a quality knob: a generation that
      // already fit under 48000 finishes exactly the same; only one that
      // was being cut off actually changes. Sonnet 5 supports up to
      // 128000 output tokens (confirmed via the claude-api skill), so
      // this is still well under the actual ceiling.
      max_tokens: 72000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' },
      // A non-streaming call with a thinking pass hit a Cloudflare 524 --
      // the generation genuinely took longer than the edge's timeout for
      // one long silent response. Streaming keeps the
      // connection actively receiving data the whole time instead of one
      // long wait, which is the documented fix for exactly this failure
      // mode on a large max_tokens request.
      stream: true,
      system: [
        { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }
      ],
      messages
    })
  });

  armStallTimer();
  if (!res.ok) {
    clearTimeout(stallTimer);
    throw new Error(`Claude API error: ${await res.text()}`);
  }

  // Manual SSE parse -- this codebase calls the API with raw fetch
  // throughout, no SDK, so streaming means reading Anthropic's
  // documented event sequence by hand: message_start carries the
  // initial (input-side) usage, content_block_start says whether a
  // block is "thinking" or "text" so deltas can be routed correctly,
  // content_block_delta carries the actual text (and thinking, which
  // is discarded -- nothing here needs to show it), and message_delta
  // carries the final stop_reason and the real cumulative output_tokens.
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let textOut = '';
  const blockTypes = {};
  let usage = null;
  let stopReason = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    armStallTimer();
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      let evt;
      try { evt = JSON.parse(line.slice(6)); } catch (_) { continue; }
      if (evt.type === 'message_start') {
        usage = evt.message?.usage || null;
      } else if (evt.type === 'content_block_start') {
        blockTypes[evt.index] = evt.content_block?.type;
      } else if (evt.type === 'content_block_delta') {
        if (blockTypes[evt.index] === 'text' && evt.delta?.type === 'text_delta') {
          textOut += evt.delta.text;
        }
      } else if (evt.type === 'message_delta') {
        if (evt.delta?.stop_reason) stopReason = evt.delta.stop_reason;
        if (evt.usage) usage = { ...usage, ...evt.usage };
      }
    }
  }

  clearTimeout(stallTimer);
  if (stopReason === 'max_tokens') {
    const err = new Error('Reading was cut off before it finished (hit the max_tokens limit).');
    err.usage = usage;
    throw err;
  }
  if (!textOut) {
    const err = new Error('Claude API response had no text content.');
    err.usage = usage;
    throw err;
  }
  return { text: textOut, usage };
}

function countNameMentions(text, name) {
  if (!name) return 0;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\b`, 'gi');
  return (text.match(re) || []).length;
}

function flattenReadingText(reading) {
  const parts = [reading.headline];
  (reading.sections || []).forEach(s => parts.push(s.eyebrow, s.title, s.body));
  return parts.filter(Boolean).join('\n');
}

// A response that parses as valid JSON can still violate the naming
// rule (a live case used "Partner A"/"Partner B" throughout, never the
// person's first name, despite the system prompt). Don't just trust
// the prompt held -- count how many times each first name shows up
// before this ever reaches a paying customer. This no longer feeds a
// repair pass (see generateReport) -- it only decides whether this
// response gets accepted or discarded for the fallback, so what it
// returns is a diagnostic description for the log, not an instruction
// aimed at the model.
function findNamingDefect(reading, rtype, p1, p2) {
  const text = flattenReadingText(reading);
  // A separate, repeated live case: a single reading used "she"/"her"
  // throughout instead of "you", and nothing ever caught it, because
  // this whole function used to return early for anything that wasn't
  // a two-person reading -- only the two-person defect below was ever
  // actually checked. Flag it the same way: count third-person
  // pronouns against actual "you"/name usage, and require a sustained
  // pattern (not one incidental slip) before flagging it.
  if (rtype !== 'two-person') {
    const nameCount = countNameMentions(text, p1.first);
    const youCount = (text.match(/\byou(?:r|rs|self)?\b/gi) || []).length;
    const thirdPersonCount = (text.match(/\b(she|her|hers|he|him|his)\b/gi) || []).length;
    if (thirdPersonCount >= 3 && thirdPersonCount > (nameCount + youCount)) {
      return `Refers to ${p1.first} with third-person pronouns (she/her/he/him, found ${thirdPersonCount} times) instead of "you" -- a single reading must use "you" every time, never a third-person pronoun.`;
    }
    // A live case used the person's name in sustained third-person
    // narration -- "Jacob's sense of who Jacob is centers on..." --
    // instead of "you." A single reading never uses the person's name
    // at all, so any use of it (not just a majority) is a defect.
    if (nameCount >= 1) {
      return `Refers to ${p1.first} by name (found ${nameCount} times) instead of "you" (found ${youCount} times) -- a single reading must always say "you," never the person's name.`;
    }
    return null;
  }
  const minCount = Math.max(2, (reading.sections || []).length);
  const p1Count = countNameMentions(text, p1.first);
  const p2Count = countNameMentions(text, p2.first);
  if (p1Count < minCount || p2Count < minCount) {
    return `Barely used ${p1.first} and ${p2.first}'s first names (found ${p1Count} and ${p2Count} mentions across ${(reading.sections||[]).length} sections) -- every reference to either person must use their actual first name.`;
  }
  return null;
}

// A real customer reading had citations (e.g. "Sun in Scorpio, 6th
// house, square Mars in Leo, 9th house") stacked directly into the
// prose with no real sentence around them, breaking readability enough
// that they couldn't get through it. The system prompt now tells the
// model to name a placement directly AND explain it in the same
// sentence (see REPORT_SYSTEM_PROMPT) -- a single named placement
// inside a real, explained sentence is exactly what's wanted, not a
// defect. This used to flag ANY single occurrence of a sign/planet/
// number name anywhere in the prose and force a full rewrite stripping
// it out entirely, which directly fought that instruction: it made
// naming-and-explaining impossible, forcing the model into a repair
// pass that reached for vague, unnamed paraphrases instead (this is
// the confirmed mechanism behind Karmic Lesson 7 repeatedly coming
// back as bare "introspection" -- the model wasn't allowed to just say
// "Karmic Lesson 7" and explain it). What actually needs catching is
// the original problem specifically: two or more citation-style terms
// sitting back-to-back with nothing but punctuation between them --
// never a single term inside real, connected prose.
const ZODIAC_SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const CITATION_PATTERNS = [
  new RegExp(`\\b(Sun|Moon)\\s+in\\s+(${ZODIAC_SIGNS.join('|')})\\b`, 'i'),
  new RegExp(`\\b(${ZODIAC_SIGNS.join('|')})\\b`, 'i'),
  /\b(Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron|Ascendant|Midheaven|Lilith|Sirius)\b/i,
  /\b(North|South)\s+Node\b/i,
  /\bLife\s+Path\s+\d+/i, /\bExpression\s+\d+/i, /\bSoul\s+Urge\s+\d+/i, /\bPersonality\s+(number\s+)?\d+/i,
  /\bPersonal\s+(Year|Month|Day)\s+\d+/i, /\bPinnacle\s+\d+/i, /\bChallenge\s+(number\s+)?\d+/i,
  /\bKarmic\s+(Debt|Lesson)/i, /\bEssence\s+(cycle|number)/i,
  /\b\d+(st|nd|rd|th)\s+house\b/i,
];
// A gap this short between two citation-style matches means only
// punctuation/connectors fit in between (", ", " and ", " in ", " -- ")
// -- a real stacked-citation dump, not two named things each explained
// in their own sentence.
const CITATION_STACK_GAP = 12;
function findCitationLeak(reading) {
  const parts = [reading.headline];
  (reading.sections || []).forEach(s => parts.push(s.eyebrow, s.title, s.body));
  const text = parts.filter(Boolean).join('\n');
  const matches = [];
  for (const re of CITATION_PATTERNS) {
    const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = global.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    }
  }
  // Multiple patterns can match the same span -- "Sun in Scorpio" (the
  // Sun-in-Sign pattern) fully contains "Scorpio" (the bare-sign
  // pattern). Sorting by start ascending, longest-first as a tiebreak,
  // then dropping any match that starts before the last KEPT match's
  // end collapses that overlap into one citation instead of two --
  // without this, "Sun in Scorpio" alone produced a zero-width gap
  // between its own overlapping matches and false-positived as a
  // "stack" on literally the most common sentence shape in a reading,
  // which is what was silently failing every real attempt and forcing
  // the guaranteed fallback to run instead.
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const spans = [];
  for (const m of matches) {
    const last = spans[spans.length - 1];
    if (!last || m.start >= last.end) spans.push(m);
  }
  for (let i = 1; i < spans.length; i++) {
    const gapText = text.slice(spans[i - 1].end, spans[i].start);
    if (gapText.length <= CITATION_STACK_GAP && /^[\s,;.\-–—]*(and|in|with|of)?[\s,;.\-–—]*$/i.test(gapText)) {
      return `Stacks citations directly into the prose with no sentence around them ("${spans[i - 1].text}${gapText}${spans[i].text}") -- naming ONE placement or number and explaining it in the same sentence is fine, but two or more stacked back-to-back with nothing connecting them is not.`;
    }
  }
  return null;
}

// Runs one Claude call and returns its parsed reading plus token usage
// together -- usage travels with both the success and failure paths (see
// the err.usage assignment below) so a caller can still record real spent
// tokens even when generation ultimately fails.
async function generateSingleCallReading(env, userPrompt, systemPrompt) {
  const { text, usage } = await callReportModel(env, userPrompt, systemPrompt);
  let parsed;
  try {
    parsed = JSON.parse(extractJSON(text));
  } catch (e) {
    const err = new Error('Claude API response was not valid JSON.');
    err.usage = usage;
    throw err;
  }
  return { parsed, usage };
}

// One shot only -- no repair pass. The old version retried up to 3
// times, sending a failed response back to the model with a note on
// what was wrong so it could fix it; that's gone. The prompt is what's
// responsible for getting this right the first time, not a rewrite
// cycle catching what it missed. findNamingDefect/findCitationLeak
// below still run, but only to decide accept-or-discard -- a defect
// no longer goes back to the model, it goes straight to the honest
// "please try again" fallback instead.
//
// hdOnly is a TEMPORARY, experimental flag -- see
// HD_ONLY_RELATIONAL_SYSTEM_PROMPT above. Remove the parameter and the
// branches below once the test is done.
//
// A two-person reading was briefly split into three concurrent Claude
// calls (each person's individual profile plus a separate relational
// pass) to cut generation time -- reverted on direct instruction: reading
// quality is the accepted floor, not negotiable against speed, and the
// split risked real overlap between an individual section and the
// relational one that a single unified call doesn't have. Back to one
// call for every reading type, same as it's always been.
async function generateReport(env, rtype, relLabel, p1, p2, ctx, hdOnly) {
  const usageType = hdOnly ? 'hd-only' : (rtype === 'two-person' ? 'two-person' : 'individual');

  let result;
  try {
    if (hdOnly) {
      result = await generateSingleCallReading(env, buildHDOnlyRelationalPrompt(relLabel, p1, p2), HD_ONLY_RELATIONAL_SYSTEM_PROMPT);
    } else {
      result = await generateSingleCallReading(env, buildReportUserPrompt(rtype, relLabel, p1, p2), REPORT_SYSTEM_PROMPT);
    }
  } catch (error) {
    // A stalled connection or a Claude API error used to propagate
    // straight out of this function, skipping the guaranteed fallback
    // below -- a customer saw a raw API error string instead of ever
    // reaching the "this literally cannot fail" fallback the comment
    // below already promised. Treat it the same as any other failure.
    console.error(`Report generation failed: ${error.message}`);
    if (ctx && error.usage) ctx.waitUntil(recordUsage(env, error.usage, usageType));
    return { reading: buildFallbackReading(rtype, p1, p2), usedFallback: true };
  }

  if (ctx) ctx.waitUntil(recordUsage(env, result.usage, usageType));

  const defect = findNamingDefect(result.parsed, rtype, p1, p2) || findCitationLeak(result.parsed);
  if (!defect) return { reading: result.parsed, usedFallback: false };
  console.error(`Report generation defect, using deterministic fallback: ${defect}`);
  // A customer still always gets a reading (this literally cannot fail
  // the way an AI generation can), but usedFallback travels with it so
  // the frontend can show a visible notice instead of a customer having
  // to notice on their own that this wasn't the real, personalized one.
  return { reading: buildFallbackReading(rtype, p1, p2), usedFallback: true };
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
      const t = raw ? JSON.parse(raw) : { requests: 0, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, byType: {} };
      if (!t.byType) t.byType = {};
      // Claude Sonnet 5 pricing: $2/$10 per million input/output tokens.
      // Originally introductory through 2026-08-31 with a planned increase
      // to $3/$15 on 2026-09-01 -- Anthropic made $2/$10 permanent instead
      // (announced 2026-08-10), so that increase isn't happening. Update
      // these rates if that ever changes again.
      const INPUT_RATE = 2 / 1_000_000;
      const OUTPUT_RATE = 10 / 1_000_000;
      const CACHE_WRITE_RATE = INPUT_RATE * 1.25;
      const CACHE_READ_RATE = INPUT_RATE * 0.1;
      const costOf = (b) => (b.inputTokens || 0) * INPUT_RATE + (b.outputTokens || 0) * OUTPUT_RATE
        + (b.cacheCreationTokens || 0) * CACHE_WRITE_RATE + (b.cacheReadTokens || 0) * CACHE_READ_RATE;
      const cost = costOf(t);
      const perReading = t.requests ? cost / t.requests : 0;
      const row = (label, value) => `<tr><td>${label}</td><td>${value}</td></tr>`;

      const typeLabel = { individual: 'Individual', 'two-person': 'Relational', 'hd-only': 'HD-only test' };
      const typeRows = Object.entries(t.byType).map(([type, b]) => {
        const c = costOf(b);
        return row(typeLabel[type] || type, `${b.requests} readings · $${c.toFixed(2)} · $${(b.requests ? c / b.requests : 0).toFixed(4)}/reading`);
      }).join('') || `<tr><td colspan="2">No readings recorded yet.</td></tr>`;

      // Most-recent-first, up to 20 -- see recordUsage's reverse-timestamp
      // key comment for why list() alone (no per-entry get()) is enough.
      const recentList = await env.PASSES.list({ prefix: 'usagelog:', limit: 20 });
      const recentRows = recentList.keys.map(k => {
        const m = k.metadata || {};
        const c = costOf(m);
        return row(`${(m.time || '').replace('T', ' ').slice(0, 16)} · ${typeLabel[m.type] || m.type || 'unknown'}`,
          `${(m.inputTokens || 0).toLocaleString()} in / ${(m.outputTokens || 0).toLocaleString()} out · $${c.toFixed(4)}`);
      }).join('') || `<tr><td colspan="2">No recent requests logged.</td></tr>`;

      const html = `<!doctype html><html><head><meta charset="UTF-8"><meta name="robots" content="noindex, nofollow"><title>Usage</title>
<style>body{font-family:-apple-system,sans-serif;background:#0a1530;color:#f0c94c;padding:2rem;max-width:600px;margin:0 auto;}
h1{font-size:1.2rem;} h2{font-size:1rem;margin-top:2rem;} table{width:100%;border-collapse:collapse;margin-top:1rem;}
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
<h2>By reading type</h2>
<table>${typeRows}</table>
<h2>Recent requests (last 20, kept 90 days)</h2>
<table>${recentRows}</table>
<p class="note">Estimate uses Claude Sonnet 5 pricing ($2/$10 per million input/output tokens — made permanent 2026-08-10, not an introductory rate) — update the rates in worker.js if pricing changes. Doesn't include Stripe fees. Output tokens include thinking -- Claude's API doesn't report thinking and final text as separate numbers.</p>
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

    // Astrology/numerology are local and fast; Human Design is one quick
    // network call per person. None of that needs to wait on the AI
    // report call, which is the genuinely slow part -- this lets the
    // frontend show the chart cards immediately and only show a loading
    // state for the Reading panel while /report runs separately.
    if (url.pathname === "/chart-data") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({ error: "Invalid request body." }, 400);
      }
      const [p1Data, p2Data] = await Promise.all([
        assemblePersonData(env, body.p1),
        body.p2 ? assemblePersonData(env, body.p2) : Promise.resolve(null)
      ]);
      return jsonResponse({ p1: p1Data, p2: p2Data });
    }

    if (url.pathname === "/report-status") {
      let statusBody;
      try {
        statusBody = await request.json();
      } catch (e) {
        return jsonResponse({ error: "Invalid request body." }, 400);
      }
      if (!statusBody.jobId) {
        return jsonResponse({ error: "Missing jobId." }, 400);
      }
      const raw = await env.PASSES.get(jobKey(statusBody.jobId));
      if (!raw) {
        // Either a bad jobId, or the 1-hour TTL on the job record expired --
        // both look the same to the caller, and both mean "nothing to show."
        return jsonResponse({ error: "Job not found or expired. Please try again." }, 404);
      }
      return jsonResponse(JSON.parse(raw));
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

    // Real, confirmed root cause of live "Failed to fetch" reports (per
    // Cloudflare's own Workers Logs -- a "waitUntil() tasks did not
    // complete within the allowed time after invocation end and have been
    // cancelled" warning, not a guess): the entire chart lookup + AI
    // generation was tied to ONE HTTP connection staying open the whole
    // time. If the client's connection actually drops (a phone losing
    // signal, the screen locking, a carrier's NAT closing an idle-feeling
    // connection), Cloudflare gives ctx.waitUntil() only 30 more seconds
    // to finish -- confirmed against Cloudflare's own docs, not disputed:
    // "ctx.waitUntil() can extend execution for up to 30 seconds after the
    // response is sent or the client disconnects... If any Promises have
    // not settled after 30 seconds, they are canceled." That 30-second cap
    // applies no matter how the work is organized -- it is NOT specific to
    // the streaming-connection approach.
    //
    // A prior version of this endpoint tried to route around that by
    // returning a job ID immediately and doing all the real work only
    // inside ctx.waitUntil(). That made things categorically worse: since
    // the tiny {jobId} response finishes sending almost instantly, EVERY
    // report -- not just ones with a dropped connection -- hit the same
    // 30-second cutoff, because generation routinely takes far longer than
    // that. There is no way to make work in ctx.waitUntil() survive a
    // disconnect for longer than 30 seconds; genuinely surviving an
    // arbitrary-length disconnect needs infrastructure outside a single
    // request's lifecycle entirely (Durable Objects, Queues, or
    // Workflows) -- not implemented here.
    //
    // What this endpoint actually does instead, combining what worked
    // before with a real recovery path for the disconnect case: keep this
    // connection open with whitespace keep-alive bytes for the whole
    // generation (proven to work as long as the connection survives --
    // that was never the broken part), AND durably record the same result
    // to KV under a job ID as it becomes available. If this connection
    // does drop, index.html falls back to polling /report-status with
    // that job ID -- recovering the reading whenever the drop happens
    // late enough that the background write below still lands inside its
    // own 30-second grace window, instead of losing it outright as before
    // today's job/polling attempt existed.
    const jobId = crypto.randomUUID();
    await env.PASSES.put(jobKey(jobId), JSON.stringify({ status: "pending" }), { expirationTtl: 3600 });

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const heartbeat = setInterval(() => {
      writer.write(encoder.encode(" ")).catch(() => {});
    }, 10000);

    const reportStart = Date.now();
    console.log(`[report] start rtype=${body.rtype} jobId=${jobId}`);
    ctx.waitUntil((async () => {
      let streamBody, kvRecord;
      try {
        // The frontend calls /chart-data first now (see index.html's
        // generate()) and sends that result back as p1Data/p2Data, so
        // this doesn't recompute it -- a second Human Design network
        // call per person for no reason. Falls back to computing it
        // here from raw p1/p2 birth fields if p1Data wasn't sent, so
        // this endpoint still works called on its own. p1 and p2 are
        // fetched concurrently, not one after the other, when this
        // fallback path does run -- they're independent, and
        // assemblePersonData never throws (every step has its own
        // try/catch, always returns an object with error fields on
        // failure), so this is safe.
        const [p1Data, p2Data] = body.p1Data
          ? [body.p1Data, body.p2Data || null]
          : await Promise.all([
              assemblePersonData(env, body.p1),
              body.p2 ? assemblePersonData(env, body.p2) : Promise.resolve(null)
            ]);
        console.log(`[report] person data assembled at +${Date.now() - reportStart}ms jobId=${jobId}`);

        let report = null, reportError = null, reportUsedFallback = false;
        // body.hdOnly is a TEMPORARY, experimental flag -- see
        // HD_ONLY_RELATIONAL_SYSTEM_PROMPT above. Only meaningful for a
        // real two-person reading where both people actually have a
        // Human Design chart; otherwise there's nothing for this mode to
        // work with, so fail clearly instead of generating an empty or
        // one-sided "relational" reading.
        if (body.hdOnly && (body.rtype !== 'two-person' || !p1Data.humanDesign || !p2Data?.humanDesign)) {
          reportError = 'HD-only test mode needs a two-person reading with both people\'s Human Design charts available (birth time and city required for both).';
        } else {
          try {
            const result = await generateReport(env, body.rtype, body.relLabel, p1Data, p2Data, ctx, body.hdOnly);
            report = result.reading;
            reportUsedFallback = result.usedFallback;
            console.log(`[report] generation done at +${Date.now() - reportStart}ms usedFallback=${result.usedFallback} jobId=${jobId}`);
          } catch (error) {
            reportError = error.message;
            console.error(`[report] generation threw at +${Date.now() - reportStart}ms jobId=${jobId}: ${error.message}`);
          }
        }

        if (body.passEmail) {
          ctx.waitUntil(refreshPassSnapshot(env, body.passEmail, body.p1, body.p2));
        }

        const payload = { p1: p1Data, p2: p2Data, report, reportError, reportUsedFallback };
        streamBody = JSON.stringify(payload);
        kvRecord = { status: "done", ...payload };
      } catch (error) {
        console.error(`[report] top-level throw at +${Date.now() - reportStart}ms jobId=${jobId}: ${error.message}`);
        streamBody = JSON.stringify({ error: error.message });
        kvRecord = { status: "error", error: error.message };
      }
      clearInterval(heartbeat);
      // Write the durable KV copy first -- this is what /report-status
      // reads, and it's what makes the fallback poll path work even if
      // the write to this connection's own stream (right below) fails
      // because the client already disconnected.
      await env.PASSES.put(jobKey(jobId), JSON.stringify(kvRecord), { expirationTtl: 3600 });
      console.log(`[report] job record written at +${Date.now() - reportStart}ms jobId=${jobId}`);
      try {
        await writer.write(encoder.encode(streamBody));
        await writer.close();
      } catch (e) {
        console.error(`[report] writer failed at +${Date.now() - reportStart}ms (client likely disconnected, but KV record above is already saved): ${e.message}`);
      }
    })());

    return new Response(readable, {
      headers: {
        "Content-Type": "application/json",
        "X-Job-Id": jobId,
        ...CORS_HEADERS,
        ...PRIVACY_HEADERS
      }
    });
  }
};
