export default {
  async fetch(request, env) {

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ───────────────────────────────
    // ASTROLOGY ENDPOINT
    // ───────────────────────────────
    if (path === '/astrology') {
      try {
        const body = await request.json();
        const subject = body.subject;

        // Build a location string for geocoding
        const locationQuery = [subject.city, subject.state, subject.nation]
          .filter(Boolean)
          .join(', ');

        // Step 1 — Geocode the location (free, no key needed)
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(subject.city)}&count=1&language=en&format=json`
        );
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          return new Response(JSON.stringify({ error: 'Could not find location', query: locationQuery }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const place = geoData.results[0];
        const latitude = place.latitude;
        const longitude = place.longitude;

        // Step 2 — Get timezone offset for that location and date
        const tzRes = await fetch(
          `https://timeapi.io/api/timezone/coordinate?latitude=${latitude}&longitude=${longitude}`
        );
        let timezoneOffset = 0;
        try {
          const tzData = await tzRes.json();
          timezoneOffset = (tzData.currentUtcOffset && tzData.currentUtcOffset.seconds / 3600) || 0;
        } catch (e) {
          timezoneOffset = 0;
        }

        // Step 3 — Call freeastrologyapi.com with real coordinates
        const hasTime = subject.hour !== undefined && subject.hour !== null;

        const astroPayload = {
          year: subject.year,
          month: subject.month,
          date: subject.day,
          hours: hasTime ? subject.hour : 12,
          minutes: hasTime ? subject.minute : 0,
          seconds: 0,
          latitude: latitude,
          longitude: longitude,
          timezone: timezoneOffset,
          settings: {
            observation_point: 'topocentric',
            ayanamsha: 'lahiri'
          }
        };

        const astroRes = await fetch('https://json.freeastrologyapi.com/planets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'FREEASTROLOGY_API_KEY_HERE'
          },
          body: JSON.stringify(astroPayload)
        });

        const astroData = await astroRes.json();

        return new Response(JSON.stringify({
          subject: {
            name: subject.name,
            sun_sign: null,   // derived client-side or from planets array
            moon_sign: null,
            rising_sign: null,
            time_known: hasTime,
            location: place.name + ', ' + (place.admin1 || '') + ', ' + place.country
          },
          planets: astroData,
          raw: astroData
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: 'Astrology lookup failed', detail: err.message }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ───────────────────────────────
    // NUMEROLOGY ENDPOINT (placeholder until Dakidarts key added)
    // ───────────────────────────────
    if (path === '/numerology') {
      return new Response(JSON.stringify({ status: 'pending', message: 'Numerology API not yet connected' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // ───────────────────────────────
    // HUMAN DESIGN ENDPOINT (placeholder until HD key added)
    // ───────────────────────────────
    if (path === '/humandesign') {
      return new Response(JSON.stringify({ status: 'pending', message: 'Human Design API not yet connected' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response('Know Your Energy Worker is running.', {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
};


