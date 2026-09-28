import React from "react";
import { motion } from "framer-motion";
// ProblemSolution module

export default function ProblemSolution() {
  return (
    <section className="snap-section relative flex items-center overflow-hidden" style={{ background: '#05070A' }}>
      <div className="relative z-10 w-full px-6 lg:px-16 py-20 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative p-8 lg:p-12"
            style={{
              background: 'rgba(16, 20, 29, 0.6)',
              borderLeft: '2px solid #D1FF26',
            }}
          >
            <p className="font-mono text-xs tracking-[0.4em] mb-6" style={{ color: '#8A8F98' }}>
              // THE PROBLEM
            </p>
            <h3 className="font-heading font-black text-3xl lg:text-5xl tracking-tight mb-6" style={{ color: '#F5F5F7' }}>
              3.7 Billion<br />
              <span style={{ color: '#8A8F98' }}>Left Offline</span>
            </h3>
            <p className="text-base leading-relaxed" style={{ color: '#8A8F98', lineHeight: '1.6', fontSize: '18px' }}>
              Modern digital services require smartphones, apps, and reliable internet.
              Billions of people are excluded or face high friction accessing basic services.
              The digital divide is not just about connectivity — it is about access to opportunity.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { val: "3.7B", label: "Without Internet" },
                { val: "66%", label: "SMS Accessible" },
                { val: "5B+", label: "Phone Users" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading font-black text-2xl" style={{ color: '#D1FF26' }}>{stat.val}</p>
                  <p className="font-mono text-[10px] tracking-wider mt-1" style={{ color: '#8A8F98' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative p-8 lg:p-12"
            style={{
              background: 'rgba(209, 255, 38, 0.03)',
              borderLeft: '2px solid #D1FF26',
            }}
          >
            <p className="font-mono text-xs tracking-[0.4em] mb-6" style={{ color: '#D1FF26' }}>
              // THE SOLUTION
            </p>
            <h3 className="font-heading font-black text-3xl lg:text-5xl tracking-tight mb-6" style={{ color: '#F5F5F7' }}>
              One Number.<br />
              <span style={{ color: '#D1FF26' }}>Every Service.</span>
            </h3>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#8A8F98', lineHeight: '1.6', fontSize: '18px' }}>
              The Dial Browser™ turns voice calls and SMS into a universal interface for digital services.
              Users simply say what they need — and the system delivers results through voice or text.
              No apps. No Wi-Fi required. Any phone, anywhere.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}