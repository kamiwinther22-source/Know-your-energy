// Human Design chart computation — 100% local, no external API.
//
// Vendored and trimmed from free-human-design (github.com/adamblvck/free-human-design,
// MIT License, Copyright (c) Adam Blvck) rather than depended on as an npm
// package: that package's optional Swiss Ephemeris backend does a literal
// require('./swisseph') (plus 'fs'/'path') that a bundler resolves eagerly at
// build time even though it's only reached behind a runtime env-var check and
// never actually used here -- that breaks bundling for Cloudflare Workers
// outright. This file keeps only the parts actually used: the pure-JS
// astronomia ephemeris backend, the 64-gate mandala mapping, the canonical
// gate/channel/center bodygraph data, and Type/Authority/Profile derivation.
// Not used from the original: Gene Keys spheres, the astrology-angles/houses
// section, the midpoint matrix, and the package's own city/timezone lookup
// (this app resolves birth coordinates via its own findCity, then tz-lookup
// for the IANA timezone name).
//
// Verified against this app's own already-audited gate/center/channel
// reference data (see CLAUDE.md's GATES/HD_DEFS audit note) before use --
// matched exactly.

import * as astronomia from 'astronomia';
import { DateTime } from 'luxon';
import tzlookup from 'tz-lookup';

// Each VSOP87B table imported directly by its own subpath, not the blanket
// astronomia/data aggregator -- that aggregator unconditionally imports every
// table it ships (all the D-series variants and two large lunar tables, ~14MB
// combined) even though moonposition.js -- the only lunar function this file
// calls -- carries its own self-contained series and needs none of them. A
// Cloudflare Worker has a real script-size ceiling; only pulling in the 7
// B-series tables this file actually uses keeps the bundle to what's needed.
import vsop87Bearth from 'astronomia/data/vsop87Bearth';
import vsop87Bmercury from 'astronomia/data/vsop87Bmercury';
import vsop87Bvenus from 'astronomia/data/vsop87Bvenus';
import vsop87Bmars from 'astronomia/data/vsop87Bmars';
import vsop87Bjupiter from 'astronomia/data/vsop87Bjupiter';
import vsop87Bsaturn from 'astronomia/data/vsop87Bsaturn';
import vsop87Buranus from 'astronomia/data/vsop87Buranus';
import vsop87Bneptune from 'astronomia/data/vsop87Bneptune';

const A = astronomia;

// ─── Ephemeris backend (astronomia) ──────────────────────────────────────────
// Reproduces the same apparent geocentric tropical ecliptic longitudes Swiss
// Ephemeris produces. All longitudes in degrees [0, 360).

const R2D = 180 / Math.PI;

const EARTH = new A.planetposition.Planet(vsop87Bearth);
const PLANETS = {
  mercury: new A.planetposition.Planet(vsop87Bmercury),
  venus: new A.planetposition.Planet(vsop87Bvenus),
  mars: new A.planetposition.Planet(vsop87Bmars),
  jupiter: new A.planetposition.Planet(vsop87Bjupiter),
  saturn: new A.planetposition.Planet(vsop87Bsaturn),
  uranus: new A.planetposition.Planet(vsop87Buranus),
  neptune: new A.planetposition.Planet(vsop87Bneptune),
};

function normalizeAngleDegrees(angle) {
  const out = angle % 360;
  return out < 0 ? out + 360 : out;
}

function julianDayUT(dt) {
  const hour =
    dt.getUTCHours() +
    dt.getUTCMinutes() / 60 +
    dt.getUTCSeconds() / 3600 +
    dt.getUTCMilliseconds() / 3600000;
  return A.julian.CalendarGregorianToJD(
    dt.getUTCFullYear(),
    dt.getUTCMonth() + 1,
    dt.getUTCDate() + hour / 24
  );
}

function toJDE(jdUT) {
  const cal = A.julian.JDToCalendar(jdUT);
  const yearFrac = cal.year + (cal.month - 1) / 12;
  return jdUT + A.deltat.deltaT(yearFrac) / 86400;
}

function trueObliquity(jde) {
  return A.nutation.meanObliquity(jde) + A.nutation.nutation(jde)[1];
}

