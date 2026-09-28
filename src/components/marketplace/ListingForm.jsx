import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImagePlus, X, Tag, ArrowLeftRight, DollarSign, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const categories = [
  { id: "realestate", label: "Real Estate", icon: "🏠" },
  { id: "vehicles", label: "Vehicles", icon: "🚗" },
  { id: "electronics", label: "Electronics", icon: "📱" },
  { id: "jobs", label: "Jobs", icon: "💼" },
  { id: "services", label: "Services", icon: "🔧" },
  { id: "other", label: "Other", icon: "📦" },
];

export default function ListingForm({ onCreated, sellerName }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    listing_type: "sale",
    price: "",
    category: "other",
    location: "",
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch {
      setError("Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => setPhotoUrl("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) return;
    if (form.listing_type === "sale" && !form.price) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        description: form.description,
        listing_type: form.listing_type,
        category: form.category,
        location: form.location || "Remote",
        photo_url: photoUrl || "",
        status: "active",
        seller_name: sellerName || "",
      };
      if (form.listing_type === "sale" && form.price) {
        payload.price = Number(form.price);
      }
      const created = await base44.entities.MarketplaceListing.create(payload);
      onCreated?.(created);
      setForm({ title: "", description: "", listing_type: "sale", price: "", category: "other", location: "" });
      setPhotoUrl("");
    } catch {
      setError("Failed to post listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 lg:p-6" style={{ background: "rgba(209,255,38,0.04)", border: "0.5px solid rgba(209,255,38,0.25)" }}>
      <div className="flex items-center gap-2 mb-5">
        <ImagePlus size={16} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// POST A LISTING</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo upload */}
        <div>
          <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>PHOTO</label>
          <AnimatePresence mode="wait">
            {photoUrl ? (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full h-40 overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.3)" }}>
                <img src={photoUrl} alt="Listing preview" className="w-full h-full object-cover" />
                <button type="button" onClick={removePhoto} className="absolute top-2 right-2 p-1.5" style={{ background: "rgba(5,7,10,0.8)", border: "0.5px solid rgba(138,143,152,0.3)" }}>
                  <X size={14} style={{ color: "#F5F5F7" }} />
                </button>
              </motion.div>
            ) : (
              <motion.label key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center w-full h-40 cursor-pointer transition-all hover:bg-[rgba(209,255,38,0.04)]" style={{ border: "0.5px dashed rgba(209,255,38,0.4)", background: "rgba(16,20,29,0.4)" }}>
                {uploading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[9px] tracking-widest mt-3" style={{ color: "#D1FF26" }}>UPLOADING…</p>
                  </>
                ) : (
                  <>
                    <Upload size={24} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[9px] tracking-widest mt-3" style={{ color: "#D1FF26" }}>UPLOAD PHOTO</p>
                    <p className="font-mono text-[8px] mt-1" style={{ color: "#8A8F98" }}>Click to browse</p>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
              </motion.label>
            )}
          </AnimatePresence>
        </div>

        {/* Listing type toggle */}
        <div>
          <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>LISTING TYPE</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, listing_type: "sale" })}
              className="flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
              style={{
                background: form.listing_type === "sale" ? "#D1FF26" : "rgba(16,20,29,0.6)",
                color: form.listing_type === "sale" ? "#05070A" : "#8A8F98",
                border: `0.5px solid ${form.listing_type === "sale" ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.2)"}`,
              }}
            >
              <DollarSign size={12} /> For Sale
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, listing_type: "trade" })}
              className="flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all"
              style={{
                background: form.listing_type === "trade" ? "#D1FF26" : "rgba(16,20,29,0.6)",
                color: form.listing_type === "trade" ? "#05070A" : "#8A8F98",
                border: `0.5px solid ${form.listing_type === "trade" ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.2)"}`,
              }}
            >
              <ArrowLeftRight size={12} /> For Trade
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>TITLE</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="What are you offering?"
            className="w-full px-3 py-2.5 text-sm"
            style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>DESCRIPTION</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the item, condition, and what you're looking for…"
            rows={3}
            className="w-full px-3 py-2.5 text-sm resize-none"
            style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}
            required
          />
        </div>

        {/* Category + Location */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>CATEGORY</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2.5 text-sm"
              style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} style={{ background: "#10141D" }}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>LOCATION</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="City, State"
              className="w-full px-3 py-2.5 text-sm"
              style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}
            />
          </div>
        </div>

        {/* Price (only for sale) */}
        {form.listing_type === "sale" && (
          <div>
            <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>PRICE (USD)</label>
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0.00"
              type="number"
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 text-sm"
              style={{ background: "rgba(16,20,29,0.8)", border: "0.5px solid rgba(138,143,152,0.2)", color: "#F5F5F7" }}
              required
            />
          </div>
        )}

        {error && <p className="font-mono text-[9px]" style={{ color: "#ef4444" }}>{error}</p>}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || uploading}
          className="w-full flex items-center justify-center gap-2 py-4 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_25px_rgba(209,255,38,0.3)] disabled:opacity-50"
          style={{ background: "#D1FF26", color: "#05070A" }}
        >
          {submitting ? <><Loader2 size={12} className="animate-spin" /> Posting…</> : <><Tag size={12} /> Publish Listing</>}
        </button>
      </form>
    </div>
  );
}