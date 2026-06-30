export default {
  async fetch(request, env, ctx) {
    // 1. Allow local computer/Python scripts to connect (CORS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // 2. Only accept incoming POST requests with birth details
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const birthDetails = await request.json();

      // 3. Connect to AstrologyAPI using your hidden long key token variable
      const astroResponse = await fetch("https://astrologyapi.com", {
        method: "POST",
        headers: {
          "x-astrologyapi-key": env.ASTROLOGY_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(birthDetails)
      });

      const data = await astroResponse.json();

      // 4. Return clean data back to your machine
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        }
      });
    }
  },
};
