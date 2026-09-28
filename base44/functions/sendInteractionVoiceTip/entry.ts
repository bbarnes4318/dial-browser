import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requireAdmin } from "../../shared/smsAuth.ts";

const TIP_MILESTONES = [1, 3, 5, 10];

const TIP_TEMPLATES = {
  1: {
    category: 'Getting Started',
    phrase: 'Find a plumber near me',
    hint: 'Just say what you need in plain words — the Dial Browser connects you to the right service instantly.',
  },
  3: {
    category: 'Compare',
    phrase: 'Compare providers near me',
    hint: 'Say this to see multiple contractors side by side with ratings and verified badges before you choose.',
  },
  5: {
    category: 'Save',
    phrase: 'Save this provider',
    hint: 'Bookmark any service you like so you can call them back with one tap — no need to search again.',
  },
  10: {
    category: 'SOS',
    phrase: 'Emergency help',
    hint: 'Press the SOS button or say this to instantly alert your emergency contacts with your location.',
  },
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { userId } = body;
    const base44 = createClientFromRequest(req);

    // LLM + notification generation — admin only (scheduled workflow carries an admin session).
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    // Count this user's voice interactions
    const userCommands = await base44.asServiceRole.entities.VoiceCommand.filter({ created_by_id: userId });
    const interactionCount = (userCommands || []).length;

    if (!TIP_MILESTONES.includes(interactionCount)) {
      return Response.json({ status: 'skipped', reason: 'Not a milestone interaction', interactionCount });
    }

    const template = TIP_TEMPLATES[interactionCount];

    // Generate a contextual, fresh tip using the LLM
    const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a voice-platform concierge for "1 Call Away" — a service where users call in and speak natural commands to access digital services.

A user has just completed their ${interactionCount}th voice interaction. Generate ONE helpful voice-usage tip.

Context for milestone ${interactionCount}: ${template.hint}

The tip must be:
- Practical and actionable (a specific phrase the user can say)
- Warm and encouraging — celebrate that they've used the platform ${interactionCount} times
- Under 120 characters for the phrase, under 180 for the hint
- Focused on what the user gains by using voice

Return JSON with: category (one word, capitalized), phrase (the exact words to say, in quotes), hint (a short helpful explanation).`,
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

    const notification = await base44.asServiceRole.entities.AppNotification.create({
      notification_type: 'system',
      title: `Voice Tip #${interactionCount} — ${tip.category || template.category}`,
      message: `Say: "${tip.phrase}" — ${tip.hint || template.hint}`,
      related_type: 'voice_tip',
      action_label: 'Open Dashboard',
      action_url: '/dashboard',
      priority: 'normal',
      read: false,
    });

    return Response.json({
      status: 'success',
      milestone: interactionCount,
      tip: {
        category: tip.category || template.category,
        phrase: tip.phrase,
        hint: tip.hint || template.hint,
      },
      notification_id: notification.id,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('sendInteractionVoiceTip error:', error);
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});