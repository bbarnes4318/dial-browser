import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ChevronDown, DollarSign, Percent, TrendingUp,
  Shield, FileText, Users, AlertCircle, Check,
} from "lucide-react";

const SECTIONS = [
  {
    id: "overview",
    title: "How Share Sales Work",
    icon: BookOpen,
    content: [
      "1 Call Equity™ allows creators with 1,000,000+ verified subscribers to sell ownership shares of their show directly to the public.",
      "Fans purchase shares at the price set by the creator. Each share represents a percentage of the show's revenue, distributed quarterly.",
      "Creators define the total number of shares, the price per share, and the revenue share percentage when listing their show.",
      "All transactions are processed securely through Dial Pay. Shareholders receive a digital certificate confirming their ownership stake.",
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility Requirements",
    icon: Shield,
    content: [
      "Your show must have a verified audience of at least 1,000,000 subscribers.",
      "Your subscriber count is verified by the 1 Call Away team before your offering goes live.",
      "You must maintain an active show with regular content to keep your offering listed.",
      "Listings are reviewed and approved by our team before shares are available for purchase.",
    ],
  },
  {
    id: "process",
    title: "Step-by-Step Process",
    icon: FileText,
    content: [
      "Step 1 — Submit your show for review using the 'List Your Show' form above.",
      "Step 2 — Our team verifies your subscriber count and reviews your listing (typically 2-3 business days).",
      "Step 3 — Once approved, your offering goes live and shares become available for public purchase.",
      "Step 4 — Shareholders can purchase shares directly through the platform via secure checkout.",
      "Step 5 — Revenue is distributed to shareholders quarterly based on their ownership percentage.",
    ],
  },
  {
    id: "fees",
    title: "Platform Fees & Revenue Split",
    icon: Percent,
    content: [
      "Donations & Tips: The platform receives 30% of all donations made to creators. Creators retain 70%.",
      "All Other Transactions: The platform receives a 10% fee on merchandise sales, share purchases, subscriptions, and all other transactions. Creators retain 90%.",
      "Share purchase fees are deducted from the total transaction amount at checkout.",
      "Revenue distributions to shareholders are calculated after the platform fee is applied.",
      "There are no hidden fees. The fee structure is transparent and applied consistently across all transactions.",
    ],
  },
  {
    id: "payouts",
    title: "Shareholder Payouts",
    icon: TrendingUp,
    content: [
      "Revenue is distributed to shareholders on a quarterly basis.",
      "Each shareholder receives a payout proportional to their ownership percentage of the total revenue share pool.",
      "Example: If a show generates $100,000 in revenue and the revenue share pool is 10%, shareholders split $10,000 (after the 10% platform fee) proportionally to their shares.",
      "Payouts are processed via Dial Pay and sent to the shareholder's registered payment method.",
      "Shareholders can track their earnings and ownership stake in their dashboard.",
    ],
  },
  {
    id: "important",
    title: "Important Considerations",
    icon: AlertCircle,
    content: [
      "Selling shares of your show is a commitment to share future revenue with your shareholders.",
      "Once shares are sold, shareholders are entitled to their portion of revenue for the duration of the show's life.",
      "You may close your offering at any time, but existing shareholders retain their ownership rights.",
      "All share sales are final. Refunds are not available once a purchase is completed.",
      "Creators are responsible for accurate reporting of show revenue for distribution purposes.",
    ],
  },
];

export default function ShareInstructions() {
  const [openSection, setOpenSection] = useState("overview");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="mt-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={14} style={{ color: "#D1FF26" }} />
        <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>
          // HOW SHARE SALES WORK — COMPLETE GUIDE
        </p>
      </div>

      <div className="p-5" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.15)" }}>
        {/* Fee summary banner */}
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          <div className="p-4 flex items-center gap-3" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
            <div className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: "rgba(209,255,38,0.1)", border: "0.5px solid rgba(209,255,38,0.3)" }}>
              <DollarSign size={18} style={{ color: "#D1FF26" }} />
            </div>
            <div>
              <p className="font-mono text-[8px] tracking-widest mb-0.5" style={{ color: "#8A8F98" }}>DONATIONS & TIPS</p>
              <p className="font-heading font-black text-lg" style={{ color: "#D1FF26" }}>30% Platform Fee</p>
              <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>Creators keep 70%</p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
            <div className="flex items-center justify-center w-10 h-10 flex-shrink-0" style={{ background: "rgba(138,143,152,0.1)", border: "0.5px solid rgba(138,143,152,0.2)" }}>
              <Percent size={18} style={{ color: "#F5F5F7" }} />
            </div>
            <div>
              <p className="font-mono text-[8px] tracking-widest mb-0.5" style={{ color: "#8A8F98" }}>ALL OTHER TRANSACTIONS</p>
              <p className="font-heading font-black text-lg" style={{ color: "#F5F5F7" }}>10% Platform Fee</p>
              <p className="font-mono text-[8px]" style={{ color: "#8A8F98" }}>Creators keep 90%</p>
            </div>
          </div>
        </div>

        {/* Accordion sections */}
        <div className="space-y-2">
          {SECTIONS.map((section) => {
            const isOpen = openSection === section.id;
            const Icon = section.icon;
            return (
              <div key={section.id} style={{ background: "rgba(5,7,10,0.5)", border: `0.5px solid ${isOpen ? "rgba(209,255,38,0.3)" : "rgba(138,143,152,0.1)"}` }}>
                <button
                  onClick={() => setOpenSection(isOpen ? null : section.id)}
                  className="w-full flex items-center justify-between p-3 text-left transition-all hover:bg-[rgba(209,255,38,0.03)]"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} style={{ color: isOpen ? "#D1FF26" : "#8A8F98" }} />
                    <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: isOpen ? "#D1FF26" : "#F5F5F7" }}>
                      {section.title}
                    </span>
                  </div>
                  <ChevronDown size={14} style={{ color: isOpen ? "#D1FF26" : "#8A8F98", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        {section.content.map((line, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check size={10} className="flex-shrink-0 mt-1" style={{ color: "#D1FF26" }} />
                            <p className="text-xs" style={{ color: "#8A8F98", lineHeight: 1.6 }}>{line}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}