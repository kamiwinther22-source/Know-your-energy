// astro-engine.js
// Local astrology calculation engine for Know Your Energy.
// Replaces the paid astrology-api.io call. Runs entirely inside the
// Cloudflare Worker — no external API, no key, no usage limits.
//
// Engine: circular-natal-horoscope-js (Unlicense / public domain),
// which uses a JavaScript port of Moshier's ephemeris internally.
// Settings mirror what the old API was asked for:
//   tropical zodiac, Placidus houses, Sun through Pluto, major aspects.

import pkg from "circular-natal-horoscope-js";
const { Origin, Horoscope } = pkg;
import { findCity } from "./cities.js";

const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const PLANET_KEYS = [
  "sun", "moon", "mercury", "venus", "mars",
  "jupiter", "saturn", "uranus", "neptune", "pluto",
];

function signFromDegrees(deg) {
  const d = ((deg % 360) + 360) % 360;
  return {
    sign: SIGN_NAMES[Math.floor(d / 30)],
    degreesInSign: Math.round((d % 30) * 100) / 100,
    absoluteDegrees: Math.round(d * 100) / 100,
  };
}

function readBody(body) {
  if (!body) return null;
  const deg =
    body?.ChartPosition?.Ecliptic?.DecimalDegrees ??
    body?.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees;
  if (typeof deg !== "number" || Number.isNaN(deg)) return null;
  const pos = signFromDegrees(deg);
  return {
    name: body.label || body.key || "unknown",
    sign: pos.sign,
    degreesInSign: pos.degreesInSign,
    absoluteDegrees: pos.absoluteDegrees,
    house: body?.House?.id ?? null,
    retrograde: body?.isRetrograde ?? false,
  };
}

/**
 * Compute a full natal chart locally.
 *
 * @param {Object} input
 * @param {number} input.year   4-digit year
 * @param {number} input.month  1-12  (this module converts to the library's 0-11 internally)
 * @param {number} input.day    1-31
 * @param {number} input.hour   0-23 (already converted from AM/PM upstream)
 * @param {number} input.minute 0-59
 * @param {string} input.cityName
 * @param {string} input.countryCode  ISO-2, e.g. "US"
 * @param {string} [input.state]      state / province name or code, used to
 *                                    disambiguate duplicate city names
 * @returns {Object} chart data (planets, houses, angles, aspects, location)
 */
export function computeAstrology(input) {
  const { year, month, day, hour, minute, cityName, countryCode, state } = input;

  const loc = findCity(cityName, countryCode, state);
  if (!loc) {
    throw new Error(
      `Could not find coordinates for "${cityName}" (${countryCode}). ` +
      `Please check the birth city spelling.`
    );
  }

  const origin = new Origin({
    year,
    month: month - 1, // library uses 0-indexed months (0 = January)
    date: day,
    hour,
    minute,
    latitude: loc.lat,
    longitude: loc.lng,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    aspectPoints: ["bodies", "points", "angles"],
    aspectWithPoints: ["bodies", "points", "angles"],
    aspectTypes: ["major"],
    customOrbs: {},
    language: "en",
  });

  // --- Planets (Sun through Pluto) ---
  const planets = [];
  for (const key of PLANET_KEYS) {
    const b = readBody(horoscope.CelestialBodies?.[key]);
    if (b) planets.push(b);
  }

  // --- Angles ---
  const ascendant = readBody(horoscope.Ascendant);
  const midheaven = readBody(horoscope.Midheaven);

  // --- North Node / South Node / Chiron (bonus points the old API didn't send) ---
  const northNode = readBody(horoscope.CelestialPoints?.northnode);
  const southNode = readBody(horoscope.CelestialPoints?.southnode);
  const chiron = readBody(horoscope.CelestialBodies?.chiron);

  // --- House cusps ---
  const houses = (horoscope.Houses || []).map((h, i) => {
    const deg =
      h?.ChartPosition?.StartPosition?.Ecliptic?.DecimalDegrees ??
      h?.ChartPosition?.Ecliptic?.DecimalDegrees;
    const pos = typeof deg === "number" ? signFromDegrees(deg) : null;
    return {
      house: h?.id ?? i + 1,
      sign: pos ? pos.sign : null,
      cuspDegrees: pos ? pos.degreesInSign : null,
      absoluteDegrees: pos ? pos.absoluteDegrees : null,
    };
  });

  // --- Aspects ---
  const aspects = (horoscope.Aspects?.all || []).map((a) => ({
    point1: a?.point1Label ?? a?.point1Key ?? null,
    point2: a?.point2Label ?? a?.point2Key ?? null,
    aspect: a?.label ?? a?.aspectKey ?? null,
    orb: typeof a?.orbUsed === "number" ? Math.round(a.orbUsed * 100) / 100 : (a?.orb ?? null),
  }));

  return {
    engine: "local (Moshier ephemeris via circular-natal-horoscope-js)",
    settings: { zodiac: "tropical", houseSystem: "placidus" },
    location: {
      matchedCity: loc.name,
      country: loc.country,
      latitude: loc.lat,
      longitude: loc.lng,
      source: loc.source, // "dataset" or "fallback"
    },
    planets,
    ascendant,
    midheaven,
    northNode,
    southNode,
    chiron,
    houses,
    aspects,
  };
}
