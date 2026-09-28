import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAuthAndCredits, CREDIT_COSTS } from "../../shared/credits.ts";

const SCHEMA = {
  type: "object",
  properties: {
    restaurant_name: { type: "string" },
    location: { type: "string" },
    overall_rating: { type: "number" },
    total_reviews: { type: "number" },
    cuisine: { type: "string" },
    price_range: { type: "string" },
    review_summary: { type: "string" },
    top_reviews: {
      type: "array",
      items: {
        type: "object",
        properties: {
          author: { type: "string" },
          rating: { type: "number" },
          text: { type: "string" },
          source: { type: "string" },
        },
      },
    },
    vibe: { type: "string" },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthAndCredits(base44, CREDIT_COSTS.llm_web);
    if (auth.error) return auth.error;
    const body = await req.json();
    const query = (body.query || "").trim().slice(0, 200);
    if (!query) return Response.json({ error: "Missing query" }, { status: 400 });

    const prompt = `You are a restaurant review aggregator. Search the web for reviews of the following restaurant: "${query}".

Find real reviews from Google, Yelp, TripAdvisor, and other sources. Return a structured summary with:
- restaurant_name: the official name
- location: city and country
- overall_rating: average star rating (0-5)
- total_reviews: approximate number of reviews
- cuisine: type of cuisine
- price_range: $ to $$$$
- review_summary: a natural, conversational 3-4 sentence summary of what diners are saying (both positives and negatives)
- top_reviews: array of 3 review objects, each with {author, rating, text (2-3 sentences), source}
- vibe: one-word description of the atmosphere

Be accurate and only include real information found online. If the restaurant cannot be found, say so in the review_summary.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: SCHEMA,
    });
    return Response.json(res);
  } catch (error) {
    console.error("restaurant-reviews error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});