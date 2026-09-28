import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { FORTE_SCRIPTS } from '../../shared/forteAudiobookScripts.ts';

// Narrates one S. Jason Forte audiobook from its written script in the shared
// module, stores the generated MP3 as audio_url, and sets a real duration.
// Admin-only — it burns TTS credits, so only the builder may run it.

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const audiobookId = body?.audiobook_id;
    if (!audiobookId) return Response.json({ error: 'audiobook_id required' }, { status: 400 });

    const book = await base44.asServiceRole.entities.Audiobook.get(audiobookId);
    if (!book) return Response.json({ error: 'Audiobook not found' }, { status: 404 });

    const script = FORTE_SCRIPTS[book.title];
    if (!script) return Response.json({ error: 'No script found for title: ' + book.title }, { status: 404 });

    // GenerateSpeech caps at 5000 chars — keep a safety margin.
    const text = script.slice(0, 4900);
    const voice = body?.voice || 'storm';

    const speech = await base44.asServiceRole.integrations.Core.GenerateSpeech({
      text,
      voice,
      language_code: 'en',
    });
    const audioUrl = speech?.url;
    if (!audioUrl) return Response.json({ error: 'Speech generation returned no audio url' }, { status: 502 });

    // Real spoken duration estimate at ~150 wpm.
    const words = text.trim().split(/\s+/).length;
    const durationMinutes = Math.max(1, Math.round((words / 150) * 10) / 10);

    await base44.asServiceRole.entities.Audiobook.update(audiobookId, {
      audio_url: audioUrl,
      duration_minutes: durationMinutes,
      narrator: 'S. Jason Forte',
    });

    return Response.json({
      ok: true,
      title: book.title,
      audio_url: audioUrl,
      duration_minutes: durationMinutes,
      words,
    });
  } catch (error) {
    console.error('narrate-forte-book error:', error?.message || error);
    return Response.json({ error: error?.message || 'Failed to narrate audiobook' }, { status: 500 });
  }
}