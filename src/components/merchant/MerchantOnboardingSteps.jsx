import React from "react";
import { UserPlus, PhoneCall, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    title: "Merchant enrollment",
    body: "Register at /merchant-dispatch. Forward your existing published number to the 1 Call Away order line. We generate a secure signing secret for your webhook.",
  },
  {
    icon: PhoneCall,
    title: "Customer call flow",
    body: "Customer dials your number. The automated assistant takes the order by voice, parses it, reads it back for confirmation, and fires the structured order to your webhook.",
  },
  {
    icon: ShieldCheck,
    title: "The 60-second safety valve",
    body: "Staff receives an SMS order alert instantly. Reply CANCEL within 60 seconds and the order is voided — in your queue and with the caller — no manual cleanup.",
  },
];

export default function MerchantOnboardingSteps() {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
          How it works
        </h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-2xl mx-auto">
          Three steps from enrollment to live orders. No apps, no Wi-Fi, no tablets needed for your customers.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="relative bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-mono text-sm text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-heading font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}