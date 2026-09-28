import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Wallet, Sparkles, Users, Crown, Loader2, AlertCircle, ArrowLeft, DollarSign, Zap, ShieldCheck, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import TrafficCharts from "@/components/dashboard/TrafficCharts";
import RegionalHeatmap from "@/components/dashboard/RegionalHeatmap";
import FinancialSummary from "@/components/dashboard/FinancialSummary";
import UsageForecast from "@/components/dashboard/UsageForecast";
import SearchLogViewer from "@/components/dashboard/SearchLogViewer";
import FlaggedReports from "@/components/dashboard/FlaggedReports";
import CommunityQuality from "@/components/dashboard/CommunityQuality";
import DatingHeatMap from "@/components/dashboard/DatingHeatMap";
import DatingEconomics from "@/components/dashboard/DatingEconomics";
import MatchGrowthTrend from "@/components/dashboard/MatchGrowthTrend";
import DisputeReview from "@/components/dashboard/DisputeReview";
import DisputeArchive from "@/components/dashboard/DisputeArchive";
import AdminVoiceInbox from "@/components/dashboard/AdminVoiceInbox";
import FaqManager from "@/components/dashboard/FaqManager";
import GrowthOverview from "@/components/dashboard/GrowthOverview";

const TIER_COLOR = {
  free: "#8A8F98",
  plus: "#D1FF26",
  premium: "#5AE0C8",
  elite: "#E0A85A",
  ultimate: "#C8A0FF",
};

