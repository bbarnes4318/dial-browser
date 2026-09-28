import React from "react";
import { PhoneOff, Eye, MapPin, Store } from "lucide-react";

/**
 * The market-scale value proposition for voice-powered merchant dispatch —
 * the demographic data that frames why a phone-in order line reaches people
 * no app or tablet can.
 */
const STATS = [
  {
    icon: PhoneOff,
    figure: "2.1B",
    label: "Non-smartphone & offline users",
    body: "Roughly 600M–2B+ people globally rely on basic or feature phones without mobile internet data. The active installed base of feature phones sits near 2.1 billion units.",
  },
  {
    icon: Eye,
    figure: "2.2B",
    label: "Elderly & visually impaired",
    body: "WHO estimates ~2.2B people live with vision impairment, and 775M+ are aged 65 or older — a population that benefits heavily from voice-first, tactile technology.",
  },
  {
    icon: MapPin,
    figure: "1.8B",
    label: "Low-connectivity & rural",
    body: "ITU data places 1.8B people in rural areas offline, frequently depending on traditional circuit-switched voice (PSTN) when cellular data packets are unavailable.",
  },
  {
    icon: Store,
    figure: "Millions",
    label: "Local merchants",
    body: "Small-to-medium restaurants, independent food stalls, and corner merchants worldwide still rely on manual phone-in orders or disparate tablets for non-app business.",
  },
];

export default function MerchantOnboardingStats() {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
          Reach customers no app can
        </h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-2xl mx-auto">
          Voice is the only channel that reaches the offline, the elderly, and the rural —
          the demographics every delivery app leaves behind.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-mono text-3xl font-bold text-primary">{s.figure}</p>
              <p className="text-sm font-medium mt-1">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{s.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}