import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requireAdmin } from "../../shared/smsAuth.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Operational health check enumerating entities + LLM — admin only.
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    const timestamp = new Date().toISOString();
    const checks = [];
    let allHealthy = true;

    // Check core entities are accessible
    const entityChecks = [
      { name: "Member", entity: "Member" },
      { name: "SmsNotification", entity: "SmsNotification" },
      { name: "ServiceRequest", entity: "ServiceRequest" },
      { name: "WeatherSubscription", entity: "WeatherSubscription" },
      { name: "JobListing", entity: "JobListing" },
      { name: "ArtistProfile", entity: "ArtistProfile" },
      { name: "VoiceHost", entity: "VoiceHost" },
      { name: "MarketplaceListing", entity: "MarketplaceListing" },
      { name: "Reminder", entity: "Reminder" },
      { name: "Contact", entity: "Contact" },
    ];

    for (const check of entityChecks) {
      try {
        await base44.asServiceRole.entities[check.entity].list("-created_date", 1);
        checks.push({ system: check.name, status: "operational" });
      } catch (err) {
        checks.push({ system: check.name, status: "degraded", error: err.message });
        allHealthy = false;
      }
    }

    // Check LLM integration
    try {
      await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: "Respond with the word: OK",
        response_json_schema: { type: "object", properties: { status: { type: "string" } } },
      });
      checks.push({ system: "AI/LLM Engine", status: "operational" });
    } catch (err) {
      checks.push({ system: "AI/LLM Engine", status: "degraded", error: err.message });
      allHealthy = false;
    }

    // Log the health check result
    console.log(`[SYSTEMS CHECK ${timestamp}] Status: ${allHealthy ? "ALL SYSTEMS OPERATIONAL" : "DEGRADED DETECTED"}`);
    console.log(JSON.stringify(checks));

    return Response.json({
      timestamp,
      overall_status: allHealthy ? "operational" : "degraded",
      checks,
      total_systems: checks.length,
      operational: checks.filter(c => c.status === "operational").length,
      degraded: checks.filter(c => c.status === "degraded").length,
    });
  } catch (error) {
    console.error("systemHealthCheck error:", error);
    return Response.json({ error: error.message, timestamp: new Date().toISOString(), overall_status: "critical" }, { status: 500 });
  }
});