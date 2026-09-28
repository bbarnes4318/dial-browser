import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requireAdmin } from "../../shared/smsAuth.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Transcribes all users' voice interactions — admin only.
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    // Find VoiceInteractions that have audio but no transcript
    const interactions = await base44.asServiceRole.entities.VoiceInteraction.list('-created_date', 200);

    const needsTranscription = (interactions || []).filter(
      (i) => i.audio_url && (!i.transcript || i.transcript.trim() === '')
    );

    if (needsTranscription.length === 0) {
      return Response.json({ success: true, message: 'No voice calls pending transcription', transcribed: 0 });
    }

    let transcribed = 0;
    let failed = 0;
    const errors = [];

    for (const item of needsTranscription) {
      try {
        const result = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: item.audio_url });
        const transcript = (typeof result === 'string' ? result : result?.transcript || result?.text || '').trim();
        if (transcript) {
          await base44.asServiceRole.entities.VoiceInteraction.update(item.id, { transcript });
          transcribed++;
        } else {
          failed++;
          errors.push({ id: item.id, title: item.title, error: 'Empty transcription result' });
        }
      } catch (err) {
        failed++;
        errors.push({ id: item.id, title: item.title, error: err.message });
      }
    }

    return Response.json({
      success: true,
      transcribed,
      failed,
      total_pending: needsTranscription.length,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('autoTranscribeCalls error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});