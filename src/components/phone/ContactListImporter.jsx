import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, FileSpreadsheet, Loader2, Check, AlertCircle, ChevronRight,
  Users, ArrowLeft, MapPin,
} from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * ContactListImporter — upload a CSV spreadsheet of contacts, map the
 * name/phone columns, then bulk-import them into the address book and drop
 * them straight into a new (or existing) contact group so the group is ready
 * to broadcast to instantly.
 *
 * CSV is parsed entirely in the browser (no credits, no uploads). Expects a
 * header row. Phone numbers are normalized to E.164-ish (+ and digits).
 */

const LIME = "#D1FF26";

// --- minimal CSV parser (handles quoted fields, commas, embedded newlines) ---
function parseCSV(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { cur.push(field); field = ""; }
      else if (ch === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (ch === "\r") { /* skip */ }
      else field += ch;
    }
  }
  if (field !== "" || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function rowsToObjects(rows) {
  if (!rows.length) return { headers: [], objects: [] };
  const headers = rows[0].map((h) => (h || "").trim());
  const objects = rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => { o[h] = (r[i] || "").trim(); });
    return o;
  });
  return { headers, objects };
}

// crude phone normalization — keeps a leading + and digits, defaults US +1
function normalizePhone(raw) {
  if (!raw) return "";
  let s = String(raw).trim();
  // keep a leading + if present, otherwise strip non-digits
  if (s.startsWith("+")) {
    const digits = s.slice(1).replace(/\D/g, "");
    return "+" + digits;
  }
  const digits = s.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return "+" + digits;
}

// auto-detect which header looks like name / phone / email / company
function detect(headers, candidates) {
  const lc = headers.map((h) => h.toLowerCase());
  for (const cand of candidates) {
    const idx = lc.findIndex((h) => h.includes(cand));
    if (idx !== -1) return headers[idx];
  }
  return "";
}

const NAME_HINTS = ["name", "full name", "contact", "first", "customer", "client"];
const PHONE_HINTS = ["phone", "mobile", "cell", "number", "tel", "msisdn", "whatsapp"];
const EMAIL_HINTS = ["email", "e-mail", "mail"];
const COMPANY_HINTS = ["company", "org", "organization", "business", "employer"];

