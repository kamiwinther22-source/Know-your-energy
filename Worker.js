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
      
      const testAstrologyData = {
        status: "success",
        message: "Test data received successfully!",
        input_received: requestData,
        analysis: {
          sun_sign: "Leo",
          moon_sign: "Scorpio",
          rising_sign: "Sagittarius",
          interpretation: "This is a free test response! Your frontend connection to GitHub works perfectly."
        }
      };

      return new Response(JSON.stringify(testAstrologyData), {
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

