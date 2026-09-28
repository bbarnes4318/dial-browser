import { createClientFromRequest } from 'npm:@base44/sdk@0.8.49';
import {
  resolveTier, ensureEntitlement, remainingMinutes, normalizeE164, isAllowedContact,
} from "../../shared/phoneMetering.ts";
import { twimlEscape } from "../../shared/twilioVoice.ts";

// Per-call minute allocation reserved at placement to bound telephony spend.
// Audiobooks are long-form, so this is higher than the radio cap, but the call
// is still hard-capped to reserve*60 seconds via Twilio TimeLimit and minutes
// are reserved up-front so an exhausted member can't sidestep the cap.
const AUDIO_BRIDGE_MAX_MINUTES = 20;

/**
 * bridge-audio-call — bridges an audiobook to a real phone call.
 * Places an outbound Twilio call to the member's phone that <Play>s the
 * selected audiobook chapter, so they can listen over any phone line
 * (no app, no data plan). Metered against the member's monthly call minutes
 * via PhoneEntitlement, exactly like the radio bridge.
 *
 * Security: the audio URL is resolved from the app-owned Audiobook record
 * (never attacker-supplied), paid titles require a confirmed AudiobookPurchase,
 * the dialed number must be one of the member's own pre-existing contacts
 * (age-gated), and a fixed minute allocation is reserved at placement.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized", code: "auth_required" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const phone = normalizeE164(body.phone);
    const audiobookId = String(body.audiobook_id || "").trim();
    const chapterIndex = Number.isFinite(body.chapter_index) ? Math.max(0, Math.floor(body.chapter_index)) : 0;
    if (!audiobookId) return Response.json({ error: "Audiobook is required.", code: "invalid_audiobook" }, { status: 400 });
    if (!phone) return Response.json({ error: "A valid phone number is required.", code: "invalid_phone" }, { status: 400 });

    // Resolve the audiobook (public read). The audio URL comes from the
    // app-owned record only — never from a raw attacker-supplied URL.
    let book;
    try { book = await base44.entities.Audiobook.get(audiobookId); } catch { book = null; }
    if (!book || !book.audio_url) {
      return Response.json({ error: "That audiobook isn't available for phone streaming.", code: "invalid_audiobook" }, { status: 400 });
    }

    // Pick the chapter audio URL when multi-chapter, else the single audio_url.
    const chapters = Array.isArray(book.chapter_audio_urls) ? book.chapter_audio_urls : [];
    let audioUrl = book.audio_url;
    if (chapters.length > 0) {
      audioUrl = (chapterIndex < chapters.length ? chapters[chapterIndex] : chapters[0]) || book.audio_url;
    }
    if (!audioUrl) return Response.json({ error: "No audio file for that chapter.", code: "no_audio" }, { status: 400 });

    // Paid audiobooks require a confirmed purchase before phone streaming.
    const price = parseFloat(book.price) || 0;
    if (price > 0) {
      // Require a checkout_id on the paid row — only create-checkout mints the
      // checkout_id and only the wix-payments-webhook sets status 'paid', so a
      // paid row with a non-empty checkout_id is provenance of a real payment.
      // A self-created 'paid' row (now blocked by RLS) has no checkout_id.
      const purchases = await base44.asServiceRole.entities.AudiobookPurchase.filter(
        { audiobook_id: audiobookId, owner_user_id: user.id, status: "paid" }, "-created_date", 5
      ).catch(() => []);
      const verified = (purchases || []).find((p) => p.checkout_id && p.checkout_id.trim() !== '');
      if (!verified) {
        return Response.json({
          error: "Purchase this audiobook first to unlock phone listening.",
          code: "purchase_required",
        }, { status: 403 });
      }
    }

    // Entitlement + disclaimer + minute cap
    const tier = await resolveTier(base44, user.id);
    const ent = await ensureEntitlement(base44, user.id, tier);
    if (!ent || !ent.disclaimer_acknowledged) {
      return Response.json({
        error: "Please accept the one-time non-emergency (no 911) disclaimer before placing a call.",
        code: "disclaimer_required",
      }, { status: 403 });
    }
    const rem = remainingMinutes(ent);
    if (rem <= 0) {
      return Response.json({
        error: "You're out of call minutes for this cycle. Upgrade your plan or add a top-up to continue.",
        code: "no_minutes",
      }, { status: 403 });
    }

    // Recipient must be the caller's own pre-existing contact (age-gated) —
    // blocks dialing arbitrary numbers for harassment / voice phishing.
    const allowed = await isAllowedContact(base44, phone);
    if (!allowed) {
      return Response.json({
        error: "You can only bridge audiobooks to a number saved in your contacts. Add the number to your contacts first.",
        code: "recipient_not_contact",
      }, { status: 403 });
    }

    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_VOICE_NUMBER || process.env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !fromNumber) {
      return Response.json({ error: "Telephony is not configured.", code: "telephony_unavailable" }, { status: 503 });
    }

    const reserve = Math.min(AUDIO_BRIDGE_MAX_MINUTES, rem);
    const chapterLabel = chapters.length > 0 ? ` Chapter ${chapterIndex + 1}.` : "";

    // Build TwiML from the vetted audiobook record only — no user-controlled
    // URL or text reaches <Play> / <Say>.
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Connecting you to ${twimlEscape(book.title)} by ${twimlEscape(book.author || "")}.${twimlEscape(chapterLabel)} on Dial Browser.</Say>
  <Play loop="0">${twimlEscape(audioUrl)}</Play>
</Response>`;

    const url = new URL(req.url);
    const base = `${url.protocol}//${url.host}`;
    const statusCallback = `${base}/functions/phone-call-status`;

    const auth = btoa(`${sid}:${token}`);
    const params = new URLSearchParams();
    params.set("From", fromNumber);
    params.set("To", phone);
    params.set("Twiml", twiml);
    params.set("TimeLimit", String(reserve * 60));
    params.set("StatusCallback", statusCallback);
    params.set("StatusCallbackEvent", "completed");
    params.set("StatusCallbackMethod", "POST");

    const twRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const twData = await twRes.json();

    if (!twRes.ok || !twData.sid) {
      console.error("bridge-audio-call Twilio error:", twData.message || twRes.status);
      return Response.json({
        error: twData.message || `Twilio error ${twRes.status}`,
        code: "twilio_error",
      }, { status: 502 });
    }

    // Reserve the minutes immediately so the cap can't be sidestepped with
    // concurrent calls before the completion callback bills. minutes_billed
    // is set on the PhoneCall row so phone-call-status treats this call as
    // already metered and doesn't double-bill it.
    try {
      await base44.asServiceRole.entities.PhoneEntitlement.update(ent.id, {
        minutes_used: (ent.minutes_used || 0) + reserve,
      });
    } catch (e) { console.error("bridge-audio-call: failed to reserve minutes:", e.message); }

    await base44.asServiceRole.entities.PhoneCall.create({
      owner_user_id: user.id,
      direction: "outbound",
      from_number: fromNumber,
      to_number: phone,
      remote_number: phone,
      remote_label: `${book.title} (audiobook bridge)`,
      status: "connecting",
      call_sid: twData.sid,
      started_at: new Date().toISOString(),
      created_by_id: user.id,
      recorded: false,
      minutes_billed: reserve,
    });

    return Response.json({ ok: true, callSid: twData.sid, bookTitle: book.title, reserved_minutes: reserve });
  } catch (error) {
    console.error("bridge-audio-call error:", error.message);
    return Response.json({ error: error.message || "Failed to place call." }, { status: 500 });
  }
}