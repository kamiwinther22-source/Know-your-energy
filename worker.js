import { calculateFullChart } from "./numerology-calculator.js";

import { computeAstrology } from "./astro-engine.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Expose-Headers": "X-Job-Id"
};

const PRIVACY_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...PRIVACY_HEADERS
    }
  });
}

const pad = n => String(n).padStart(2, "0");

function toCountryCode(country) {
  if (!country) return "US";
  const lower = country.toLowerCase().trim();
  if (lower.length === 2) return lower.toUpperCase();
  const map = {
    "united states": "US",
    usa: "US",
    "u.s.": "US",
    "u.s.a.": "US",
    "united kingdom": "GB",
    uk: "GB",
    england: "GB",
    britain: "GB",
    scotland: "GB",
    wales: "GB",
    canada: "CA",
    australia: "AU",
    "new zealand": "NZ",
    ireland: "IE",
    germany: "DE",
    france: "FR",
    spain: "ES",
    italy: "IT",
    portugal: "PT",
    netherlands: "NL",
    belgium: "BE",
    switzerland: "CH",
    austria: "AT",
    sweden: "SE",
    norway: "NO",
    denmark: "DK",
    finland: "FI",
    poland: "PL",
    russia: "RU",
    ukraine: "UA",
    greece: "GR",
    turkey: "TR",
    israel: "IL",
    "saudi arabia": "SA",
    uae: "AE",
    "united arab emirates": "AE",
    "south africa": "ZA",
    nigeria: "NG",
    kenya: "KE",
    egypt: "EG",
    ghana: "GH",
    india: "IN",
    pakistan: "PK",
    bangladesh: "BD",
    "sri lanka": "LK",
    nepal: "NP",
    china: "CN",
    japan: "JP",
    "south korea": "KR",
    korea: "KR",
    taiwan: "TW",
    thailand: "TH",
    vietnam: "VN",
    indonesia: "ID",
    philippines: "PH",
    malaysia: "MY",
    singapore: "SG",
    "hong kong": "HK",
    brazil: "BR",
    argentina: "AR",
    colombia: "CO",
    chile: "CL",
    peru: "PE",
    mexico: "MX",
    cuba: "CU",
    jamaica: "JM",
    "dominican republic": "DO",
    morocco: "MA",
    algeria: "DZ",
    tunisia: "TN",
    iraq: "IQ",
    iran: "IR",
    afghanistan: "AF",
    kazakhstan: "KZ"
  };
  return map[lower] || "US";
}

function normalizeDOB(dob) {
  if (!dob) throw new Error("Date of birth is required.");
  const str = dob.trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
    const [year, month, day] = str.split("-").map(Number);
    return {
      year: year,
      month: month,
      day: day
    };
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [month, day, year] = str.split("/").map(Number);
    return {
      year: year,
      month: month,
      day: day
    };
  }
  throw new Error(`Unrecognized date format: "${dob}". Use MM/DD/YYYY or YYYY-MM-DD.`);
}

function dobToMMDDYYYY(dob) {
  const {year: year, month: month, day: day} = normalizeDOB(dob);
  return `${pad(month)}/${pad(day)}/${year}`;
}

function normalizeTime(timeStr, ampm) {
  if (!timeStr || !timeStr.trim()) return {
    hour: 12,
    minute: 0
  };
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
  if (ap === "AM") {
    if (hour === 12) hour = 0;
  } else if (ap === "PM") {
    if (hour !== 12) hour += 12;
  }
  return {
    hour: hour,
    minute: minute
  };
}

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

function getAstrologyLocal(dob, timeStr, ampm, city, state, country) {
  const {year: year, month: month, day: day} = normalizeDOB(dob);
  const hasRealTime = !!(timeStr && timeStr.trim());
  const hasRealCity = !!(city && city.trim());
  const {hour: hour, minute: minute} = normalizeTime(timeStr, ampm);
  const {cityName: cityName, countryCode: countryCode} = normalizeCity(city, state, country);
  const result = computeAstrology({
    year: year,
    month: month,
    day: day,
    hour: hour,
    minute: minute,
    cityName: cityName,
    countryCode: countryCode,
    state: state || ""
  });
  if (result.location.source === "fallback-default" && hasRealCity) {
    throw new Error(`Could not find "${city}" as a recognized city. Please check the spelling, or try the nearest larger city -- your chart depends on the exact birth location, so it can't be computed without a real match.`);
  }
  const hasRealLocation = hasRealCity && result.location.source !== "fallback-default";
  if (!hasRealTime || !hasRealLocation) {
    const dayStart = computeAstrology({
      year: year,
      month: month,
      day: day,
      hour: 0,
      minute: 0,
      cityName: cityName,
      countryCode: countryCode,
      state: state || "",
      skipAspects: true
    });
    const dayEnd = computeAstrology({
      year: year,
      month: month,
      day: day,
      hour: 23,
      minute: 59,
      cityName: cityName,
      countryCode: countryCode,
      state: state || "",
      skipAspects: true
    });
    const byName = list => Object.fromEntries((list || []).filter(b => b?.name).map(b => [ b.name, b ]));
    const startPlanets = byName(dayStart.planets);
    const endPlanets = byName(dayEnd.planets);
    const flagIfAmbiguous = (body, startBody, endBody) => {
      if (!body || !startBody || !endBody) return body;
      if (startBody.sign !== endBody.sign) {
        return {
          ...body,
          sign: startBody.sign,
          signUncertain: true,
          signAlt: endBody.sign
        };
      }
      return body;
    };
    const stripHouse = b => b ? (({house: house, ...rest}) => rest)(b) : b;
    result.planets = result.planets.map(p => stripHouse(flagIfAmbiguous(p, startPlanets[p.name], endPlanets[p.name])));
    result.northNode = stripHouse(flagIfAmbiguous(result.northNode, dayStart.northNode, dayEnd.northNode));
    result.southNode = stripHouse(flagIfAmbiguous(result.southNode, dayStart.southNode, dayEnd.southNode));
    result.chiron = stripHouse(flagIfAmbiguous(result.chiron, dayStart.chiron, dayEnd.chiron));
    result.lilith = stripHouse(flagIfAmbiguous(result.lilith, dayStart.lilith, dayEnd.lilith));
    result.ascendant = null;
    result.midheaven = null;
    result.houses = [];
    result.aspects = result.aspects.filter(a => a.point1 !== "Ascendant" && a.point2 !== "Ascendant" && a.point1 !== "Midheaven" && a.point2 !== "Midheaven");
    result.timeUnknown = !hasRealTime;
    result.locationUnknown = !hasRealLocation;
  }
  return result;
}

