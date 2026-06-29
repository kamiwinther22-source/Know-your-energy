export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const requestData = await request.json();

      // This talks to your astrology company
      const apiResponse = await fetch("https://astrologyprovider.com", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.ASTROLOGY_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      const data = await apiResponse.json();

      return new Response(JSON.stringify(data), {
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