function sunLonDeg(jde) {
  return A.solar.apparentVSOP87(EARTH, jde).lon * R2D;
}

function planetLonDeg(name, jde) {
  const pos = A.elliptic.position(PLANETS[name], EARTH, jde);
  const eps = trueObliquity(jde);
  const ecl = new A.coord.Equatorial(pos.ra, pos.dec).toEcliptic(eps);
  return ecl.lon * R2D;
}

function moonLonDeg(jde) {
  const pos = A.moonposition.position(jde);
  const dpsi = A.nutation.nutation(jde)[0];
  return (pos.lon + dpsi) * R2D;
}

function northNodeLonDeg(jde) {
  // TRUE lunar ascending node (oscillating), matching mainstream Human
  // Design calculators.
  const dpsi = A.nutation.nutation(jde)[0];
  return (A.moonposition.trueNode(jde) + dpsi) * R2D;
}

function plutoLonDeg(jde) {
  // pluto.astrometric returns J2000 astrometric equatorial; convert to
  // J2000 ecliptic, precess J2000 -> date (EclipticPrecessor epochs are
  // Julian YEARS, not Julian Days), then add nutation for apparent-of-date.
  const astro = A.pluto.astrometric(jde, EARTH);
  const eclJ2000 = new A.coord.Equatorial(astro._ra, astro._dec).toEcliptic(
    A.nutation.meanObliquity(2451545.0)
  );
  const epochTo = 2000 + (jde - 2451545.0) / 365.25;
  const prec = new A.precess.EclipticPrecessor(2000, epochTo);
  const moved = prec.precess(new A.coord.Ecliptic(eclJ2000.lon, eclJ2000.lat));
  const dpsi = A.nutation.nutation(jde)[0];
  return (moved.lon + dpsi) * R2D;
}

function longitude(body, jdUT) {
  const jde = toJDE(jdUT);
  switch (body) {
    case 'sun': return normalizeAngleDegrees(sunLonDeg(jde));
    case 'moon': return normalizeAngleDegrees(moonLonDeg(jde));
    case 'pluto': return normalizeAngleDegrees(plutoLonDeg(jde));
    case 'north_node': return normalizeAngleDegrees(northNodeLonDeg(jde));
    default:
      if (!PLANETS[body]) throw new Error(`Unknown body "${body}".`);
      return normalizeAngleDegrees(planetLonDeg(body, jde));
  }
}

// ─── Mandala (64-gate wheel) ──────────────────────────────────────────────────

const pi2 = Math.PI * 2;
const hex_width = pi2 / 64;
const line_width = hex_width / 6;
const color_width = line_width / 6;
const tone_width = color_width / 6;
const base_width = tone_width / 5;

const iching_map = [
  55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8,
  20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29,
  59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14,
  34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60, 41, 19, 13, 49, 30,
];

const DEG_TO_RADIANS = Math.PI / 180;
const LINE_SEGMENT = 1 / 6;

function neutronStreamPos(radiansPosition) {
  const offset = 2 * line_width - 1 * color_width - 1 * tone_width + 3 * base_width;
  const offsetCalc = (360 * DEG_TO_RADIANS) / 64 * 5 + offset;
  return (((radiansPosition + offsetCalc) / pi2) * 64) % 64;
}

function mapLongitudeDegrees(lonDeg) {
  const lon = normalizeAngleDegrees(lonDeg);
  const binValue = neutronStreamPos(lon * DEG_TO_RADIANS);
  const fractalBin = Math.floor(binValue);
  const gate = iching_map[fractalBin];
  const remainder = binValue - fractalBin;
  const line = Math.floor(remainder / LINE_SEGMENT) + 1;
  return { gate, line };
}

// ─── Bodygraph (canonical Jovian Archive gate/channel/center reference) ──────

const CENTERS = ['head', 'ajna', 'throat', 'g', 'heart', 'sacral', 'solarplexus', 'spleen', 'root'];
const MOTOR_CENTERS = ['sacral', 'heart', 'solarplexus', 'root'];

