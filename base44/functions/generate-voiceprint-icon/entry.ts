import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import OpenAI from 'npm:openai@6.45.0';

/**
 * generate-voiceprint-icon — one-shot asset generator. Produces a transparent
 * PNG of the neon voiceprint fingerprint (using the attached reference image)
 * via the aiGateway image endpoint, so it can be rendered on the dark HUD
 * background without a checkerboard and rotated in 3D.
 *
 * Authenticated: only the app owner needs to run this once; the returned URL is
 * then hardcoded into VoiceprintDemo as a static asset.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let me;
    try { me = await base44.auth.me(); } catch {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }

    const { baseURL, token } = base44.asServiceRole.aiGateway.connection();
    const client = new OpenAI({ baseURL, apiKey: token, maxRetries: 0 });

    const { data } = await client.images.generate({
      model: "gpt_image_2",
      prompt: "A neon cybernetic fingerprint icon centered on a fully transparent background. Outer whorls are vivid lime green (#8DFF33), the inner core is vibrant purple (#BC56FF), and three concentric cyan (#33CCFF) semi-circles emanate from the right edge like a wireless signal pulse. Luminous digital trace lines, high contrast, sleek tech aesthetic. No backdrop, no checkerboard, no border — only the fingerprint glyph with full alpha transparency.",
      n: 1,
      response_format: "url",
      output_format: "png",
      background: "transparent",
      aspect_ratio: "1:1",
      reference_image_urls: [
        "https://media.base44.com/images/public/6a422320311efd575ae6536c/354c68c5f_Gemini_Generated_Image_4by9fj4by9fj4by9.jpg"
      ],
    });

    return Response.json({ url: data[0].url });
  } catch (error) {
    console.error("generate-voiceprint-icon error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});