// Astrocartography line math. Pure functions, no network, no cost per reading.
// Inputs: apparent right ascension / declination of each body (radians) and Greenwich sidereal time (degrees).
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const norm180 = x => ((x + 180) % 360 + 360) % 360 - 180;
const norm360 = x => ((x % 360) + 360) % 360;

// Greenwich mean sidereal time in degrees for a Julian Date (UT).
export function gmstDegrees(jd) {
  const T = (jd - 2451545.0) / 36525;
  return norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000);
}

// Returns { MC:{lng}, IC:{lng}, ASC:[[lat,lng]...], DSC:[[lat,lng]...] } for one body.
export function bodyLines(raRad, decRad, gmst, latStep = 1, latMax = 85) {
  const ra = raRad * R2D, base = ra - gmst, tanDec = Math.tan(decRad);
  const asc = [], dsc = [];
  for (let lat = -latMax; lat <= latMax; lat += latStep) {
    const c = -Math.tan(lat * D2R) * tanDec;
    if (c < -1 || c > 1) continue; // body never rises/sets at this latitude
    const H = Math.acos(c) * R2D;
    asc.push([lat, norm180(base - H)]);
    dsc.push([lat, norm180(base + H)]);
  }
  return { MC: { lng: norm180(base) }, IC: { lng: norm180(base + 180) }, ASC: asc, DSC: dsc };
}