const GATE_CENTER = {
  64: 'head', 61: 'head', 63: 'head',
  47: 'ajna', 24: 'ajna', 4: 'ajna', 17: 'ajna', 11: 'ajna', 43: 'ajna',
  62: 'throat', 23: 'throat', 56: 'throat', 35: 'throat', 12: 'throat', 45: 'throat',
  33: 'throat', 8: 'throat', 31: 'throat', 20: 'throat', 16: 'throat',
  1: 'g', 13: 'g', 25: 'g', 46: 'g', 2: 'g', 15: 'g', 10: 'g', 7: 'g',
  21: 'heart', 40: 'heart', 26: 'heart', 51: 'heart',
  48: 'spleen', 57: 'spleen', 44: 'spleen', 50: 'spleen', 32: 'spleen', 28: 'spleen', 18: 'spleen',
  34: 'sacral', 5: 'sacral', 14: 'sacral', 29: 'sacral', 59: 'sacral', 9: 'sacral',
  3: 'sacral', 42: 'sacral', 27: 'sacral',
  6: 'solarplexus', 37: 'solarplexus', 30: 'solarplexus', 55: 'solarplexus',
  49: 'solarplexus', 22: 'solarplexus', 36: 'solarplexus',
  53: 'root', 60: 'root', 52: 'root', 19: 'root', 39: 'root', 41: 'root',
  58: 'root', 38: 'root', 54: 'root',
};

const CHANNEL_GATE_PAIRS = [
  [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31], [9, 52],
  [10, 20], [10, 34], [10, 57], [11, 56], [12, 22], [13, 33], [16, 48], [17, 62],
  [18, 58], [19, 49], [20, 34], [20, 57], [21, 45], [23, 43], [24, 61], [25, 51],
  [26, 44], [27, 50], [28, 38], [29, 46], [30, 41], [32, 54], [34, 57], [35, 36],
  [37, 40], [39, 55], [42, 53], [47, 64],
];

const CHANNELS = CHANNEL_GATE_PAIRS.map(([a, b]) => {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  return { gates: [lo, hi], centers: [GATE_CENTER[lo], GATE_CENTER[hi]] };
});

function reachesThroat(start, definedCentersSet, definedChannels) {
  if (!definedCentersSet.has('throat') || !definedCentersSet.has(start)) return false;
  const adj = new Map();
  for (const c of definedCentersSet) adj.set(c, new Set());
  for (const ch of definedChannels) {
    const [c1, c2] = ch.centers;
    if (adj.has(c1) && adj.has(c2)) { adj.get(c1).add(c2); adj.get(c2).add(c1); }
  }
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    if (cur === 'throat') return true;
    for (const nxt of adj.get(cur) || []) {
      if (!seen.has(nxt)) { seen.add(nxt); queue.push(nxt); }
    }
  }
  return false;
}

function anyMotorReachesThroat(definedCentersSet, definedChannels) {
  return MOTOR_CENTERS
    .filter((m) => definedCentersSet.has(m))
    .some((m) => reachesThroat(m, definedCentersSet, definedChannels));
}

function determineType(definedCentersSet, definedChannels) {
  if (definedCentersSet.size === 0) return 'Reflector';
  const motorThroat = anyMotorReachesThroat(definedCentersSet, definedChannels);
  if (definedCentersSet.has('sacral')) return motorThroat ? 'Manifesting Generator' : 'Generator';
  return motorThroat ? 'Manifestor' : 'Projector';
}

function determineAuthority(definedCentersSet, definedChannels) {
  const has = (c) => definedCentersSet.has(c);
  if (definedCentersSet.size === 0) return 'Lunar (Reflector)';
  if (has('solarplexus')) return 'Emotional (Solar Plexus)';
  if (has('sacral')) return 'Sacral';
  if (has('spleen')) return 'Splenic';
  if (has('heart')) return 'Ego (Heart)';
  if (has('g') && has('throat') && reachesThroat('g', definedCentersSet, definedChannels)) {
    return 'Self-Projected (G)';
  }
  return 'Mental (None / Environmental)';
}