async function getHDTimezone(env, cityName) {
  const cacheKey = `hdtz:${cityName.toLowerCase().trim()}`;
  const cached = await env.PASSES.get(cacheKey);
  if (cached !== null) return cached === "" ? null : cached;
  try {
    const res = await fetch(`https://api.humandesignhub.app/v2/locations/search?query=${encodeURIComponent(cityName)}`, {
      headers: {
        "X-API-KEY": env.HumanDesign_key
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = Array.isArray(data) ? data : data.results || data.data || [];
    const tz = results.length ? results[0].timezone || results[0].iana_timezone || results[0].tz : null;
    await env.PASSES.put(cacheKey, tz || "");
    return tz || null;
  } catch (_) {
    return null;
  }
}

async function resolveHDDatetime(env, dateStr, timeStr, timezone) {
  const cacheKey = `hddt:${dateStr}|${timeStr}|${timezone}`;
  const cached = await env.PASSES.get(cacheKey);
  if (cached !== null) return cached === "" ? null : cached;
  try {
    const res = await fetch("https://api.humandesignhub.app/v2/timezone/resolve", {
      method: "POST",
      headers: {
        "X-API-KEY": env.HumanDesign_key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date: dateStr,
        time: timeStr,
        timezone: timezone
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const datetime = data.datetime || data.resolved_datetime || null;
    await env.PASSES.put(cacheKey, datetime || "");
    return datetime;
  } catch (_) {
    return null;
  }
}

async function getHumanDesign(env, dob, timeStr, ampm, city, state) {
  const {year: year, month: month, day: day} = normalizeDOB(dob);
  const {hour: hour, minute: minute} = normalizeTime(timeStr, ampm);
  const {cityName: cityName} = normalizeCity(city, state, null);
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const timeFormatted = `${pad(hour)}:${pad(minute)}`;
  let datetime = null;
  const timezone = await getHDTimezone(env, cityName);
  if (timezone) {
    datetime = await resolveHDDatetime(env, dateStr, timeFormatted, timezone);
  }
  if (!datetime) {
    throw new Error(`Could not resolve a timezone for "${cityName}". Human Design needs the exact UTC moment of birth, so the chart can't be safely computed without it.`);
  }
  const chartCacheKey = `hdchart:${datetime}`;
  const cachedChart = await env.PASSES.get(chartCacheKey);
  if (cachedChart !== null) return JSON.parse(cachedChart);
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch("https://api.humandesignhub.app/v2/simple-bodygraph", {
      method: "POST",
      headers: {
        "X-API-KEY": env.HumanDesign_key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        datetime: datetime
      })
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
  const now = new Date;
  return `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;
}

async function assemblePersonData(env, person) {
  const {first: first, mid: mid, last: last, dob: dob, time: time, ampm: ampm, city: city, state: state, country: country} = person;
  let numerology = null, numerologyError = null;
  try {
    numerology = calculateFullChart({
      first: first,
      middle: mid || "",
      last: last,
      dob: dobToMMDDYYYY(dob),
      currentDate: todayAsMMDDYYYY()
    });
  } catch (e) {
    numerologyError = e.message;
  }
  let astrology = null, astrologyError = null;
  try {
    astrology = getAstrologyLocal(dob, time, ampm, city, state, country);
  } catch (e) {
    astrologyError = e.message;
  }
  let humanDesign = null, humanDesignError = null;
  const hasTime = time && time.trim().length > 0;
  const hasCity = city && city.trim().length > 0;
  if (hasTime && hasCity) {
    try {
      humanDesign = await getHumanDesign(env, dob, time, ampm, city, state);
    } catch (e) {
      humanDesignError = e.message;
    }
  } else {
    humanDesignError = "Birth time and city are required for Human Design. Chart omitted.";
  }
  return {
    first: first,
    mid: mid,
    last: last,
    numerology: numerology,
    numerologyError: numerologyError,
    astrology: astrology,
    astrologyError: astrologyError,
    humanDesign: humanDesign,
    humanDesignError: humanDesignError
  };
}

const PLAN_CONFIG = {
  single: {
    mode: "payment",
    amount: 500,
    name: "Single Reading"
  },
  monthly: {
    mode: "payment",
    amount: 1e3,
    name: "One Month Pass"
  },
  annual: {
    mode: "payment",
    amount: 2500,
    name: "One Year Pass"
  }
};

async function createCheckoutSession(env, plan, origin, email) {
  const config = PLAN_CONFIG[plan];
  if (!config) throw new Error(`Unknown plan: "${plan}".`);
  const params = new URLSearchParams;
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
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
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

const PASS_DURATION_MS = {
  monthly: 31 * 24 * 60 * 60 * 1e3,
  annual: 366 * 24 * 60 * 60 * 1e3
};

const UNLIMITED_EMAILS = [ "kamiwinther22@gmail.com", "maddiewinther@gmail.com", "halliewinther@gmail.com" ];

function passKey(email) {
  return `pass:${email.trim().toLowerCase()}`;
}

function jobKey(jobId) {
  return `job:${jobId}`;
}

function personSnapshot(p) {
  if (!p) return null;
  const {first: first, mid: mid, last: last, dob: dob, time: time, city: city, state: state, country: country} = p;
  return {
    first: first,
    mid: mid,
    last: last,
    dob: dob,
    time: time,
    city: city,
    state: state,
    country: country
  };
}

async function recordPass(env, sessionId, p1, p2) {
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`
    }
  });
  if (!res.ok) throw new Error("Could not verify checkout session with Stripe.");
  const session = await res.json();
  if (session.payment_status !== "paid") {
    return {
      ok: false,
      reason: "Payment not completed."
    };
  }
  const plan = session.metadata && session.metadata.plan;
  const durationMs = PASS_DURATION_MS[plan];
  if (!durationMs) {
    return {
      ok: true,
      plan: plan || null
    };
  }
  const email = session.customer_details && session.customer_details.email;
  if (!email) return {
    ok: false,
    reason: "No email on checkout session."
  };
  const purchasedAt = Date.now();
  const expiresAt = purchasedAt + durationMs;
  await env.PASSES.put(passKey(email), JSON.stringify({
    plan: plan,
    purchasedAt: purchasedAt,
    expiresAt: expiresAt,
    p1: personSnapshot(p1),
    p2: personSnapshot(p2)
  }), {
    expirationTtl: Math.ceil(durationMs / 1e3)
  });
  return {
    ok: true,
    plan: plan,
    expiresAt: expiresAt
  };
}

async function checkPassRecord(env, email) {
  if (!email) return {
    active: false
  };
  if (UNLIMITED_EMAILS.includes(email.trim().toLowerCase())) {
    const raw = await env.PASSES.get(passKey(email));
    const record = raw ? JSON.parse(raw) : {};
    return {
      active: true,
      plan: "annual",
      expiresAt: Date.now() + PASS_DURATION_MS.annual,
      p1: record.p1 || null,
      p2: record.p2 || null
    };
  }
  const raw = await env.PASSES.get(passKey(email));
  if (!raw) return {
    active: false
  };
  const record = JSON.parse(raw);
  if (record.expiresAt < Date.now()) return {
    active: false
  };
  return {
    active: true,
    plan: record.plan,
    expiresAt: record.expiresAt,
    p1: record.p1 || null,
    p2: record.p2 || null
  };
}

async function refreshPassSnapshot(env, email, p1, p2) {
  if (!email) return;
  const key = passKey(email);
  const raw = await env.PASSES.get(key);
  const isUnlimited = UNLIMITED_EMAILS.includes(email.trim().toLowerCase());
  if (!raw && !isUnlimited) return;
  const record = raw ? JSON.parse(raw) : {
    plan: "annual",
    purchasedAt: Date.now()
  };
  if (!isUnlimited && record.expiresAt < Date.now()) return;
  const expiresAt = isUnlimited ? Date.now() + PASS_DURATION_MS.annual : record.expiresAt;
  const remainingTtl = Math.ceil((expiresAt - Date.now()) / 1e3);
  if (remainingTtl <= 0) return;
  record.expiresAt = expiresAt;
  record.p1 = personSnapshot(p1);
  record.p2 = personSnapshot(p2);
  await env.PASSES.put(key, JSON.stringify(record), {
    expirationTtl: remainingTtl
  });
}

const USAGE_KV_KEY = "usage:totals";

const USAGE_LOG_TTL_SECONDS = 90 * 24 * 60 * 60;

function bumpUsageBucket(bucket, usage) {
  bucket.requests = (bucket.requests || 0) + 1;
  bucket.inputTokens = (bucket.inputTokens || 0) + (usage.input_tokens || 0);
  bucket.outputTokens = (bucket.outputTokens || 0) + (usage.output_tokens || 0);
  bucket.cacheCreationTokens = (bucket.cacheCreationTokens || 0) + (usage.cache_creation_input_tokens || 0);
  bucket.cacheReadTokens = (bucket.cacheReadTokens || 0) + (usage.cache_read_input_tokens || 0);
}

async function recordUsage(env, usage, type) {
  if (!usage) return;
  const raw = await env.PASSES.get(USAGE_KV_KEY);
  const totals = raw ? JSON.parse(raw) : {
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    byType: {}
  };
  if (!totals.byType) totals.byType = {};
  bumpUsageBucket(totals, usage);
  if (!totals.byType[type]) totals.byType[type] = {};
  bumpUsageBucket(totals.byType[type], usage);
  await env.PASSES.put(USAGE_KV_KEY, JSON.stringify(totals));
  const logKey = `usagelog:${String(9999999999999 - Date.now()).padStart(13, "0")}:${crypto.randomUUID().slice(0, 8)}`;
  await env.PASSES.put(logKey, "1", {
    expirationTtl: USAGE_LOG_TTL_SECONDS,
    metadata: {
      time: (new Date).toISOString(),
      type: type,
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cacheCreationTokens: usage.cache_creation_input_tokens || 0,
      cacheReadTokens: usage.cache_read_input_tokens || 0
    }
  });
}

const REPORT_SYSTEM_PROMPT = `Check the person's current age before writing anything about love, dating, or sex. Under 18: none of it, ever.\n\n### ABSOLUTE RULES (zero exceptions)\n1. Single reading: address the person as "you" in every sentence. Never their name, never "she/he/her/him/they."\n2. Two-person reading: use each person's first name in every sentence about them. Never a label like "Partner A."\n3. Never name a placement, aspect, cycle, return, number, or degree in the prose. State what it produces. Cite it once, in references.\n4. Never intensify a claim before stating it plainly ("real tension," "genuine need," "deep restlessness," and any synonym doing the same job). State it as settled fact.\n5. Return one JSON object only -- no markdown, no text before or after it.\n\n### ROLE\nYou are an expert astrologer and numerologist -- use your full depth of knowledge in both systems, never a shortened or generic version. You already know what every placement or number means, so skip the definition: dig past the first meaning that comes to mind for what it actually means for this person, and don't reduce it to one trait when it carries several. Depth includes chart position -- the same Karmic Debt means something different in a Life Path than in a Birthday number. Write in plain, practical language -- what the person does, feels, or experiences -- never mystical or dressed-up phrasing that sounds profound but says little.\n\n### COVERAGE\n- Thorough means depth on what the data actually supports, not length for its own sake.\n- Don't omit anything the data indicates due to political correctness -- accuracy is the goal, not caution: family relationships, intimate or sexual patterns, work, social life, education, public life, faith or a higher power when a placement's tradition actually includes it, or anything else the data supports.\n- Cover what's important to them, how they handle closeness, what drives them, how they experience change, and any other theme the data supports.\n- Build every point around BOTH astrology and numerology together, never one system alone. If both point at the same trait, say it once, using both as evidence.\n- Weight each point by how much the actual data weighs toward it, not evenly.\n- Parent/child reading: name what parental actions the chart data indicates would break the bond with the child, and what approach maintains it instead.\n\n### RELATIONAL READINGS (two-person)\nBefore writing, find the connection points between the two charts -- not everything technically present, only what two people would actually notice or feel between them.\n- Astrology: Sun-Moon cross-aspects, Venus-Mars, Moon-Moon, any tight conjunction from one person's planet onto the other's planet, angle, or Chiron. Also check whether either person's active astrological return (see Cycles & Timing below) lands on a placement in the other person's chart.\n- Numerology: using the raw data and your own full training knowledge, find the data points with the biggest relational influence and state exactly what the interaction produces in practical language -- detailed enough that nothing is left as a theme or category to interpret further.\n- Human Design: only when a "Human Design connection" line is given. Cover exactly what it describes -- energy the two people generate together that neither has alone, or one person's steady definition reaching a center the other doesn't have on their own. Never bring in either person's Type, Strategy, or Authority (how they make decisions) here -- that content is out of scope for this reading and already implied by the rest of the chart.\n- Connection comes first: establish what draws the two people together before covering friction or self-protection.\n- A section describing friction, withdrawal, or a gap can't end there -- state what each person would actually need to feel reconnected, as an observational fact about that one person, never a formula and never advice. Don't claim the other person can meet that need unless the data supports it -- state what they're actually most likely to do instead.\n- Describe the relationship itself, not each person's individual process.\n\n### HOW TO WRITE\n- Describe the person, not the chart.\n- State what the person does, wants, or feels -- never the mechanism producing it.\n- State each fact once. There's no target length -- don't pad or reword to fill space. The more directly something is stated, the more content fits.\n- Never parrot this prompt's own instructions back in the reading.\n\n### CYCLES & TIMING\n- Every time-bound element -- big cycles, astrological returns, Personal Month, Personal Day -- states its real time span in the prose (the age, year, month, week, or day it covers) instead of its technical name (Rule 3). "Right now" alone is not a time span.\n- Big cycles (Personal Year, Essence, Pinnacle, Period Cycle, Challenge) plus any active return describe ONE life stage -- combine them into a single explanation of where this person stands right now. A Personal Year 1 inside a Pinnacle 3 reads differently than inside a Pinnacle 9: give concrete examples grounded in the full chart(s) for what this stretch is likely to be felt and noticed as, which choices or mindset actually produce the outcomes it supports, what changes on entering the next phase and when, and how to prepare for what the next big cycles will ask of them.\n- Personal Month and Day are a separate, much shorter timescale -- don't merge them into the life-stage picture above. Mention them only when there's something significant to say.\n- Two-person: explain how each person's current cycles affect how the two of them experience each other right now.\n- You're given astrology and numerology data only, no transit data. If birth time is missing, Ascendant/Midheaven/houses are missing with it -- leave them out, don't guess. Named astrological returns -- Saturn Return (~29, 58, or 87), Jupiter Return (~every 12 years), Uranus Opposition (~40-42), Chiron Return (~50) -- apply only when the person's current age is inside that window.\n\n### ASTROLOGY DATA RULES\n- Weigh a planet's major aspects before its sign -- a tight conjunction, square, or opposition outweighs the sign; a wide trine or sextile barely changes it.\n- Use a planet's actual house, never the house tied to its ruling sign.\n- Never label an aspect "easy" or "tense" -- state what it produces (How to Write).\n- Read the data provided and report what you see, clearly and concisely.\n\n### OUTPUT FORMAT\n{\n  "headline": "One short, specific line for the whole reading. Follows ABSOLUTE RULE 3.",\n  "sections": [\n    {\n      "eyebrow": "Short label for this section",\n      "title": "A specific title for this section",\n      "body": "Prose made of separate, specific claims -- not narrated as one continuous flow. Follows ABSOLUTE RULE 3."\n    }\n  ],\n  "references": ["Every placement, aspect, cycle, and number the reading draws on, short technical shorthand, degrees included, one per entry."]\n}\nDivide the reading into as many sections as the content naturally requires -- no fixed topic list, no fixed section count. Give each section its own specific title and eyebrow.\n\nBefore you finish: check every sentence against the ABSOLUTE RULES above and fix any violation.`;

const HD_ONLY_RELATIONAL_SYSTEM_PROMPT = `Check the person's current age before writing anything about love, dating, or sex. Under 18: none of it, ever.\n\nYou are an expert in Human Design. This reading is a deliberate experiment: it uses ONLY Human Design data for two people -- no astrology, no numerology -- so its value can be judged on its own. Draw on your own extensive knowledge of the Human Design system, not a shortened version of it, to explain what each person's Type, Strategy, Authority, Profile, Centers, and Gates/Channels actually mean for them individually and for how these two people affect each other.\n\nYou are given each person's full raw Human Design chart data, whatever fields the source returned. Use whatever is actually present; do not invent a field that isn't there.\n\nFor the relational content specifically: state what pulls these two people together before covering friction -- connection comes first. Look specifically for whether one person's defined Center consistently fills the other's undefined one (a distinct Human Design relational mechanism -- state what that produces for each of them, not just that it exists), any Channel completed between the two charts using one gate from each person, and how their two Types/Strategies/Authorities interact when they try to make a decision or take action together.\n\nA relational section that describes friction or a gap between the two people can't end there -- state what each person would actually need in order to feel reconnected, as an observational fact about that one person, never as advice and never as a formula. Don't claim the other person is capable of meeting that need unless the data actually supports it.\n\nDescribe the two people, not the chart. Every sentence uses their first names. A Type, Center, Gate, or Channel can prove a claim true -- it can never be the claim itself. State what each person does, wants, or feels; the Human Design detail is the reason why, not the claim.\n\nState each fact once. Be as direct and concise as the depth allows -- no padding, no repeating the same point reworded.\n\n### NON-NEGOTIABLE\n- First names, every time -- never a label like "Person One."\n- Describe the relationship itself, not each person's individual process alone.\n\n### OUTPUT FORMAT\nReturn only a single JSON object. No markdown, no text outside it:\n{\n  "headline": "One short, specific line for the whole reading. No system names or Human Design jargon (Type/Gate/Channel names), stated as plain fact instead.",\n  "sections": [\n    {\n      "eyebrow": "Short label for this section",\n      "title": "A specific title for this section",\n      "body": "Prose made of separate, specific claims -- not narrated as one continuous flow. Same naming restriction as headline."\n    }\n  ],\n  "references": ["Every Human Design detail actually used (Type, Authority, Profile, Center, Gate, Channel), short technical shorthand, one per entry."]\n}\nDivide the reading into as many sections as the content naturally requires.`;

function buildHDOnlyRelationalPrompt(relLabel, p1, p2) {
  const hdBlock = p => `${p.first}${p.last ? " " + p.last : ""}:\n${p.humanDesign ? JSON.stringify(p.humanDesign) : "No Human Design chart available."}`;
  return `Relationship type: ${relLabel}\n${hdBlock(p1)}\n${hdBlock(p2)}`;
}

function buildFallbackReading() {
  return {
    headline: "Please Try Again",
    sections: [],
    references: []
  };
}

const HD_CENTER_GATES = {
  Head: [ 64, 61, 63 ],
  Ajna: [ 47, 24, 4, 11, 43, 17 ],
  Throat: [ 62, 23, 56, 16, 20, 31, 8, 33, 35, 12, 45 ],
  G: [ 1, 13, 7, 2, 15, 10, 25, 46 ],
  Heart: [ 21, 40, 26, 51 ],
  Sacral: [ 34, 5, 14, 29, 59, 9, 3, 42, 27 ],
  Spleen: [ 48, 57, 44, 50, 32, 28, 18 ],
  SolarPlexus: [ 37, 6, 49, 22, 55, 36, 30 ],
  Root: [ 58, 38, 54, 53, 60, 52, 19, 39, 41 ]
};

const HD_GATE_CENTER = {};

Object.entries(HD_CENTER_GATES).forEach(([c, gates]) => gates.forEach(g => HD_GATE_CENTER[g] = c));

const HD_CHANNELS = [ [ 64, 47 ], [ 61, 24 ], [ 63, 4 ], [ 17, 62 ], [ 43, 23 ], [ 11, 56 ], [ 16, 48 ], [ 20, 57 ], [ 20, 34 ], [ 32, 54 ], [ 28, 38 ], [ 18, 58 ], [ 20, 10 ], [ 31, 7 ], [ 8, 1 ], [ 33, 13 ], [ 10, 34 ], [ 15, 5 ], [ 2, 14 ], [ 46, 29 ], [ 10, 57 ], [ 57, 34 ], [ 50, 27 ], [ 45, 21 ], [ 59, 6 ], [ 42, 53 ], [ 3, 60 ], [ 9, 52 ], [ 26, 44 ], [ 25, 51 ], [ 40, 37 ], [ 35, 36 ], [ 12, 22 ], [ 49, 19 ], [ 55, 39 ], [ 30, 41 ] ];

function hdCenterLabel(c) {
  return c === "SolarPlexus" ? "Solar Plexus" : c;
}

function buildHDConnectionLine(hd1, hd2, name1, name2) {
  const toGateSet = hd => {
    const gates = (hd?.gates || []).map(g => parseInt(g, 10)).filter(g => !isNaN(g));
    return gates.length ? new Set(gates) : null;
  };
  const set1 = toGateSet(hd1), set2 = toGateSet(hd2);
  if (!set1 || !set2) return null;
  const electromagnetic = [];
  const dominance = [];
  for (const [a, b] of HD_CHANNELS) {
    const centers = `${hdCenterLabel(HD_GATE_CENTER[a])}-${hdCenterLabel(HD_GATE_CENTER[b])}`;
    if (set1.has(a) && set1.has(b) || set2.has(a) && set2.has(b)) {
      const [empty, fullName, emptyName] = set1.has(a) && set1.has(b) ? [ set2, name1, name2 ] : [ set1, name2, name1 ];
      if (!empty.has(a) && !empty.has(b)) {
        dominance.push(`${fullName}'s ${centers} channel (Gates ${a}-${b}, fully defined) is fully undefined in ${emptyName}`);
      }
      continue;
    }
    if (set1.has(a) && set2.has(b) && !set1.has(b) && !set2.has(a) || set1.has(b) && set2.has(a) && !set1.has(a) && !set2.has(b)) {
      electromagnetic.push(`Gates ${a}-${b} (${centers}), split between ${name1} and ${name2}`);
    }
  }
  if (!electromagnetic.length && !dominance.length) return null;
  const lines = [ "Human Design connection (only this two-chart dynamic -- not either person's Type, Strategy, or Authority):" ];
  if (electromagnetic.length) lines.push(`  Completed together, neither has alone: ${electromagnetic.join("; ")}`);
  if (dominance.length) lines.push(`  One person's defined channel, fully undefined in the other: ${dominance.join("; ")}`);
  return lines.join("\n");
}

function buildReportUserPrompt(rtype, relLabel, p1, p2) {
  const personBlock = p => {
    const n = p.numerology || {};
    const a = p.astrology || {};
    const pinnacle = x => x ? `${x.value} (${x.ageRange})` : "unknown";
    const challenge = (val, pin) => `${val}${pin?.ageRange ? ` (age ${pin.ageRange})` : ""}`;
    const numerologyLines = [ `Life Path ${n.lifePath}, Expression ${n.expression}, Soul Urge ${n.soulUrge}, Personality ${n.personality}, Birthday ${n.birthday}`, `Attitude ${n.attitude}, Balance ${n.balance}, Maturity ${n.maturity}`, `Current cycle: Personal Year ${n.personalYear}, Personal Month ${n.personalMonth}, Personal Day ${n.personalDay}, Essence ${n.essenceCycle?.value} (age ${n.essenceCycle?.currentAge})`, `Pinnacles: 1) ${pinnacle(n.pinnacles?.pinnacle1)}  2) ${pinnacle(n.pinnacles?.pinnacle2)}  3) ${pinnacle(n.pinnacles?.pinnacle3)}  4) ${pinnacle(n.pinnacles?.pinnacle4)}`, `Challenges: 1) ${challenge(n.challengeNumbers?.challenge1, n.pinnacles?.pinnacle1)}  2) ${challenge(n.challengeNumbers?.challenge2, n.pinnacles?.pinnacle2)}  3) ${challenge(n.challengeNumbers?.challenge3, n.pinnacles?.pinnacle3)}  4) ${challenge(n.challengeNumbers?.challenge4, n.pinnacles?.pinnacle4)}`, `Period Cycles (3 long background chapters, each from one raw birthdate component -- distinct from Pinnacles above): 1) ${pinnacle(n.periodCycles?.period1)}  2) ${pinnacle(n.periodCycles?.period2)}  3) ${pinnacle(n.periodCycles?.period3)}`, `Karmic Lessons: ${n.karmicLessons?.length ? n.karmicLessons.join(", ") : "none"}`, `Karmic Debt: ${n.karmicDebtNumbers?.length ? n.karmicDebtNumbers.join(", ") : "none"}` ].join("\n  ");
    const planetLine = pl => `${pl.name} in ${pl.sign} ${pl.degreesInSign}°${pl.house ? ` (house ${pl.house})` : ""}${pl.retrograde ? " Rx" : ""}`;
    const angle = (label, x) => x ? `${label}: ${x.sign} ${x.degreesInSign}°` : null;
    const astrologyLines = [ a.timeUnknown && a.locationUnknown ? "Birth time and birth location not provided — Ascendant, Midheaven, and house placements are unavailable. Do not guess or invent them; cover planets by sign only." : a.timeUnknown ? "Birth time not provided — Ascendant, Midheaven, and house placements are unavailable. Do not guess or invent them; cover planets by sign only." : a.locationUnknown ? "Birth location not provided — Ascendant, Midheaven, and house placements are unavailable. Do not guess or invent them; cover planets by sign only." : null, (a.planets || []).map(planetLine).join(", "), [ angle("Ascendant", a.ascendant), angle("Midheaven", a.midheaven), angle("North Node", a.northNode), angle("South Node", a.southNode), angle("Chiron", a.chiron), angle("Lilith", a.lilith) ].filter(Boolean).join(", "), a.houses?.length ? `House cusps: ${a.houses.map(h => `${h.house}:${h.sign} ${h.cuspDegrees}°`).join(", ")}` : null, `Major aspects: ${(a.aspects || []).filter(x => x.point1 !== "Sirius" && x.point2 !== "Sirius").map(x => `${x.point1} ${x.aspect} ${x.point2}`).join(", ") || "none"}` ].filter(Boolean).join("\n  ");
    const h = p.humanDesign || {};
    const INCLUDE_HUMAN_DESIGN_IN_REPORT = false;
    const hasHD = INCLUDE_HUMAN_DESIGN_IN_REPORT && !!h.type;
    const hdLines = hasHD ? [ `${h.type} type, ${h.profile || "unknown"} profile, ${h.authority || "unknown"} authority`, h.incarnation_cross ? `Incarnation Cross: ${h.incarnation_cross}` : null ].filter(Boolean).join("\n  ") : null;
    return `\n${p.first}${p.last ? " " + p.last : ""}:\nCurrent age: ${n.essenceCycle?.currentAge ?? "unknown"}\nNumerology:\n  ${numerologyLines}\nAstrology:\n  ${astrologyLines}${hasHD ? `\nHuman Design:\n  ${hdLines}` : ""}`;
  };
  if (rtype === "two-person") {
    const hdConnection = buildHDConnectionLine(p1.humanDesign, p2.humanDesign, p1.first, p2.first);
    return `Relationship type: ${relLabel}\n${personBlock(p1)}\n${personBlock(p2)}${hdConnection ? `\n${hdConnection}` : ""}`;
  }
  return personBlock(p1);
}

function extractJSON(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) return fenced[1];
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

async function callReportModel(env, userPrompt, systemPrompt = REPORT_SYSTEM_PROMPT, modelOpts = {}) {
  const messages = [ {
    role: "user",
    content: userPrompt
  } ];
  const {max_tokens: max_tokens = 72e3, thinking: thinking = {
    type: "adaptive"
  }, effort: effort = "medium"} = modelOpts;
  const controller = new AbortController;
  const STALL_MS = 9e4;
  let stallTimer;
  const armStallTimer = () => {
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => controller.abort(), STALL_MS);
  };
  armStallTimer();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: controller.signal,
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: max_tokens,
      thinking: thinking,
      output_config: {
        effort: effort
      },
      stream: true,
      system: [ {
        type: "text",
        text: systemPrompt,
        cache_control: {
          type: "ephemeral"
        }
      } ],
      messages: messages
    })
  });
  armStallTimer();
  if (!res.ok) {
    clearTimeout(stallTimer);
    throw new Error(`Claude API error: ${await res.text()}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder;
  let buffer = "";
  let textOut = "";
  const blockTypes = {};
  let usage = null;
  let stopReason = null;
  while (true) {
    const {done: done, value: value} = await reader.read();
    if (done) break;
    armStallTimer();
    buffer += decoder.decode(value, {
      stream: true
    });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      let evt;
      try {
        evt = JSON.parse(line.slice(6));
      } catch (_) {
        continue;
      }
      if (evt.type === "message_start") {
        usage = evt.message?.usage || null;
      } else if (evt.type === "content_block_start") {
        blockTypes[evt.index] = evt.content_block?.type;
      } else if (evt.type === "content_block_delta") {
        if (blockTypes[evt.index] === "text" && evt.delta?.type === "text_delta") {
          textOut += evt.delta.text;
        }
      } else if (evt.type === "message_delta") {
        if (evt.delta?.stop_reason) stopReason = evt.delta.stop_reason;
        if (evt.usage) usage = {
          ...usage,
          ...evt.usage
        };
      }
    }
  }
  clearTimeout(stallTimer);
  if (stopReason === "max_tokens") {
    const err = new Error("Reading was cut off before it finished (hit the max_tokens limit).");
    err.usage = usage;
    throw err;
  }
  if (!textOut) {
    const err = new Error("Claude API response had no text content.");
    err.usage = usage;
    throw err;
  }
  return {
    text: textOut,
    usage: usage
  };
}

const ZODIAC_SIGNS = [ "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces" ];

const CITATION_PATTERNS = [ new RegExp(`\\b(Sun|Moon)\\s+in\\s+(${ZODIAC_SIGNS.join("|")})\\b`, "i"), new RegExp(`\\b(${ZODIAC_SIGNS.join("|")})\\b`, "i"), /\b(Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Chiron|Ascendant|Midheaven|Lilith)\b/i, /\b(North|South)\s+Node\b/i, /\bLife\s+Path\s+\d+/i, /\bExpression\s+\d+/i, /\bSoul\s+Urge\s+\d+/i, /\bPersonality\s+(number\s+)?\d+/i, /\bPersonal\s+(Year|Month|Day)\s+\d+/i, /\bPinnacle\s+\d+/i, /\bChallenge\s+(number\s+)?\d+/i, /\bKarmic\s+(Debt|Lesson)/i, /\bEssence\s+(cycle|number)/i, /\b\d+(st|nd|rd|th)\s+house\b/i, /\d+(\.\d+)?°/, /\b\d{1,2}\s+degrees?\b/i ];

function findCitationSpan(text) {
  for (const re of CITATION_PATTERNS) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

function findCitationLeak(reading) {
  const fields = [ {
    sectionIndex: -1,
    key: "headline",
    text: reading.headline
  } ];
  (reading.sections || []).forEach((s, i) => {
    fields.push({
      sectionIndex: i,
      key: "eyebrow",
      text: s.eyebrow
    });
    fields.push({
      sectionIndex: i,
      key: "title",
      text: s.title
    });
    fields.push({
      sectionIndex: i,
      key: "body",
      text: s.body
    });
  });
  for (const f of fields) {
    if (!f.text) continue;
    const snippet = findCitationSpan(f.text);
    if (snippet) {
      return {
        message: `Names a placement, aspect, cycle, or number directly in the text ("${snippet}") instead of stating what it produces -- rewrite with no technical astrology or numerology term anywhere in it, only what it means for the person.`,
        sectionIndex: f.sectionIndex,
        key: f.key,
        text: f.text
      };
    }
  }
  return null;
}

async function generateSingleCallReading(env, userPrompt, systemPrompt) {
  const {text: text, usage: usage} = await callReportModel(env, userPrompt, systemPrompt);
  let parsed;
  try {
    parsed = JSON.parse(extractJSON(text));
  } catch (e) {
    const err = new Error("Claude API response was not valid JSON.");
    err.usage = usage;
    throw err;
  }
  return {
    parsed: parsed,
    usage: usage
  };
}

const CITATION_FIX_SYSTEM_PROMPT = `You're fixing one specific, mechanical problem in one short piece of text from an already-written astrology/numerology reading. You'll be given the text and a description of what's wrong with it.\n\nRewrite it so the problem is gone. Keep every fact, keep the exact same voice ("you", or a first name, whichever the text already uses), keep roughly the same length. Change only what the described problem requires -- leave everything else as close to the original wording as it can stay.\n\nReturn ONLY the corrected text. No JSON, no quotation marks around it, no preamble, no explanation.`;

async function correctCitationDefect(env, fieldText, defectMessage) {
  const userPrompt = `Problem: ${defectMessage}\n\nText:\n${fieldText}`;
  const {text: text, usage: usage} = await callReportModel(env, userPrompt, CITATION_FIX_SYSTEM_PROMPT, {
    max_tokens: 2e3,
    thinking: {
      type: "adaptive"
    },
    effort: "low"
  });
  return {
    text: text.trim(),
    usage: usage
  };
}

async function generateReport(env, rtype, relLabel, p1, p2, ctx, hdOnly) {
  const usageType = hdOnly ? "hd-only" : rtype === "two-person" ? "two-person" : "individual";
  let result, lastError;
  const failedUsages = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (hdOnly) {
        result = await generateSingleCallReading(env, buildHDOnlyRelationalPrompt(relLabel, p1, p2), HD_ONLY_RELATIONAL_SYSTEM_PROMPT);
      } else {
        result = await generateSingleCallReading(env, buildReportUserPrompt(rtype, relLabel, p1, p2), REPORT_SYSTEM_PROMPT);
      }
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (error.usage) failedUsages.push(error.usage);
      console.error(`Report generation attempt ${attempt + 1} failed: ${error.message}`);
    }
  }
  const combineUsage = usages => usages.reduce((total, u) => ({
    input_tokens: (total.input_tokens || 0) + (u.input_tokens || 0),
    output_tokens: (total.output_tokens || 0) + (u.output_tokens || 0),
    cache_creation_input_tokens: (total.cache_creation_input_tokens || 0) + (u.cache_creation_input_tokens || 0),
    cache_read_input_tokens: (total.cache_read_input_tokens || 0) + (u.cache_read_input_tokens || 0)
  }), {});
  if (lastError) {
    if (ctx && failedUsages.length) ctx.waitUntil(recordUsage(env, combineUsage(failedUsages), usageType));
    return {
      reading: buildFallbackReading(rtype, p1, p2),
      usedFallback: true,
      fallbackReason: lastError.message
    };
  }
  let defect = findCitationLeak(result.parsed);
  for (let fixAttempt = 0; defect && fixAttempt < 2; fixAttempt++) {
    try {
      const fix = await correctCitationDefect(env, defect.text, defect.message);
      failedUsages.push(fix.usage);
      if (defect.sectionIndex === -1) result.parsed.headline = fix.text; else result.parsed.sections[defect.sectionIndex][defect.key] = fix.text;
      defect = findCitationLeak(result.parsed);
    } catch (fixError) {
      console.error(`Citation-defect fix attempt ${fixAttempt + 1} failed: ${fixError.message}`);
      if (fixError.usage) failedUsages.push(fixError.usage);
    }
  }
  const usage = failedUsages.length ? combineUsage([ ...failedUsages, result.usage ]) : result.usage;
  if (ctx) ctx.waitUntil(recordUsage(env, usage, usageType));
  if (defect) console.error(`Report generation defect, delivering anyway: ${defect.message}`);
  return {
    reading: result.parsed,
    usedFallback: false
  };
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          ...CORS_HEADERS,
          ...PRIVACY_HEADERS
        }
      });
    }
    const url = new URL(request.url);
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: {
          "Content-Type": "text/plain; charset=UTF-8"
        }
      });
    }
    if (url.pathname === "/astro-check") {
      try {
        const sample = getAstrologyLocal("06/15/1990", "11:30", "AM", "Paris", "", "France");
        return jsonResponse({
          ok: true,
          engine: "local",
          sample: sample
        });
      } catch (error) {
        return jsonResponse({
          ok: false,
          error: error.message
        }, 500);
      }
    }
    if (url.pathname === "/usage") {
      const raw = await env.PASSES.get(USAGE_KV_KEY);
      const t = raw ? JSON.parse(raw) : {
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheCreationTokens: 0,
        cacheReadTokens: 0,
        byType: {}
      };
      if (!t.byType) t.byType = {};
      const INPUT_RATE = 2 / 1e6;
      const OUTPUT_RATE = 10 / 1e6;
      const CACHE_WRITE_RATE = INPUT_RATE * 1.25;
      const CACHE_READ_RATE = INPUT_RATE * .1;
      const costOf = b => (b.inputTokens || 0) * INPUT_RATE + (b.outputTokens || 0) * OUTPUT_RATE + (b.cacheCreationTokens || 0) * CACHE_WRITE_RATE + (b.cacheReadTokens || 0) * CACHE_READ_RATE;
      const cost = costOf(t);
      const perReading = t.requests ? cost / t.requests : 0;
      const row = (label, value) => `<tr><td>${label}</td><td>${value}</td></tr>`;
      const typeLabel = {
        individual: "Individual",
        "two-person": "Relational",
        "hd-only": "HD-only test"
      };
      const typeRows = Object.entries(t.byType).map(([type, b]) => {
        const c = costOf(b);
        return row(typeLabel[type] || type, `${b.requests} readings · $${c.toFixed(2)} · $${(b.requests ? c / b.requests : 0).toFixed(4)}/reading`);
      }).join("") || `<tr><td colspan="2">No readings recorded yet.</td></tr>`;
      const recentList = await env.PASSES.list({
        prefix: "usagelog:",
        limit: 20
      });
      const recentRows = recentList.keys.map(k => {
        const m = k.metadata || {};
        const c = costOf(m);
        return row(`${(m.time || "").replace("T", " ").slice(0, 16)} · ${typeLabel[m.type] || m.type || "unknown"}`, `${(m.inputTokens || 0).toLocaleString()} in / ${(m.outputTokens || 0).toLocaleString()} out · $${c.toFixed(4)}`);
      }).join("") || `<tr><td colspan="2">No recent requests logged.</td></tr>`;
      const html = `<!doctype html><html><head><meta charset="UTF-8"><meta name="robots" content="noindex, nofollow"><title>Usage</title>\n<style>body{font-family:-apple-system,sans-serif;background:#0a1530;color:#f0c94c;padding:2rem;max-width:600px;margin:0 auto;}\nh1{font-size:1.2rem;} h2{font-size:1rem;margin-top:2rem;} table{width:100%;border-collapse:collapse;margin-top:1rem;}\ntd{padding:0.4rem 0;border-bottom:1px solid rgba(240,201,76,0.2);} td:last-child{text-align:right;font-weight:700;}\n.note{font-size:0.75rem;opacity:0.7;margin-top:1.5rem;}</style></head><body>\n<h1>Claude API usage — running total</h1>\n<table>\n${row("Readings generated", t.requests)}\n${row("Input tokens", t.inputTokens.toLocaleString())}\n${row("Output tokens", t.outputTokens.toLocaleString())}\n${row("Cache write tokens", t.cacheCreationTokens.toLocaleString())}\n${row("Cache read tokens", t.cacheReadTokens.toLocaleString())}\n${row("Estimated total cost", "$" + cost.toFixed(2))}\n${row("Estimated cost per reading", "$" + perReading.toFixed(4))}\n</table>\n<h2>By reading type</h2>\n<table>${typeRows}</table>\n<h2>Recent requests (last 20, kept 90 days)</h2>\n<table>${recentRows}</table>\n<p class="note">Estimate uses Claude Sonnet 5 pricing ($2/$10 per million input/output tokens — made permanent 2026-08-10, not an introductory rate) — update the rates in worker.js if pricing changes. Doesn't include Stripe fees. Output tokens include thinking -- Claude's API doesn't report thinking and final text as separate numbers.</p>\n</body></html>`;
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          ...CORS_HEADERS
        }
      });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          ...CORS_HEADERS,
          ...PRIVACY_HEADERS
        }
      });
    }
    if (url.pathname === "/create-checkout-session") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({
          error: "Invalid request body."
        }, 400);
      }
      try {
        const origin = url.origin === "https://know-your-energy.kwdoanchor.workers.dev" ? "https://know-your-energy.com" : url.origin;
        const session = await createCheckoutSession(env, body.plan, origin, body.email);
        return jsonResponse({
          url: session.url
        });
      } catch (error) {
        return jsonResponse({
          error: error.message
        }, 500);
      }
    }
    if (url.pathname === "/record-pass") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({
          error: "Invalid request body."
        }, 400);
      }
      try {
        const result = await recordPass(env, body.session_id, body.p1, body.p2);
        return jsonResponse(result);
      } catch (error) {
        return jsonResponse({
          error: error.message
        }, 500);
      }
    }
    if (url.pathname === "/check-pass") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({
          error: "Invalid request body."
        }, 400);
      }
      try {
        const result = await checkPassRecord(env, body.email);
        return jsonResponse(result);
      } catch (error) {
        return jsonResponse({
          error: error.message
        }, 500);
      }
    }
    if (url.pathname === "/chart-data") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return jsonResponse({
          error: "Invalid request body."
        }, 400);
      }
      const [p1Data, p2Data] = await Promise.all([ assemblePersonData(env, body.p1), body.p2 ? assemblePersonData(env, body.p2) : Promise.resolve(null) ]);
      return jsonResponse({
        p1: p1Data,
        p2: p2Data
      });
    }
    if (url.pathname === "/report-status") {
      let statusBody;
      try {
        statusBody = await request.json();
      } catch (e) {
        return jsonResponse({
          error: "Invalid request body."
        }, 400);
      }
      if (!statusBody.jobId) {
        return jsonResponse({
          error: "Missing jobId."
        }, 400);
      }
      const raw = await env.PASSES.get(jobKey(statusBody.jobId));
      if (!raw) {
        return jsonResponse({
          error: "Job not found or expired. Please try again."
        }, 404);
      }
      return jsonResponse(JSON.parse(raw));
    }
    if (url.pathname !== "/report") {
      return jsonResponse({
        error: "Unknown endpoint"
      }, 404);
    }
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({
        error: "Invalid request body."
      }, 400);
    }
    const jobId = crypto.randomUUID();
    await env.PASSES.put(jobKey(jobId), JSON.stringify({
      status: "pending"
    }), {
      expirationTtl: 3600
    });
    const {readable: readable, writable: writable} = new TransformStream;
    const writer = writable.getWriter();
    const encoder = new TextEncoder;
    const heartbeat = setInterval(() => {
      writer.write(encoder.encode(" ")).catch(() => {});
    }, 1e4);
    const reportStart = Date.now();
    console.log(`[report] start rtype=${body.rtype} jobId=${jobId}`);
    ctx.waitUntil((async () => {
      let streamBody, kvRecord;
      try {
        const [p1Data, p2Data] = body.p1Data ? [ body.p1Data, body.p2Data || null ] : await Promise.all([ assemblePersonData(env, body.p1), body.p2 ? assemblePersonData(env, body.p2) : Promise.resolve(null) ]);
        console.log(`[report] person data assembled at +${Date.now() - reportStart}ms jobId=${jobId}`);
        let report = null, reportError = null, reportUsedFallback = false, reportFallbackReason = null;
        if (body.hdOnly && (body.rtype !== "two-person" || !p1Data.humanDesign || !p2Data?.humanDesign)) {
          reportError = "HD-only test mode needs a two-person reading with both people's Human Design charts available (birth time and city required for both).";
        } else {
          try {
            const result = await generateReport(env, body.rtype, body.relLabel, p1Data, p2Data, ctx, body.hdOnly);
            report = result.reading;
            reportUsedFallback = result.usedFallback;
            reportFallbackReason = result.fallbackReason || null;
            console.log(`[report] generation done at +${Date.now() - reportStart}ms usedFallback=${result.usedFallback}${result.fallbackReason ? ` reason=${result.fallbackReason}` : ""} jobId=${jobId}`);
          } catch (error) {
            reportError = error.message;
            console.error(`[report] generation threw at +${Date.now() - reportStart}ms jobId=${jobId}: ${error.message}`);
          }
        }
        if (body.passEmail) {
          ctx.waitUntil(refreshPassSnapshot(env, body.passEmail, body.p1, body.p2));
        }
        const payload = {
          p1: p1Data,
          p2: p2Data,
          report: report,
          reportError: reportError,
          reportUsedFallback: reportUsedFallback,
          reportFallbackReason: reportFallbackReason
        };
        streamBody = JSON.stringify(payload);
        kvRecord = {
          status: "done",
          ...payload
        };
      } catch (error) {
        console.error(`[report] top-level throw at +${Date.now() - reportStart}ms jobId=${jobId}: ${error.message}`);
        streamBody = JSON.stringify({
          error: error.message
        });
        kvRecord = {
          status: "error",
          error: error.message
        };
      }
      clearInterval(heartbeat);
      await env.PASSES.put(jobKey(jobId), JSON.stringify(kvRecord), {
        expirationTtl: 3600
      });
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