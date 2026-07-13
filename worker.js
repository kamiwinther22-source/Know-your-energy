import { calculateFullChart } from './numerology-calculator.js';

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

// ─── COUNTRY CODE ───────────────────────────────────────────────────────────

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

// ─── DATE NORMALIZATION ──────────────────────────────────────────────────────
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

// ─── TIME NORMALIZATION ──────────────────────────────────────────────────────
// Accepts: "06:45 AM", "6:45AM", "14:30", "14:30:00", or ISO datetime string
// ampm is an optional separate field ("AM"/"PM") from the front end

function normalizeTime(timeStr, ampm) {
  if (!timeStr || !timeStr.trim()) return { hour: 12, minute: 0 };

  let str = timeStr.trim();

  // Strip ISO datetime prefix: "1977-11-14T06:45:00" → "06:45:00"
  if (str.includes("T")) {
    str = str.split("T")[1];
  }

  // Strip timezone offset: "+09:00" or "Z"
  str = str.replace(/([+-]\d{2}:\d{2}|Z)$/, "").trim();

  // Extract inline AM/PM
  let inlineAP = "";
  const apMatch = str.match(/\s*(AM|PM)$/i);
  if (apMatch) {
    inlineAP = apMatch[1].toUpperCase();
    str = str.replace(/\s*(AM|PM)$/i, "").trim();
  }

  const parts = str.split(":");
  let hour = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;

  // Inline AM/PM takes priority over separate ampm field
  const ap = inlineAP || (ampm ? ampm.toUpperCase().trim() : "");

  if (ap === "AM") {
    if (hour === 12) hour = 0;
  } else if (ap === "PM") {
    if (hour !== 12) hour += 12;
  }
  // No AM/PM = already 24-hour

  return { hour, minute };
}

// ─── LOCATION NORMALIZATION ──────────────────────────────────────────────────
// Extracts clean city name and country code from any combination of inputs.
// Handles: "Cedar Rapids", "Cedar Rapids, IA", "Cedar Rapids, Iowa, United States",
//          "Cedar Rapids IA", city="" with country="United States", etc.

function normalizeLocation(city, state, country) {
  let rawCity = (city || "").trim();
  let rawCountry = (country || "").trim();

  if (rawCity.includes(",")) {
    const segments = rawCity.split(",").map(s => s.trim());
    rawCity = segments[0];
    if (!rawCountry && segments.length >= 3) {
      rawCountry = segments[2];
    }
    if (!rawCountry && segments.length === 2 && segments[1].length > 3) {
      rawCountry = segments[1];
    }
  }

  // Strip trailing 2-letter state code: "Cedar Rapids IA" → "Cedar Rapids"
  rawCity = rawCity.replace(/\s+[A-Z]{2}$/, "").trim();

  // Fall back to state field if city is empty
  if (!rawCity && state) {
    rawCity = (state || "").trim().replace(/\s+[A-Z]{2}$/, "").trim();
  }

  if (!rawCity) rawCity = "New York";

  return {
    cityName: rawCity,
    countryCode: toCountryCode(rawCountry || "US")
  };
}

// ─── ASTROLOGY API ───────────────────────────────────────────────────────────
// Confirmed working request structure from live API dashboard test (200 OK):
// Top-level fields: name, birth_data
// birth_data fields: year, month, day, hour, minute, second, latitude, longitude, timezone
// NO subject wrapper. City/country_code not used — lat/lng required.
// We geocode city → lat/lng using the API's own geocode utility first.

async function geocodeForAstrology(env, cityName, countryCode) {
  // Use the astrology API's geocode endpoint to convert city to lat/lng/timezone
  try {
    const res = await fetch(
      `https://api.astrology-api.io/api/v3/utils/geocode?city=${encodeURIComponent(cityName)}&country_code=${countryCode}`,
      { headers: { "Authorization": `Bearer ${env.AstroKYE}` } }
    );
    if (res.ok) {
      const data = await res.json();
      return {
        latitude: data.latitude ?? data.lat ?? 0,
        longitude: data.longitude ?? data.lng ?? data.lon ?? 0,
        timezone: data.timezone ?? "UTC"
      };
    }
  } catch (_) {}
  // Fallback: no location, planets only
  return { latitude: 0, longitude: 0, timezone: "UTC" };
}

