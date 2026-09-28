import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { name, email, phone, subject, category, message, source } = body || {};

    // Validate required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return Response.json({ ok: false, error: "Name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: false, error: "A valid email is required" }, { status: 400 });
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return Response.json({ ok: false, error: "Subject is required" }, { status: 400 });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return Response.json({ ok: false, error: "Message is required" }, { status: 400 });
    }

    // Capture the submitter if they happen to be logged in (non-blocking)
    let submitterUserId = "";
    try {
      const user = await base44.auth.me();
      if (user && user.id) submitterUserId = user.id;
    } catch { /* anonymous visitor — allowed */ }

    const inquiry = await base44.asServiceRole.entities.ContactInquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || "").trim(),
      subject: subject.trim(),
      category: category || "general",
      message: message.trim(),
      status: "new",
      submitter_user_id: submitterUserId,
      source: source || "contact_page",
    });

    return Response.json({ ok: true, id: inquiry.id });
  } catch (error) {
    console.error("submit-contact-inquiry error:", error.message);
    return Response.json({ ok: false, error: "Could not submit your inquiry. Please try again." }, { status: 500 });
  }
}