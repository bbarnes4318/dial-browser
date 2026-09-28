import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';

// Public download / export endpoint. Streams an audiobook as a single MP3
// attachment. For multi-chapter books, the per-chapter MP3s are fetched and
// concatenated into one file. Triggered from a download link in the UI.

function sanitizeFilename(name: string): string {
  return (name || 'audiobook').replace(/[^a-z0-9 _-]/gi, '').trim().replace(/\s+/g, '_') || 'audiobook';
}

export default async function(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    let id = url.searchParams.get('id');
    // Also accept the id in a JSON body so the function works via SDK invoke too.
    if (!id && req.method === 'POST') {
      try { const body = await req.json(); if (body && body.id) id = body.id; } catch {}
    }
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const base44 = createClientFromRequest(req);
    const book = await base44.asServiceRole.entities.Audiobook.get(id);
    if (!book) return Response.json({ error: 'Audiobook not found' }, { status: 404 });

    // Paid audiobooks require a completed purchase by the authenticated caller.
    // Free audiobooks (price 0) remain a public download, preserving prior behavior.
    const bookPrice = parseFloat(book.price) || 0;
    if (bookPrice > 0) {
      let me;
      try { me = await base44.auth.me(); } catch {}
      if (!me || !me.id) {
        return Response.json({ error: 'Sign in and purchase this audiobook to download the full chapter.', purchase_required: true }, { status: 401 });
      }
      // A 'paid' row only counts as proof of payment when it carries a
      // checkout_id minted by create-checkout and fulfilled by the
      // wix-payments-webhook. A self-created row with status 'paid' (now
      // blocked by RLS, but checked here too) has no checkout_id and is rejected.
      const owned = await base44.asServiceRole.entities.AudiobookPurchase.filter(
        { audiobook_id: id, owner_user_id: me.id, status: 'paid' },
        '-created_date',
        5
      );
      const verified = (owned || []).find((p) => p.checkout_id && p.checkout_id.trim() !== '');
      if (!verified) {
        return Response.json({ error: 'You have not purchased this audiobook.', purchase_required: true }, { status: 403 });
      }
    }

    const urls: string[] = (book.chapter_audio_urls && book.chapter_audio_urls.length > 0)
      ? book.chapter_audio_urls.filter(Boolean)
      : (book.audio_url ? [book.audio_url] : []);
    if (urls.length === 0) return Response.json({ error: 'No audio available for this audiobook' }, { status: 404 });

    // Fetch every chapter and concatenate the MP3 bytes.
    const parts: Uint8Array[] = [];
    for (const u of urls) {
      const res = await fetch(u);
      if (!res.ok) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      parts.push(buf);
    }
    if (parts.length === 0) return Response.json({ error: 'Failed to fetch audio' }, { status: 502 });

    const total = parts.reduce((n, p) => n + p.length, 0);
    const combined = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) { combined.set(p, offset); offset += p.length; }

    const filename = sanitizeFilename(book.title) + '.mp3';
    return new Response(combined, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(total),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('download-audiobook error:', error?.message || error);
    return Response.json({ error: error?.message || 'Download failed' }, { status: 500 });
  }
}