const TIER_ALLOWANCE = {
  free: 25,
  plus: 300,
  premium: 800,
  elite: 2000,
  ultimate: 5000,
};

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        if (!me || me.role !== "admin") {
          setLoading(false);
          return;
        }
        const res = await base44.functions.invoke("getAdminEarnings", {});
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to load earnings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05070A" }}>
        <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#05070A" }}>
        <div className="max-w-md text-center p-8" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle size={32} className="mx-auto mb-3" style={{ color: "#ef4444" }} />
          <p className="font-heading font-bold text-lg mb-1" style={{ color: "#F5F5F7" }}>Admin access required</p>
          <p className="text-sm mb-4" style={{ color: "#8A8F98" }}>This dashboard is restricted to workspace admins.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
            <ArrowLeft size={12} /> Back to home
          </Link>
        </div>
      </div>
    );
  }

  const subs = data?.subscriptions || { activeCount: 0, mrr: 0, byTier: {} };
  const credits = data?.credits || { totalUsed: 0, totalAllocated: 0, estimatedCostUsd: 0, activeUsers: 0, costPerCredit: 0.01 };
  const oneTime = data?.oneTime || { tips: 0, employer: 0, shares: 0, total: 0 };
  const profit = data?.profit || { monthlyNet: 0 };

  const tiers = Object.keys(TIER_ALLOWANCE);

  return (
    <div className="min-h-screen p-6 lg:p-10" style={{ background: "#05070A" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={16} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#D1FF26" }}>// ADMIN — EARNINGS & CREDITS</p>
            </div>
            <h1 className="font-heading font-black text-3xl lg:text-4xl" style={{ color: "#F5F5F7" }}>Business Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/regional-broadcast" className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_24px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
              <MapPin size={12} /> Regional Broadcast
            </Link>
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
              <ArrowLeft size={12} /> Member Dashboard
            </Link>
          </div>
        </div>

        {error ? (
          <div className="p-4 mb-6 flex items-center gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
            <AlertCircle size={14} style={{ color: "#ef4444" }} />
            <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
          </div>
        ) : null}

        {/* Growth & engagement — live signups, searches, matches, social activity */}
        <GrowthOverview />

        {/* Flagged dating reports — surface immediately for admin review */}
        <FlaggedReports />

        {/* Dating community quality — meetup ratings */}
        <CommunityQuality />

        {/* Dating member heat map — where members are located */}
        <DatingHeatMap />

        {/* Dating tier economics — profit per tier, credit cost = $0 */}
        <DatingEconomics />

        {/* Active match growth trend — 30-day match engagement */}
        <MatchGrowthTrend />

        {/* Dispute management — service issue reports from members */}
        <DisputeReview />

        {/* Full searchable dispute archive — filter by status, search all fields */}
        <DisputeArchive />

        {/* Unified admin voice inbox — all dispute notes + dating voice intros */}
        <AdminVoiceInbox />

        {/* Voice FAQ manager — answers callers hear in the searchable FAQ flow */}
        <FaqManager />

        {/* Top KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard icon={DollarSign} label="SUBSCRIPTION MRR" value={`$${subs.mrr.toFixed(2)}`} sub={`${subs.activeCount} active subscribers`} accent="#D1FF26" />
          <KpiCard icon={TrendingUp} label="ONE-TIME REVENUE" value={`$${oneTime.total.toFixed(2)}`} sub="Tips · Employer access · Show shares" accent="#5AE0C8" />
          <KpiCard icon={Zap} label="CREDITS USED (CYCLE)" value={credits.totalUsed.toLocaleString()} sub={`Est. cost $${credits.estimatedCostUsd.toFixed(2)} · ${credits.activeUsers} users`} accent="#E0A85A" />
          <KpiCard icon={Wallet} label="MONTHLY NET" value={`$${profit.monthlyNet.toFixed(2)}`} sub="MRR minus estimated credit cost" accent={profit.monthlyNet >= 0 ? "#D1FF26" : "#ef4444"} />
        </div>

        {/* Financial summary — revenue by tier + testing-cost tracking */}
        <FinancialSummary data={data} />

        {/* Usage forecast — projected monthly cost + volume-discount savings at growth tiers */}
        <UsageForecast />

        {/* Platform traffic — daily call volume & peak usage times (glowing data points) */}
        <TrafficCharts />

        {/* Regional heat map — where highest call volumes originate */}
        <RegionalHeatmap />

        {/* Secure search log viewer — what users are searching for (PII stripped) */}
        <SearchLogViewer />

        {/* Subscription breakdown */}
        <div className="mb-8 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div className="flex items-center gap-2 mb-5">
            <Users size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// SUBSCRIPTION TIERS</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tiers.map((t) => {
              const info = subs.byTier[t] || { count: 0, mrr: 0 };
              const color = TIER_COLOR[t];
              return (
                <div key={t} className="p-4" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${color}40` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-heading font-bold capitalize" style={{ color }}>{t}</span>
                    <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{TIER_ALLOWANCE[t]} CR/MO</span>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>SUBSCRIBERS</p>
                      <p className="font-heading font-black text-xl" style={{ color: "#F5F5F7" }}>{info.count}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>MRR</p>
                      <p className="font-heading font-black text-xl" style={{ color }}>${info.mrr.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-tier profitability guard — price vs max credit cost */}
        {data?.tierProfitability?.length > 0 && (
          <div className="mb-8 p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// PER-TIER PROFIT GUARD</p>
            </div>
            <p className="text-xs mb-4" style={{ color: "#8A8F98" }}>
              Each tier's subscription price vs its maximum possible credit cost (allowance × $0.01). Free is the only unrecovered tier — your accepted marketing cost. Every paid tier must clear a margin, and user activity is hard-capped at the allowance so you never pay beyond it. Admin testing is exempt from credit accounting.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {data.tierProfitability.map((t) => {
                const color = t.tier === "free" ? "#8A8F98" : (TIER_COLOR[t.tier] || "#D1FF26");
                return (
                  <div key={t.tier} className="p-4" style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${color}40` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading font-bold capitalize text-sm" style={{ color }}>{t.tier}</span>
                      {t.tier === "free" ? (
                        <span className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: "rgba(138,143,152,0.15)", color: "#8A8F98" }}>MARKETING</span>
                      ) : t.profitable ? (
                        <span className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.1)", color: "#D1FF26" }}>PROFIT</span>
                      ) : (
                        <span className="font-mono text-[8px] px-1.5 py-0.5" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>LOSS</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>PRICE</span><span className="font-mono text-[9px]" style={{ color: "#F5F5F7" }}>${t.price.toFixed(0)}</span></div>
                      <div className="flex justify-between"><span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>MAX COST</span><span className="font-mono text-[9px]" style={{ color: "#ef4444" }}>-${t.max_credit_cost.toFixed(2)}</span></div>
                      <div className="flex justify-between pt-1" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}><span className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>MARGIN</span><span className="font-heading font-black text-sm" style={{ color: t.profitable ? "#D1FF26" : "#ef4444" }}>${t.max_profit_per_user.toFixed(2)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Credit operations + one-time revenue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// APP OPERATIONS — CREDIT BALANCE</p>
            </div>
            <div className="space-y-3">
              <Row label="Credits allocated (cycle)" value={credits.totalAllocated.toLocaleString()} />
              <Row label="Credits consumed (cycle)" value={credits.totalUsed.toLocaleString()} />
              <Row label="Remaining allocated" value={(credits.totalAllocated - credits.totalUsed).toLocaleString()} />
              <Row label="Estimated platform cost" value={`$${credits.estimatedCostUsd.toFixed(2)} @ $${credits.costPerCredit}/cr`} />
            </div>
            <p className="mt-4 pt-3 font-mono text-[9px] leading-relaxed" style={{ color: "rgba(138,143,152,0.7)", borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
              Users draw AI credits from their tier allowance. Free users are capped at 25/mo (your only out-of-pocket cost). Paid tiers prepay their allowance via subscription, so subscriber usage is covered by their payment — not your balance.
            </p>
          </div>

          <div className="p-6" style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={14} style={{ color: "#D1FF26" }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// ONE-TIME REVENUE</p>
            </div>
            <div className="space-y-3">
              <Row label="Creator tips" value={`$${oneTime.tips.toFixed(2)}`} />
              <Row label="Employer access passes" value={`$${oneTime.employer.toFixed(2)}`} />
              <Row label="Show share purchases" value={`$${oneTime.shares.toFixed(2)}`} />
              <Row label="Total one-time" value={`$${oneTime.total.toFixed(2)}`} bold />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-5" style={{ background: "rgba(16,20,29,0.8)", border: `0.5px solid ${accent}40` }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color: accent }} />
        <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>{label}</p>
      </div>
      <p className="font-heading font-black text-2xl mb-1" style={{ color: "#F5F5F7" }}>{value}</p>
      <p className="font-mono text-[8px] tracking-wider" style={{ color: "rgba(138,143,152,0.7)" }}>{sub}</p>
    </motion.div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
      <span className="text-sm" style={{ color: "#8A8F98" }}>{label}</span>
      <span className={bold ? "font-heading font-bold text-lg" : "font-mono text-sm"} style={{ color: bold ? "#D1FF26" : "#F5F5F7" }}>{value}</span>
    </div>
  );
}