function computeBodygraph(activations) {
  const all = [...activations.personality, ...activations.design];
  const gateSet = new Set(all.map((a) => a.gate));
  const activatedGates = [...gateSet].sort((a, b) => a - b);

  const definedChannels = CHANNELS.filter((ch) => gateSet.has(ch.gates[0]) && gateSet.has(ch.gates[1]));
  const definedCentersSet = new Set();
  for (const ch of definedChannels) { definedCentersSet.add(ch.centers[0]); definedCentersSet.add(ch.centers[1]); }

  const pSun = activations.personality.find((a) => a.body === 'sun');
  const dSun = activations.design.find((a) => a.body === 'sun');

  return {
    type: determineType(definedCentersSet, definedChannels),
    authority: determineAuthority(definedCentersSet, definedChannels),
    profile: pSun && dSun ? `${pSun.line}/${dSun.line}` : null,
    activatedGates,
  };
}

// ─── Personality/Design activations (26 = 13 bodies x 2 streams) ────────────

const HD_BODIES = [
  'sun', 'earth', 'moon', 'north_node', 'south_node',
  'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

function signedAngleDiff(a, b) {
  return ((a - b + 540) % 360) - 180;
}

// Design moment = ~88 degrees of solar arc before birth. Bracket the
// crossing walking backward a day at a time, then binary-search it.
function findPreviousSolarLongitude(jdUt, deltaDegrees) {
  const currentSun = longitude('sun', jdUt);
  const target = normalizeAngleDegrees(currentSun - deltaDegrees);

  let highJd = jdUt;
  const step = 1.0;
  let lowJd = highJd - step;
  let lowDiff = signedAngleDiff(longitude('sun', lowJd), target);

  let iterations = 0;
  while (lowDiff > 0 && iterations < 365) {
    lowJd -= step;
    lowDiff = signedAngleDiff(longitude('sun', lowJd), target);
    iterations += 1;
  }
  if (lowDiff > 0) throw new Error('Failed to bracket previous solar longitude.');

  for (let i = 0; i < 50; i += 1) {
    const mid = 0.5 * (lowJd + highJd);
    if (signedAngleDiff(longitude('sun', mid), target) > 0) highJd = mid; else lowJd = mid;
  }
  return 0.5 * (lowJd + highJd);
}

function bodyLongitude(body, jdUt) {
  if (body === 'earth') return normalizeAngleDegrees(longitude('sun', jdUt) + 180);
  if (body === 'south_node') return normalizeAngleDegrees(longitude('north_node', jdUt) + 180);
  return longitude(body, jdUt);
}

function activationAt(jdUt, body) {
  const { gate, line } = mapLongitudeDegrees(bodyLongitude(body, jdUt));
  return { body, gate, line };
}

function computeActivations(birthUtc) {
  const jdPersonality = julianDayUT(birthUtc);
  const jdDesign = findPreviousSolarLongitude(jdPersonality, 88.0);
  return {
    personality: HD_BODIES.map((b) => activationAt(jdPersonality, b)),
    design: HD_BODIES.map((b) => activationAt(jdDesign, b)),
  };
}

// ─── Birth parsing ────────────────────────────────────────────────────────────

function parseBirthToUtc(birthdate, birthtime, timezone) {
  const dt = DateTime.fromISO(`${birthdate}T${birthtime}`, { zone: timezone });
  if (!dt.isValid) {
    throw new Error(`Invalid birth date/time/timezone: ${dt.invalidReason || 'unknown'}.`);
  }
  return dt.toUTC().toJSDate();
}

// ─── Public entry point ───────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

/**
 * @param {Object} input
 * @param {number} input.year
 * @param {number} input.month   1-indexed (1 = January)
 * @param {number} input.day
 * @param {number} input.hour
 * @param {number} input.minute
 * @param {number} input.lat
 * @param {number} input.lng
 * @returns {{type: string, authority: string, profile: string, gates: number[]}}
 */
export function computeHumanDesign(input) {
  const { year, month, day, hour, minute, lat, lng } = input;

  const timezone = tzlookup(lat, lng);
  if (!timezone) {
    throw new Error(`Could not resolve a timezone for coordinates ${lat}, ${lng}.`);
  }

  const birthUtc = parseBirthToUtc(
    `${year}-${pad(month)}-${pad(day)}`,
    `${pad(hour)}:${pad(minute)}`,
    timezone
  );
  const activations = computeActivations(birthUtc);
  const bodygraph = computeBodygraph(activations);

  return {
    type: bodygraph.type,
    authority: bodygraph.authority,
    profile: bodygraph.profile,
    gates: bodygraph.activatedGates,
  };
}
