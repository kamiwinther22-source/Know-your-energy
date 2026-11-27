import { calculateFullChart } from "./numerology-calculator.js";

import { computeAstrology } from "./astro-engine.js";
import { searchCities } from "./cities.js";

// The two requests that cost money (writing a reading and fetching Human Design charts) are only accepted when the
// browser says they come from our own web page. Browsers always send this header and a web page on another site cannot
// change it. A program that is not a browser can fake it, so this stops other sites and casual misuse, not a determined person.
const OUR_SITE_ORIGINS = [ "https://know-your-energy.com", "https://www.know-your-energy.com" ];

function fromOurSite(request) {
  return OUR_SITE_ORIGINS.includes(request.headers.get("Origin"));
}

function notFromOurSite() {
  return new Response(JSON.stringify({
    error: "Invalid request."
  }), {
    status: 403,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

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

const TZ_CITY = {
  "America/New_York": "New York",
  "America/Chicago": "Chicago",
  "America/Denver": "Denver",
  "America/Phoenix": "Phoenix",
  "America/Los_Angeles": "Los Angeles",
  "America/Anchorage": "Anchorage",
  "Pacific/Honolulu": "Honolulu"
};

function getAstrologyLocal(dob, timeStr, ampm, city, state, country, tz) {
  const {year: year, month: month, day: day} = normalizeDOB(dob);
  const hasRealTime = !!(timeStr && timeStr.trim());
  const hasRealCity = !!(city && city.trim());
  const {hour: hour, minute: minute} = normalizeTime(timeStr, ampm);
  const useTzCity = !hasRealCity && tz && TZ_CITY[tz];
  const {cityName: cityName, countryCode: countryCode} = normalizeCity(useTzCity ? TZ_CITY[tz] : city, useTzCity ? "" : state, useTzCity ? "US" : country);
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
  const locationNotFound = result.location.source === "fallback-default" && hasRealCity;
  const hasRealLocation = hasRealCity && !locationNotFound;
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
    result.acg = null;   // the map needs the exact birth time and place
    result.timeUnknown = !hasRealTime;
    result.locationUnknown = !hasRealLocation;
  }
  if (locationNotFound) result.locationNotFound = city;
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

async function getHumanDesign(env, dob, timeStr, ampm, city, state, tzFallback) {
  const {year: year, month: month, day: day} = normalizeDOB(dob);
  const {hour: hour, minute: minute} = normalizeTime(timeStr, ampm);
  const {cityName: cityName} = normalizeCity(city, state, null);
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const timeFormatted = `${pad(hour)}:${pad(minute)}`;
  let datetime = null;
  let timezone = city && city.trim() ? await getHDTimezone(env, cityName) : null;
  if (!timezone && tzFallback && TZ_CITY[tzFallback]) timezone = tzFallback;
  if (timezone) {
    datetime = await resolveHDDatetime(env, dateStr, timeFormatted, timezone);
  }
  if (!datetime) {
    throw new Error(`Could not resolve a timezone for "${cityName}". Human Design needs the exact UTC moment of birth. Choose a time zone under the city box, or pick the nearest larger city.`);
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
  const {first: first, mid: mid, last: last, dob: dob, time: time, ampm: ampm, city: city, state: state, country: country, tz: tz} = person;
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
    astrology = getAstrologyLocal(dob, time, ampm, city, state, country, tz);
  } catch (e) {
    astrologyError = e.message;
  }
  let humanDesign = null, humanDesignError = null;
  const hasTime = time && time.trim().length > 0;
  const hasCity = city && city.trim().length > 0;
  const hasZone = !!(tz && TZ_CITY[tz]);
  if (hasTime && (hasCity || hasZone)) {
    try {
      humanDesign = await getHumanDesign(env, dob, time, ampm, city, state, tz);
    } catch (e) {
      humanDesignError = e.message;
    }
  } else {
    humanDesignError = "Birth time and either a birth city or a time zone are required for Human Design. Chart omitted.";
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

const UNLIMITED_DURATION_MS = 366 * 24 * 60 * 60 * 1e3;

// Synchronous SHA-256 (hex). Used so the unlimited-access list below can hold fingerprints, not addresses.
function sha256Hex(str) {
  const K = [ 1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298 ];
  const H = [ 1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225 ];
  const bytes = Array.from(new TextEncoder().encode(str));
  const bitLen = bytes.length * 8;
  bytes.push(128);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : bitLen >>> i * 8 & 255);
  const w = new Array(64), rr = (x, n) => x >>> n | x << 32 - n;
  for (let o = 0; o < bytes.length; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = (bytes[o + i * 4] << 24 | bytes[o + i * 4 + 1] << 16 | bytes[o + i * 4 + 2] << 8 | bytes[o + i * 4 + 3]) >>> 0;
    for (let i = 16; i < 64; i++) {
      const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ w[i - 15] >>> 3, s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ w[i - 2] >>> 10;
      w[i] = w[i - 16] + s0 + w[i - 7] + s1 >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = h + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + (e & f ^ ~e & g) + K[i] + w[i] >>> 0;
      const t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + (a & b ^ a & c ^ b & c) >>> 0;
      h = g; g = f; f = e; e = d + t1 >>> 0; d = c; c = b; b = a; a = t1 + t2 >>> 0;
    }
    H[0] = H[0] + a >>> 0; H[1] = H[1] + b >>> 0; H[2] = H[2] + c >>> 0; H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0; H[5] = H[5] + f >>> 0; H[6] = H[6] + g >>> 0; H[7] = H[7] + h >>> 0;
  }
  return H.map(x => x.toString(16).padStart(8, "0")).join("");
}

// Addresses with unlimited access, stored as salted SHA-256 fingerprints so the addresses themselves are not in the code.
const UNLIMITED_EMAIL_HASHES = ["d3537956dea4a7d3936ce446b67bad6b18a3461c4a448b8619dbeca3fc0ac04b","e11ce37d7b6d96139b5bd2a156284c2b7874e606b45966d0ecc516010f6ae48d","6c62a787fa8344697497c1ac159bf7b8c32a219b44f59daf997379d51bc371f0"];

function isUnlimitedEmail(email) {
  return UNLIMITED_EMAIL_HASHES.includes(sha256Hex("kye-unlimited-v1:" + String(email || "").trim().toLowerCase()));
}

function passKey(email) {
  return `pass:${email.trim().toLowerCase()}`;
}

// ---- Phone unlock (passkeys). The site stores a random public code per phone, never a name, email, face or fingerprint. ----
const WA_RP_ID = "know-your-energy.com";
const WA_ORIGINS = ["https://know-your-energy.com", "https://www.know-your-energy.com"];
const WA_TOKEN_NO_PASS_TTL_S = 86400;
const WA_TOKEN_MAX_TTL_S = 400 * 86400;
const WA_NEW_PER_IP_PER_DAY = 10;

function b64uToBytes(s) {
  s = String(s || "").replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64u(b) {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesToHex(b) {
  return Array.from(b).map(x => x.toString(16).padStart(2, "0")).join("");
}

async function sha256Bytes(bytes) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

// Minimal CBOR reader: enough for passkey attestation objects and public keys.
function cborDecode(buf, pos = 0) {
  const first = buf[pos++];
  const major = first >> 5;
  const info = first & 31;
  let val;
  if (info < 24) val = info;
  else if (info === 24) { val = buf[pos]; pos += 1; }
  else if (info === 25) { val = (buf[pos] << 8) | buf[pos + 1]; pos += 2; }
  else if (info === 26) { val = ((buf[pos] << 24) | (buf[pos + 1] << 16) | (buf[pos + 2] << 8) | buf[pos + 3]) >>> 0; pos += 4; }
  else if (major === 7) val = 0;
  else throw new Error("cbor: unsupported length");
  if (major === 0) return [val, pos];
  if (major === 1) return [-1 - val, pos];
  if (major === 2) return [buf.slice(pos, pos + val), pos + val];
  if (major === 3) return [new TextDecoder().decode(buf.slice(pos, pos + val)), pos + val];
  if (major === 4) {
    const arr = [];
    for (let i = 0; i < val; i++) { const [v, p] = cborDecode(buf, pos); arr.push(v); pos = p; }
    return [arr, pos];
  }
  if (major === 5) {
    const m = new Map();
    for (let i = 0; i < val; i++) {
      const [k, p1] = cborDecode(buf, pos);
      const [v, p2] = cborDecode(buf, p1);
      m.set(k, v);
      pos = p2;
    }
    return [m, pos];
  }
  if (major === 7) return [info === 20 ? false : info === 21 ? true : null, pos];
  throw new Error("cbor: unsupported type");
}

function parseClientData(b64) {
  const raw = b64uToBytes(b64);
  return { raw, json: JSON.parse(new TextDecoder().decode(raw)) };
}

async function checkClientData(env, cd, type) {
  if (cd.json.type !== type) throw new Error("wrong type");
  if (!WA_ORIGINS.includes(cd.json.origin)) throw new Error("wrong origin");
  const ck = "chal:" + cd.json.challenge;
  if (!(await env.PASSES.get(ck))) throw new Error("challenge expired");
  await env.PASSES.delete(ck);
}

async function checkAuthData(ad, needAttested) {
  if (ad.length < 37) throw new Error("short authData");
  if (!bytesEqual(ad.slice(0, 32), await sha256Bytes(new TextEncoder().encode(WA_RP_ID)))) throw new Error("wrong rp");
  if (!(ad[32] & 1)) throw new Error("no user presence");
  if (needAttested && !(ad[32] & 64)) throw new Error("no credential data");
}

// Stores the new phone's public key. Returns the credential's stable id.
async function waRegister(env, body) {
  const cd = parseClientData(body.clientDataJSON);
  await checkClientData(env, cd, "webauthn.create");
  const [att] = cborDecode(b64uToBytes(body.attestationObject));
  const ad = att.get("authData");
  await checkAuthData(ad, true);
  let p = 37 + 16;
  const idLen = (ad[p] << 8) | ad[p + 1];
  p += 2;
  const credId = ad.slice(p, p + idLen);
  p += idLen;
  const [cose] = cborDecode(ad, p);
  const kty = cose.get(1), alg = cose.get(3);
  let jwk, algo;
  if (kty === 2 && alg === -7) {
    jwk = { kty: "EC", crv: "P-256", x: bytesToB64u(cose.get(-2)), y: bytesToB64u(cose.get(-3)) };
    algo = "es256";
  } else if (kty === 3 && alg === -257) {
    jwk = { kty: "RSA", alg: "RS256", n: bytesToB64u(cose.get(-1)), e: bytesToB64u(cose.get(-2)), ext: true };
    algo = "rs256";
  } else throw new Error("unsupported key");
  const id = bytesToHex(await sha256Bytes(credId)).slice(0, 32);
  await env.PASSES.put("cred:" + id, JSON.stringify({ algo, jwk, created: Date.now() }));
  return id;
}

function derToRaw(der) {
  // ECDSA signature from DER (SEQUENCE of two INTEGERs) to 64-byte r||s
  let p = 2;
  if (der[1] & 0x80) p += der[1] & 0x7f;
  const rd = i => {
    if (der[i] !== 2) throw new Error("bad sig");
    const len = der[i + 1], s = i + 2;
    let v = der.slice(s, s + len);
    while (v.length > 32 && v[0] === 0) v = v.slice(1);
    const out = new Uint8Array(32);
    out.set(v, 32 - v.length);
    return [out, s + len];
  };
  const [r, n] = rd(p);
  const [s] = rd(n);
  const raw = new Uint8Array(64);
  raw.set(r, 0);
  raw.set(s, 32);
  return raw;
}

// Checks a phone's unlock. Returns the credential's stable id.
async function waAuthenticate(env, body) {
  const cd = parseClientData(body.clientDataJSON);
  await checkClientData(env, cd, "webauthn.get");
  const ad = b64uToBytes(body.authenticatorData);
  await checkAuthData(ad, false);
  const credId = b64uToBytes(body.credentialId);
  const id = bytesToHex(await sha256Bytes(credId)).slice(0, 32);
  const rec = await env.PASSES.get("cred:" + id);
  if (!rec) throw new Error("unknown phone");
  const { algo, jwk } = JSON.parse(rec);
  const signed = new Uint8Array(ad.length + 32);
  signed.set(ad, 0);
  signed.set(await sha256Bytes(cd.raw), ad.length);
  const sig = b64uToBytes(body.signature);
  let ok;
  if (algo === "es256") {
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, derToRaw(sig), signed);
  } else {
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, signed);
  }
  if (!ok) throw new Error("bad signature");
  return id;
}

async function waIssueToken(env, id) {
  const t = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  // the browser's sign-in lasts as long as the pass does; with no pass it lasts one day (enough for the free reading and its day reading)
  let ttl = WA_TOKEN_NO_PASS_TTL_S;
  try {
    const st = await checkPassRecord(env, id + "@kye.device");
    if (st.active && st.expiresAt) ttl = Math.min(WA_TOKEN_MAX_TTL_S, Math.max(60, Math.ceil((st.expiresAt - Date.now()) / 1e3)));
  } catch (e) {}
  await env.PASSES.put("tok:" + sha256Hex(t), JSON.stringify({ id, t: Date.now() }), { expirationTtl: ttl });
  return t;
}

// ---- The owner key. One private key for the owner and family, kept only as a one-way hash (never the key itself). ----
// A device that enters it is remembered with no expiry and gets unlimited use of the site and access to the private page at /owner.
// The hash (and the epoch, below) live only as Cloudflare secrets (env.OWNER_KEY_HASH, env.OWNER_KEY_EPOCH) -- never in this
// public repository. Set or change them in the Cloudflare dashboard (Workers & Pages -> this worker -> Settings -> Variables
// and Secrets), not here. If OWNER_KEY_HASH is not set, no key can unlock a new device, but devices already remembered keep
// working. To sign every device out (for example if the key leaks), set a new key's hash and raise OWNER_KEY_EPOCH by one.
function ownerKeyEpoch(env) {
  return Number(env.OWNER_KEY_EPOCH) || 1;
}
const OWNER_KEY_TRIES_PER_IP_PER_DAY = 20;

function ownerKeyHash(key) {
  return sha256Hex("kye-owner-v1:" + String(key || "").toUpperCase().replace(/[^A-Z0-9]/g, ""));
}

// Creates a new remembered device for the owner or family: a token that never expires, and unlimited use for that device.
async function issueOwnerToken(env) {
  const id = "own" + bytesToHex(crypto.getRandomValues(new Uint8Array(12)));
  const t = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  await env.PASSES.put("tok:" + sha256Hex(t), JSON.stringify({ id, t: Date.now(), owner: true, epoch: ownerKeyEpoch(env) }));
  await env.PASSES.put("fam:" + id + "@kye.device", "1");
  return t;
}

async function readToken(env, value) {
  const m = /^([a-f0-9]{64})(@kye\.device)?$/.exec(String(value || "").trim().toLowerCase());
  if (!m) return null;
  const raw = await env.PASSES.get("tok:" + sha256Hex(m[1]));
  if (!raw) return null;
  const rec = JSON.parse(raw);
  if (rec.owner && rec.epoch !== ownerKeyEpoch(env)) return null;
  return rec;
}

// A request's "email" is now "<token>@kye.device". Returns the phone's stable identity string, or null if the token is unknown or expired.
async function resolveIdentity(env, value) {
  if (!/@kye\.device$/i.test(String(value || "").trim())) return null;
  const rec = await readToken(env, value);
  return rec ? rec.id + "@kye.device" : null;
}

// True only for a device that has entered the owner key.
async function resolveOwner(env, value) {
  const rec = await readToken(env, value);
  return !!(rec && rec.owner);
}

// Asks Cloudflare whether a Turnstile token is genuine, unused and from our own pages. Any failure to reach Cloudflare counts as not passed.
async function verifyTurnstile(env, token) {
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  try {
    const form = new URLSearchParams();
    form.set("secret", env.TURNSTILE_SECRET);
    form.set("response", token);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const j = await r.json();
    return !!(j && j.success === true && (!j.hostname || WA_ORIGINS.includes("https://" + j.hostname)));
  } catch (e) {
    return false;
  }
}

async function handleAuth(request, env, url) {
  let body = {};
  try { body = await request.json(); } catch (e) {}
  try {
    if (url.pathname === "/auth/start") {
      const ip = request.headers.get("CF-Connecting-IP") || "";
      if (body.mode === "create") {
        // bot check (Cloudflare Turnstile): a new unlock is only made for a visitor who passes it. Switched on when the TURNSTILE_SECRET secret is set.
        if (env.TURNSTILE_SECRET && !(await verifyTurnstile(env, body.ts))) return jsonResponse({ error: "We could not confirm you are a person. Please try again." }, 403);
        const day = new Date().toISOString().slice(0, 10);
        const k = "newcred:" + sha256Hex("kye-ip-v1:" + ip) + ":" + day;
        const n = parseInt(await env.PASSES.get(k) || "0", 10);
        if (n >= WA_NEW_PER_IP_PER_DAY) return jsonResponse({ error: "Too many new phones from this connection today. Please try again tomorrow." }, 429);
        await env.PASSES.put(k, String(n + 1), { expirationTtl: 2 * 86400 });
      }
      const challenge = bytesToB64u(crypto.getRandomValues(new Uint8Array(32)));
      await env.PASSES.put("chal:" + challenge, "1", { expirationTtl: 300 });
      const userId = bytesToB64u(crypto.getRandomValues(new Uint8Array(16)));
      return jsonResponse({ challenge, userId, rpId: WA_RP_ID });
    }
    if (url.pathname === "/auth/finish") {
      const id = body.mode === "create" ? await waRegister(env, body) : await waAuthenticate(env, body);
      const token = await waIssueToken(env, id);
      return jsonResponse({ ok: true, email: token + "@kye.device" });
    }
    if (url.pathname === "/auth/key") {
      const day = new Date().toISOString().slice(0, 10);
      const tk = "keytry:" + sha256Hex("kye-ip-v1:" + (request.headers.get("CF-Connecting-IP") || "")) + ":" + day;
      const tries = parseInt(await env.PASSES.get(tk) || "0", 10);
      if (tries >= OWNER_KEY_TRIES_PER_IP_PER_DAY) return jsonResponse({ error: "Too many tries from this connection today. Please try again tomorrow." }, 429);
      if (!env.OWNER_KEY_HASH || !sameKey(ownerKeyHash(body.key), env.OWNER_KEY_HASH)) {
        await env.PASSES.put(tk, String(tries + 1), { expirationTtl: 2 * 86400 });
        return jsonResponse({ error: "That key is not right." }, 403);
      }
      const token = await issueOwnerToken(env);
      return jsonResponse({ ok: true, token, email: token + "@kye.device" });
    }
  } catch (e) {
    return jsonResponse({ error: "The unlock could not be verified. Please try again." }, 400);
  }
  return jsonResponse({ error: "Not found." }, 404);
}

// Free-reading tracking. One record per email once their first reading has been delivered.
// The one-free-reading limit is always enforced at /report: an email that is not on the unlimited list, has no active
// pass and has already had its free reading is refused. (The page also locks the form for such an email.)
// PAYMENTS_ENABLED is kept for when a payment processor exists; it does not control the free-reading limit.
const PAYMENTS_ENABLED = false;

// Anonymous counters for what people do after a reading. No email, no name, no birth details.
const EVENT_NAMES = [ "run_another", "date_check", "save_print", "page_load", "real_visit" ];

async function eventTotals(env) {
  const keys = await listAll(env, "evt:");
  const now = Date.now();
  const out = {};
  EVENT_NAMES.forEach(n => out[n] = {
    d1: 0,
    d7: 0,
    d30: 0,
    total: 0
  });
  for (const k of keys) {
    const m = k.metadata || {};
    if (!out[m.name]) continue;
    const age = now - new Date(m.d + "T00:00:00Z").getTime();
    out[m.name].total += m.n || 0;
    if (age < 2 * 864e5) out[m.name].d1 += m.n || 0;
    if (age < 8 * 864e5) out[m.name].d7 += m.n || 0;
    if (age < 31 * 864e5) out[m.name].d30 += m.n || 0;
  }
  return out;
}

function seenKeyFor(email) {
  return `seen:${email.trim().toLowerCase()}`;
}

async function listAll(env, prefix) {
  const out = [];
  let cursor;
  do {
    const page = await env.PASSES.list({
      prefix,
      cursor,
      limit: 1000
    });
    out.push(...page.keys);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out;
}

function sameKey(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function adminUsers(env) {
  let [seen, free, passes, usageRaw] = await Promise.all([ listAll(env, "seen:"), listAll(env, "free:"), listAll(env, "pass:"), env.PASSES.get(USAGE_KV_KEY) ]);
  const fam = k => isUnlimitedEmail(k.name.slice(k.name.indexOf(":") + 1));
  seen = seen.filter(k => !fam(k));
  free = free.filter(k => !fam(k));
  const users = new Map;
  const row = email => {
    if (!users.has(email)) users.set(email, {
      email,
      firstSeen: null,
      freeUsedAt: null,
      pass: null
    });
    return users.get(email);
  };
  for (const k of seen) row(k.name.slice(5)).firstSeen = (k.metadata && k.metadata.t) || null;
  for (const k of free) row(k.name.slice(5)).freeUsedAt = (k.metadata && k.metadata.t) || true;
  for (const k of passes) {
    const email = k.name.slice(5);
    if (isUnlimitedEmail(email)) continue;
    const raw = await env.PASSES.get(k.name);
    if (!raw) continue;
    try {
      const rec = JSON.parse(raw);
      row(email).pass = {
        plan: rec.plan,
        expiresAt: rec.expiresAt
      };
    } catch (e) {}
  }
  const list = [ ...users.values() ].sort((a, b) => (b.firstSeen || b.freeUsedAt || 0) - (a.firstSeen || a.freeUsedAt || 0));
  const usage = usageRaw ? JSON.parse(usageRaw) : {
    requests: 0
  };
  const within = (keys, ms) => keys.filter(k => k.metadata && k.metadata.t && k.metadata.t >= Date.now() - ms).length;
  return {
    totals: {
      emailsEntered: seen.length,
      freeReadingsUsed: free.length,
      activePasses: list.filter(u => u.pass && u.pass.expiresAt > Date.now()).length,
      readingsGenerated: usage.requests || 0,
      newEmails24h: within(seen, 864e5),
      newEmails7d: within(seen, 7 * 864e5),
      newEmails30d: within(seen, 30 * 864e5),
      readings24h: within(free, 864e5),
      readings7d: within(free, 7 * 864e5)
    },
    events: await eventTotals(env),
    users: list
  };
}

function freeKey(email) {
  return `free:${email.trim().toLowerCase()}`;
}

// Marks that a free reading is being written right now for this email, so a second one cannot be started in parallel.
// It is removed when the reading finishes or fails, and expires by itself after 10 minutes if the Worker is cut off.
function claimKeyFor(email) {
  return `claim:${email.trim().toLowerCase()}`;
}

async function freeReadingUsed(env, email) {
  if (!email) return false;
  return !!(await env.PASSES.get(freeKey(email)));
}

function jobKey(jobId) {
  return `job:${jobId}`;
}

// Pass records hold the email's plan and expiry only. No names, birth dates or places are kept.
// Older records that still carry saved birth details are cleaned the next time they are read.
async function cleanPassRecord(env, key, record, remainingTtlSeconds) {
  if (!record || (!record.p1 && !record.p2)) return record;
  delete record.p1;
  delete record.p2;
  try {
    await env.PASSES.put(key, JSON.stringify(record), remainingTtlSeconds > 0 ? {
      expirationTtl: remainingTtlSeconds
    } : undefined);
  } catch (e) {}
  return record;
}

async function checkPassRecord(env, email) {
  if (!email) return {
    active: false,
    freeReadingUsed: false
  };
  const used = await freeReadingUsed(env, email);
  const key = passKey(email);
  const raw = await env.PASSES.get(key);
  if (isUnlimitedEmail(email) || await env.PASSES.get("fam:" + email)) {
    if (raw) {
      await cleanPassRecord(env, key, JSON.parse(raw), Math.ceil(UNLIMITED_DURATION_MS / 1e3));
    }
    return {
      active: true,
      freeReadingUsed: used,
      plan: "unlimited",
      expiresAt: Date.now() + UNLIMITED_DURATION_MS
    };
  }
  if (!raw) return {
    active: false,
    freeReadingUsed: used
  };
  const record = JSON.parse(raw);
  if (record.expiresAt < Date.now()) return {
    active: false,
    freeReadingUsed: used
  };
  await cleanPassRecord(env, key, record, Math.ceil((record.expiresAt - Date.now()) / 1e3));
  return {
    active: true,
    freeReadingUsed: used,
    plan: record.plan,
    expiresAt: record.expiresAt
  };
}

const USAGE_KV_KEY = "usage:totals";

// Countries whose visitors are turned away (two-letter codes, e.g. ["XX"]). Empty means no country is blocked.
const BLOCKED_COUNTRIES = [];

// Most the free readings may cost per day (US dollars), and a conservative estimate of what one costs. When the day's free readings reach the cap,
// the next free reading waits until tomorrow. Pass holders are never held back by it. Override with the DAILY_FREE_CAP_USD variable.
const DAILY_FREE_CAP_USD = 10;
const FREE_READING_COST_USD = 0.15;
const dayKey = () => `freecount:${new Date().toISOString().slice(0, 10)}`;
async function freeCapReached(env) {
  const cap = Number(env.DAILY_FREE_CAP_USD) > 0 ? Number(env.DAILY_FREE_CAP_USD) : DAILY_FREE_CAP_USD;
  const n = Number(await env.PASSES.get(dayKey())) || 0;
  return n * FREE_READING_COST_USD >= cap;
}
async function countFreeReading(env) {
  const key = dayKey();
  const n = Number(await env.PASSES.get(key)) || 0;
  await env.PASSES.put(key, String(n + 1), { expirationTtl: 3 * 86400 });
  return key;
}
// Gives one back when a free reading was counted but never delivered, so a failed reading does not use up someone else's place in the day's free readings.
async function uncountFreeReading(env, key) {
  try {
    const n = Number(await env.PASSES.get(key)) || 0;
    if (n > 0) await env.PASSES.put(key, String(n - 1), { expirationTtl: 3 * 86400 });
  } catch (e) {
    console.error(`[report] could not give back the free-reading count: ${e.message}`);
  }
}

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

const REPORT_SYSTEM_PROMPT = `Check the person's current age before writing anything about love, dating, or sex. Under 18: none of it, ever.\n\n### ABSOLUTE RULES (zero exceptions)\n1. Single reading: address the person as "you" in every sentence. Never their name, never "she/he/her/him/they."\n2. Two-person reading: use each person's first name in every sentence about them. Never a label like "Partner A."\n3. Never name a placement, aspect, cycle, return, number, or degree in the prose. State what it produces. Cite it once, in references.\n4. Never intensify a claim before stating it plainly ("real tension," "genuine need," "deep restlessness," and any synonym doing the same job). State it as settled fact.\n5. Return one JSON object only -- no markdown, no text before or after it.\n6. One point, one place. State each trait, need, or pattern in exactly one section -- the one where it matters most -- even when several placements produce it or it touches several areas of life. A later section may point back to it in a few words. It never explains it again.\n\n### ROLE\nYou are an expert astrologer and numerologist -- use your full depth of knowledge in both systems, never a shortened or generic version. You already know what every placement or number means, so skip the definition: dig past the first meaning that comes to mind for what it actually means for this person, and don't reduce it to one trait when it carries several. Depth includes chart position -- the same Karmic Debt means something different in a Life Path than in a Birthday number. Write in plain, practical language -- what the person does, feels, or experiences -- never mystical or dressed-up phrasing that sounds profound but says little.\n\n### COVERAGE\n- Thorough means depth on what the data actually supports, not length for its own sake.\n- Don't omit anything the data indicates due to political correctness -- accuracy is the goal, not caution: family relationships, intimate or sexual patterns, work, social life, education, public life, faith or a higher power when a placement's tradition actually includes it, or anything else the data supports.\n- Cover what's important to them, how they handle closeness, what drives them, how they experience change, and any other theme the data supports.\n- Build every point around BOTH astrology and numerology together, never one system alone. If both point at the same trait, say it once, using both as evidence.\n- Weight each point by how much the actual data weighs toward it, not evenly.\n- Parent/child reading: name what parental actions the chart data indicates would break the bond with the child, and what approach maintains it instead.\n\n### RELATIONAL READINGS (two-person)\nBefore writing, find the connection points between the two charts -- not everything technically present, only what two people would actually notice or feel between them.\n- Astrology: Sun-Moon cross-aspects, Venus-Mars, Moon-Moon, any tight conjunction from one person's planet onto the other's planet, angle, or Chiron. Also check whether either person's active astrological return (see Cycles & Timing below) lands on a placement in the other person's chart.\n- Numerology: using the raw data and your own full training knowledge, find the data points with the biggest relational influence and state exactly what the interaction produces in practical language -- detailed enough that nothing is left as a theme or category to interpret further.\n- Human Design: only when a "Human Design connection" line is given. Cover exactly what it describes -- energy the two people generate together that neither has alone, or one person's steady definition reaching a center the other doesn't have on their own. Never bring in either person's Type, Strategy, or Authority (how they make decisions) here -- that content is out of scope for this reading and already implied by the rest of the chart.\n- Connection comes first: establish what draws the two people together before covering friction or self-protection.\n- A section describing friction, withdrawal, or a gap can't end there -- state what each person would actually need to feel reconnected, as an observational fact about that one person, never a formula and never advice. Don't claim the other person can meet that need unless the data supports it -- state what they're actually most likely to do instead.\n- Describe the relationship itself, not each person's individual process.\n\n### HOW TO WRITE\n- Write every sentence as something the person will do, feel, notice, or decide, or something that gets easier or harder for them, naming the who, what, and where.\n- There's no target length -- don't pad or reword to fill space. The more directly something is stated, the more content fits.\n- Never parrot this prompt's own instructions back in the reading.\n\n### CYCLES & TIMING\n- Every time-bound element -- big cycles, astrological returns, Personal Month, Personal Day -- states its real time span in the prose (the age, year, month, week, or day it covers) instead of its technical name (Rule 3). "Right now" alone is not a time span.\n- Big cycles (Personal Year, Essence, Pinnacle, Period Cycle, Challenge) plus any active return describe ONE life stage -- combine them into a single explanation of where this person stands right now. A Personal Year 1 inside a Pinnacle 3 reads differently than inside a Pinnacle 9: give concrete examples grounded in the full chart(s) for what this stretch is likely to be felt and noticed as, which choices or mindset actually produce the outcomes it supports, what changes on entering the next phase and when, and how to prepare for what the next big cycles will ask of them.\n- Personal Month and Day are a separate, much shorter timescale -- don't merge them into the life-stage picture above. Mention them only when there's something significant to say.\n- Two-person: explain how each person's current cycles affect how the two of them experience each other right now.\n- You're given astrology and numerology data only, no transit data. If birth time is missing, Ascendant/Midheaven/houses are missing with it -- leave them out, don't guess. Named astrological returns -- Saturn Return (~29, 58, or 87), Jupiter Return (~every 12 years), Uranus Opposition (~40-42), Chiron Return (~50) -- apply only when the person's current age is inside that window.\n\n### ASTROLOGY DATA RULES\n- Weigh a planet's major aspects before its sign -- a tight conjunction, square, or opposition outweighs the sign; a wide trine or sextile barely changes it.\n- Use a planet's actual house, never the house tied to its ruling sign.\n- Never label an aspect "easy" or "tense" -- state what it produces (How to Write).\n- Read the data provided and report what you see, clearly and concisely.\n\n### OUTPUT FORMAT\n{\n  "headline": "One short, specific line for the whole reading. Follows ABSOLUTE RULE 3.",\n  "sections": [\n    {\n      "eyebrow": "Short label for this section",\n      "title": "A specific title for this section",\n      "body": "Prose made of separate, specific claims -- not narrated as one continuous flow. Follows ABSOLUTE RULE 3."\n    }\n  ],\n  "references": ["Every placement, aspect, cycle, and number the reading draws on, short technical shorthand, degrees included, one per entry."]\n}\nDivide the reading into as many sections as the content naturally requires -- no fixed topic list, no fixed section count. Give each section its own specific title and eyebrow.`;

const HD_ONLY_RELATIONAL_SYSTEM_PROMPT = `Check the person's current age before writing anything about love, dating, or sex. Under 18: none of it, ever.\n\nYou are an expert in Human Design. This reading is a deliberate experiment: it uses ONLY Human Design data for two people -- no astrology, no numerology -- so its value can be judged on its own. Draw on your own extensive knowledge of the Human Design system, not a shortened version of it, to explain what each person's Type, Strategy, Authority, Profile, Centers, and Gates/Channels actually mean for them individually and for how these two people affect each other.\n\nYou are given each person's full raw Human Design chart data, whatever fields the source returned. Use whatever is actually present; do not invent a field that isn't there.\n\nFor the relational content specifically: state what pulls these two people together before covering friction -- connection comes first. Look specifically for whether one person's defined Center consistently fills the other's undefined one (a distinct Human Design relational mechanism -- state what that produces for each of them, not just that it exists), any Channel completed between the two charts using one gate from each person, and how their two Types/Strategies/Authorities interact when they try to make a decision or take action together.\n\nA relational section that describes friction or a gap between the two people can't end there -- state what each person would actually need in order to feel reconnected, as an observational fact about that one person, never as advice and never as a formula. Don't claim the other person is capable of meeting that need unless the data actually supports it.\n\nDescribe the two people, not the chart. Every sentence uses their first names. A Type, Center, Gate, or Channel can prove a claim true -- it can never be the claim itself. State what each person does, wants, or feels; the Human Design detail is the reason why, not the claim.\n\nState each fact once. Be as direct and concise as the depth allows -- no padding, no repeating the same point reworded.\n\n### NON-NEGOTIABLE\n- First names, every time -- never a label like "Person One."\n- Describe the relationship itself, not each person's individual process alone.\n\n### OUTPUT FORMAT\nReturn only a single JSON object. No markdown, no text outside it:\n{\n  "headline": "One short, specific line for the whole reading. No system names or Human Design jargon (Type/Gate/Channel names), stated as plain fact instead.",\n  "sections": [\n    {\n      "eyebrow": "Short label for this section",\n      "title": "A specific title for this section",\n      "body": "Prose made of separate, specific claims -- not narrated as one continuous flow. Same naming restriction as headline."\n    }\n  ],\n  "references": ["Every Human Design detail actually used (Type, Authority, Profile, Center, Gate, Channel), short technical shorthand, one per entry."]\n}\nDivide the reading into as many sections as the content naturally requires.`;

// An "Other" relationship is unspecified (coworker, sibling, relative, friend, neighbour...). It must never be read as romantic. Returns nothing for every other type.
function relationshipNote(relLabel) {
  if (String(relLabel || "").trim().toLowerCase() !== "other") return "";
  return `\nRelationship note: "other" means the relationship is not specified. It could be a coworker, sibling, relative, friend, neighbor, or anyone else. Do not assume or imply that it is romantic or sexual. Do not write about romantic appreciation, attraction, dating, intimacy or love. Describe how these two people communicate, handle disagreement, support each other and affect each other's energy, in language that fits any kind of relationship.`;
}

function buildHDOnlyRelationalPrompt(relLabel, p1, p2) {
  const hdBlock = p => `${p.first}${p.last ? " " + p.last : ""}:\n${p.humanDesign ? JSON.stringify(p.humanDesign) : "No Human Design chart available."}`;
  return `Relationship type: ${relLabel}${relationshipNote(relLabel)}\n${hdBlock(p1)}\n${hdBlock(p2)}`;
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

// A two-person reading is built only from what both charts can supply. If either person's chart lacks the birth time or place,
// every item that depends on them is left out for BOTH people, so the reading never has to explain what is missing.
function relationalTimeLeftOut(rtype, p1, p2) {
  if (rtype !== "two-person" || !p2) return false;
  return [ p1, p2 ].some(p => {
    const a = p && p.astrology || {};
    return !!(a.timeUnknown || a.locationUnknown);
  });
}

// What is left of one person's astrology when the time-based items are removed: no Ascendant, Midheaven, houses or house numbers,
// and no planet or point whose sign could not be settled without the time (nor any aspect that names one).
function withoutTimeBasedItems(a0) {
  const points = [ ...a0.planets || [], a0.northNode, a0.southNode, a0.chiron, a0.lilith ];
  const unsure = new Set(points.filter(b => b && b.signUncertain).map(b => b.name));
  const keep = b => b && !b.signUncertain ? b : null;
  const noAngles = x => ![ "Ascendant", "Midheaven" ].includes(x.point1) && ![ "Ascendant", "Midheaven" ].includes(x.point2);
  return {
    ...a0,
    ascendant: null,
    midheaven: null,
    houses: [],
    timeUnknown: false,
    locationUnknown: false,
    planets: (a0.planets || []).filter(b => keep(b)).map(({house: house, ...rest}) => rest),
    northNode: keep(a0.northNode),
    southNode: keep(a0.southNode),
    chiron: keep(a0.chiron),
    lilith: keep(a0.lilith),
    aspects: (a0.aspects || []).filter(x => noAngles(x) && !unsure.has(x.point1) && !unsure.has(x.point2))
  };
}

function buildReportUserPrompt(rtype, relLabel, p1, p2) {
  const dropTimeItems = relationalTimeLeftOut(rtype, p1, p2);
  const personBlock = p => {
    const n = p.numerology || {};
    const a = dropTimeItems ? withoutTimeBasedItems(p.astrology || {}) : p.astrology || {};
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
    if (!p2) throw new Error("A two-person reading needs both people's data.");
    const hdConnection = buildHDConnectionLine(p1.humanDesign, p2.humanDesign, p1.first, p2.first);
    return `Relationship type: ${relLabel}${relationshipNote(relLabel)}\n${personBlock(p1)}\n${personBlock(p2)}${hdConnection ? `\n${hdConnection}` : ""}`;
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
      console.error(`Report generation attempt ${attempt + 1} received nothing: ${error.message}`);
    }
  }
  if (lastError) {
    if (ctx && failedUsages.length) {
      const usage = failedUsages.reduce((total, u) => ({
        input_tokens: (total.input_tokens || 0) + (u.input_tokens || 0),
        output_tokens: (total.output_tokens || 0) + (u.output_tokens || 0),
        cache_creation_input_tokens: (total.cache_creation_input_tokens || 0) + (u.cache_creation_input_tokens || 0),
        cache_read_input_tokens: (total.cache_read_input_tokens || 0) + (u.cache_read_input_tokens || 0)
      }), {});
      ctx.waitUntil(recordUsage(env, usage, usageType));
    }
    throw lastError;
  }
  if (ctx) ctx.waitUntil(recordUsage(env, result.usage, usageType));
  const reading = !hdOnly && result.parsed && relationalTimeLeftOut(rtype, p1, p2) ? {
    ...result.parsed,
    timeLeftOut: true
  } : result.parsed;
  return { reading: reading };
}

// ---------- Day reading ----------
// One reading for one person on one chosen date, written by the model from the birth chart, the numerology as of that date and the sky on that date.
// Open to anyone who has a pass or has had their free reading; a free reading gets one day (the day it is run). Finished day readings are not kept on the server; each request writes a new reading.
// A free reading includes one day reading, for the day it is run, and no other date.
// Pass holders have no limit on day readings.

const DAY_SYSTEM_PROMPT = `Check the person's age on the reading date before writing anything about love, dating, or sex. Under 18: none of it, ever.

### ABSOLUTE RULES (zero exceptions)
1. Address the person as "you" in every sentence. Never their name, never "she/he/her/him/they."
2. Never name a placement, aspect, transit, cycle, return, number, or degree in the prose. State what it produces for this person on this day. Cite each one once, in references.
3. Never intensify a claim before stating it ("real tension," "genuine need," "deep restlessness," and any synonym doing the same job). State it as settled fact.
4. Return one JSON object only -- no markdown, no text before or after it.
5. One point, one place. State each trait, need, or pattern once, in the paragraph where it matters most. A later paragraph may point back to it in a few words. It never explains it again.
6. Do not predict events, outcomes, or what other people will do. Describe what the day asks of this person, what comes easier and what comes harder, and what to attend to. No medical, legal, or financial advice.

### ROLE
You are an expert astrologer and numerologist, and an expert in Human Design when a Human Design chart is given. Use your full depth in each system, never a shortened or generic version. You already know what every placement and number means, so skip the definition: dig past the first meaning that comes to mind for what it means for this person on this day. Write in plain, practical language: what the person feels, notices, handles, or decides. Never use mystical or dressed-up phrasing that sounds profound but says little.

### WHAT YOU ARE GIVEN
- The person's birth chart and, when available, their houses.
- Their numerology as of the reading date: Personal Day inside Personal Month inside Personal Year, inside the current Essence, Pinnacle, Challenge, and Period Cycle, and the Universal Day.
- The sky on the reading date: the Moon's sign and phase, the contacts the fast-moving planets (Moon, Sun, Mercury, Venus, Mars) make to the birth chart, the contacts the slow planets make to it, the aspects between planets in the sky itself, and the houses the moving planets pass through.
- Longer astrological cycles that are active on that date.
- Their Human Design (type, authority, profile, Incarnation Cross) when given, and the Human Design gates the Sun, Earth, Moon and planets occupy on the reading date, with which of them match or complete the person's own gates and channels.

### HOW TO READ IT
- Weigh the data by strength. A contact within one degree outweighs a wide one. The Moon changes fastest and sets the day's feeling. The slow planets describe the background of the whole stretch, not just today. A moving planet's house says which area of life the energy lands in.
- Read the numerology cycles as one combined picture, never one number alone. The Personal Day means something different inside a Personal Year 1 than inside a Personal Year 7, and different again inside the Personal Month, the Essence, the Pinnacle, and the Challenge. State what that whole combination produces on this day.
- Every paragraph must say something that is true of this day and would not be true of the day before or after it. The Moon, the fast planets, the day's Human Design gates, the Personal Day, and the Personal Month are what make the day specific. The long cycles and the slow planets set the conditions those land in: use them to say how the day's points show up for this person, and never spend a paragraph describing them.
- Build every point around the astrology and numerology together, never one system alone. If both point at the same thing, say it once, using both as evidence. If they pull apart, state what each produces and what the day feels like with both. If Human Design is given, use it for how this person best acts on the day's energy and for the theme it frames. A gate in the sky that the person already has in their chart is amplified today; a gate in the sky that completes a channel with one of their gates brings a connection they do not have on their own, for this day only. Use only what is given.
- Write every sentence as something the person will do, feel, notice, or decide, or something that gets easier or harder for them, naming the who, what, and where.

### HOW TO WRITE
- Cover what the data supports: the overall feeling of the day, where attention and energy go, what comes easily, what is better done slowly or left alone, how closeness and work are likely to feel, and the body and mood as the data supports. Cover only what the data supports.
- Do not pad or reword to fill space. There is no target length. The more directly something is stated, the more content fits.
- Never parrot this prompt's instructions back in the reading.

### OUTPUT FORMAT
{
  "headline": "One short, specific line about this day. Follows ABSOLUTE RULE 2.",
  "body": "The reading, in short paragraphs separated by a blank line. Each paragraph is one theme. Follows ABSOLUTE RULES 1 to 6.",
  "references": ["Every placement, contact, cycle, and number the reading draws on, short technical shorthand, degrees included, one per entry."]
}`;

// The same day prompt, for two people: one reading about the relationship on this day, each person named by first name (as in the two-person reading).
const DAY_RELATIONAL_SYSTEM_PROMPT = DAY_SYSTEM_PROMPT
  .replace("Check the person's age on the reading date before writing anything about love, dating, or sex. Under 18: none of it, ever.", "Check each person's age on the reading date before writing anything about love, dating, or sex. If either is under 18: none of it, ever.")
  .replace('1. Address the person as "you" in every sentence. Never their name, never "she/he/her/him/they."', `1. Use each person's first name in every sentence about them. Never a label like "Partner A." Never address either person as "you."`)
  .replace("State what it produces for this person on this day.", "State what it produces between these two people on this day.")
  .replace("Describe what the day asks of this person, what comes easier and what comes harder, and what to attend to.", "Describe what the day asks of each of them and of the two of them together, what comes easier and what comes harder between them, and what to attend to.")
  .replace("### WHAT YOU ARE GIVEN\n- The person's birth chart and, when available, their houses.", "This is one reading about the relationship between the two people on this day, not two separate readings. Describe how the day lands between them.\n\n### WHAT YOU ARE GIVEN\n- Each person's birth chart and, when available, their houses.")
  .replace("use them to say how the day's points show up for this person, and never spend a paragraph describing them.", "use them to say how the day's points show up between these two people, and never spend a paragraph describing them.")
  .replace("that completes a channel with one of their gates brings a connection they do not have on their own, for this day only.", "that completes a channel with one of their gates brings a connection they do not have on their own, for this day only. Where one person's gate and the other's gate meet in the sky's gate, say what that does between them.")
  .replace("with which of them match or complete the person's own gates and channels.", "with which of them match or complete each person's own gates and channels.");

const DAY_SIGNS = [ "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces" ];

function dayAbs(x) {
  if (!x) return null;
  if (typeof x.absoluteDegrees === "number") return x.absoluteDegrees;
  const i = DAY_SIGNS.indexOf(x.sign), d = parseFloat(x.degreesInSign);
  return i >= 0 && isFinite(d) ? i * 30 + d : null;
}

function dayLonLabel(lon) {
  const l = (lon % 360 + 360) % 360;
  return `${DAY_SIGNS[Math.floor(l / 30)]} ${(l % 30).toFixed(1)}°`;
}

function dayHouseOf(lon, houses) {
  const cusps = (houses || []).filter(h => typeof h.absoluteDegrees === "number" && typeof h.house === "number").sort((a, b) => a.house - b.house);
  if (cusps.length !== 12) return null;
  for (let i = 0; i < 12; i++) {
    const s = cusps[i].absoluteDegrees, e = cusps[(i + 1) % 12].absoluteDegrees;
    if (((lon - s) % 360 + 360) % 360 < ((e - s) % 360 + 360) % 360) return cusps[i].house;
  }
  return null;
}

function dayMoonPhase(sunLon, moonLon) {
  const e = ((moonLon - sunLon) % 360 + 360) % 360;
  if (e < 22.5 || e >= 337.5) return "new";
  if (e < 67.5) return "waxing crescent";
  if (e < 112.5) return "first quarter";
  if (e < 157.5) return "waxing gibbous";
  if (e < 202.5) return "full";
  if (e < 247.5) return "waning gibbous";
  if (e < 292.5) return "last quarter";
  return "waning crescent";
}

function dayRangeAges(str) {
  const s = String(str || "");
  const m = /^(birth|\d+)\D+(onward|\d+)$/.exec(s);
  if (!m) return null;
  return { lo: m[1] === "birth" ? 0 : +m[1], hi: m[2] === "onward" ? 999 : +m[2] };
}

function dayCurrentStage(n) {
  const age = n.essenceCycle?.currentAge;
  const pick = (obj, prefix, count) => {
    for (let i = 1; i <= count; i++) {
      const x = obj?.[prefix + i];
      const r = x && dayRangeAges(x.ageRange);
      if (r && age >= r.lo && age <= r.hi) return { n: i, x: x };
    }
    return null;
  };
  const pin = pick(n.pinnacles, "pinnacle", 4), per = pick(n.periodCycles, "period", 3);
  const ch = pin ? n.challengeNumbers?.["challenge" + pin.n] : null;
  return { pin: pin, per: per, ch: ch };
}

function dayAspects(transitPts, natalPts, maxOrb) {
  const A = [ [ "conjunct", 0 ], [ "sextile", 60 ], [ "square", 90 ], [ "trine", 120 ], [ "opposite", 180 ] ];
  const out = [];
  for (const t of transitPts) for (const nt of natalPts) {
    const sep = Math.abs(((t.lon - nt.lon) % 360 + 360) % 360);
    const fold = sep > 180 ? 360 - sep : sep;
    const lim = maxOrb ? maxOrb(t) : 2;
    for (const [name, ang] of A) {
      const orb = Math.abs(fold - ang);
      if (orb <= lim) out.push({ t: t, n: nt, name: name, orb: orb });
    }
  }
  return out.sort((a, b) => a.orb - b.orb);
}

const DAY_FAST = [ "Moon", "Sun", "Mercury", "Venus", "Mars" ];
const dayFastOrb = t => t.name === "Moon" ? 3 : 2;

// aspects between the planets in the sky itself, where at least one is a fast planet
function daySkyAspects(skyPts) {
  const A = [ [ "conjunct", 0 ], [ "sextile", 60 ], [ "square", 90 ], [ "trine", 120 ], [ "opposite", 180 ] ];
  const out = [];
  for (let i = 0; i < skyPts.length; i++) for (let j = i + 1; j < skyPts.length; j++) {
    const a = skyPts[i], b = skyPts[j];
    if (!DAY_FAST.includes(a.name) && !DAY_FAST.includes(b.name)) continue;
    const lim = a.name === "Moon" || b.name === "Moon" ? 3 : 2;
    const sep = Math.abs(((a.lon - b.lon) % 360 + 360) % 360);
    const fold = sep > 180 ? 360 - sep : sep;
    for (const [name, ang] of A) {
      const orb = Math.abs(fold - ang);
      if (orb <= lim) out.push({ a: a, b: b, name: name, orb: orb });
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

// the standard Human Design gate wheel: 64 gates of 5.625 degrees, the first (gate 41) starting at 2 degrees Aquarius
const DAY_GATE_WHEEL = [ 41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60 ];
function dayGateOf(lon) {
  return DAY_GATE_WHEEL[Math.floor((((lon - 302) % 360 + 360) % 360) / 5.625) % 64];
}

function dayReduceNumber(n) {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) n = String(n).split("").reduce((t, d) => t + +d, 0);
  return n;
}

function buildDayUserPrompt(person, natalAstro, humanDesign, dateISO, activeCycles) {
  const [yy, mm, dd] = dateISO.split("-").map(Number);
  const mdy = `${pad(mm)}/${pad(dd)}/${yy}`;
  const n = calculateFullChart({ first: person.first, middle: person.mid || "", last: person.last, dob: dobToMMDDYYYY(person.dob), currentDate: mdy });
  const sky = computeAstrology({ year: yy, month: mm, day: dd, hour: 12, minute: 0, cityName: "", countryCode: "", state: "", skipAspects: true });
  const a = natalAstro || {};
  const hasHouses = !(a.timeUnknown || a.locationUnknown) && (a.houses || []).length === 12;
  const natalPts = [];
  (a.planets || []).forEach(p => { const l = dayAbs(p); if (l != null && !p.signUncertain) natalPts.push({ name: p.name, lon: l }); });
  [ [ "North Node", a.northNode ], [ "Chiron", a.chiron ] ].forEach(([nm, p]) => { const l = dayAbs(p); if (l != null && !p?.signUncertain) natalPts.push({ name: nm, lon: l }); });
  if (hasHouses) [ [ "Ascendant", a.ascendant ], [ "Midheaven", a.midheaven ] ].forEach(([nm, p]) => { const l = dayAbs(p); if (l != null) natalPts.push({ name: nm, lon: l }); });
  const skyPts = (sky.planets || []).map(p => ({ name: p.name, lon: p.absoluteDegrees, rx: p.retrograde })).filter(p => typeof p.lon === "number");
  if (sky.chiron && typeof sky.chiron.absoluteDegrees === "number") skyPts.push({ name: "Chiron", lon: sky.chiron.absoluteDegrees, rx: sky.chiron.retrograde });
  const sun = skyPts.find(p => p.name === "Sun"), moon = skyPts.find(p => p.name === "Moon");
  const skyLines = skyPts.map(p => `${p.name} ${dayLonLabel(p.lon)}${p.rx ? " Rx" : ""}${hasHouses ? ` (natal house ${dayHouseOf(p.lon, a.houses)})` : ""}`).join(", ");
  const fastSky = skyPts.filter(p => DAY_FAST.includes(p.name)), slowSky = skyPts.filter(p => !DAY_FAST.includes(p.name));
  const fmtContact = c => `${c.t.name} ${c.name} natal ${c.n.name}, orb ${c.orb.toFixed(1)}°`;
  const fastContacts = dayAspects(fastSky, natalPts, dayFastOrb).slice(0, 12).map(fmtContact);
  const slowContacts = dayAspects(slowSky, natalPts).slice(0, 10).map(fmtContact);
  const skyAspects = daySkyAspects(skyPts).slice(0, 12).map(c => `${c.a.name} ${c.name} ${c.b.name}, orb ${c.orb.toFixed(1)}°`);
  const universalDay = dayReduceNumber(String(mm).split("").reduce((t, d) => t + +d, 0) + String(dd).split("").reduce((t, d) => t + +d, 0) + String(yy).split("").reduce((t, d) => t + +d, 0));
  const pinnacle = x => x ? `${x.value} (${x.ageRange})` : "unknown";
  const stage = dayCurrentStage(n);
  const numerologyLines = [ `Life Path ${n.lifePath}, Expression ${n.expression}, Soul Urge ${n.soulUrge}, Personality ${n.personality}, Birthday ${n.birthday}`, `Attitude ${n.attitude}, Balance ${n.balance}, Maturity ${n.maturity}`, `On the reading date: Personal Year ${n.personalYear}, Personal Month ${n.personalMonth}, Personal Day ${n.personalDay}, Essence ${n.essenceCycle?.value}`, `Current stage: Pinnacle ${stage.pin ? pinnacle(stage.pin.x) : "unknown"}, Challenge ${stage.ch != null ? stage.ch : "unknown"}, Period Cycle ${stage.per ? pinnacle(stage.per.x) : "unknown"}`, `Karmic Lessons: ${n.karmicLessons?.length ? n.karmicLessons.join(", ") : "none"}`, `Karmic Debt: ${n.karmicDebtNumbers?.length ? n.karmicDebtNumbers.join(", ") : "none"}` ].join("\n  ");
  const planetLine = pl => `${pl.name} in ${pl.sign} ${pl.degreesInSign}°${pl.house && hasHouses ? ` (house ${pl.house})` : ""}${pl.retrograde ? " Rx" : ""}`;
  const angle = (label, x) => x ? `${label}: ${x.sign} ${x.degreesInSign}°` : null;
  const natalLines = [ !hasHouses ? "Birth time or birth location not provided, so the Ascendant, Midheaven, and houses are unavailable. Do not guess or invent them; read the chart by sign only." : null, (a.planets || []).map(planetLine).join(", "), [ angle("North Node", a.northNode), angle("Chiron", a.chiron), hasHouses ? angle("Ascendant", a.ascendant) : null, hasHouses ? angle("Midheaven", a.midheaven) : null ].filter(Boolean).join(", "), hasHouses ? `House cusps: ${a.houses.map(h => `${h.house}:${h.sign} ${h.cuspDegrees}°`).join(", ")}` : null ].filter(Boolean).join("\n  ");
  const h = humanDesign || {};
  const hdLines = h.type ? `${h.type} type, ${h.profile || "unknown"} profile, ${h.authority || "unknown"} authority${h.incarnation_cross ? `\n  Incarnation Cross: ${h.incarnation_cross}` : ""}` : null;
  let gateLines = null;
  if (h.type) {
    const pick = nm => skyPts.find(p => p.name === nm);
    const sunP = pick("Sun");
    const skyGates = [];
    if (sunP) { skyGates.push([ "Sun", dayGateOf(sunP.lon) ], [ "Earth", dayGateOf(sunP.lon + 180) ]); }
    [ "Moon", "Mercury", "Venus", "Mars" ].forEach(nm => { const q = pick(nm); if (q) skyGates.push([ nm, dayGateOf(q.lon) ]); });
    const own = new Set((h.gates || []).map(g => parseInt(g, 10)).filter(g => !isNaN(g)));
    const matches = [], completes = [];
    if (own.size) skyGates.forEach(([nm, g]) => {
      if (own.has(g)) { matches.push(`${nm} gate ${g}`); return; }
      HD_CHANNELS.forEach(([x, y]) => { const partner = x === g ? y : y === g ? x : null; if (partner != null && own.has(partner)) completes.push(`${nm} gate ${g} (with their gate ${partner})`); });
    });
    gateLines = [ `Human Design gates in the sky today: ${skyGates.map(([nm, g]) => `${nm} ${g}`).join(", ")}`, own.size ? `Gates in the sky today that match the person's own gates: ${matches.length ? matches.join(", ") : "none"}. Gates that complete a channel with one of the person's gates: ${completes.length ? completes.join(", ") : "none"}` : null ].filter(Boolean).join("\n\n");
  }
  const dateLabel = new Date(Date.UTC(yy, mm - 1, dd)).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const cycles = (activeCycles || []).filter(s => typeof s === "string").slice(0, 8).map(s => s.slice(0, 200));
  return [ `Date of the reading: ${dateLabel}`, `Person: ${person.first} (age ${n.essenceCycle?.currentAge ?? "unknown"} on this date)`, `Numerology as of this date:\n  ${numerologyLines}`, `Universal Day: ${universalDay}`, `Birth chart:\n  ${natalLines}`, `The sky on this date (planets at noon UT): ${skyLines}`, sun && moon ? `Moon phase: ${dayMoonPhase(sun.lon, moon.lon)}` : null, `Contacts the fast-moving planets (Moon, Sun, Mercury, Venus, Mars) make to the birth chart (Moon within 3 degrees, the others within 2): ${fastContacts.length ? fastContacts.join("; ") : "none"}`, `Contacts the slow planets make to the birth chart (within 2 degrees): ${slowContacts.length ? slowContacts.join("; ") : "none"}`, `Aspects between planets in the sky today (Moon within 3 degrees, the others within 2): ${skyAspects.length ? skyAspects.join("; ") : "none"}`, cycles.length ? `Longer astrological cycles active on this date: ${cycles.join("; ")}` : null, hdLines ? `Human Design:\n  ${hdLines}` : null, gateLines ].filter(Boolean).join("\n\n");
}

function buildRelationalDayUserPrompt(p1, a1, h1, p2, a2, h2, dateISO, c1, c2, relLabel) {
  const u1 = buildDayUserPrompt(p1, a1, h1, dateISO, c1), u2 = buildDayUserPrompt(p2, a2, h2, dateISO, c2);
  const conn = buildHDConnectionLine(h1, h2, p1.first, p2.first);
  return [ `Relationship type: ${relLabel || "unspecified"}${relationshipNote(relLabel)}`, `FIRST PERSON\n${u1}`, `SECOND PERSON\n${u2}`, conn ].filter(Boolean).join("\n\n");
}

async function handleDayReading(request, env, ctx) {
  if (!fromOurSite(request)) return notFromOurSite();
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  const email = await resolveIdentity(env, typeof body.passEmail === "string" ? body.passEmail : "");
  if (!email) return jsonResponse({ error: "Please unlock with your phone first.", code: "unlock_needed" }, 401);
  const dateISO = typeof body.date === "string" ? body.date : "";
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!dm || +dm[1] < 1900 || +dm[1] > 2100 || +dm[2] < 1 || +dm[2] > 12 || +dm[3] < 1 || +dm[3] > 31) return jsonResponse({ error: "A valid date is needed." }, 400);
  const person = body.person || {};
  if (typeof person.first !== "string" || !person.first.trim() || typeof person.last !== "string" || !person.last.trim() || typeof person.dob !== "string") return jsonResponse({ error: "The person's name and date of birth are needed." }, 400);
  const person2 = body.person2 && typeof body.person2 === "object" ? body.person2 : null;
  if (person2 && (typeof person2.first !== "string" || !person2.first.trim() || typeof person2.last !== "string" || !person2.last.trim() || typeof person2.dob !== "string")) return jsonResponse({ error: "The second person's name and date of birth are needed." }, 400);
  let status;
  try {
    status = await checkPassRecord(env, email);
  } catch (e) {
    return jsonResponse({ error: "Your unlock could not be checked just now. Please try again in a moment." }, 503);
  }
  // everyone who reaches the Timeline has a pass or has had their free reading; an email with neither (or no reading under way) is not let through, so a made-up email cannot run readings
  let allowed = status.active || status.freeReadingUsed;
  if (!allowed && await env.PASSES.get(claimKeyFor(email))) allowed = true;
  if (!allowed) return jsonResponse({ error: "Run your reading first, then you can read any day.", code: "reading_first" }, 402);
  // the free reading includes the reading for the day it is run and nothing else: one date, no other dates, no second reading
  const emailHash = sha256Hex(email.toLowerCase());
  const pinKey = "dayfree:" + emailHash, claimDay = "dayclaim:" + emailHash;
  const FREE_MSG = "Your free reading includes the reading for the day you run it. Another day needs a pass, and passes are not available yet.";
  let pinned = null;
  if (!status.active) {
    const now = new Date, todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    if (Math.abs(Date.UTC(+dm[1], +dm[2] - 1, +dm[3]) - todayMs) > 864e5) return jsonResponse({ error: FREE_MSG, code: "pass_needed" }, 402);
    pinned = await env.PASSES.get(pinKey);
    if (pinned && pinned !== dateISO) return jsonResponse({ error: FREE_MSG, code: "pass_needed" }, 402);
  }
  // the reading is not kept, so a free reading that has already been written for its one day is not written again
  if (!status.active && pinned === dateISO) return jsonResponse({ error: "Your free reading for this day has already been written. Readings are not kept on our server, and another one needs a pass. Passes are not available yet.", code: "pass_needed" }, 402);
  if (!status.active && await env.PASSES.get(claimDay)) return jsonResponse({ error: "Your reading for this day is already being written. Please wait for it to finish.", code: "reading_in_progress" }, 429);
  let prompt;
  try {
    prompt = person2 ? buildRelationalDayUserPrompt(person, body.astrology || null, body.humanDesign || null, person2, body.astrology2 || null, body.humanDesign2 || null, dateISO, body.activeCycles, body.activeCycles2, typeof body.relLabel === "string" ? body.relLabel.slice(0, 40) : "") : buildDayUserPrompt(person, body.astrology || null, body.humanDesign || null, dateISO, body.activeCycles);
  } catch (e) {
    return jsonResponse({ error: "The reading could not be set up: " + e.message }, 400);
  }
  if (!status.active) await env.PASSES.put(claimDay, "1", { expirationTtl: 300 });
  let result, lastError;
  const failed = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      result = await generateSingleCallReading(env, prompt, person2 ? DAY_RELATIONAL_SYSTEM_PROMPT : DAY_SYSTEM_PROMPT);
      if (!result.parsed || typeof result.parsed.body !== "string") throw new Error("The reading came back in an unexpected form.");
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (error.usage) failed.push(error.usage);
    }
  }
  const sumUsage = list => list.reduce((t, u) => ({ input_tokens: (t.input_tokens || 0) + (u.input_tokens || 0), output_tokens: (t.output_tokens || 0) + (u.output_tokens || 0), cache_creation_input_tokens: (t.cache_creation_input_tokens || 0) + (u.cache_creation_input_tokens || 0), cache_read_input_tokens: (t.cache_read_input_tokens || 0) + (u.cache_read_input_tokens || 0) }), {});
  if (!status.active) await env.PASSES.delete(claimDay);
  if (lastError) {
    if (failed.length) ctx.waitUntil(recordUsage(env, sumUsage(failed), "day"));
    return jsonResponse({ error: "The reading could not be written just now. Please try again in a moment." }, 502);
  }
  ctx.waitUntil(recordUsage(env, result.usage, "day"));
  const report = { headline: String(result.parsed.headline || ""), body: result.parsed.body, references: Array.isArray(result.parsed.references) ? result.parsed.references.map(String) : [] };
  if (!status.active && !pinned) await env.PASSES.put(pinKey, dateISO, { expirationTtl: 800 * 24 * 3600 });
  return jsonResponse({ report: report, cached: false });
}

// ---- The private owner page (/owner). Nothing on it is public: the page itself holds no data, and the numbers are only
// sent to a device that has entered the owner key. ----
async function usageReport(env) {
  const raw = await env.PASSES.get(USAGE_KV_KEY);
  const t = raw ? JSON.parse(raw) : { requests: 0, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, byType: {} };
  if (!t.byType) t.byType = {};
  const INPUT_RATE = 2 / 1e6;
  const OUTPUT_RATE = 10 / 1e6;
  const costOf = b => (b.inputTokens || 0) * INPUT_RATE + (b.outputTokens || 0) * OUTPUT_RATE + (b.cacheCreationTokens || 0) * INPUT_RATE * 1.25 + (b.cacheReadTokens || 0) * INPUT_RATE * .1;
  const typeLabel = { individual: "Individual", "two-person": "Relational", "hd-only": "HD-only test" };
  const cost = costOf(t);
  const recentList = await env.PASSES.list({ prefix: "usagelog:", limit: 20 });
  return {
    readings: t.requests || 0,
    inputTokens: t.inputTokens || 0,
    outputTokens: t.outputTokens || 0,
    cacheCreationTokens: t.cacheCreationTokens || 0,
    cacheReadTokens: t.cacheReadTokens || 0,
    cost,
    perReading: t.requests ? cost / t.requests : 0,
    byType: Object.entries(t.byType).map(([type, b]) => ({ label: typeLabel[type] || type, readings: b.requests || 0, cost: costOf(b), perReading: b.requests ? costOf(b) / b.requests : 0 })),
    recent: recentList.keys.map(k => {
      const m = k.metadata || {};
      return { time: (m.time || "").replace("T", " ").slice(0, 16), type: typeLabel[m.type] || m.type || "unknown", input: m.inputTokens || 0, output: m.outputTokens || 0, cost: costOf(m) };
    }),
    note: "Cost is an estimate at Claude Sonnet 5 prices ($2 and $10 per million input and output tokens). Output tokens include thinking."
  };
}

async function ownerData(env) {
  const [usage, people] = await Promise.all([ usageReport(env), adminUsers(env) ]);
  delete people.users;
  return { usage, people };
}

// Two private pages share one key and one remembered device: /owner (open the site) and /usage (the numbers).
const OWNER_CSS = `
*{box-sizing:border-box}
body{margin:0;padding:22px 18px 48px;background:radial-gradient(ellipse 120% 60% at 20% 0%,#8c1034 0,#560a21 55%,#2a0510 100%) fixed;color:#fff;font:18px/1.45 Georgia,'Times New Roman',serif;min-height:100vh}
.wrap{max-width:520px;margin:0 auto}
h1{font-size:30px;margin:0 0 6px;font-weight:700}
h2{font-size:21px;margin:30px 0 8px;font-weight:700}
p{margin:0 0 12px}
input{width:100%;height:50px;border:0;border-radius:8px;padding:0 14px;font:inherit;font-size:20px;letter-spacing:.08em;color:#fff;background:#2a0612;box-shadow:inset 0 3px 8px rgba(0,0,0,.7)}
input::placeholder{color:#fff;opacity:1}
button,a.btn{display:block;width:100%;height:52px;margin-top:12px;border:0;border-radius:8px;background:#fff;color:#2a0510;font:inherit;font-weight:700;line-height:52px;text-align:center;text-decoration:none;cursor:pointer}
button.quiet{background:transparent;color:#fff;border:1px solid #fff;height:44px;line-height:42px;margin-top:26px;font-weight:400}
.row{display:flex;justify-content:space-between;gap:14px;padding:8px 0}
.row b{white-space:nowrap}
.sub{font-size:15px}
#msg{min-height:1.4em;margin-top:10px}
`;

const OWNER_GATE = `<div id="gate" style="display:none">
<h2>Enter the key</h2>
<input id="key" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX">
<button id="go" type="button">Enter</button>
<p class="sub" style="margin-top:14px">You enter it once. This device is then remembered.</p>
</div>
<div id="msg"></div>`;

const OWNER_JS = `
var LS = "kye_owner_token";
var SITE = "https://know-your-energy.com/";
function $(i) { return document.getElementById(i); }
function show(i, on) { $(i).style.display = on ? "block" : "none"; }
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function money(n) { return "$" + Number(n || 0).toFixed(2); }
function num(n) { return Number(n || 0).toLocaleString(); }
function row(a, b) { return '<div class="row"><span>' + esc(a) + '</span><b>' + esc(b) + '</b></div>'; }
function getTok() { try { return localStorage.getItem(LS) || ""; } catch (e) { return ""; } }
async function post(path, body) {
  var r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  var j = {};
  try { j = await r.json(); } catch (e) {}
  return { ok: r.ok, status: r.status, j: j };
}
function lock(msg) {
  try { localStorage.removeItem(LS); } catch (e) {}
  show("gate", true); show("home", false);
  if (msg) $("msg").textContent = msg;
}
async function enter() {
  $("msg").textContent = "Checking…";
  var r;
  try { r = await post("/auth/key", { key: $("key").value }); } catch (e) { $("msg").textContent = "Could not reach the server."; return; }
  if (!r.ok) { $("msg").textContent = r.j.error || "That did not work."; return; }
  try { localStorage.setItem(LS, r.j.token); } catch (e) { $("msg").textContent = "This browser would not save the key. Turn off private browsing and try again."; return; }
  $("key").value = "";
  $("msg").textContent = "";
  start();
}
$("go").onclick = enter;
$("key").addEventListener("keydown", function (e) { if (e.key === "Enter") enter(); });
`;

function ownerShell(title, body, script) {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="${title}">
<title>Know Your Energy: ${title}</title>
<style>${OWNER_CSS}</style></head><body><div class="wrap">
<h1>Know Your Energy</h1>
<p class="sub">Private. This page is not part of the public site.</p>
${body}
</div>
<script>${OWNER_JS}
${script}</script></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}

// /owner: enter the key, open the site, go to the usage page. No numbers on it.
function ownerPage() {
  return ownerShell("owner", OWNER_GATE + `
<div id="home" style="display:none">
<a class="btn" id="open" href="https://know-your-energy.com/">Open the site</a>
<a class="btn" href="/usage">Usage and costs</a>
<button class="quiet" id="forget" type="button">Forget this device</button>
</div>`, `
async function start() {
  var t = getTok();
  if (!t) { show("gate", true); show("home", false); return; }
  var r;
  try { r = await post("/owner/check", { token: t }); } catch (e) { $("msg").textContent = "Could not reach the server."; return; }
  if (!r.ok) { lock(r.status === 401 ? "This device was signed out. Enter the key again." : "Could not check this device."); return; }
  $("open").href = SITE + "#unlock=" + t;
  show("gate", false); show("home", true);
}
$("forget").onclick = function () { try { localStorage.removeItem(LS); } catch (e) {} location.reload(); };
start();`);
}

// /usage: the costs and counts. Nothing on it until a device has entered the key.
function usagePage() {
  return ownerShell("usage", OWNER_GATE + `
<div id="home" style="display:none">
<div id="nums"></div>
<a class="btn" href="/owner" style="margin-top:30px">Back</a>
</div>`, `
function render(d) {
  var u = d.usage, p = d.people, t = p.totals || {}, ev = t.events || p.events || {};
  var h = "<h2>People</h2>";
  h += row("Have unlocked, ever", num(t.emailsEntered));
  h += row("New, last 24 hours", num(t.newEmails24h));
  h += row("New, last 7 days", num(t.newEmails7d));
  h += row("New, last 30 days", num(t.newEmails30d));
  h += row("Free readings, last 24 hours", num(t.readings24h));
  h += row("Free readings, last 7 days", num(t.readings7d));
  h += row("Free readings, ever", num(t.freeReadingsUsed));
  h += row("Active passes", num(t.activePasses));
  h += "<h2>Visits</h2>";
  var L = { real_visit: "Real visitors", page_load: "Page loads (including bots)", run_another: "Run Another Reading", date_check: "Checked a different date", save_print: "Save / Print" };
  Object.keys(L).forEach(function (k) { var e = ev[k] || { d7: 0, total: 0 }; h += row(L[k] + ", last 7 days", num(e.d7) + " (" + num(e.total) + " ever)"); });
  var rv = (ev.real_visit || {}).d7 || 0;
  h += row("Real visitors who finished a free reading, last 7 days", rv ? (Math.round((t.readings7d || 0) / rv * 1000) / 10) + "%" : "0%");
  h += "<h2>What it costs (Claude)</h2>";
  h += row("Readings generated", num(u.readings));
  h += row("Total cost", money(u.cost));
  h += row("Cost per reading", "$" + Number(u.perReading || 0).toFixed(4));
  h += row("Input tokens", num(u.inputTokens));
  h += row("Output tokens", num(u.outputTokens));
  h += "<h2>By reading type</h2>";
  h += (u.byType || []).map(function (b) { return row(b.label, num(b.readings) + " readings, " + money(b.cost) + ", $" + Number(b.perReading).toFixed(4) + " each"); }).join("") || "<p>No readings recorded yet.</p>";
  h += "<h2>Last 20 requests</h2>";
  h += (u.recent || []).map(function (r) { return row(r.time + ", " + r.type, num(r.input) + " in / " + num(r.output) + " out, $" + Number(r.cost).toFixed(4)); }).join("") || "<p>None logged yet.</p>";
  h += '<p class="sub" style="margin-top:14px">' + esc(u.note || "") + "</p>";
  $("nums").innerHTML = h;
}
async function start() {
  var t = getTok();
  if (!t) { show("gate", true); show("home", false); return; }
  $("msg").textContent = "Loading…";
  var r;
  try { r = await post("/owner/data", { token: t }); } catch (e) { $("msg").textContent = "Could not reach the server."; return; }
  if (!r.ok) { lock(r.status === 401 ? "This device was signed out. Enter the key again." : "Could not load the numbers."); return; }
  $("msg").textContent = "";
  render(r.j);
  show("gate", false); show("home", true);
}
start();`);
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
    if (BLOCKED_COUNTRIES.length && BLOCKED_COUNTRIES.includes(request.cf?.country)) {
      return jsonResponse({ error: "This service is not available in your region." }, 403);
    }
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
    // The private page for the owner and family. It holds no data until a device has entered the owner key.
    if (url.pathname === "/owner") return ownerPage();
    if (url.pathname === "/usage") return usagePage();
    // city suggestions are a GET, so they must be answered before the POST-only rule below
    if (url.pathname === "/places") {
      const q = url.searchParams.get("q") || "";
      const names = typeof Intl !== "undefined" && Intl.DisplayNames ? new Intl.DisplayNames([ "en" ], {
        type: "region"
      }) : null;
      const list = searchCities(q, 7).map(r => ({
        city: r.city,
        state: r.state,
        country: r.country,
        label: r.country === "US" ? `${r.city}, ${r.stateName}` : `${r.city}, ${names ? names.of(r.country) : r.country}`
      }));
      const res = jsonResponse(list);
      res.headers.set("Cache-Control", "private, max-age=3600");
      res.headers.delete("Pragma");
      res.headers.delete("Expires");
      return res;
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
    if (url.pathname.startsWith("/auth/")) return handleAuth(request, env, url);
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
        const who = await resolveIdentity(env, body.email);
        if (!who) return jsonResponse({ active: false, freeReadingUsed: false, code: "unlock_needed" });
        const result = await checkPassRecord(env, who);
        return jsonResponse(result);
      } catch (error) {
        return jsonResponse({
          error: error.message
        }, 500);
      }
    }
    if (url.pathname === "/event") {
      let ev = {};
      try {
        ev = await request.json();
      } catch (e) {}
      if (!EVENT_NAMES.includes(ev.name)) {
        return jsonResponse({
          error: "Unknown event."
        }, 400);
      }
      try {
        const day = (new Date).toISOString().slice(0, 10);
        const key = `evt:${ev.name}:${day}`;
        const n = (parseInt(await env.PASSES.get(key), 10) || 0) + 1;
        await env.PASSES.put(key, String(n), {
          expirationTtl: 400 * 86400,
          metadata: {
            n: n,
            d: day,
            name: ev.name
          }
        });
      } catch (e) {}
      return jsonResponse({
        ok: true
      });
    }
    if (url.pathname === "/owner/check") {
      let body = {};
      try {
        body = await request.json();
      } catch (e) {}
      if (!(await resolveOwner(env, body.token))) return jsonResponse({ error: "Key needed.", code: "key_needed" }, 401);
      return jsonResponse({ ok: true });
    }
    if (url.pathname === "/owner/data") {
      let body = {};
      try {
        body = await request.json();
      } catch (e) {}
      if (!(await resolveOwner(env, body.token))) return jsonResponse({ error: "Key needed.", code: "key_needed" }, 401);
      try {
        return jsonResponse(await ownerData(env));
      } catch (error) {
        return jsonResponse({ error: error.message }, 500);
      }
    }
    if (url.pathname === "/chart-data") {
      if (!fromOurSite(request)) return notFromOurSite();
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
    if (url.pathname === "/day-reading") return handleDayReading(request, env, ctx);
    if (url.pathname !== "/report") {
      return jsonResponse({
        error: "Unknown endpoint"
      }, 404);
    }
    if (!fromOurSite(request)) return notFromOurSite();
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse({
        error: "Invalid request body."
      }, 400);
    }
    // who is asking: a pass holder (including the unlimited family emails) or someone with their one free reading still to use
    const passEmail = await resolveIdentity(env, typeof body.passEmail === "string" ? body.passEmail : "");
    if (!passEmail) {
      return jsonResponse({
        error: "Please unlock with your phone first.",
        code: "unlock_needed"
      }, 401);
    }
    let askerStatus;
    try {
      askerStatus = await checkPassRecord(env, passEmail);
    } catch (e) {
      // if the check cannot be made, no reading is written: failing open would let a free reading through unchecked
      return jsonResponse({
        error: "Your unlock could not be checked just now. Please try again in a moment."
      }, 503);
    }
    let claimKey = null, countedKey = null, freeDelivered = false;
    if (!askerStatus.active) {
      if (askerStatus.freeReadingUsed) {
        return jsonResponse({
          error: "Your free reading has been used. A pass is needed for another reading, and passes are not available yet.",
          code: "free_used"
        }, 402);
      }
      if (await env.PASSES.get(claimKeyFor(passEmail))) {
        return jsonResponse({
          error: "A reading for this phone is already being written. Please wait for it to finish.",
          code: "reading_in_progress"
        }, 429);
      }
      if (await freeCapReached(env)) {
        return jsonResponse({
          error: "Today's free readings are all taken. Please come back tomorrow.",
          code: "daily_cap"
        }, 429);
      }
      countedKey = await countFreeReading(env);
      claimKey = claimKeyFor(passEmail);
      await env.PASSES.put(claimKey, String(Date.now()), {
        expirationTtl: 600
      });
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
        let report = null, reportError = null;
        if (body.rtype === "two-person" && !p2Data) {
          reportError = "A two-person reading needs both people's data.";
        } else if (body.hdOnly && (body.rtype !== "two-person" || !p1Data.humanDesign || !p2Data?.humanDesign)) {
          reportError = "HD-only test mode needs a two-person reading with both people's Human Design charts available (birth time and city required for both).";
        } else {
          try {
            const result = await generateReport(env, body.rtype, body.relLabel, p1Data, p2Data, ctx, body.hdOnly);
            report = result.reading;
            console.log(`[report] generation done at +${Date.now() - reportStart}ms jobId=${jobId}`);
          } catch (error) {
            reportError = error.message;
            console.error(`[report] generation threw at +${Date.now() - reportStart}ms jobId=${jobId}: ${error.message}`);
          }
        }
        // the free reading counts as used once a reading has actually been delivered to someone without a pass
        if (!askerStatus.active && report && !reportError) {
          freeDelivered = true;
          try {
            await env.PASSES.put(freeKey(passEmail), String(Date.now()), {
              metadata: {
                t: Date.now()
              }
            });
          } catch (e) {
            console.error(`[report] could not save the free-reading record: ${e.message}`);
          }
        }
        const payload = {
          p1: p1Data,
          p2: p2Data,
          report: report,
          reportError: reportError
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
      // a free reading that was counted but not delivered is given back to the day's total
      if (countedKey && !freeDelivered) await uncountFreeReading(env, countedKey);
      // the reading has either been delivered (the free record above is already saved) or failed (the email may try again)
      if (claimKey) {
        try {
          await env.PASSES.delete(claimKey);
        } catch (e) {
          console.error(`[report] could not remove the in-progress mark; it expires by itself: ${e.message}`);
        }
      }
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