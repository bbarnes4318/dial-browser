import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { authorizeSmsDispatch } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";

// Verified play destination — real, playable text games hosted on PlayHop.
// Users receive this link via SMS and can start playing instantly in their browser.
const VERIFIED_PLAY_LINK = "https://playhop.com/tag/text_709";

const GAME_LIBRARY = {
  "signal-runner": { title: "Signal Runner", genre: "Action / Runner" },
  "dial-quest": { title: "Dial Quest", genre: "RPG / Adventure" },
  "frequency-wars": { title: "Frequency Wars", genre: "Space Shooter" },
  "pulse-arena": { title: "Pulse Arena", genre: "Fighting" },
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { phone, game_id, player_name } = body;

    if (!phone) {
      return Response.json({ error: "Missing required field: phone" }, { status: 400 });
    }
    if (!game_id) {
      return Response.json({ error: "Missing required field: game_id" }, { status: 400 });
    }

    const game = GAME_LIBRARY[game_id];
    if (!game) {
      return Response.json({ error: "Game not found in library" }, { status: 404 });
    }

    const base44 = createClientFromRequest(req);

    // Require an authenticated caller; non-admins may only send to their own registered phone
    const auth = await authorizeSmsDispatch(base44, phone, true);
    if (auth.error) return auth.error;

    const message_body = `1 CALL AWAY GAMES: ${player_name || "Player"}, your verified play link for "${game.title}" (${game.genre}) is ready! Tap to start playing now: ${VERIFIED_PLAY_LINK} — Game on!`;

    // Log the SMS notification, then deliver via Twilio
    const notif = await base44.asServiceRole.entities.SmsNotification.create({
      notification_type: "daily_summary",
      recipient_name: player_name || "Player",
      recipient_phone: phone,
      title: `Game Play Link: ${game.title}`,
      message_body,
      related_name: game.title,
      status: "pending",
      read: false,
    });
    const sms = await sendTwilioSms(phone, message_body);
    try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }

    console.log(`Game play-link SMS ${sms.success ? "sent" : "failed"} for "${game.title}" to ${phone}${sms.error ? " — " + sms.error : ""}`);

    return Response.json({
      success: sms.success,
      message: `Verified play link for "${game.title}" ${sms.success ? "sent" : "failed"} to ${phone}`,
      game_title: game.title,
      sms_delivered: sms.success,
      sms_error: sms.success ? undefined : sms.error,
    });
  } catch (error) {
    console.error("sendGameDownloadLink error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});