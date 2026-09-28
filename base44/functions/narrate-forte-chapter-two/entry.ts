import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import { FORTE_CHAPTER_TWO } from '../../shared/forteAudiobookChapterTwo.ts';

// Generates Part Two for one S. Jason Forte audiobook, reuses the existing
// Part One audio_url as chapter 1, and stores the ordered playlist in
// chapter_audio_urls with an updated total duration and chapter_count.
// Admin-only — burns TTS credits.

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
    if (!book.audio_url) return Response.json({ error: 'Part One audio is missing — narrate it first' }, { status: 409 });

    const script = FORTE_CHAPTER_TWO[book.title];
    if (!script) return Response.json({ error: 'No Part Two script for title: ' + book.title }, { status: 404 });

    const text = script.slice(0, 4900);
    const voice = body?.voice || 'storm';

    const speech = await base44.asServiceRole.integrations.Core.GenerateSpeech({
      text,
      voice,
      language_code: 'en',
    });
    const ch2Url = speech?.url;
    if (!ch2Url) return Response.json({ error: 'Speech generation returned no audio url' }, { status: 502 });

    // Chapter 1 = existing audio_url (already narrated). Chapter 2 = new.
    const chapterAudioUrls = [book.audio_url, ch2Url];

    // Duration: keep Part One duration (book.duration_minutes) + Part Two estimate.
    const words = text.trim().split(/\s+/).length;
    const ch2Minutes = Math.max(1, Math.round((words / 150) * 10) / 10);
    const totalMinutes = Math.round(((book.duration_minutes || 0) + ch2Minutes) * 10) / 10;

    await base44.asServiceRole.entities.Audiobook.update(audiobookId, {
      chapter_audio_urls: chapterAudioUrls,
      chapter_count: 2,
      duration_minutes: totalMinutes,
      narrator: 'S. Jason Forte',
    });

    return Response.json({
      ok: true,
      title: book.title,
      chapter_audio_urls: chapterAudioUrls,
      duration_minutes: totalMinutes,
      chapter2_words: words,
    });
  } catch (error) {
    console.error('narrate-forte-chapter-two error:', error?.message || error);
    return Response.json({ error: error?.message || 'Failed to narrate Part Two' }, { status: 500 });
  }
}