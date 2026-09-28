import React, { useState, useEffect } from "react";
import { proxyMediaUrl } from "@/lib/mediaProxy";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Users, DollarSign, PieChart, Lock, Loader2, Check,
  Radio, ArrowUpRight, Shield, Star, ChevronRight,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

import ShareInstructions from "@/components/landing/ShareInstructions";

export default function ShowSharesSection() {
  const [showList, setShowList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listMode, setListMode] = useState(false);
  const [purchaseMode, setPurchaseMode] = useState(null);
  const [form, setForm] = useState({
    show_title: "",
    creator_name: "",
    category: "podcast",
    subscriber_count: "",
    description: "",
    total_shares: "",
    price_per_share: "",
    revenue_share_percent: "",
  });
  const [purchaseForm, setPurchaseForm] = useState({ buyer_name: "", buyer_email: "", shares: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadShows();
  }, []);

  const loadShows = async () => {
    try {
      const data = await base44.entities.ShowShare.filter({ status: "active" }, "-created_date", 20);
      setShowList(data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const update = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleListShow = async (e) => {
    e.preventDefault();
    setError(null);
    const subs = parseInt(form.subscriber_count);
    if (!form.show_title.trim() || !form.creator_name.trim()) {
      setError("Show title and creator name are required.");
      return;
    }
    if (isNaN(subs) || subs < 1000000) {
      setError("This feature requires a minimum of 1,000,000 subscribers to qualify.");
      return;
    }
    if (!form.total_shares || !form.price_per_share || !form.revenue_share_percent) {
      setError("Total shares, price per share, and revenue share percentage are required.");
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.ShowShare.create({
        ...form,
        subscriber_count: subs,
        total_shares: parseInt(form.total_shares),
        price_per_share: parseFloat(form.price_per_share),
        revenue_share_percent: parseFloat(form.revenue_share_percent),
        shares_sold: 0,
        status: "pending_review",
      });
      setSuccess("Your show has been submitted for review. Once approved, it will be listed for public share purchases.");
      setListMode(false);
      setForm({ show_title: "", creator_name: "", category: "podcast", subscriber_count: "", description: "", total_shares: "", price_per_share: "", revenue_share_percent: "" });
    } catch {
      setError("Could not submit your show. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchase = async (show) => {
    setError(null);
    if (!purchaseForm.buyer_name.trim() || !purchaseForm.buyer_email.trim()) {
      setError("Buyer name and email are required.");
      return;
    }
    const shares = parseInt(purchaseForm.shares) || 1;
    if (shares < 1) {
      setError("Must purchase at least 1 share.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await base44.functions.invoke("create-checkout", {
        plan: "share_purchase",
        show_title: show.show_title,
        creator_name: show.creator_name,
        shares: shares,
        price_per_share: show.price_per_share,
        show_share_id: show.id,
        buyer_name: purchaseForm.buyer_name.trim(),
        buyer_email: purchaseForm.buyer_email.trim(),
      });
      if (response?.data?.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      } else {
        setError("Could not initiate checkout. Please try again.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Could not process purchase. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const fmtMoney = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtSubs = (n) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n.toLocaleString();

  return (
    <div className="p-6 lg:p-8" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <PieChart size={14} style={{ color: "#D1FF26" }} />
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// 1 CALL EQUITY™</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
          <DollarSign size={10} style={{ color: "#D1FF26" }} />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>PAID FEATURE · $99.99/mo</span>
        </div>
      </div>

      <h3 className="font-heading font-black text-2xl lg:text-3xl mb-2" style={{ color: "#F5F5F7" }}>
        Sell Shares of Your <span style={{ color: "#D1FF26" }}>Show</span>
      </h3>
      <p className="text-sm mb-6 max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
        Creators with 1M+ subscribers can offer ownership shares of their podcast or show to the public.
        Fans become stakeholders, sharing in the show's revenue growth — a first for the creator economy.
      </p>

      {/* Qualification banner */}
      <div className="flex items-center gap-3 p-4 mb-6" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        <div className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
          <Shield size={18} style={{ color: "#D1FF26" }} />
        </div>
        <div>
          <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: "#D1FF26" }}>ELIGIBILITY REQUIREMENT</p>
          <p className="text-xs" style={{ color: "#8A8F98" }}>Shows must have a verified audience of <span style={{ color: "#F5F5F7", fontWeight: 600 }}>1,000,000+ subscribers</span> to qualify for public share offerings.</p>
        </div>
      </div>

      {/* Active show share listings */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>▸ ACTIVE OFFERINGS</p>
          <button onClick={() => setListMode(!listMode)} className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[8px] tracking-widest uppercase transition-all" style={{ background: listMode ? "rgba(138,143,152,0.1)" : "rgba(209,255,38,0.1)", border: `0.5px solid ${listMode ? "rgba(138,143,152,0.2)" : "rgba(209,255,38,0.3)"}`, color: listMode ? "#8A8F98" : "#D1FF26" }}>
            {listMode ? "Cancel" : "List Your Show"} <ChevronRight size={10} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin" style={{ color: "#D1FF26" }} />
          </div>
        ) : showList.length === 0 ? (
          <div className="p-8 text-center" style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
            <PieChart size={32} style={{ color: "rgba(209,255,38,0.2)", margin: "0 auto 12px" }} />
            <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#8A8F98" }}>NO ACTIVE OFFERINGS</p>
            <p className="text-sm max-w-md mx-auto" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
              Be the first to offer show shares to your audience.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {showList.map((show) => {
              const soldPct = show.total_shares > 0 ? Math.round((show.shares_sold / show.total_shares) * 100) : 0;
              const available = show.total_shares - show.shares_sold;
              return (
                <motion.div
                  key={show.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-4"
                  style={{ background: "rgba(16,20,29,0.5)", border: "0.5px solid rgba(209,255,38,0.1)" }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {show.image_url ? (
                      <img src={proxyMediaUrl(show.image_url)} alt={show.show_title} className="w-14 h-14 object-cover flex-shrink-0" style={{ border: "0.5px solid rgba(209,255,38,0.2)" }} />
                    ) : (
                      <div className="flex items-center justify-center w-14 h-14 flex-shrink-0" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                        <Radio size={18} style={{ color: "#D1FF26" }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-sm truncate" style={{ color: "#F5F5F7" }}>{show.show_title}</p>
                      <p className="font-mono text-[8px] tracking-widest" style={{ color: "#8A8F98" }}>{show.creator_name.toUpperCase()}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Users size={9} style={{ color: "#D1FF26" }} />
                        <span className="font-mono text-[8px]" style={{ color: "#D1FF26" }}>{fmtSubs(show.subscriber_count)} subscribers</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] mb-3" style={{ color: "#8A8F98", lineHeight: 1.4 }}>{show.description}</p>

                  {/* Share stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="p-2" style={{ background: "rgba(5,7,10,0.5)" }}>
                      <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>PRICE/SHARE</p>
                      <p className="font-heading font-bold text-xs" style={{ color: "#F5F5F7" }}>{fmtMoney(show.price_per_share)}</p>
                    </div>
                    <div className="p-2" style={{ background: "rgba(5,7,10,0.5)" }}>
                      <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>REV SHARE</p>
                      <p className="font-heading font-bold text-xs" style={{ color: "#F5F5F7" }}>{show.revenue_share_percent}%</p>
                    </div>
                    <div className="p-2" style={{ background: "rgba(5,7,10,0.5)" }}>
                      <p className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>AVAILABLE</p>
                      <p className="font-heading font-bold text-xs" style={{ color: "#D1FF26" }}>{available.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Sold progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>SOLD</span>
                      <span className="font-mono text-[7px]" style={{ color: "#D1FF26" }}>{soldPct}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(209,255,38,0.1)" }}>
                      <div className="h-full rounded-full" style={{ width: `${soldPct}%`, background: "#D1FF26" }} />
                    </div>
                  </div>

                  <button
                    onClick={() => setPurchaseMode(purchaseMode === show.id ? null : show.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]"
                    style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
                  >
                    <TrendingUp size={11} /> Buy Shares
                  </button>

                  {/* Purchase form */}
                  <AnimatePresence>
                    {purchaseMode === show.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 space-y-2" style={{ borderTop: "0.5px solid rgba(138,143,152,0.12)" }}>
                          <input
                            value={purchaseForm.buyer_name}
                            onChange={(e) => setPurchaseForm({ ...purchaseForm, buyer_name: e.target.value })}
                            placeholder="Full name"
                            className="w-full px-3 py-2 text-[16px] sm:text-xs"
                            style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
                          />
                          <input
                            type="email"
                            value={purchaseForm.buyer_email}
                            onChange={(e) => setPurchaseForm({ ...purchaseForm, buyer_email: e.target.value })}
                            placeholder="Email address"
                            className="w-full px-3 py-2 text-[16px] sm:text-xs"
                            style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              max={available}
                              value={purchaseForm.shares}
                              onChange={(e) => setPurchaseForm({ ...purchaseForm, shares: e.target.value })}
                              placeholder="Shares"
                              className="w-24 px-3 py-2 text-[16px] sm:text-xs"
                              style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.15)", color: "#F5F5F7" }}
                            />
                            <div className="flex-1 flex items-center justify-end px-3" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                              <span className="font-mono text-[10px]" style={{ color: "#D1FF26" }}>
                                = {fmtMoney((parseInt(purchaseForm.shares) || 1) * show.price_per_share)}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handlePurchase(show)}
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]"
                            style={{ background: "#D1FF26", color: "#05070A" }}
                          >
                            {submitting ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpRight size={12} />}
                            Proceed to Checkout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* List your show form */}
      <AnimatePresence>
        {listMode && (
          <motion.form
            onSubmit={handleListShow}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 space-y-4" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
              <p className="font-mono text-[9px] tracking-widest" style={{ color: "#D1FF26" }}>▸ LIST YOUR SHOW</p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>SHOW TITLE *</label>
                  <input value={form.show_title} onChange={(e) => update("show_title", e.target.value)} className="w-full px-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>
                <div>
                  <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>CREATOR NAME *</label>
                  <input value={form.creator_name} onChange={(e) => update("creator_name", e.target.value)} className="w-full px-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>CATEGORY</label>
                  <select value={form.category} onChange={(e) => update("category", e.target.value)} className="w-full px-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}>
                    <option value="podcast">Podcast</option>
                    <option value="video_series">Video Series</option>
                    <option value="audio_series">Audio Series</option>
                    <option value="live_show">Live Show</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>SUBSCRIBERS *</label>
                  <input type="number" min="1000000" value={form.subscriber_count} onChange={(e) => update("subscriber_count", e.target.value)} placeholder="1,000,000" className="w-full px-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>
                <div>
                  <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>REVENUE SHARE % *</label>
                  <input type="number" min="0.1" max="100" step="0.1" value={form.revenue_share_percent} onChange={(e) => update("revenue_share_percent", e.target.value)} placeholder="5.0" className="w-full px-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>TOTAL SHARES *</label>
                  <input type="number" min="1" value={form.total_shares} onChange={(e) => update("total_shares", e.target.value)} placeholder="1000" className="w-full px-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>
                <div>
                  <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>PRICE PER SHARE *</label>
                  <input type="number" min="0.50" step="0.50" value={form.price_per_share} onChange={(e) => update("price_per_share", e.target.value)} placeholder="50.00" className="w-full px-3 py-2.5 text-[16px] sm:text-sm" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
                </div>
              </div>

              <div>
                <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>DESCRIPTION</label>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} placeholder="Describe what share ownership includes and the show's growth potential…" className="w-full px-3 py-2.5 text-sm resize-none" style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }} />
              </div>

              {error && <p className="font-mono text-[10px] tracking-widest" style={{ color: "#ef4444" }}>⚠ {error}</p>}

              <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 hover:shadow-[0_0_20px_rgba(209,255,38,0.3)]" style={{ background: "#D1FF26", color: "#05070A" }}>
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Submit for Review
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {success && (
        <div className="mt-4 p-4 flex items-center gap-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <Check size={16} style={{ color: "#D1FF26" }} />
          <p className="text-xs" style={{ color: "#F5F5F7" }}>{success}</p>
        </div>
      )}

      {error && !listMode && (
        <div className="mt-4 p-4 flex items-center gap-3" style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.2)" }}>
          <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
        </div>
      )}

      {/* How share sales work — instructions guide */}
      <ShareInstructions />

      {/* Pricing CTA */}
      <div className="mt-6 p-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <Lock size={20} style={{ color: "#D1FF26" }} />
          </div>
          <div>
            <p className="font-heading font-black text-xl" style={{ color: "#F5F5F7" }}>$99.99<span className="text-sm font-mono" style={{ color: "#8A8F98" }}>/mo</span></p>
            <p className="font-mono text-[8px] tracking-widest" style={{ color: "#D1FF26" }}>DIAL *EQUITY# TO ACTIVATE</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[0,1,2,3,4].map(i => <Star key={i} size={10} style={{ color: "#D1FF26", fill: "#D1FF26" }} />)}
          <span className="font-mono text-[9px] ml-1" style={{ color: "#8A8F98" }}>Premium Creator Tool</span>
        </div>
      </div>
    </div>
  );
}