export default function ContactListImporter({ existingGroups = [], onDone, onClose }) {
  const [step, setStep] = useState(1); // 1 = upload, 2 = map, 3 = importing, 4 = done
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [objects, setObjects] = useState([]);
  const [error, setError] = useState("");
  const [mapping, setMapping] = useState({ name: "", phone: "", email: "", company: "" });
  const [groupName, setGroupName] = useState("");
  const [targetMode, setTargetMode] = useState("new"); // "new" | "existing"
  const [existingId, setExistingId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, created: 0, skipped: 0 });
  const [createdGroup, setCreatedGroup] = useState(null);
  const fileRef = useRef(null);

  const validRows = useMemo(() => {
    if (!mapping.phone) return [];
    return objects.filter((o) => normalizePhone(o[mapping.phone]));
  }, [objects, mapping.phone]);

  const previewRows = validRows.slice(0, 5);

  const handleFile = (file) => {
    setError("");
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !file.type.includes("csv") && !name.endsWith(".txt")) {
      setError("Please upload a .csv file. Export your spreadsheet (Excel, Google Sheets) as CSV first.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const rows = parseCSV(text);
        if (rows.length < 2) { setError("The file needs a header row plus at least one contact row."); return; }
        const { headers: hs, objects: objs } = rowsToObjects(rows);
        setHeaders(hs);
        setObjects(objs);
        setMapping({
          name: detect(hs, NAME_HINTS),
          phone: detect(hs, PHONE_HINTS),
          email: detect(hs, EMAIL_HINTS),
          company: detect(hs, COMPANY_HINTS),
        });
        setFileName(file.name.replace(/\.[^.]+$/, ""));
        setGroupName(file.name.replace(/\.[^.]+$/, ""));
        setStep(2);
      } catch (e) {
        setError("Could not read that file. Make sure it's a valid CSV.");
      }
    };
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsText(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const reset = () => {
    setStep(1); setHeaders([]); setObjects([]); setFileName("");
    setMapping({ name: "", phone: "", email: "", company: "" });
    setError(""); setProgress({ done: 0, total: 0, created: 0, skipped: 0 });
    setCreatedGroup(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const runImport = async () => {
    if (!mapping.phone) { setError("Pick the column that holds the phone numbers."); return; }
    if (targetMode === "new" && !groupName.trim()) { setError("Give the new group a name."); return; }
    if (targetMode === "existing" && !existingId) { setError("Pick a group to add the contacts to."); return; }
    setStep(3);
    setError("");

    const toCreate = validRows.map((o) => ({
      name: (mapping.name ? o[mapping.name] : "") || normalizePhone(o[mapping.phone]),
      phone: normalizePhone(o[mapping.phone]),
      contact_type: "phone",
      email: mapping.email ? o[mapping.email] : "",
      company: mapping.company ? o[mapping.company] : "",
      category: "other",
      favorite: false,
    }));

    setProgress({ done: 0, total: toCreate.length, created: 0, skipped: 0 });

    // Bulk create in batches of 500 (Contact.bulkCreate limit)
    const created = [];
    let skipped = 0;
    try {
      for (let i = 0; i < toCreate.length; i += 500) {
        const batch = toCreate.slice(i, i + 500);
        try {
          const res = await base44.entities.Contact.bulkCreate(batch);
          const arr = Array.isArray(res) ? res : (res?.data || []);
          created.push(...arr);
        } catch (e) {
          // fallback: one-by-one
          for (const c of batch) {
            try { const r = await base44.entities.Contact.create(c); created.push(r); }
            catch { skipped++; }
            setProgress((p) => ({ ...p, done: p.done + 1, created: created.length, skipped }));
          }
          continue;
        }
        setProgress({ done: Math.min(i + 500, toCreate.length), total: toCreate.length, created: created.length, skipped });
      }
    } catch (e) {
      setError(e?.message || "Import failed partway.");
    }

    if (created.length === 0) {
      setError("No contacts were imported. Check the phone column mapping and try again.");
      setStep(2);
      return;
    }

    // Assign to group
    const ids = created.map((c) => c.id).filter(Boolean);
    try {
      let group;
      if (targetMode === "existing") {
        const existing = existingGroups.find((g) => g.id === existingId);
        const merged = Array.from(new Set([...(existing?.member_contact_ids || []), ...ids]));
        group = await base44.entities.ContactGroup.update(existingId, {
          member_contact_ids: merged,
          member_count: merged.length,
        });
        group = { ...group, name: existing?.name };
      } else {
        group = await base44.entities.ContactGroup.create({
          name: groupName.trim(),
          description: `Imported from ${fileName || "spreadsheet"}`,
          member_contact_ids: ids,
          member_count: ids.length,
        });
      }
      setCreatedGroup(group);
      setStep(4);
      if (onDone) onDone({ created: created.length, skipped, group });
    } catch (e) {
      setError(`Contacts were imported, but grouping failed: ${e?.message || ""}`);
      setStep(4);
      if (onDone) onDone({ created: created.length, skipped, group: null });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.78)" }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] flex flex-col"
        style={{ background: "#10141d", border: `0.5px solid ${LIME}55` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.15)" }}>
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} style={{ color: LIME }} />
            <p className="font-mono text-[10px] tracking-widest" style={{ color: LIME }}>// IMPORT CONTACT LIST</p>
          </div>
          <button onClick={onClose}><X size={16} style={{ color: "#8A8F98" }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <AnimatePresence mode="wait">
            {/* Step 1 — upload */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <p className="text-sm mb-4" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
                  Upload a CSV of names and phone numbers, map the columns, and we'll create a contact group you can broadcast to instantly.
                </p>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center text-center py-10 px-4 cursor-pointer transition-all"
                  style={{
                    background: dragOver ? "rgba(209,255,38,0.06)" : "rgba(5,7,10,0.5)",
                    border: `0.5px dashed ${dragOver ? `${LIME}80` : "rgba(138,143,152,0.25)"}`,
                  }}
                >
                  <Upload size={26} style={{ color: LIME }} />
                  <p className="font-mono text-[10px] tracking-widest mt-3" style={{ color: "#F5F5F7" }}>DROP CSV OR TAP TO BROWSE</p>
                  <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>.csv · header row required</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>
                {error && (
                  <div className="mt-4 flex items-start gap-2 p-3" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                    <AlertCircle size={14} style={{ color: "#ef4444" }} className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs" style={{ color: "#F5F5F7" }}>{error}</p>
                  </div>
                )}
                <div className="mt-4 p-3" style={{ background: "rgba(209,255,38,0.04)", border: `0.5px solid ${LIME}25` }}>
                  <p className="font-mono text-[9px] tracking-widest mb-1" style={{ color: LIME }}>TIP</p>
                  <p className="text-[11px]" style={{ color: "#8A8F98", lineHeight: 1.5 }}>
                    In Excel or Google Sheets: File → Download → Comma Separated Values (.csv). Columns can be named anything — you'll map them next.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2 — map columns */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>FILE:</p>
                  <p className="font-mono text-[10px]" style={{ color: LIME }}>{fileName}</p>
                  <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>· {objects.length} rows</span>
                </div>

                <div>
                  <p className="font-mono text-[9px] tracking-widest mb-2 flex items-center gap-1" style={{ color: LIME }}><MapPin size={11} /> MAP COLUMNS</p>
                  <div className="space-y-2.5">
                    <MapRow label="Phone (required)" value={mapping.phone} headers={headers} onChange={(v) => setMapping({ ...mapping, phone: v })} accent="#ef4444" required />
                    <MapRow label="Name" value={mapping.name} headers={headers} onChange={(v) => setMapping({ ...mapping, name: v })} accent={LIME} />
                    <MapRow label="Email" value={mapping.email} headers={headers} onChange={(v) => setMapping({ ...mapping, email: v })} accent="#8A8F98" />
                    <MapRow label="Company" value={mapping.company} headers={headers} onChange={(v) => setMapping({ ...mapping, company: v })} accent="#8A8F98" />
                  </div>
                </div>

                {/* Preview */}
                {mapping.phone && (
                  <div>
                    <p className="font-mono text-[9px] tracking-widest mb-1.5" style={{ color: "#8A8F98" }}>PREVIEW · {validRows.length} VALID</p>
                    <div className="overflow-x-auto" style={{ border: "0.5px solid rgba(138,143,152,0.15)" }}>
                      <table className="w-full text-left">
                        <thead>
                          <tr style={{ borderBottom: "0.5px solid rgba(138,143,152,0.15)" }}>
                            <th className="font-mono text-[9px] tracking-widest px-2 py-1.5" style={{ color: "#8A8F98" }}>NAME</th>
                            <th className="font-mono text-[9px] tracking-widest px-2 py-1.5" style={{ color: "#8A8F98" }}>PHONE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewRows.map((o, i) => (
                            <tr key={i} style={{ borderBottom: "0.5px solid rgba(138,143,152,0.08)" }}>
                              <td className="text-[11px] px-2 py-1.5" style={{ color: "#F5F5F7" }}>{mapping.name ? o[mapping.name] : "—"}</td>
                              <td className="font-mono text-[11px] px-2 py-1.5" style={{ color: LIME }}>{normalizePhone(o[mapping.phone])}</td>
                            </tr>
                          ))}
                          {validRows.length > 5 && (
                            <tr><td colSpan={2} className="font-mono text-[9px] px-2 py-1.5" style={{ color: "#8A8F98" }}>+ {validRows.length - 5} more…</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Group target */}
                <div className="pt-1">
                  <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: LIME }}><Users size={11} className="inline mr-1" /> ADD TO GROUP</p>
                  <div className="flex gap-2 mb-2.5">
                    <TargetBtn active={targetMode === "new"} onClick={() => setTargetMode("new")}>New group</TargetBtn>
                    <TargetBtn active={targetMode === "existing"} onClick={() => setTargetMode("existing")} disabled={!existingGroups.length}>
                      Existing group
                    </TargetBtn>
                  </div>
                  {targetMode === "new" ? (
                    <input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group name (e.g. Promo Blast Q4)"
                      className="w-full px-3 py-2.5 text-sm outline-none"
                      style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#F5F5F7" }}
                    />
                  ) : (
                    <select
                      value={existingId}
                      onChange={(e) => setExistingId(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm outline-none"
                      style={{ background: "rgba(5,7,10,0.6)", border: "0.5px solid rgba(209,255,38,0.25)", color: "#F5F5F7" }}
                    >
                      <option value="">Select a group…</option>
                      {existingGroups.map((g) => (
                        <option key={g.id} value={g.id} style={{ background: "#10141d" }}>{g.name} ({g.member_count || 0})</option>
                      ))}
                    </select>
                  )}
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)" }}>
                    <AlertCircle size={14} style={{ color: "#ef4444" }} className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs" style={{ color: "#F5F5F7" }}>{error}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3 — importing */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-10 text-center">
                <Loader2 size={28} className="animate-spin mb-4" style={{ color: LIME }} />
                <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: LIME }}>IMPORTING…</p>
                <div className="w-full h-2 mb-2" style={{ background: "rgba(138,143,152,0.12)", borderRadius: 2 }}>
                  <div className="h-full transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, background: LIME, borderRadius: 2 }} />
                </div>
                <p className="font-mono text-[10px]" style={{ color: "#F5F5F7" }}>{progress.done} / {progress.total}</p>
                <p className="font-mono text-[9px] mt-1" style={{ color: "#8A8F98" }}>{progress.created} created · {progress.skipped} skipped</p>
              </motion.div>
            )}

            {/* Step 4 — done */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex items-center justify-center w-14 h-14 mb-4" style={{ background: `${LIME}1a`, border: `0.5px solid ${LIME}66`, borderRadius: "50%" }}>
                  <Check size={26} style={{ color: LIME }} />
                </motion.div>
                <h3 className="font-heading font-black text-xl mb-1" style={{ color: "#F5F5F7" }}>Import complete</h3>
                <p className="text-sm" style={{ color: "#8A8F98" }}>
                  {progress.created} contact{progress.created === 1 ? "" : "s"} imported
                  {createdGroup ? <> into <span style={{ color: LIME }}>{createdGroup.name}</span></> : "."}
                </p>
                {createdGroup && (
                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(209,255,38,0.08)", border: `0.5px solid ${LIME}40` }}>
                    <Users size={14} style={{ color: LIME }} />
                    <span className="font-mono text-[10px] tracking-widest" style={{ color: LIME }}>READY TO BROADCAST → {createdGroup.name}</span>
                  </div>
                )}
                {error && (
                  <p className="text-[11px] mt-4" style={{ color: "#fb923c" }}>{error}</p>
                )}
                <div className="flex gap-2 mt-6">
                  <button onClick={reset} className="flex-1 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.25)", color: "#8A8F98" }}>Import another</button>
                  <button onClick={onClose} className="flex-1 py-3 font-mono text-[10px] tracking-widest uppercase font-bold" style={{ background: LIME, color: "#05070A" }}>Done</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        {step === 2 && (
          <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: "0.5px solid rgba(138,143,152,0.15)" }}>
            <button onClick={reset} className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>
              <ArrowLeft size={13} /> Back
            </button>
            <button onClick={runImport} disabled={!mapping.phone || validRows.length === 0} className="flex items-center gap-1.5 px-5 py-3 font-mono text-[10px] tracking-widest uppercase font-bold transition-all hover:shadow-[0_0_18px_rgba(209,255,38,0.3)] disabled:opacity-40" style={{ background: LIME, color: "#05070A" }}>
              Import {validRows.length} <ChevronRight size={13} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function MapRow({ label, value, headers, onChange, accent, required }) {
  return (
    <div className="flex items-center gap-3">
      <p className="font-mono text-[9px] tracking-widest w-28 flex-shrink-0" style={{ color: "#8A8F98" }}>{label.toUpperCase()}{required && <span style={{ color: "#ef4444" }}> *</span>}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2.5 py-2 text-xs outline-none"
        style={{ background: "rgba(5,7,10,0.6)", border: `0.5px solid ${value ? `${accent}66` : "rgba(138,143,152,0.2)"}`, color: value ? "#F5F5F7" : "#8A8F98" }}
      >
        <option value="">{required ? "Select column…" : "— none —"}</option>
        {headers.map((h) => (
          <option key={h} value={h} style={{ background: "#10141d" }}>{h}</option>
        ))}
      </select>
    </div>
  );
}

function TargetBtn({ active, onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 py-2 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30"
      style={{
        background: active ? "rgba(209,255,38,0.12)" : "rgba(5,7,10,0.5)",
        border: `0.5px solid ${active ? `${LIME}66` : "rgba(138,143,152,0.15)"}`,
        color: active ? LIME : "#8A8F98",
      }}
    >
      {children}
    </button>
  );
}