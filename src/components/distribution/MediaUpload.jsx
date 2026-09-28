import React, { useRef, useState } from "react";
import { Upload, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function MediaUpload({ label, value, onChange, accept = "image/*" }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onChange(file_url);
    } catch (err) {
      console.error("upload failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>{label}</span>}
      <div className="flex items-center gap-2">
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={handle} />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-50"
          style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : value ? <Check size={12} /> : <Upload size={12} />}
          {value ? "Uploaded" : "Upload"}
        </button>
        {value && (
          <span className="font-mono text-[9px] truncate max-w-[180px]" style={{ color: "#8A8F98" }}>
            {value.split("/").pop()}
          </span>
        )}
      </div>
    </div>
  );
}