import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { requireAdmin } from "../../shared/smsAuth.ts";
import { sendTwilioSms } from "../../shared/twilioSms.ts";

// Inline dial service directory — backend functions can't import frontend modules
const DIAL_SERVICES = [
  { id: "01", name: "Flight Booking", category: "Travel", icon: "✈️", dial: "*102#" },
  { id: "02", name: "Hotel Reservations", category: "Travel", icon: "🏨", dial: "*102#" },
  { id: "03", name: "Restaurant Finder", category: "Food", icon: "🍽️", dial: "*101#" },
  { id: "04", name: "Ride Hailing", category: "Transport", icon: "🚗", dial: "*103#" },
  { id: "05", name: "Apartment Search", category: "Housing", icon: "🏠", dial: "*104#" },
  { id: "06", name: "Music Streaming", category: "Entertainment", icon: "🎵", dial: "*105#" },
  { id: "07", name: "Grocery Delivery", category: "Food", icon: "🛒", dial: "*106#" },
  { id: "08", name: "Creator Access", category: "Entertainment", icon: "🎤", dial: "*107#" },
  { id: "09", name: "AI Assistant", category: "Productivity", icon: "🤖", dial: "*108#" },
  { id: "10", name: "Weather Forecast", category: "Local", icon: "🌤️", dial: "*101#" },
  { id: "11", name: "Pharmacy Locator", category: "Health", icon: "💊", dial: "*101#" },
  { id: "12", name: "Job Search", category: "Productivity", icon: "💼", dial: "*108#" },
  { id: "13", name: "Event Tickets", category: "Entertainment", icon: "🎫", dial: "*107#" },
  { id: "14", name: "Money Transfer", category: "Finance", icon: "💸", dial: "*106#" },
  { id: "15", name: "Local Directory", category: "Local", icon: "📍", dial: "*101#" },
  { id: "16", name: "Emergency Services", category: "Health", icon: "🚑", dial: "*101#" },
  { id: "17", name: "Bus & Train Schedules", category: "Transport", icon: "🚌", dial: "*103#" },
  { id: "18", name: "Movie Showtimes", category: "Entertainment", icon: "🎬", dial: "*105#" },
  { id: "19", name: "Food Delivery", category: "Food", icon: "🥡", dial: "*101#" },
  { id: "20", name: "Bill Pay", category: "Finance", icon: "🧾", dial: "*106#" },
  { id: "21", name: "Doctor Appointment", category: "Health", icon: "🩺", dial: "*101#" },
  { id: "22", name: "Car Rental", category: "Travel", icon: "🚙", dial: "*102#" },
  { id: "23", name: "Marketplace Listings", category: "Shopping", icon: "🏷️", dial: "*106#" },
  { id: "24", name: "Real Estate Listings", category: "Housing", icon: "🏘️", dial: "*104#" },
];

// Match an interaction's service_name to a dial service
function matchService(serviceName) {
  if (!serviceName) return null;
  const q = serviceName.toLowerCase().trim();
  return DIAL_SERVICES.find(s =>
    s.name.toLowerCase() === q ||
    s.name.toLowerCase().includes(q) ||
    q.includes(s.name.toLowerCase()) ||
    s.category.toLowerCase() === q
  ) || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Mass SMS digest to all members — admin only (scheduled workflow carries an admin session).
    const admin = await requireAdmin(base44);
    if (admin.error) return admin.error;

    // 1. Fetch ALL voice interactions to build global trending + per-user profiles
    const interactions = await base44.asServiceRole.entities.VoiceInteraction.list("-created_date", 500);

    // 2. Build global service popularity map
    const globalServiceCounts = {};
    // 3. Build per-user category preferences keyed by created_by_id
    const userCategoryPrefs = {};

    (interactions || []).forEach((i) => {
      const matched = matchService(i.service_name);
      if (matched) {
        const key = matched.id;
        globalServiceCounts[key] = (globalServiceCounts[key] || 0) + 1;

        if (i.created_by_id) {
          if (!userCategoryPrefs[i.created_by_id]) userCategoryPrefs[i.created_by_id] = {};
          userCategoryPrefs[i.created_by_id][matched.category] =
            (userCategoryPrefs[i.created_by_id][matched.category] || 0) + 1;
        }
      }
    });

    // 4. Rank services globally by interaction count (fallback to deterministic stats)
    const globalRanked = DIAL_SERVICES
      .map(s => ({ ...s, score: globalServiceCounts[s.id] || 0 }))
      .sort((a, b) => b.score - a.score);

    // 5. Fetch all members with phone numbers
    const members = await base44.asServiceRole.entities.Member.list("-created_date", 500);
    const membersWithPhone = (members || []).filter(m => m.phone && m.full_name);

    let sentCount = 0;
    let skipped = 0;

    for (const member of membersWithPhone) {
      try {
        // Get this member's preferred categories from their listening history
        const prefs = userCategoryPrefs[member.created_by_id] || {};
        const preferredCategories = Object.entries(prefs)
          .sort((a, b) => b[1] - a[1])
          .map(([cat]) => cat);

        let top3;

        if (preferredCategories.length > 0) {
          // Personalize: top services matching their preferred categories,
          // falling back to global ranking if not enough matches
          const personalized = globalRanked.filter(s =>
            preferredCategories.includes(s.category)
          );
          const globalFallback = globalRanked.filter(s =>
            !preferredCategories.includes(s.category)
          );
          top3 = [...personalized, ...globalFallback].slice(0, 3);
        } else {
          // No listening history — use global top 3
          top3 = globalRanked.slice(0, 3);
        }

        if (top3.length === 0) continue;

        // Build the SMS message
        let message = `1 CALL AWAY — DAILY DIGEST\n\nHi ${member.full_name.split(' ')[0]}, your top 3 trending picks today:\n`;
        top3.forEach((svc, i) => {
          message += `\n${i + 1}. ${svc.icon} ${svc.name} — Dial ${svc.dial}`;
        });
        message += `\n\n${preferredCategories.length > 0 ? "Based on your listening history." : "Trending across the network right now."}\nDial any code to connect instantly.`;

        const notif = await base44.asServiceRole.entities.SmsNotification.create({
          notification_type: "daily_summary",
          recipient_name: member.full_name,
          recipient_phone: member.phone,
          title: `Daily Digest: Top 3 Trending Services`,
          message_body: message,
          related_name: top3[0].name,
          status: "pending",
          read: false,
        });
        const sms = await sendTwilioSms(member.phone, message);
        try { await base44.asServiceRole.entities.SmsNotification.update(notif.id, { status: sms.status }); } catch { /* best-effort */ }
        if (sms.success) sentCount++;
      } catch (e) {
        console.error(`Failed to send digest to ${member.phone}: ${e.message}`);
        skipped++;
      }
    }

    return Response.json({
      success: true,
      sent: sentCount,
      skipped,
      total_members: membersWithPhone.length,
      global_top: globalRanked.slice(0, 3).map(s => s.name),
    });
  } catch (error) {
    console.error(`Trending digest error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});