import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Send, Check } from "lucide-react";

export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "", type: "demo" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = form.type === "demo" ? "Demo Request" : "General Inquiry";
    const body = `Name: ${form.name}%0D%0AEmail: ${form.email}%0D%0A%0D%0A${encodeURIComponent(form.message)}`;
    window.location.href = `mailto:founders@dialbrowser.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setOpen(false);
      setForm({ name: "", email: "", message: "", type: "demo" });
    }, 2000);
  };

  return (
    <div className="fixed bottom-12 left-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-16 left-0 w-80 p-5"
            style={{
              background: '#10141D',
              border: '0.5px solid rgba(209,255,38,0.25)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: '#D1FF26' }}>
                  {sent ? "TRANSMITTED" : "OPEN CHANNEL"}
                </p>
                <p className="font-heading font-bold text-sm mt-0.5" style={{ color: '#F5F5F7' }}>
                  {sent ? "Message Sent" : "Send a Message"}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="transition-colors hover:text-[#D1FF26]"
                style={{ color: '#8A8F98' }}
              >
                <X size={16} />
              </button>
            </div>

            {sent ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'rgba(209,255,38,0.12)' }}
                >
                  <Check size={24} style={{ color: '#D1FF26' }} />
                </div>
                <p className="text-sm text-center" style={{ color: '#8A8F98' }}>
                  Your message is on its way. We'll be in touch shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Type toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "demo" })}
                    className="flex-1 py-2 text-xs font-mono tracking-wider transition-all"
                    style={{
                      background: form.type === "demo" ? 'rgba(209,255,38,0.12)' : 'transparent',
                      border: `0.5px solid ${form.type === "demo" ? 'rgba(209,255,38,0.4)' : 'rgba(138,143,152,0.15)'}`,
                      color: form.type === "demo" ? '#D1FF26' : '#8A8F98',
                    }}
                  >
                    DEMO
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "message" })}
                    className="flex-1 py-2 text-xs font-mono tracking-wider transition-all"
                    style={{
                      background: form.type === "message" ? 'rgba(209,255,38,0.12)' : 'transparent',
                      border: `0.5px solid ${form.type === "message" ? 'rgba(209,255,38,0.4)' : 'rgba(138,143,152,0.15)'}`,
                      color: form.type === "message" ? '#D1FF26' : '#8A8F98',
                    }}
                  >
                    MESSAGE
                  </button>
                </div>

                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm bg-transparent focus:outline-none transition-colors"
                  style={{
                    border: '0.5px solid rgba(138,143,152,0.15)',
                    color: '#F5F5F7',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(209,255,38,0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(138,143,152,0.15)'}
                />
                <input
                  type="email"
                  required
                  placeholder="Your email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm bg-transparent focus:outline-none transition-colors"
                  style={{
                    border: '0.5px solid rgba(138,143,152,0.15)',
                    color: '#F5F5F7',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(209,255,38,0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(138,143,152,0.15)'}
                />
                <textarea
                  required
                  rows={3}
                  placeholder={form.type === "demo" ? "Tell us what you'd like to see..." : "How can we help?"}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm bg-transparent focus:outline-none resize-none transition-colors"
                  style={{
                    border: '0.5px solid rgba(138,143,152,0.15)',
                    color: '#F5F5F7',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(209,255,38,0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(138,143,152,0.15)'}
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 font-mono text-xs tracking-widest uppercase transition-all duration-300 hover:shadow-[0_0_30px_rgba(209,255,38,0.2)]"
                  style={{ background: '#D1FF26', color: '#05070A' }}
                >
                  <Send size={14} />
                  Transmit
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(209,255,38,0.3)]"
        style={{
          background: open ? '#D1FF26' : 'rgba(209,255,38,0.15)',
          border: '1px solid #D1FF26',
        }}
        aria-label="Contact"
      >
        {open ? (
          <X size={20} style={{ color: '#05070A' }} />
        ) : (
          <Mail size={20} style={{ color: open ? '#05070A' : '#D1FF26' }} />
        )}
      </button>
    </div>
  );
}