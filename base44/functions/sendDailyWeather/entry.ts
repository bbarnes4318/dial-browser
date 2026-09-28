import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requireAdmin } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Mass SMS dispatch + LLM calls — admin only (scheduled workflow carries an admin session).
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    // Get all active weather subscribers
    const subscribers = await base44.asServiceRole.entities.WeatherSubscription.filter({ active: true });

    if (!subscribers || subscribers.length === 0) {
      return Response.json({ message: "No active weather subscribers", sent: 0 });
    }

    let sentCount = 0;
    const errors = [];

    for (const sub of subscribers) {
      try {
        // Fetch weather for this subscriber's location
        const weatherRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Provide a concise daily weather forecast SMS message for: ${sub.location}. Include today's high/low in Fahrenheit, condition (sunny, cloudy, rain, etc.), and one tip (bring umbrella, dress warm, etc.). Keep it under 160 characters. Format: "Good morning! Today in {location}: {condition}, {low}°F-{high}°F. {tip}"`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              sms_message: { type: "string" },
              location: { type: "string" },
              condition: { type: "string" },
              high_f: { type: "number" },
              low_f: { type: "number" },
            },
          },
        });

        const smsMessage = weatherRes.sms_message || `Good morning! Today in ${sub.location}: ${weatherRes.condition || "variable conditions"}, ${Math.round(weatherRes.low_f || 0)}°F-${Math.round(weatherRes.high_f || 0)}°F.`;

        // Create SMS notification record, then deliver via Twilio
        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: "daily_summary",
          recipient_name: sub.full_name,
          recipient_phone: sub.phone,
          title: `Daily Weather: ${sub.location}`,
          message_body: smsMessage,
          related_name: sub.location,
          status: "pending",
          read: false,
        });
        const sms = await sendTwilioSms(sub.phone, smsMessage);
        try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
        if (sms.success) sentCount++;
      } catch (err) {
        errors.push({ subscriber: sub.phone, error: err.message });
      }
    }

    return Response.json({
      message: `Daily weather SMS sent to ${sentCount} of ${subscribers.length} subscribers`,
      sent: sentCount,
      total: subscribers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("sendDailyWeather error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});