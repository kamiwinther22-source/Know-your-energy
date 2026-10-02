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

export function computeAstrology(input) {
  const { year, month, day, hour, minute, cityName, countryCode, state, skipAspects } = input;

  const loc = findCity(cityName, countryCode, state);
  if (!loc) {
    throw new Error(
      `Could not find coordinates for "${cityName}" (${countryCode}). ` +
      `Please check the birth city spelling.`
    );
  }

  const origin = new Origin({
    year,
    month: month - 1,
    date: day,
    hour,
    minute,
    latitude: loc.lat,
    longitude: loc.lng,
  });

  const buildHoroscope = (houseSystem) =>
    new Horoscope({
      origin,
      houseSystem,
      zodiac: "tropical",
      aspectPoints: skipAspects ? [] : ["bodies", "points", "angles"],
      aspectWithPoints: skipAspects ? [] : ["bodies", "points", "angles"],
      aspectTypes: skipAspects ? [] : ["major"],
      customOrbs: {},
      language: "en",
    });

  let horoscope, houseSystemUsed = "placidus";
  try {
    horoscope = buildHoroscope("placidus");
  } catch (_) {
    horoscope = buildHoroscope("whole-sign");
    houseSystemUsed = "whole-sign";
  }

  const planets = [];
  for (const key of PLANET_KEYS) {
    const b = readBody(horoscope.CelestialBodies?.[key]);
    if (b) planets.push(b);
  }

  const ascendant = readBody(horoscope.Ascendant);
  const midheaven = readBody(horoscope.Midheaven);

  const northNode = readBody(horoscope.CelestialPoints?.northnode);
  const southNode = readBody(horoscope.CelestialPoints?.southnode);
  const chiron = readBody(horoscope.CelestialBodies?.chiron);
  const lilith = readBody(horoscope.CelestialPoints?.lilith);

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

  const aspects = skipAspects ? [] : (horoscope.Aspects?.all || []).map((a) => ({
    point1: a?.point1Label ?? a?.point1Key ?? null,
    point2: a?.point2Label ?? a?.point2Key ?? null,
    aspect: a?.label ?? a?.aspectKey ?? null,
    orb: typeof a?.orbUsed === "number" ? Math.round(a.orbUsed * 100) / 100 : (a?.orb ?? null),
  }));

  return {
    engine: "local (Moshier ephemeris via circular-natal-horoscope-js)",
    settings: { zodiac: "tropical", houseSystem: houseSystemUsed },
    location: {
      matchedCity: loc.name,
      country: loc.country,
      latitude: loc.lat,
      longitude: loc.lng,
      source: loc.source,
    },
    planets,
    ascendant,
    midheaven,
    northNode,
    southNode,
    chiron,
    lilith,
    houses,
    aspects,
  };
}
