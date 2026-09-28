// Shared authorization helper for SMS-dispatching backend functions.
//
// SMS sending is a privileged, cost-bearing operation. These functions run
// with the service role, so without an auth check they act as an open SMS
// relay for unauthenticated callers. This helper enforces:
//   1. A valid authenticated caller (base44.auth.me()).
//   2. For single-recipient dispatchers: non-admins may only send to the
//      phone number registered on their own Member record. Admins may send
//      to any recipient (support/operations).
//
// Broadcast functions (mass SMS to many subscribers) should NOT use this
// helper — they require an explicit admin role check instead.

export function normalizePhone(p) {
  return String(p || "").replace(/[^0-9]/g, "");
}

// Require an authenticated admin caller. Broadcast / scheduled / operational
// functions that act across all users' data must be restricted to admins
// (or the platform scheduler, which carries an admin session). Returns
// { user } on success, or { error: Response } to return.
export async function requireAdmin(base44) {
  let user = null;
  try { user = await base44.auth.me(); } catch { /* not authenticated */ }
  if (!user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "admin") {
    return { error: Response.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { user };
}

export async function authorizeSmsDispatch(base44, recipientPhone, requireOwnerMatch) {
  const user = await base44.auth.me();
  if (!user) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Admins may dispatch to any recipient (support / operations use case)
  if (user.role === "admin") {
    return { user };
  }

  if (requireOwnerMatch) {
    let member = null;
    try {
      const members = await base44.asServiceRole.entities.Member.filter({ created_by_id: user.id });
      member = (members && members[0]) || null;
    } catch (e) {
      // fall through to denial below
    }

    const memberPhone = member && member.phone ? normalizePhone(member.phone) : null;
    if (!memberPhone) {
      return { error: Response.json({ error: "No registered phone number on file for your account" }, { status: 403 }) };
    }
    if (normalizePhone(recipientPhone) !== memberPhone) {
      return { error: Response.json({ error: "Recipient phone must match your registered number" }, { status: 403 }) };
    }
  }

  return { user };
}