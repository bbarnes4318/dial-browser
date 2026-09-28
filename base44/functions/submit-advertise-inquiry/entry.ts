import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_CHANNELS = ["voice_ads", "sms_broadcast", "radio_spot", "dating_sponsor", "social_feed", "audiobook_pre_roll"];
const ALLOWED_BUDGETS = ["under_1k", "1k_5k", "5k_25k", "25k_100k", "100k_plus"];
const ALLOWED_GOALS = ["brand_awareness", "app_installs", "lead_gen", "sales", "foot_traffic"];
const ALLOWED_TIMELINES = ["ready_now", "30_days", "60_days", "just_exploring"];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const business_name = String(body.business_name || "").trim();
    const contact_name = String(body.contact_name || "").trim();
    const contact_email = String(body.contact_email || "").trim();
    const contact_phone = String(body.contact_phone || "").trim();
    const website = String(body.website || "").trim();
    const industry = String(body.industry || "").trim();
    const notes = String(body.notes || "").slice(0, 2000);

    if (!business_name) return Response.json({ error: "Business name is required" }, { status: 400 });
    if (!contact_name) return Response.json({ error: "Contact name is required" }, { status: 400 });
    if (!contact_email || !EMAIL_RE.test(contact_email)) {
      return Response.json({ error: "A valid contact email is required" }, { status: 400 });
    }

    const budget_range = ALLOWED_BUDGETS.includes(body.budget_range) ? body.budget_range : "under_1k";
    const campaign_goal = ALLOWED_GOALS.includes(body.campaign_goal) ? body.campaign_goal : "brand_awareness";
    const start_timeline = ALLOWED_TIMELINES.includes(body.start_timeline) ? body.start_timeline : "just_exploring";

    const target_regions = Array.isArray(body.target_regions)
      ? body.target_regions.map((r) => String(r)).filter(Boolean).slice(0, 20)
      : [];
    const preferred_channels = Array.isArray(body.preferred_channels)
      ? body.preferred_channels.filter((c) => ALLOWED_CHANNELS.includes(c))
      : [];
    const creative_ready = Boolean(body.creative_ready);

    const created = await base44.asServiceRole.entities.AdvertiseInquiry.create({
      business_name,
      contact_name,
      contact_email,
      contact_phone,
      website,
      industry,
      budget_range,
      campaign_goal,
      target_regions,
      preferred_channels,
      start_timeline,
      creative_ready,
      notes,
      step_reached: 4,
      status: "submitted",
    });

    return Response.json({ ok: true, id: created.id, status: "submitted" });
  } catch (error) {
    console.error("submit-advertise-inquiry failed", error);
    return Response.json({ error: error.message || "Failed to submit inquiry" }, { status: 500 });
  }
}