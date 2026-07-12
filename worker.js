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

function parseTime(timeStr) {
  if (!timeStr || !timeStr.trim()) return { hour: 12, minute: 0 };
  const parts = timeStr.trim().split(" ");
  const [hStr, mStr] = parts[0].split(":");
  let hour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10) || 0;
  const ap = parts[1] ? parts[1].toUpperCase() : "";
  if (ap === "AM") {
    if (hour === 12) hour = 0;
  } else if (ap === "PM") {
    if (hour !== 12) hour += 12;
  }
  return { hour, minute };
}

function parseDOB(dob) {
  const [month, day, year] = dob.split("/").map(Number);
  return { year, month, day };
}

async function getAstrology(env, dob, timeStr, city, state, country) {
  const { year, month, day } = parseDOB(dob);
  const { hour, minute } = parseTime(timeStr);
  const country_code = toCountryCode(country);
  // API expects city field to be the city name only
  const cityName = city || "New York";

  const res = await fetch("https://api.astrology-api.io/api/v3/data/positions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.AstroKYE}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      subject: {
        name: "subject",
        birth_data: {
          year,
          month,
          day,
          hour,
          minute,
          city: cityName,
          country_code
        }
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Astrology API ${res.status}: ${errText}`);
  }
  return await res.json();
}

async function getHumanDesign(env, dob, timeStr, city) {
  const { year, month, day } = parseDOB(dob);
  const { hour, minute } = parseTime(timeStr);

  // API accepts: date (YYYY-MM-DD), time (HH:MM), city (city name only)
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  const timeStrFmt = `${pad(hour)}:${pad(minute)}`;
  const cityName = city || "New York";

  const res = await fetch("https://api.humandesignhub.app/v1/simple-bodygraph", {
    method: "POST",
    headers: {
      "X-API-KEY": env.HumanDesign_key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      date: dateStr,
      time: timeStrFmt,
      city: cityName
    })
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
  const { first, mid, last, dob, time, city, state, country } = person;

  const numerology = calculateFullChart({
    first,
    middle: mid || "",
    last,
    dob,
    currentDate: todayAsMMDDYYYY()
  });

  const [astrology, humanDesign] = await Promise.all([
    getAstrology(env, dob, time, city, state, country),
    getHumanDesign(env, dob, time, city)
  ]);

  return { numerology, astrology, humanDesign };
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
