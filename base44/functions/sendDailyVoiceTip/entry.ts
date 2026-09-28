import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requireAdmin } from "../../shared/smsAuth.ts";

const TIP_SEEDS = [
  'medical appointments', 'grocery ordering', 'weather forecasts', 'bill payments',
  'job searches', 'real estate browsing', 'construction contractor matching',
  'music streaming', 'ride hailing', 'marketplace listings', 'restaurant discovery',
  'emergency SOS alerts', 'voicemail greetings', 'voice notes and reminders',
  'price estimation', 'referral sharing', 'saved services bookmarks', 'SMS subscriptions',
  'voice verification security', 'personal dial numbers',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // LLM + notification generation — admin only (scheduled workflow carries an admin session).
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    const topic = TIP_SEEDS[new Date().getDate() % TIP_SEEDS.length];

    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a friendly voice-platform concierge for "1 Call Away" — a service where users call in and speak natural commands to access digital services (booking doctors, ordering groceries, paying bills, finding jobs, etc.) without apps or internet.

Generate ONE fresh, helpful voice-usage tip about: ${topic}.

The tip must be:
- Practical and actionable (a specific phrase the user can say)
- Warm and encouraging in tone
- Under 120 characters for the phrase, under 180 for the hint
- Focused on what the user gains by using voice

Return JSON with: category (one word, capitalized), phrase (the exact words to say, in quotes), hint (a short helpful explanation of what happens).`,
      response_json_schema: {
        type: 'object',
        properties: {
          category: { type: 'string' },
          phrase: { type: 'string' },
          hint: { type: 'string' },
        },
      },
    });

    const tip = typeof llmResponse === 'string' ? JSON.parse(llmResponse) : llmResponse;

    if (!tip || !tip.phrase) {
      throw new Error('LLM did not return a valid tip');
    }

    // Store as an AppNotification so it surfaces on the dashboard
    const notification = await base44.asServiceRole.entities.AppNotification.create({
      notification_type: 'system',
      title: `Daily Voice Tip — ${tip.category || 'Quick Win'}`,
      message: `Say: "${tip.phrase}" — ${tip.hint || 'Try it on your next call.'}`,
      related_type: 'voice_tip',
      action_label: 'Open Dashboard',
      action_url: '/dashboard',
      priority: 'normal',
      read: false,
    });

    return Response.json({
      status: 'success',
      tip: {
        category: tip.category,
        phrase: tip.phrase,
        hint: tip.hint,
      },
      notification_id: notification.id,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('sendDailyVoiceTip error:', error);
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});