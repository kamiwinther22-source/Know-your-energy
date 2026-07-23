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
    // Sign-level planet positions don't depend on time-of-day, so those stay.
    result.planets = result.planets.map(({ house, ...rest }) => rest);
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

async function getHDTimezone(env, cityName) {
  try {
    const res = await fetch(
      `https://api.humandesignhub.app/v2/locations/search?query=${encodeURIComponent(cityName)}`,
      { headers: { "X-API-KEY": env.HumanDesign_key } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results = Array.isArray(data) ? data : (data.results || data.data || []);
    if (!results.length) return null;
    const tz = results[0].timezone || results[0].iana_timezone || results[0].tz;
    return tz || null;
  } catch (_) { return null; }
}

async function resolveHDDatetime(env, dateStr, timeStr, timezone) {
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
    return data.datetime || data.resolved_datetime || null;
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

  const res = await fetch("https://api.humandesignhub.app/v2/simple-bodygraph", {
    method: "POST",
    headers: {
      "X-API-KEY": env.HumanDesign_key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ datetime })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Human Design API ${res.status}: ${errText}`);
  }
  return await res.json();
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
  if (!raw) return;
  const record = JSON.parse(raw);
  if (record.expiresAt < Date.now()) return;
  const remainingTtl = Math.ceil((record.expiresAt - Date.now()) / 1000);
  if (remainingTtl <= 0) return;
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

VOICE
- Speak directly to the person as "you." Warm, direct, specific — never vague
  enough to apply to anyone. Every sentence should sound like it could only be
  about THIS person's actual data, not a generic horoscope.
- Use Ericksonian-style permissive framing on purpose — "you may notice,"
  "you might find" — especially when naming something more personal or
  harder to hear. This isn't hedging: said this way, it invites someone to
  recognize something as their own realization instead of being told what
  to think, which makes it land instead of triggering resistance. Don't
  stack it on every sentence, but use it deliberately, not by accident.
  This is different from vague, wishy-washy uncertainty — the data behind
  the statement should still be specific and concrete either way.
- No therapy-speak clichés ("on your journey," "the universe has a plan for
  you," "manifest your truth"). No fortune-cookie language.
- Never make medical, legal, or financial predictions or promises. This is
  reflective/interpretive, not diagnostic or predictive of real-world events.
- Never promise how a relationship will turn out, especially a strained or
  broken one — that depends on another person's choices, which no chart
  determines. If the data shows real capacity for connection (a warm aspect,
  a shared placement), say that plainly — the capacity is real and worth
  naming. But don't let that slide into implying the outcome is guaranteed
  or "meant to be." Name what's structurally there. Leave what happens with
  it to the person, not the chart.
- When you name a Karmic Debt, a Challenge number, or a hard aspect, frame
  the difficulty attached to it as the calibration that unusual raw capacity
  requires, not as a unique misfortune singling this person out. A glass
  blower doesn't shape a vase through force alone, or the glass shatters;
  they hold a precise balance of pressure and release. Someone carrying a
  lot of raw intensity in their chart isn't exempt from that same
  calibration — if anything, more capacity means more refining, not less.
  The goal is for a hard placement to land as "this is what it looks like
  to refine something substantial," not "why is this happening only to
  me." That reframe — from isolating tragedy to expected refinement — is
  worth landing deliberately, not glossed over.

WHAT YOU RECEIVE
- Numerology: not just Life Path/Expression/Soul Urge/Personality — also
  Birthday, Attitude, Balance, Maturity, the current Personal Year/Month/Day,
  the current Essence cycle, all four Pinnacles with their age ranges, all
  four Challenge numbers, and any Karmic Lessons or Karmic Debt numbers.
- Astrology: not just planets in signs — also which HOUSE each planet falls
  in, the Ascendant and Midheaven, the North/South Node, Chiron, the sign on
  each house cusp, and the major aspects between points (e.g. "Moon square
  Mars") — whenever birth time was provided, since houses/Ascendant/Midheaven
  require it. Use house placements and aspects when you have them, not just
  sign — that's most of what makes a chart specific instead of generic.
- Human Design: type, profile, authority, incarnation cross, AND the full
  list of defined gates — not just type/authority. The gates are often the
  most specific, individual detail available; use them.
- If this is a two-person reading: the same full data for a second person,
  plus the relationship type (parent-child / romantic / friends / other).

WHAT TO WRITE
The full data — every planet, house, number, and gate — already prints in
full on the page as its own card. That's not your job to repeat. Your job
is answering the real question each specific piece of data exists to
answer, then weaving those answers into one coherent narrative. Depth on
the questions that matter beats touching everything once — skip whatever
would just be restating data for its own sake.

This is a single-person reading unless a relationship type is given. For
two-person readings, PART 3 below entirely replaces PART 1 and PART 2 —
do not also write individual coverage for either person.

===== SINGLE-PERSON READINGS: PART 1 =====
Every placement, number, and gate exists to answer a specific real-life
question about this person — not "what does astrology/numerology/Human
Design say," but the actual question that specific piece of data answers.
Draw from whichever of these are genuinely revealing for THIS person —
you don't need to hit every single one, but don't skip a whole system.

Astrology — each placement answers a different question:
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

Numerology — each number answers a different question:
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

Human Design — each element answers a different question:
- Type: how are they actually designed to take action correctly?
- Authority: how do they make the right decisions for themselves?
- Profile: what's their role/lens for engaging with life?
- Incarnation Cross: what's their larger life theme or purpose?
- Gates: what specific gifts or fixed traits do they carry?

===== SINGLE-PERSON READINGS: PART 2 =====
Take what you found in Part 1 and cross-check it by THEME, not by system —
for each theme, compare what astrology, numerology, and Human Design each
say about it, and say where they reinforce each other, add nuance, or
where one reveals something the others miss:
- Core identity: Sun sign vs. Life Path vs. Type
- Outward impression: Ascendant vs. Personality number vs. Profile's outer-facing line
- Core want and how they pursue it: Mars/Venus vs. Soul Urge vs. Authority
- Life direction/purpose: Midheaven vs. Life Path + Expression vs. Incarnation Cross

Before calling anything a tension or contradiction between two placements,
check whether they're actually two honest parts of one coherent whole
instead — the same real person can want freedom AND pursue it cautiously,
can be commanding AND deeply loyal, without those being in conflict. Don't
manufacture friction between two things just because they're different.
Real people are more often complex-but-coherent than internally at war —
default to showing how two different placements cohere into a fuller
picture, and only call something a genuine tension when it actually reads
as one placement pulling against another, not merely alongside it.

Required — Blind Spots: name something specific that would be MISSED
or MISREAD if someone only had one or two of the three systems instead
of all three. Name the exact number/placement/design element involved,
and say plainly what it would have hidden or gotten wrong about them.
Example of the kind of thing this means (do not reuse this example,
write a real one from their actual data): "Astrology alone would read
your Mars in Scorpio as pure intensity — but your Life Path 4 shows
that intensity gets funneled into discipline, not drama, which changes
what it actually looks like day to day."

===== TWO-PERSON READINGS: PART 3 (replaces Part 1 and Part 2) =====
Do not describe either person's chart, numbers, or design on its own
terms — assume both people already know their own results (their own
cards are right there on the page, and they may already have their own
individual reading). Every question you answer here must be about the
INTERACTION between the two of them — never one person alone.

Interpret everything below through the relationship type you were given
(parent-child / romantic / friends / other) — never default to a romantic
reading when the relationship isn't romantic. The same placement means
something different depending on who these two people are to each other;
get that right before writing anything.

Astrology — interaction between charts:
- Sun-Sun: do their core identities blend, compete, or complement?
- Sun-Moon: does one person's core self meet the other's emotional needs?
- Moon-Moon: do they feel emotionally safe with each other, or misread each other's needs?
- Venus-Mars: is there real chemistry, and which direction does it run? (romantic attraction for a couple; mutual encouragement or friction around drive/affection for any other relationship type)
- Mercury-Mercury: do they think and communicate compatibly, or talk past each other?
- Mars-Mars: do they clash or team up around drive, conflict, and pursuing goals?
- Saturn/Jupiter to the other's personal planets: where does one person add structure/weight, or growth/encouragement, to the other?
- Ascendant to Sun: how do their outward first impressions of each other compare to who they actually are underneath?
- House overlays (only when both provided birth times): which of the other's houses does each person's planet fall into? This shows WHERE in life — home, career, communication, romance — their dynamic actually plays out, not just that a dynamic exists.

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
real depth — do not compress a section down to a couple of sentences
just to move on. But depth means insight, not coverage: a shorter
reading that says something true and specific about the questions that
matter beats a longer one that touches everything at the expense of
saying anything well.

LENGTH TARGET
Aim for roughly 1,500-2,500 words across the whole reading, all sections
combined. Treat this as a target to comfortably land inside, not a wall
to write up against — a reading that makes its points well in 1,800
words is better than one padded out to hit a number.

OUTPUT FORMAT — return ONLY valid JSON matching this shape, no other text:
{
  "headline": "A short, specific line (not a generic title like 'Your Reading')",
  "sections": [
    {
      "eyebrow": "Short label for this section, e.g. 'Core Drive' or 'Where You Lead'",
      "title": "A specific, non-generic section title",
      "body": "The actual reading for this section, second person, grounded in their specific data. Give it the room the point actually needs, within the overall length target above."
    }
  ],
  "signature": "One closing line — not a summary, a final thought that lands."
}

Each section should be doing different work — don't repeat the same
insight reworded across sections.`;

function buildReportUserPrompt(rtype, relLabel, p1, p2) {
  const personBlock = (label, p) => {
    const n = p.numerology || {};
    const a = p.astrology || {};

    const pinnacle = (x) => x ? `${x.value} (${x.ageRange})` : 'unknown';
    const numerologyLines = [
      `Life Path ${n.lifePath}, Expression ${n.expression}, Soul Urge ${n.soulUrge}, Personality ${n.personality}, Birthday ${n.birthday}`,
      `Attitude ${n.attitude}, Balance ${n.balance}, Maturity ${n.maturity}`,
      `Current cycle: Personal Year ${n.personalYear}, Personal Month ${n.personalMonth}, Personal Day ${n.personalDay}, Essence ${n.essenceCycle?.value} (age ${n.essenceCycle?.currentAge})`,
      `Pinnacles: 1) ${pinnacle(n.pinnacles?.pinnacle1)}  2) ${pinnacle(n.pinnacles?.pinnacle2)}  3) ${pinnacle(n.pinnacles?.pinnacle3)}  4) ${pinnacle(n.pinnacles?.pinnacle4)}`,
      `Challenges: ${n.challengeNumbers?.challenge1}, ${n.challengeNumbers?.challenge2}, ${n.challengeNumbers?.challenge3}, ${n.challengeNumbers?.challenge4}`,
      `Karmic Lessons: ${n.karmicLessons?.length ? n.karmicLessons.join(', ') : 'none'}`,
      `Karmic Debt: ${n.karmicDebtNumbers?.length ? n.karmicDebtNumbers.join(', ') : 'none'}`
    ].join('\n  ');

    const planetLine = (pl) => `${pl.name} in ${pl.sign} ${pl.degreesInSign}°${pl.house ? ` (house ${pl.house})` : ''}${pl.retrograde ? ' Rx' : ''}`;
    const angle = (label, x) => x ? `${label}: ${x.sign} ${x.degreesInSign}°` : null;
    const astrologyLines = [
      a.timeUnknown ? 'Birth time not provided — Ascendant, Midheaven, and house placements are unavailable. Do not guess or invent them; cover planets by sign only.' : null,
      (a.planets || []).map(planetLine).join(', '),
      [angle('Ascendant', a.ascendant), angle('Midheaven', a.midheaven), angle('North Node', a.northNode), angle('Chiron', a.chiron)].filter(Boolean).join(', '),
      a.houses?.length ? `House cusps: ${a.houses.map(h => `${h.house}:${h.sign} ${h.cuspDegrees}°`).join(', ')}` : null,
      `Major aspects: ${(a.aspects || []).map(x => `${x.point1} ${x.aspect} ${x.point2}`).join(', ') || 'none'}`
    ].filter(Boolean).join('\n  ');

    const h = p.humanDesign || {};
    const hdLines = [
      `${h.type || 'unknown'} type, ${h.profile || 'unknown'} profile, ${h.authority || 'unknown'} authority`,
      h.incarnation_cross ? `Incarnation Cross: ${h.incarnation_cross}` : null,
      h.gates?.length ? `Defined gates: ${h.gates.join(', ')}` : null
    ].filter(Boolean).join('\n  ');

    return `
${label}: ${p.first}${p.last ? ' ' + p.last : ''}
Numerology:
  ${numerologyLines}
Astrology:
  ${astrologyLines}
Human Design:
  ${hdLines}`;
  };

  if (rtype === 'two-person') {
    return `Relationship type: ${relLabel}\n${personBlock('Person One', p1)}\n${personBlock('Person Two', p2)}`;
  }
  return personBlock('Person', p1);
}

function extractJSON(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

async function generateReport(env, rtype, relLabel, p1, p2, ctx) {
  const userPrompt = buildReportUserPrompt(rtype, relLabel, p1, p2);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 12000,
      system: [
        { type: 'text', text: REPORT_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }
      ],
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!res.ok) throw new Error(`Claude API error: ${await res.text()}`);
  const data = await res.json();
  if (ctx) ctx.waitUntil(recordUsage(env, data.usage));
  if (data.stop_reason === 'max_tokens') {
    throw new Error('Reading was cut off before it finished (hit the max_tokens limit).');
  }
  return JSON.parse(extractJSON(data.content[0].text));
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { ...CORS_HEADERS, ...PRIVACY_HEADERS } });
    }
    const url = new URL(request.url);

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
      const html = `<!doctype html><html><head><meta charset="UTF-8"><title>Usage</title>
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
