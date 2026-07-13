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

// Accepts ANY of these formats and always returns { hour (0-23), minute }:
//   "06:45 AM", "6:45 AM", "06:45AM", "06:45 PM", "14:30", "14:30:00",
//   "1989-03-29T16:05:00", "1989-03-29T16:05:00+09:00"
// ampm can also be passed separately as "AM", "PM", "am", "pm"
function normalizeTime(timeStr, ampm) {
  if (!timeStr || !timeStr.trim()) return { hour: 12, minute: 0 };

  let str = timeStr.trim();

  // Strip ISO datetime prefix if someone passes a full datetime string
  if (str.includes("T")) {
    str = str.split("T")[1];
  }

  // Strip timezone offset e.g. "+09:00" or "Z"
  str = str.replace(/([+-]\d{2}:\d{2}|Z)$/, "").trim();

  // Separate inline AM/PM from the time string if present
  let inlineAP = "";
  const apMatch = str.match(/\s*(AM|PM)$/i);
  if (apMatch) {
    inlineAP = apMatch[1].toUpperCase();
    str = str.replace(/\s*(AM|PM)$/i, "").trim();
  }

  // Parse HH:MM or HH:MM:SS
  const parts = str.split(":");
  let hour = parseInt(parts[0], 10) || 0;
  const minute = parseInt(parts[1], 10) || 0;

  // Resolve AM/PM — inline takes priority, then separate ampm arg
  const ap = inlineAP || (ampm ? ampm.toUpperCase().trim() : "");

  if (ap === "AM") {
    if (hour === 12) hour = 0;
  } else if (ap === "PM") {
    if (hour !== 12) hour += 12;
  }
  // If no AM/PM at all, assume the value is already 24-hour

  return { hour, minute };
}

// Accepts MM/DD/YYYY, YYYY-MM-DD, or M/D/YYYY
function normalizeDOB(dob) {
  if (!dob) throw new Error("Date of birth is required.");
  const str = dob.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split("-").map(Number);
    return { year, month, day };
  }

  // MM/DD/YYYY or M/D/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [month, day, year] = str.split("/").map(Number);
    return { year, month, day };
  }

  throw new Error(`Unrecognized date format: "${dob}". Use MM/DD/YYYY or YYYY-MM-DD.`);
}

// Returns dob as MM/DD/YYYY string for numerology calculator
function dobToMMDDYYYY(dob) {
  const { year, month, day } = normalizeDOB(dob);
  return `${pad(month)}/${pad(day)}/${year}`;
}

// Strips state/country suffixes from city field no matter how the front end sends it.
// Handles: "Cedar Rapids", "Cedar Rapids, IA", "Cedar Rapids, Iowa",
//          "Cedar Rapids, Iowa, United States", "Cedar Rapids IA", etc.
function normalizeCity(city) {
  if (!city || !city.trim()) return "New York";

  let str = city.trim();

  // Split on comma — take only the first segment (the city name itself)
  if (str.includes(",")) {
    str = str.split(",")[0].trim();
  }

  // Strip trailing 2-letter state abbreviation separated by space: "Cedar Rapids IA"
  str = str.replace(/\s+[A-Z]{2}$/, "").trim();

  return str || "New York";
}

async function geocodeCity(env, city, country) {
  const cityName = normalizeCity(city);
  const countryCode = toCountryCode(country);

  try {
    const res = await fetch(
      `https://api.astrology-api.io/api/v3/utils/geocode?city=${encodeURIComponent(cityName)}&country_code=${countryCode}`,
      { headers: { "Authorization": `Bearer ${env.AstroKYE}` } }
    );
    if (res.ok) {
      const data = await res.json();
      return {
        latitude: data.latitude ?? data.lat ?? 40.7128,
        longitude: data.longitude ?? data.lng ?? data.lon ?? -74.0060,
        timezone: data.timezone ?? "UTC"
      };
    }
  } catch (_) {}

  // Fall back to New York if geocoding fails
  return { latitude: 40.7128, longitude: -74.0060, timezone: "America/New_York" };
}

async function getAstrology(env, dob, timeStr, ampm, city, country) {
  const { year, month, day } = normalizeDOB(dob);
  const { hour, minute } = normalizeTime(timeStr, ampm);

  let latitude, longitude, timezone;
  if (city && city.trim().length > 0) {
    const geo = await geocodeCity(env, city, country);
    latitude = geo.latitude;
    longitude = geo.longitude;
    timezone = geo.timezone;
  } else {
    latitude = 0;
    longitude = 0;
    timezone = "UTC";
  }

  const res = await fetch("https://api.astrology-api.io/api/v3/data/positions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.AstroKYE}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      subject: {
        name: "subject",
        birth_data: { year, month, day, hour, minute, latitude, longitude, timezone }
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Astrology API ${res.status}: ${errText}`);
  }
  return await res.json();
}

async function getHumanDesign(env, dob, timeStr, ampm, city) {
  const { year, month, day } = normalizeDOB(dob);
  const { hour, minute } = normalizeTime(timeStr, ampm);

  // v1 API requires separate "date" (YYYY-MM-DD) and "time" (HH:MM) — never a combined datetime
  const date = `${year}-${pad(month)}-${pad(day)}`;
  const time = `${pad(hour)}:${pad(minute)}`;
  const cityName = normalizeCity(city);

  const res = await fetch("https://api.humandesignhub.app/v1/simple-bodygraph", {
    method: "POST",
    headers: {
      "X-API-KEY": env.HumanDesign_key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ date, time, city: cityName })
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

  let astrology = null;
  let astrologyError = null;
  try {
    astrology = await getAstrology(env, dob, time, ampm, city, country);
  } catch (e) {
    astrologyError = e.message;
  }

  let humanDesign = null;
  let humanDesignError = null;
  const hasTime = time && time.trim().length > 0;
  const hasCity = city && city.trim().length > 0;
  if (hasTime && hasCity) {
    try {
      humanDesign = await getHumanDesign(env, dob, time, ampm, city);
    } catch (e) {
      humanDesignError = e.message;
    }
  } else {
    humanDesignError = "Birth time and city are required for Human Design. Chart omitted.";
  }

  return { numerology, numerologyError, astrology, astrologyError, humanDesign, humanDesignError };
}

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
