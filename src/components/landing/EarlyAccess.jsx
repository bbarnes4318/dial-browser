import React from "react";
import { motion } from "framer-motion";
import { UserPlus, LogIn, Phone } from "lucide-react";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";

export default function EarlyAccess() {
  return (
    <section id="early-access" className="snap-section relative flex items-center justify-center overflow-hidden" style={{ background: '#05070A' }}>
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-6" style={{ color: '#D1FF26' }}>
            // REGISTRATION
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-6" style={{ color: '#F5F5F7' }}>
            Join The<br />
            <span style={{ color: '#D1FF26' }}>Signal</span>
          </h2>
          <p className="text-lg mb-10" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Create your 1 Call Away™ account to get a personal dial code and start accessing services by voice. Already registered? Login with your email and password.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openRegistrationModal()}
              className="group relative inline-flex items-center gap-3 px-10 py-5 font-semibold text-sm tracking-widest uppercase transition-all duration-500 hover:shadow-[0_0_80px_rgba(209,255,38,0.3)]"
              style={{
                background: '#D1FF26',
                color: '#05070A',
                borderRadius: '2px',
              }}
            >
              <UserPlus size={16} />
              Registration
            </button>
            <button
              onClick={() => openRegistrationModal()}
              className="inline-flex items-center gap-3 px-8 py-5 font-mono text-xs tracking-widest uppercase transition-all duration-300 hover:bg-[rgba(209,255,38,0.08)]"
              style={{
                background: 'transparent',
                color: '#D1FF26',
                border: '0.5px solid rgba(209,255,38,0.4)',
                borderRadius: '2px',
              }}
            >
              <LogIn size={14} />
              Already Registered? Login
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            <Phone size={12} style={{ color: '#8A8F98' }} />
            <p className="font-mono text-[10px] tracking-[0.2em]" style={{ color: '#8A8F98' }}>
              founders@dialbrowser.com
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}