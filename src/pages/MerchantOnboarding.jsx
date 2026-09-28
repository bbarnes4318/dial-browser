import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight, PhoneCall, BarChart3, Receipt, Trophy } from "lucide-react";
import MerchantOnboardingStats from "@/components/merchant/MerchantOnboardingStats";
import MerchantOnboardingSteps from "@/components/merchant/MerchantOnboardingSteps";
import MerchantLeaderboard from "@/components/merchant/MerchantLeaderboard";

const INFOGRAPHIC_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/33b74ecf6_Gemini_Generated_Image_pmjmshpmjmshpmjm1.jpg";

const STATEMENT_URL =
  "https://media.base44.com/images/public/6a422320311efd575ae6536c/5bfbc2f5b_Gemini_Generated_Image_yek1j0yek1j0yek1.jpg";

export default function MerchantOnboarding() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header badge */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
          <Rocket className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono text-primary tracking-wider uppercase" data-no-translate>
            Merchant Dispatch
          </span>
        </div>
      </div>

      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
          Turn any phone into an
          <br className="hidden sm:block" />{" "}
          <span className="text-primary">automated order line</span>
        </h1>
        <p className="text-muted-foreground text-base mt-4 max-w-2xl mx-auto">
          The voice-powered dispatch solution. Integrate voice infrastructure to unlock critical
          avenues — reach offline users, enhance inclusivity, and streamline operations.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <Link to="/merchant-dispatch">
            <Button size="lg" className="w-full sm:w-auto">
              Enroll your restaurant <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/merchant-dispatch">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Open the dashboard
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-3" data-no-translate>
          No apps, no Wi-Fi, no tablets needed for customers.
        </p>
      </div>

      {/* Infographic image */}
      <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden border border-border bg-card mb-14">
        <img
          src={INFOGRAPHIC_URL}
          alt="Dial Browser Merchant Dispatch — turn any phone into an automated order line. Overview, how it works, and the merchant dashboard."
          className="w-full h-auto block"
          loading="lazy"
        />
      </div>

      {/* Value-prop stats */}
      <section className="mb-14">
        <MerchantOnboardingStats />
      </section>

      {/* How it works */}
      <section className="mb-14">
        <MerchantOnboardingSteps />
      </section>

      {/* Merchant leaderboard */}
      <section className="mb-14">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-xl font-bold tracking-tight">Top merchants</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
          Businesses ranked by order completion rate and customer rating — updated from live
          dispatch and review data.
        </p>
        <MerchantLeaderboard />
      </section>

      {/* Dashboard callout */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-14">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-xl font-bold tracking-tight">The merchant dashboard</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              A live control center for every phone-in order. Watch voice-to-text orders arrive in
              real time, track each request's status from received to fired to delivered, and pause
              dispatch with one toggle — all without touching a tablet.
            </p>
            <Link to="/merchant-dispatch" className="inline-block mt-4">
              <Button variant="outline" size="sm">
                <PhoneCall className="w-4 h-4 mr-1.5" /> Go to dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sample merchant statement */}
      <section className="mb-14">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-primary" />
          <h2 className="font-heading text-xl font-bold tracking-tight">Sample merchant statement</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          Each billing period you receive a clear, itemized statement — base plan, per-order intake
          fees, overage charges, and taxes — with your order volume and call minutes, auto-charged to
          your card on file.
        </p>
        <div className="rounded-2xl overflow-hidden border border-border bg-card">
          <img
            src={STATEMENT_URL}
            alt="Sample Dial Browser Merchant Services statement and activity ledger for Luigi's Pizzeria & Trattoria — merchant profile, order volume summary, and financial breakdown."
            className="w-full h-auto block"
            loading="lazy"
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center py-10 border-t border-border">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
          Tap into new demographics
        </h2>
        <p className="text-muted-foreground text-sm mt-2 mb-6 max-w-xl mx-auto">
          Offline users, the elderly, and rural expansion — reached through the one channel they
          already have: a phone call.
        </p>
        <Link to="/merchant-dispatch">
          <Button size="lg">
            Get started <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </section>
    </div>
  );
}