import React from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function BrutalistFooter() {
  const { t } = useLanguage();
  return (
    <footer className="relative overflow-hidden py-20 lg:py-32" style={{ background: '#05070A', borderTop: '0.5px solid rgba(209,255,38,0.1)' }}>
      <div className="px-6 lg:px-16">
        {/* Massive logotype */}
        <div className="mb-16">
          <h2
            className="font-heading font-black leading-none tracking-tighter select-none"
            style={{
              fontSize: 'clamp(60px, 15vw, 200px)',
              color: 'rgba(209, 255, 38, 0.06)',
              lineHeight: '0.85',
            }}
          >
            1 CALL<br />AWAY™
          </h2>
        </div>

        {/* Footer info */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8" style={{ borderTop: '0.5px solid rgba(138,143,152,0.15)', paddingTop: '2rem' }}>
          <div>
            <p className="font-mono text-xs tracking-[0.2em] mb-2" style={{ color: '#D1FF26' }}>
              THE DIAL BROWSER™
            </p>
            <p className="font-mono text-[10px] tracking-wider" style={{ color: '#8A8F98' }}>
              {t("footer.tagline")}
            </p>
          </div>
          <div className="flex gap-8">
            <a href="mailto:founders@dialbrowser.com" className="font-mono text-[10px] tracking-wider transition-colors hover:text-[#D1FF26]" style={{ color: '#8A8F98' }}>
              {t("footer.contact")}
            </a>
            <a href="#early-access" className="font-mono text-[10px] tracking-wider transition-colors hover:text-[#D1FF26]" style={{ color: '#8A8F98' }}>
              {t("footer.earlyAccess")}
            </a>
          </div>
        </div>

        <div className="mt-8">
          <p className="font-mono text-[10px] tracking-wider" style={{ color: '#8A8F98' }}>
            {t("footer.rights", { year: new Date().getFullYear() })}
          </p>
          <p className="font-mono text-[9px] tracking-wider mt-3 max-w-3xl leading-relaxed" style={{ color: 'rgba(138,143,152,0.5)' }}>
            1 CALL AWAY™ and The Dial Browser™ are trademarks of 1 CALL AWAY. This website is for informational purposes only and does not constitute an offer to sell or a solicitation to buy any securities. All product names, logos, and brands are property of their respective owners. Service availability, features, and pricing are subject to change. Use of the platform is governed by our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </footer>
  );
}