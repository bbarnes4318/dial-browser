import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Auto-transcribes a dispute's voice note to text so admins can scan
// complaints without listening to every recording. Triggered automatically
// right after a member files a dispute with a voice note, and re-triggerable
// by an admin from the dashboard for older/untranscribed disputes.
// Runs as the service role for the Core TranscribeAudio call and the dispute
// update (no charge to the reporting member's credits), but verifies the
// caller is the dispute owner or an admin before doing any work.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

    let body = {};
    try { body = await req.json(); } catch {}
    const disputeId = (body && body.dispute_id ? String(body.dispute_id) : "").trim();
    if (!disputeId) return Response.json({ error: "Missing dispute_id" }, { status: 400 });

    let dispute;
    try { dispute = await base44.asServiceRole.entities.Dispute.get(disputeId); } catch { /* not found */ }
    if (!dispute) return Response.json({ error: "Dispute not found" }, { status: 404 });

    const isOwner = dispute.created_by_id === user.id;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) return Response.json({ error: "Forbidden" }, { status: 403 });

    if (!dispute.voice_note_url) return Response.json({ error: "No voice note attached" }, { status: 400 });

    // Skip if already transcribed (unless an explicit re-run is requested).
    if (dispute.voice_note_transcript && !body.force) {
      return Response.json({ transcript: dispute.voice_note_transcript, cached: true });
    }

    const result = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: dispute.voice_note_url });
    const transcript = typeof result === "string"
      ? result
      : (result?.transcript || result?.text || "");
    if (!transcript) return Response.json({ error: "Transcription returned no text" }, { status: 502 });

    await base44.asServiceRole.entities.Dispute.update(disputeId, { voice_note_transcript: transcript });
    return Response.json({ transcript });
  } catch (error) {
    console.error("transcribe-dispute-voice error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}