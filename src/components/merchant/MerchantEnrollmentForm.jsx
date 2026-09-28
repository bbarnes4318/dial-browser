import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Phone, Webhook, MessageSquare, Loader2 } from "lucide-react";
import { generateWebhookSecret } from "./secretUtil";

/**
 * MerchantEnrollmentForm — a merchant registers their restaurant name, public
 * phone (the number customers call), dispatch webhook URL (where orders land),
 * and staff SMS cancel-contact number. A per-merchant webhook signing secret
 * is generated automatically.
 */
export default function MerchantEnrollmentForm({ onEnrolled }) {
  const [form, setForm] = useState({
    merchant_name: "",
    public_phone: "",
    dispatch_webhook_url: "",
    cancel_sms_number: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.merchant_name || !form.public_phone || !form.dispatch_webhook_url || !form.cancel_sms_number) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      const { base44 } = await import("@/api/base44Client");
      await base44.entities.MerchantDispatch.create({
        ...form,
        webhook_secret: generateWebhookSecret(),
        active: true,
        forward_configured: false,
      });
      onEnrolled?.();
    } catch (err) {
      setError(err?.message || "Failed to enroll. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
          <Store className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Enroll Your Restaurant</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
          Forward your existing phone line to 1 Call Away. We transcribe phone-in orders by voice and
          auto-fire them straight into your digital order queue — no tablet typing.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5 bg-card border border-border rounded-2xl p-6">
        <div className="space-y-2">
          <Label>Restaurant name</Label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={form.merchant_name}
              onChange={update("merchant_name")}
              placeholder="Mario's Pizza"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Your public phone number (customers call this)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={form.public_phone}
              onChange={update("public_phone")}
              placeholder="+1 555 123 4567"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dispatch webhook URL (your order queue)</Label>
          <div className="relative">
            <Webhook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={form.dispatch_webhook_url}
              onChange={update("dispatch_webhook_url")}
              placeholder="https://your-pos.com/orders/incoming"
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            We POST the structured order here with an HMAC-SHA256 signature header so you can verify it.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Staff SMS cancel-contact number</Label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={form.cancel_sms_number}
              onChange={update("cancel_sms_number")}
              placeholder="+1 555 987 6543"
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Gets a 60-second "reply CANCEL" text for each order so you can void mistakes.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive" data-no-translate>
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enrolling…
            </>
          ) : (
            "Enroll & get forwarding instructions"
          )}
        </Button>
      </form>
    </div>
  );
}