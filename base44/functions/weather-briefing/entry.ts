import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAuthAndCredits, CREDIT_COSTS } from "../../shared/credits.ts";

const SCHEMA = {
  type: "object",
  properties: {
    location: { type: "string" },
    temperature_c: { type: "number" },
    temperature_f: { type: "number" },
    condition: { type: "string" },
    humidity: { type: "number" },
    wind_kmh: { type: "number" },
    visibility_km: { type: "number" },
    feels_like_c: { type: "number" },
    sunrise: { type: "string" },
    sunset: { type: "string" },
    forecast: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          high_c: { type: "number" },
          low_c: { type: "number" },
          condition: { type: "string" },
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthAndCredits(base44, CREDIT_COSTS.llm_web);
    if (auth.error) return auth.error;
    const body = await req.json();
    const cityQuery = (body.query || "").trim().slice(0, 200);
    if (!cityQuery) return Response.json({ error: "Missing query" }, { status: 400 });

    const prompt = `Provide the current real-time weather and 5-day forecast for: ${cityQuery}. Use real current data. Include temperature in both Celsius and Fahrenheit, humidity percentage, wind speed in km/h, visibility in km, feels-like temperature, sunrise and sunset times, and a 5-day forecast with day name, high and low in Celsius, and condition.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: SCHEMA,
    });
    return Response.json(res);
  } catch (error) {
    console.error("weather-briefing error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});