import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAuthAndCredits, ttsCost } from "../../shared/credits.ts";

function buildScript(r: any): string {
  let script = `Welcome to 1 Call Dining. Here are the reviews for ${r.restaurant_name}, located in ${r.location}. `;
  script += `This restaurant serves ${r.cuisine} cuisine, with a price range of ${r.price_range}. `;
  if (r.overall_rating > 0) {
    script += `It has an overall rating of ${r.overall_rating} out of 5 stars, based on approximately ${r.total_reviews} reviews. `;
  }
  script += `Here's what diners are saying: ${r.review_summary} `;
  if (Array.isArray(r.top_reviews) && r.top_reviews.length > 0) {
    script += "Here are some top reviews. ";
    r.top_reviews.forEach((rev: any, i: number) => {
      script += `Review ${i + 1}, from ${rev.author} on ${rev.source}, rated ${rev.rating} out of 5 stars. ${rev.text} `;
    });
  }
  script += `That's all for ${r.restaurant_name}. Dial star 500 hash to hear more restaurant reviews anywhere in the world.`;
  return script.slice(0, 5000);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    if (!body.restaurant_name) return Response.json({ error: "Missing restaurant data" }, { status: 400 });

    const script = buildScript(body);
    const auth = await requireAuthAndCredits(base44, ttsCost(script));
    if (auth.error) return auth.error;
    const res = await base44.asServiceRole.integrations.Core.GenerateSpeech({
      text: script,
      voice: "sunny",
    });
    return Response.json({ url: res.url });
  } catch (error) {
    console.error("restaurant-review-audio error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});