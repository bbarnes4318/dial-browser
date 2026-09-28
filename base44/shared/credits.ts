// Shared credit-enforcement for the app's AI/integration operations.
// Every credit-consuming backend function calls requireAuthAndCredits() so that
// usage draws from the caller's tier allowance (free=25, plus=300, premium=800,
// elite=2000, ultimate=5000 per cycle). This caps the builder's out-of-pocket
// credit spend to the free tier only; paid subscribers prepay their allowance
// via their subscription, so the platform never pays for a user's credits beyond
// the free cap.

export const TIER_ALLOWANCE: Record<string, number> = {
  free: 25,
  plus: 300,
  premium: 800,
  elite: 2000,
  ultimate: 5000,
};

export const TIER_PRICE: Record<string, { monthly: number; annual: number }> = {
  free: { monthly: 0, annual: 0 },
  plus: { monthly: 19, annual: 190 },
  premium: { monthly: 39, annual: 390 },
  elite: { monthly: 79, annual: 790 },
  ultimate: { monthly: 149, annual: 1490 },
};

// Estimated platform cost per AI credit (USD) — used for profit reporting.
export const COST_PER_CREDIT = 0.01;

// Per-operation credit costs, aligned with real integration credit consumption.
export const CREDIT_COSTS = {
  llm: 1,        // InvokeLLM (no web context)
  llm_web: 2,    // InvokeLLM with add_context_from_internet
  transcribe: 2, // TranscribeAudio (Whisper)
  extract: 2,    // ExtractDataFromUploadedFile
  vision_llm: 2, // InvokeLLM with file_urls
};

// GenerateSpeech costs 1 credit per 50 characters (matches the platform's billing).
export function ttsCost(text: string): number {
  return Math.max(1, Math.ceil(((text || "").length) / 50));
}

function addMonth(iso: string): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

function inCycle(startISO: string, now = new Date()): boolean {
  if (!startISO) return false;
  const start = new Date(startISO);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return now >= start && now < end;
}

async function getTier(base44, userId): Promise<string> {
  try {
    const subs = await base44.asServiceRole.entities.Subscription.filter(
      { owner_user_id: userId, subscription_active: true },
      "-created_date", 5
    );
    if (subs && subs.length > 0 && subs[0].tier) return subs[0].tier;
  } catch { /* ignore — treat as free */ }
  return "free";
}

// Ensure a CallCredit record exists for the current cycle; reset when the cycle
// expires or the user's tier changes.
export async function ensureCreditRecord(base44, userId) {
  const now = new Date();
  const tier = await getTier(base44, userId);
  const allowance = TIER_ALLOWANCE[tier] ?? TIER_ALLOWANCE.free;

  const existing = await base44.asServiceRole.entities.CallCredit.filter(
    { created_by_id: userId }, "-created_date", 1
  );
  if (existing && existing.length > 0) {
    const rec = existing[0];
    if (inCycle(rec.billing_cycle_start, now) && rec.plan_tier === tier && (rec.total_credits || 0) === allowance) {
      return rec;
    }
    const startISO = now.toISOString();
    await base44.asServiceRole.entities.CallCredit.update(rec.id, {
      plan_tier: tier,
      total_credits: allowance,
      used_credits: 0,
      billing_cycle_start: startISO,
      billing_cycle_end: addMonth(startISO),
    });
    return { ...rec, plan_tier: tier, total_credits: allowance, used_credits: 0, billing_cycle_start: startISO, billing_cycle_end: addMonth(startISO) };
  }

  const startISO = now.toISOString();
  const rec = await base44.asServiceRole.entities.CallCredit.create({
    plan_tier: tier,
    total_credits: allowance,
    used_credits: 0,
    billing_cycle_start: startISO,
    billing_cycle_end: addMonth(startISO),
    bonus_credits: 0,
  });
  return rec;
}

// Atomically check + consume credits. Returns { ok, remaining, tier } or
// { ok:false, insufficient, remaining, tier, required }.
export async function consumeCredits(base44, userId, cost: number) {
  if (cost <= 0) return { ok: true, cost: 0, remaining: 0 } as const;
  // Atomic check-and-increment with optimistic concurrency: the conditional
  // update only applies when used_credits still matches the snapshot we read,
  // so two concurrent requests cannot both spend the same remaining credit
  // (the loser gets updated:0 and retries / re-checks the balance). This is
  // the server-side metering guarantee — the client cannot bypass it.
  for (let attempt = 0; attempt < 2; attempt++) {
    const rec = await ensureCreditRecord(base44, userId);
    const used = rec.used_credits || 0;
    const remaining = (rec.total_credits || 0) + (rec.bonus_credits || 0) - used;
    if (remaining < cost) {
      return { ok: false, insufficient: true, remaining, tier: rec.plan_tier, required: cost } as const;
    }
    const res: any = await base44.asServiceRole.entities.CallCredit.updateMany(
      { created_by_id: userId, used_credits: used },
      { $inc: { used_credits: cost } }
    );
    if (res && res.updated > 0) {
      return { ok: true, cost, remaining: remaining - cost, tier: rec.plan_tier } as const;
    }
    // Race lost — a concurrent request changed used_credits; loop and re-check.
  }
  return { ok: false, insufficient: true, remaining: 0, tier: "free", required: cost, error: "credit_update_conflict" } as const;
}

// Require an authenticated user AND enough credits for an operation.
// Returns { user, remaining, tier } on success, or { error: Response } to return.
export async function requireAuthAndCredits(base44, cost: number) {
  const user = await base44.auth.me();
  if (!user) {
    return { error: Response.json({ error: "Authentication required", auth_required: true }, { status: 401 }) } as const;
  }
  // Admins (the workspace owner testing their own app) bypass credit consumption
  // entirely: their activity is never throttled by a quota and is NOT recorded
  // against any CallCredit balance, so it never shows up as a cost in the profit
  // dashboard. This is the "don't pay to test my own app" guarantee at the app
  // accounting level — only real user activity draws down credits.
  if (user.role === "admin") {
    return { user, remaining: null, tier: "admin", test_mode: true } as const;
  }
  const consumed = await consumeCredits(base44, user.id, cost);
  if (!consumed.ok) {
    return {
      error: Response.json(
        { error: "Insufficient credits", insufficient_credits: true, remaining: consumed.remaining, tier: consumed.tier, required: (consumed as any).required },
        { status: 402 }
      ),
    } as const;
  }
  return { user, remaining: (consumed as any).remaining, tier: (consumed as any).tier } as const;
}