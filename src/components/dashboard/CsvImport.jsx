import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Check, X, Loader2, AlertCircle, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TEMPLATE = `name,phone,contact_type,email,company,category,notes
John Doe,+1 555 000 0001,phone,john@example.com,Acme Corp,personal,Friend from college
Jane Smith,+1 555 000 0002,phone,,Tech Inc,work,Project manager
Emergency Contact,+1 555 000 0003,phone,,,emergency,Doctor`;

export default function CsvImport({ onImported }) {
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedContacts, setParsedContacts] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const parseCsv = (text) => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    // Detect delimiter (comma or semicolon)
    const delim = lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";

    const headers = lines[0].split(delim).map((h) => h.trim().toLowerCase());

    return lines.slice(1).map((line) => {
      // Simple CSV parse — handles quoted fields
      const values = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === delim && !inQuotes) { values.push(current.trim()); current = ""; continue; }
        current += ch;
      }
      values.push(current.trim());

      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ""; });

      return {
        name: obj.name || "",
        phone: obj.phone || "",
        contact_type: obj.contact_type === "email_phone" ? "email_phone" : "phone",
        email: obj.email || "",
        company: obj.company || "",
        category: ["personal", "work", "service", "emergency", "other"].includes(obj.category) ? obj.category : "personal",
        notes: obj.notes || "",
        favorite: false,
      };
    }).filter((c) => c.name && c.phone);
  };

  const handleFile = async (file) => {
    setParsing(true);
    setError(null);
    setResult(null);
    try {
      const text = await file.text();
      const contacts = parseCsv(text);
      if (contacts.length === 0) {
        setError("No valid contacts found. Ensure your CSV has 'name' and 'phone' columns.");
        return;
      }
      setParsedContacts(contacts);
    } catch {
      setError("Could not read the file. Ensure it's a valid CSV.");
    } finally {
      setParsing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const doImport = async () => {
    setImporting(true);
    setError(null);
    try {
      const created = await base44.entities.Contact.bulkCreate(parsedContacts);
      const successCount = (created || []).length;
      setResult({ success: successCount, total: parsedContacts.length });
      setParsedContacts([]);
      if (onImported) onImported(created);
    } catch {
      setError("Could not import contacts. Try again.");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setOpen(false);
    setParsedContacts([]);
    setResult(null);
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all"
        style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
      >
        <Upload size={12} /> Import CSV
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80]" style={{ background: "rgba(5,7,10,0.85)", backdropFilter: "blur(4px)" }}
              onClick={importing ? undefined : reset}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[82] w-[92%] max-w-lg p-6 max-h-[90vh] overflow-y-auto"
              style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.3)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Upload size={14} style={{ color: "#D1FF26" }} />
                  <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// IMPORT CONTACTS FROM CSV</p>
                </div>
                <button onClick={reset} className="p-1 transition-colors hover:bg-[rgba(138,143,152,0.1)]">
                  <X size={16} style={{ color: "#8A8F98" }} />
                </button>
              </div>

              {error && <p className="font-mono text-[10px] tracking-widest mb-3" style={{ color: "#ef4444" }}>⚠ {error}</p>}

              {/* Result */}
              {result && (
                <div className="text-center py-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.4 }} className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4" style={{ background: "rgba(209,255,38,0.12)", border: "1px solid rgba(209,255,38,0.5)" }}>
                    <Check size={28} style={{ color: "#D1FF26" }} />
                  </motion.div>
                  <p className="font-mono text-[10px] tracking-widest mb-2" style={{ color: "#D1FF26" }}>// IMPORT COMPLETE</p>
                  <p className="font-heading font-bold text-lg" style={{ color: "#F5F5F7" }}>{result.success} contacts imported</p>
                  <button onClick={reset} className="w-full mt-4 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
                    Done
                  </button>
                </div>
              )}

              {/* Upload area */}
              {!result && !parsedContacts.length && (
                <>
                  <div className="p-6 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.3)", background: "rgba(209,255,38,0.03)" }}>
                    {parsing ? (
                      <>
                        <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: "#D1FF26" }} />
                        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>PARSING CSV…</p>
                      </>
                    ) : (
                      <>
                        <FileText size={32} style={{ color: "rgba(209,255,38,0.4)", margin: "0 auto 12px" }} />
                        <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "#F5F5F7" }}>DROP OR SELECT A CSV FILE</p>
                        <p className="font-mono text-[9px] mb-4" style={{ color: "rgba(138,143,152,0.5)" }}>Columns: name, phone, contact_type, email, company, category, notes</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase"
                          style={{ background: "#D1FF26", color: "#05070A" }}
                        >
                          <Upload size={12} /> Select CSV File
                        </button>
                        <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileSelect} className="hidden" />
                      </>
                    )}
                  </div>

                  <button
                    onClick={downloadTemplate}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-2 font-mono text-[9px] tracking-widest uppercase transition-all"
                    style={{ color: "#8A8F98" }}
                  >
                    <Download size={11} /> Download Template
                  </button>
                </>
              )}

              {/* Preview & confirm */}
              {!result && parsedContacts.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-3 p-3" style={{ background: "rgba(209,255,38,0.05)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                    <AlertCircle size={14} style={{ color: "#D1FF26" }} />
                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>{parsedContacts.length} CONTACTS READY TO IMPORT</p>
                  </div>

                  <div className="max-h-60 overflow-y-auto mb-4" style={{ border: "0.5px solid rgba(138,143,152,0.1)" }}>
                    {parsedContacts.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5" style={{ borderBottom: "0.5px solid rgba(138,143,152,0.05)" }}>
                        <div className="flex items-center justify-center w-7 h-7 flex-shrink-0 rounded-full" style={{ background: "rgba(209,255,38,0.1)" }}>
                          <span className="font-mono text-[9px]" style={{ color: "#D1FF26" }}>{c.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate" style={{ color: "#F5F5F7" }}>{c.name}</p>
                          <p className="font-mono text-[9px] truncate" style={{ color: "#8A8F98" }}>{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
                        </div>
                        <span className="font-mono text-[8px] tracking-widest px-1.5 py-0.5" style={{ background: "rgba(209,255,38,0.06)", color: "#D1FF26" }}>{c.category?.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={doImport}
                      disabled={importing}
                      className="flex-1 flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40"
                      style={{ background: "#D1FF26", color: "#05070A" }}
                    >
                      {importing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Import {parsedContacts.length} Contacts
                    </button>
                    <button onClick={reset} className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase" style={{ border: "0.5px solid rgba(138,143,152,0.2)", color: "#8A8F98" }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}