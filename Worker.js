export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle browser preflight checks
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. Get birth parameters from your frontend input fields
      const { year, month, date, hours, minutes, latitude, longitude, timezone } = await request.json();

      // 2. Safely call Free Astrology API's native planets endpoint
      const apiResponse = await fetch("https://json.freeastrologyapi.com/planets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ASTROLOGY_API_KEY // Cloudflare injects your secret key here automatically
        },
        body: JSON.stringify({
          year: parseInt(year),
          month: parseInt(month),
          date: parseInt(date),
          hours: parseInt(hours),
          minutes: parseInt(minutes),
          seconds: 0,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          timezone: parseFloat(timezone),
          settings: {
            observation_point: "topocentric",
            ayanamsha: "lahiri"
          }
        })
      });

      const rawCalculations = await apiResponse.json();

      // 3. Clean and map data dynamically to return only pure planet and house lists
      return new Response(JSON.stringify({
        status: "success",
        placements: rawCalculations
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};


