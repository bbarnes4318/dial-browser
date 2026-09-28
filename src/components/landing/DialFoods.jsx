import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Loader2, X, Phone, CheckCircle2, Star, Utensils,
  BadgeCheck, ShoppingBag, Calendar, Leaf, Store, ChefHat, Wheat, Truck,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const LIME = "#D1FF26";

// Dial Foods — food marketplace. Real food vendors (restaurants, groceries,
// meal kits, catering, bakeries, farms) listed for order. Customers filter by
// type, dietary tags, keyword and location, then submit an order/reservation
// inquiry that creates a FoodInquiry record.
const TYPE_TABS = [
  { id: "all", label: "All", glyph: "🍽️" },
  { id: "restaurant", label: "Restaurants", glyph: "🍴" },
  { id: "grocery", label: "Groceries", glyph: "🛒" },
  { id: "meal_kit", label: "Meal Kits", glyph: "📦" },
  { id: "catering", label: "Catering", glyph: "🍽️" },
  { id: "bakery", label: "Bakery", glyph: "🥖" },
  { id: "farm", label: "Farm Fresh", glyph: "🌾" },
];

const TYPE_GRADIENT = {
  restaurant: "linear-gradient(135deg, #2a1620, #1a0a10)",
  grocery: "linear-gradient(135deg, #162a1c, #0a1a10)",
  meal_kit: "linear-gradient(135deg, #1c2216, #0f140a)",
  catering: "linear-gradient(135deg, #2a2216, #1a140a)",
  bakery: "linear-gradient(135deg, #3a2a16, #1f160a)",
  farm: "linear-gradient(135deg, #1f2a16, #0f1a0a)",
};

const TYPE_GLYPH = {
  restaurant: "🍴", grocery: "🛒", meal_kit: "📦", catering: "🍽️", bakery: "🥖", farm: "🌾",
};

const TYPE_ICON = {
  restaurant: Utensils, grocery: Store, meal_kit: ShoppingBag, catering: Utensils, bakery: ChefHat, farm: Wheat,
};

const DIETARY_TABS = [
  { id: "all", label: "All" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten_free", label: "Gluten-Free" },
  { id: "halal", label: "Halal" },
  { id: "organic", label: "Organic" },
];

const DIETARY_META = {
  vegetarian: { label: "Veg", glyph: "🥗" },
  vegan: { label: "Vegan", glyph: "🌱" },
  gluten_free: { label: "GF", glyph: "🌾" },
  halal: { label: "Halal", glyph: "清真" },
  kosher: { label: "Kosher", glyph: "✡️" },
  organic: { label: "Organic", glyph: "🌿" },
};

function money(n) {
  return "$" + Number(n || 0).toLocaleString("en-US");
}

function Stars({ rating }) {
  if (!rating) return null;
  const full = Math.round(rating);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={9} style={{ color: i < full ? LIME : "#3a3a3a" }} fill={i < full ? LIME : "transparent"} />
      ))}
    </span>
  );
}