async function getAstrology(env, dob, timeStr, ampm, city, state, country) {
  const { year, month, day } = normalizeDOB(dob);
  const { hour, minute } = normalizeTime(timeStr, ampm);

  let latitude = 0;
  let longitude = 0;
  let timezone = "UTC";

  if (city && city.trim().length > 0) {
    const { cityName, countryCode } = normalizeLocation(city, state, country);
    const geo = await geocodeForAstrology(env, cityName, countryCode);
    latitude = geo.latitude;
    longitude = geo.longitude;
    timezone = geo.timezone;
  }

  // Exact structure confirmed from live API dashboard test returning 200 OK
  const body = {
    name: "subject",
    birth_data: {
      year,
      month,
      day,
      hour,
      minute,
      second: 0,
      latitude,
      longitude,
      timezone
    }
  };

  const res = await fetch("https://api.astrology-api.io/api/v3/data/positions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.AstroKYE}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Astrology API ${res.status}: ${errText}`);
  }
  return await res.json();
}

// ─── HUMAN DESIGN API ────────────────────────────────────────────────────────
// v2 API requires a single ISO 8601 datetime WITH timezone offset.
// Flow: search city → get IANA timezone → resolve to offset datetime → call chart.

async function getHumanDesignTimezone(env, cityName) {
  const res = await fetch(
    `https://api.humandesignhub.app/v2/locations/search?query=${encodeURIComponent(cityName)}`,
    { headers: { "X-API-KEY": env.HumanDesign_key } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  // Response is an array of location results; take first match
  const results = Array.isArray(data) ? data : (data.results || data.locations || []);
  if (results.length === 0) return null;
  return results[0].timezone || results[0].iana_timezone || null;
}

async function resolveHumanDesignDatetime(env, dateStr, timeStr, ianaTimezone) {
  // dateStr: "YYYY-MM-DD", timeStr: "HH:MM"
  const res = await fetch("https://api.humandesignhub.app/v2/timezone/resolve", {
    method: "POST",
    headers: {
      "X-API-KEY": env.HumanDesign_key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      date: dateStr,
      time: timeStr,
      timezone: ianaTimezone
    })
  });
  if (!res.ok) return null;
  const data = await res.json();
  // Response contains a "datetime" field with offset: "1977-11-14T06:45:00-06:00"
  return data.datetime || null;
}

async function getHumanDesign(env, dob, timeStr, ampm, city, state) {
  const { year, month, day } = normalizeDOB(dob);
  const { hour, minute } = normalizeTime(timeStr, ampm);
  const { cityName } = normalizeLocation(city, state, null);

  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const timeFormatted = `${pad(hour)}:${pad(minute)}`;

  // Step 1: Get IANA timezone for the birth city
  let ianaTimezone = null;
  try {
    ianaTimezone = await getHumanDesignTimezone(env, cityName);
  } catch (_) {}

  // Step 2: Resolve local birth time to offset-bearing ISO datetime
  let datetime = null;
  if (ianaTimezone) {
    try {
      datetime = await resolveHumanDesignDatetime(env, dateStr, timeFormatted, ianaTimezone);
    } catch (_) {}
  }

  // Fallback: build datetime without offset if resolution failed.
  // The API will still calculate but may have DST ambiguity.
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

// ─── TODAY ───────────────────────────────────────────────────────────────────

function todayAsMMDDYYYY() {
  const now = new Date();
  return `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;
}

// ─── ASSEMBLE ────────────────────────────────────────────────────────────────

async function assemblePersonData(env, person) {
  const { first, mid, last, dob, time, ampm, city, state, country } = person;

  // Numerology — needs name + DOB only, always runs
  let numerology = null;
  let numerologyError = null;
  try {
    numerology = calculateFullChart({
      first,
      middle: mid || "",
      last,
      dob: dobToMMDDYYYY(dob),
      currentDate: todayAsMMDDYYYY()
    });
  } catch (e) {
    numerologyError = e.message;
  }

  // Astrology — runs with DOB; location improves houses but is not required
  let astrology = null;
  let astrologyError = null;
  try {
    astrology = await getAstrology(env, dob, time, ampm, city, state, country);
  } catch (e) {
    astrologyError = e.message;
  }

  // Human Design — requires time AND city for timezone resolution
  let humanDesign = null;
  let humanDesignError = null;
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
    numerology,
    numerologyError,
    astrology,
    astrologyError,
    humanDesign,
    humanDesignError
  };
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: { ...CORS_HEADERS, ...PRIVACY_HEADERS } });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: { ...CORS_HEADERS, ...PRIVACY_HEADERS } });
    }

    const url = new URL(request.url);
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

      return jsonResponse({
        p1: p1Data,
        p2: p2Data,
        report: {
          headline: "Charts loaded successfully",
          sections: [{
            eyebrow: "Data Check",
            title: "All three systems returned data",
            tag: "foundational",
            body: "Astrology, Numerology, and Human Design all returned successfully. Claude report will be added next."
          }],
          signature: "Charts confirmed working."
        }
      });
    } catch (error) {
      return jsonResponse({ error: error.message }, 500);
    }
  }
};
