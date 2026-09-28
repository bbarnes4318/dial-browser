import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireAuthAndCredits, CREDIT_COSTS } from "../../shared/credits.ts";

const SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string", description: "Concise spoken-style answer" },
    source_label: { type: "string", description: "Short source/category label e.g. 'Web', 'Weather', 'Local'" },
    follow_up: { type: "string", description: "Optional short follow-up suggestion" },
    category: { type: "string", description: "Best-matching service category from this list: Weather, Food, Entertainment, Productivity, Local, Health, Shopping, Jobs, General. Pick the closest match based on the user's query." },
    region: { type: "string", description: "Geographic region or city mentioned in or inferred from the query, for mapping. e.g. 'Miami, FL', 'Lagos', 'National'" },
  },
  required: ["answer", "source_label"],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const auth = await requireAuthAndCredits(base44, CREDIT_COSTS.llm_web);
    if (auth.error) return auth.error;
    const body = await req.json();
    const query = (body.query || "").trim().slice(0, 500);
    if (!query) return Response.json({ error: "Missing query" }, { status: 400 });

    const prompt = `You are The Dial Browser™, a voice-first search engine for phone users. A user searched for: "${query}". Provide a concise, spoken-style answer (max 4 sentences, ~60 words) that reads naturally when read aloud over a phone call. No markdown, no URLs, no headers — just plain conversational text. End with a brief useful tip if relevant.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: SCHEMA,
    });
    return Response.json(res);
  } catch (error) {
    console.error("dial-browser-search error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});