export default function DialFoods() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("all");
  const [dietary, setDietary] = useState("all");
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("q") || "");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState(null);
  const [intent, setIntent] = useState("order");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({ buyer_name: "", buyer_phone: "", buyer_email: "", message: "" });

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.FoodListing.filter({ status: "available" }, "-created_date", 200);
        setListings(Array.isArray(list) ? list : []);
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const loc = location.trim().toLowerCase();
    return listings.filter((f) => {
      if (type !== "all" && f.type !== type) return false;
      if (dietary !== "all") {
        const tags = Array.isArray(f.dietary_tags) ? f.dietary_tags : [];
        if (!tags.includes(dietary)) return false;
      }
      if (q) {
        const hay = `${f.title} ${f.cuisine} ${f.vendor_name} ${f.city} ${f.state}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (loc) {
        const hay = `${f.city || ""} ${f.state || ""}`.toLowerCase();
        if (!hay.includes(loc)) return false;
      }
      return true;
    });
  }, [listings, type, dietary, search, location]);

  const openContact = (f, intentType = "order") => {
    setContact(f);
    setIntent(intentType);
    setSubmitted(false);
    setSubmitError("");
    setForm({ buyer_name: "", buyer_phone: "", buyer_email: "", message: "" });
  };
  const closeContact = () => setContact(null);

  const submitInquiry = async (e) => {
    e.preventDefault();
    if (!contact) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await base44.entities.FoodInquiry.create({
        food_id: contact.id,
        food_title: contact.title,
        buyer_name: form.buyer_name,
        buyer_phone: form.buyer_phone,
        buyer_email: form.buyer_email,
        message: form.message || `Interested in ${contact.title}. Please contact me.`,
        intent,
        status: "new",
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err?.message || "Could not submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="dial-foods" className="relative py-10 lg:py-14" style={{ background: "#05070A" }}>
      <div className="px-3 lg:px-6 max-w-6xl mx-auto w-full">
        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Utensils size={18} style={{ color: LIME }} />
            <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: LIME }}>// DIAL FOODS™ MARKETPLACE</p>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight" style={{ color: "#F5F5F7" }}>
            Order. Eat. <span style={{ color: LIME }}>Repeat.</span>
          </h2>
          <p className="text-xs sm:text-sm max-w-2xl mt-2" style={{ color: "#8A8F98" }}>
            Restaurants, groceries, meal kits, catering, bakeries and farm-fresh produce. Browse real vendors, filter by dietary needs and location, and order or reserve in one tap.
          </p>
        </div>

        {/* ── Search + Location bars ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: "#8A8F98" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dish, cuisine, vendor…"
              className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm outline-none"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: "#8A8F98" }} />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, state…"
              className="w-full pl-9 pr-3 py-3 text-[16px] sm:text-sm outline-none"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
            />
          </div>
        </div>

        {/* ── Food type tabs ── */}
        <div className="flex items-center justify-center gap-1.5 mb-3 flex-wrap">
          <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8a8a8a" }}>TYPE:</span>
          {TYPE_TABS.map((t) => {
            const active = type === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
                style={{
                  borderRadius: 4,
                  background: active ? "rgba(209,255,0,0.14)" : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${active ? `${LIME}88` : "rgba(255,255,255,0.10)"}`,
                  color: active ? LIME : "#9a9a9a",
                }}
              >
                <span className="mr-1">{t.glyph}</span>{t.label}
              </button>
            );
          })}
        </div>

        {/* ── Dietary filter ── */}
        <div className="flex items-center justify-center gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[8px] tracking-widest" style={{ color: "#8a8a8a" }}>DIETARY:</span>
            {DIETARY_TABS.map((d) => {
              const active = dietary === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDietary(d.id)}
                  className="px-2.5 py-1 font-mono text-[8px] tracking-widest uppercase transition-all"
                  style={{
                    borderRadius: 4,
                    background: active ? "rgba(209,255,0,0.14)" : "rgba(255,255,255,0.04)",
                    border: `0.5px solid ${active ? `${LIME}88` : "rgba(255,255,255,0.10)"}`,
                    color: active ? LIME : "#9a9a9a",
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Results count ── */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
            {loading ? "LOADING…" : `${filtered.length} VENDOR${filtered.length === 1 ? "" : "S"} AVAILABLE`}
          </span>
          <span className="font-mono text-[8px] tracking-widest" style={{ color: "#5a5a5a" }}>
            <BadgeCheck size={10} className="inline mr-1" style={{ color: LIME }} />
            ALL VENDORS VERIFIED OPEN FOR ORDER
          </span>
        </div>

        {/* ── Food grid ── */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={26} className="animate-spin" style={{ color: LIME }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Utensils size={30} className="mx-auto mb-2" style={{ color: "#4a4a4a" }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
              NO VENDORS MATCH YOUR FILTERS — TRY ADJUSTING TYPE, DIETARY OR LOCATION
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((f, i) => {
              const grad = f.image_url ? null : (TYPE_GRADIENT[f.type] || TYPE_GRADIENT.restaurant);
              const TypeIcon = TYPE_ICON[f.type] || Utensils;
              const tags = Array.isArray(f.dietary_tags) ? f.dietary_tags : [];
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="flex flex-col overflow-hidden"
                  style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}
                >
                  {/* Cover */}
                  <div className="relative h-40 flex items-center justify-center overflow-hidden" style={{ background: grad || undefined }}>
                    {f.image_url ? (
                      <img src={f.image_url} alt={f.title} className="w-full h-full object-cover" style={{ filter: "brightness(0.9)" }} />
                    ) : (
                      <span style={{ fontSize: 64, lineHeight: 1, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}>{TYPE_GLYPH[f.type] || "🍽️"}</span>
                    )}
                    <span className="absolute top-2 left-2 font-mono text-[7px] tracking-widest px-1.5 py-0.5 flex items-center gap-1" style={{ background: "rgba(5,7,10,0.85)", color: LIME, border: `0.5px solid ${LIME}66` }}>
                      <TypeIcon size={9} /> {f.type.replace("_", " ").toUpperCase()}
                    </span>
                    {f.featured && (
                      <span className="absolute top-2 right-2 font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: LIME, color: "#05070A" }}>★ FEATURED</span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading font-bold text-sm leading-tight" style={{ color: "#F5F5F7" }}>{f.title}</h3>
                      <Stars rating={f.rating} />
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: "#8A8F98" }}>{f.vendor_name || "Local Vendor"}{f.cuisine ? ` · ${f.cuisine}` : ""}</p>

                    {tags.length > 0 && (
                      <div className="flex items-center flex-wrap gap-1 mt-2">
                        {tags.map((t) => {
                          const dm = DIETARY_META[t];
                          if (!dm) return null;
                          return (
                            <span key={t} className="font-mono text-[7px] tracking-widest px-1.5 py-0.5 flex items-center gap-1" style={{ background: "rgba(209,255,38,0.08)", color: LIME, border: "0.5px solid rgba(209,255,38,0.25)" }}>
                              <Leaf size={8} /> {dm.label}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-2 font-mono text-[8px]" style={{ color: "#9a9a9a" }}>
                      <MapPin size={9} /> {[f.city, f.state].filter(Boolean).join(", ") || "Location on request"}
                    </div>

                    <p className="text-[11px] mt-2.5 leading-snug" style={{ color: "#A0A0A0" }}>{f.description}</p>

                    <div className="flex items-end justify-between mt-3 pt-3" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                      <div>
                        <span className="font-mono text-[7px] tracking-widest" style={{ color: "#8A8F98" }}>FROM</span>
                        <p className="font-heading font-black text-lg leading-none" style={{ color: LIME }}>{money(f.price)}<span className="font-mono text-[8px] ml-1" style={{ color: "#8A8F98" }}>{f.unit || ""}</span></p>
                      </div>
                      <span className="font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.10)", color: LIME, border: "0.5px solid rgba(209,255,38,0.3)" }}>
                        ● OPEN
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={() => openContact(f, "reserve")}
                        className="flex items-center justify-center gap-1.5 py-2.5 font-mono text-[8px] tracking-widest uppercase font-bold transition-all"
                        style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: LIME }}
                      >
                        <Calendar size={11} /> Reserve
                      </button>
                      <button
                        onClick={() => openContact(f, "order")}
                        className="flex items-center justify-center gap-1.5 py-2.5 font-mono text-[8px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)]"
                        style={{ background: LIME, color: "#05070A" }}
                      >
                        <ShoppingBag size={11} /> Order Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Inquiry modal ── */}
      <AnimatePresence>
        {contact && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              style={{ background: "rgba(5,7,10,0.88)", backdropFilter: "blur(6px)" }}
              onClick={closeContact}
            />
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto"
                style={{ background: "rgba(10,13,20,0.98)", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 20px 80px rgba(0,0,0,0.7)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4" style={{ borderBottom: "0.5px solid rgba(209,255,38,0.12)" }}>
                  <div className="flex items-center gap-2">
                    <Utensils size={14} style={{ color: LIME }} />
                    <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: LIME }}>// {intent === "reserve" ? "RESERVE A TABLE" : "PLACE AN ORDER"}</p>
                  </div>
                  <button onClick={closeContact} className="p-1.5"><X size={15} style={{ color: "#8A8F98" }} /></button>
                </div>

                <div className="p-5">
                  {submitted ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto mb-3 flex items-center justify-center" style={{ background: "rgba(209,255,38,0.12)", border: "0.5px solid rgba(209,255,38,0.4)" }}>
                        <CheckCircle2 size={24} style={{ color: LIME }} />
                      </div>
                      <h3 className="font-heading font-black text-lg mb-1" style={{ color: "#F5F5F7" }}>Request Sent</h3>
                      <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                        Your {intent === "reserve" ? "reservation request" : "order request"} for <span style={{ color: LIME }}>{contact.title}</span> has been recorded. The vendor will contact you at the number you provided to confirm.
                      </p>
                      <button onClick={closeContact} className="mt-5 w-full py-2.5 font-mono text-[9px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.10)", border: "0.5px solid rgba(209,255,38,0.3)", color: LIME }}>
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 p-3" style={{ background: "rgba(209,255,38,0.05)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
                        <p className="font-heading font-bold text-sm" style={{ color: "#F5F5F7" }}>{contact.title}</p>
                        <p className="font-mono text-[9px] mt-1" style={{ color: LIME }}>{money(contact.price)}{contact.unit ? ` ${contact.unit}` : ""}{contact.cuisine ? ` · ${contact.cuisine}` : ""}</p>
                        {contact.vendor_phone && (
                          <p className="flex items-center gap-1 mt-1 font-mono text-[8px]" style={{ color: "#9a9a9a" }}><Phone size={9} /> {contact.vendor_phone}</p>
                        )}
                      </div>
                      {submitError && <div className="mb-3 p-2.5 text-[11px]" style={{ background: "rgba(239,68,68,0.10)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>{submitError}</div>}
                      <form onSubmit={submitInquiry} className="space-y-2.5">
                        <input required placeholder="Your name" value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} className="w-full px-3 py-2.5 text-[16px] sm:text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                        <input required placeholder="Phone number" type="tel" value={form.buyer_phone} onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })} className="w-full px-3 py-2.5 text-[16px] sm:text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                        <input placeholder="Email (optional)" type="email" value={form.buyer_email} onChange={(e) => setForm({ ...form, buyer_email: e.target.value })} className="w-full px-3 py-2.5 text-[16px] sm:text-sm outline-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                        <textarea placeholder="Message (optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={2} className="w-full px-3 py-2.5 text-sm outline-none resize-none" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)", color: "#F5F5F7" }} />
                        <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_16px_rgba(209,255,38,0.25)] disabled:opacity-40" style={{ background: LIME, color: "#05070A" }}>
                          {submitting ? <Loader2 size={13} className="animate-spin" /> : <ShoppingBag size={13} />} {intent === "reserve" ? "Submit Reservation" : "Submit Order Request"}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}