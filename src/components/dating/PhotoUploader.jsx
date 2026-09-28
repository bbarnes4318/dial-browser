import React, { useState } from "react";
import { ImagePlus, X, Loader2, Heart } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Multi-photo uploader for dating profiles. Uploads to public storage via the
// SDK and calls back with the ordered list of photo URLs (max 6).
export default function PhotoUploader({ photos, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (e) => {
    setError("");
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (photos.length + files.length > 6) {
      setError("You can upload up to 6 photos.");
      return;
    }
    setUploading(true);
    try {
      const uploaded = [];
      for (const f of files) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: f });
        if (file_url) uploaded.push(file_url);
      }
      onChange([...photos, ...uploaded].slice(0, 6));
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = (idx) => onChange(photos.filter((_, i) => i !== idx));

  return (
    <div>
      <label className="font-mono text-[9px] tracking-widest mb-2 block" style={{ color: "#8A8F98" }}>YOUR PHOTOS (UP TO 6){photos.length === 0 && " *"}</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((url, i) => (
          <div key={url + i} className="relative aspect-square overflow-hidden" style={{ border: "0.5px solid rgba(209,255,38,0.3)" }}>
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1 left-1 font-mono text-[7px] tracking-widest px-1.5 py-0.5" style={{ background: "#D1FF26", color: "#05070A" }}>COVER</span>
            )}
            <button type="button" onClick={() => remove(i)} className="absolute top-1 right-1 p-1" style={{ background: "rgba(5,7,10,0.8)" }}>
              <X size={11} style={{ color: "#ef4444" }} />
            </button>
          </div>
        ))}
        {photos.length < 6 && (
          <label className="aspect-square flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[rgba(209,255,38,0.5)]" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px dashed rgba(209,255,38,0.3)" }}>
            {uploading ? <Loader2 size={18} className="animate-spin" style={{ color: "#D1FF26" }} /> : <ImagePlus size={18} style={{ color: "#D1FF26" }} />}
            <span className="font-mono text-[8px] tracking-widest mt-1" style={{ color: "#8A8F98" }}>ADD</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </label>
        )}
      </div>
      {error && <p className="text-[10px] mt-2" style={{ color: "#ef4444" }}>{error}</p>}
      {photos.length === 0 && (
        <p className="flex items-center gap-1.5 font-mono text-[9px] mt-2" style={{ color: "#8A8F98" }}>
          <Heart size={11} style={{ color: "#D1FF26" }} /> At least one photo is required to activate your profile.
        </p>
      )}
    </div>
  );
}