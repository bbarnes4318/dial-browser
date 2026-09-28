import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";
import { Phone, Clock, Wallet, TrendingDown, RotateCcw, PhoneCall } from "lucide-react";

export default function CallVolumeCalculator() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  const [callVolume, setCallVolume] = useState(50);
  const [avgDuration, setAvgDuration] = useState(4);
  const [currentSpend, setCurrentSpend] = useState(120);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // 1 CALL AWAY pricing model
  const dialFlatFee = 15;            // monthly flat access
  const dialPerCall = 0.05;          // per-call connection
  const dialPerMinute = 0.02;        // voice minute rate

  const dialMonthlyCost = dialFlatFee + (callVolume * dialPerCall) + (callVolume * avgDuration * dialPerMinute);
  const monthlySavings = currentSpend - dialMonthlyCost;
  const yearlySavings = monthlySavings * 12;
  const savingsPct = currentSpend > 0 ? Math.max(0, Math.min(99, (monthlySavings / currentSpend) * 100)) : 0;
  const dialBarWidth = currentSpend > 0 ? Math.max(2, (dialMonthlyCost / currentSpend) * 100) : 100;

  const reset = () => {
    setCallVolume(50);
    setAvgDuration(4);
    setCurrentSpend(120);
  };

  const Slider = ({ icon: Icon, label, value, min, max, step, onChange, format }) => (
    <div className="p-4" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: '#D1FF26' }} />
          <span className="text-sm" style={{ color: '#F5F5F7' }}>{label}</span>
        </div>
        <span className="font-mono text-sm font-bold" style={{ color: '#D1FF26' }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 appearance-none cursor-pointer rounded-full"
        style={{
          background: `linear-gradient(to right, #D1FF26 0%, #D1FF26 ${((value - min) / (max - min)) * 100}%, rgba(138,143,152,0.2) ${((value - min) / (max - min)) * 100}%, rgba(138,143,152,0.2) 100%)`,
        }}
      />
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: '#05070A' }}
    >
      <div className="relative z-10 px-6 lg:px-16 max-w-5xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-10 lg:mb-14 text-center"
        >
          <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>
            // CALL VOLUME CALCULATOR
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            Price Per Call
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Enter your estimated monthly call volume to see exactly how much you save by switching to 1 CALL AWAY™.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inputs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>
                YOUR CALL HABITS
              </p>
              <button
                onClick={reset}
                className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest transition-colors hover:text-[#D1FF26]"
                style={{ color: '#8A8F98' }}
              >
                <RotateCcw size={11} />
                RESET
              </button>
            </div>
            <div className="space-y-3">
              <Slider
                icon={PhoneCall}
                label="Calls per month"
                value={callVolume}
                min={1}
                max={1000}
                step={1}
                onChange={setCallVolume}
                format={(v) => `${v} calls`}
              />
              <Slider
                icon={Clock}
                label="Avg. minutes per call"
                value={avgDuration}
                min={1}
                max={60}
                step={1}
                onChange={setAvgDuration}
                format={(v) => `${v} min`}
              />
              <Slider
                icon={Wallet}
                label="Current monthly spend on apps/services"
                value={currentSpend}
                min={0}
                max={1000}
                step={5}
                onChange={setCurrentSpend}
                format={(v) => `$${v}`}
              />
            </div>

            {/* Per-call cost readout */}
            <div className="mt-3 p-4 flex items-center justify-between" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}>
              <div className="flex items-center gap-2">
                <Phone size={14} style={{ color: '#D1FF26' }} />
                <span className="text-sm" style={{ color: '#F5F5F7' }}>1 CALL AWAY cost per call</span>
              </div>
              <span className="font-mono text-lg font-bold" style={{ color: '#D1FF26' }}>
                ${callVolume > 0 ? (dialMonthlyCost / callVolume).toFixed(2) : '0.00'}
              </span>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: '#8A8F98' }}>
              YOUR SAVINGS WITH 1 CALL AWAY™
            </p>

            {/* Big savings number */}
            <div className="p-6 mb-3 relative overflow-hidden" style={{ background: 'rgba(209,255,38,0.06)', border: '0.5px solid rgba(209,255,38,0.25)' }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={14} style={{ color: '#D1FF26' }} />
                <span className="font-mono text-[10px] tracking-widest" style={{ color: '#D1FF26' }}>
                  ESTIMATED YEARLY SAVINGS
                </span>
              </div>
              <motion.p
                key={Math.round(yearlySavings)}
                initial={{ opacity: 0.5, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="font-heading font-black text-5xl lg:text-6xl tracking-tight"
                style={{ color: '#D1FF26' }}
              >
                ${Math.max(0, Math.round(yearlySavings)).toLocaleString()}
              </motion.p>
              <p className="font-mono text-xs mt-2" style={{ color: '#8A8F98' }}>
                ${Math.max(0, monthlySavings).toFixed(2)} / month saved · {savingsPct.toFixed(0)}% reduction
              </p>
            </div>

            {/* Comparison bars */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>CURRENT</span>
                  <span className="font-mono text-sm font-bold" style={{ color: '#8A8F98' }}>${currentSpend.toFixed(2)}/mo</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(138,143,152,0.15)' }}>
                  <div className="h-full rounded-full" style={{ width: '100%', background: '#8A8F98' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] tracking-widest" style={{ color: '#D1FF26' }}>1 CALL AWAY™</span>
                  <span className="font-mono text-sm font-bold" style={{ color: '#D1FF26' }}>${dialMonthlyCost.toFixed(2)}/mo</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(138,143,152,0.15)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${dialBarWidth}%` } : {}}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    style={{ background: '#D1FF26', boxShadow: '0 0 12px rgba(209,255,38,0.4)' }}
                  />
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}>
                <div>
                  <p className="text-sm" style={{ color: '#F5F5F7' }}>Dial Browser flat fee</p>
                  <p className="font-mono text-[10px]" style={{ color: '#8A8F98' }}>Monthly access</p>
                </div>
                <span className="font-mono text-lg font-bold" style={{ color: '#D1FF26' }}>$15.00</span>
              </div>
              <div className="flex items-center justify-between p-4" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}>
                <div>
                  <p className="text-sm" style={{ color: '#F5F5F7' }}>Connection + voice minutes</p>
                  <p className="font-mono text-[10px]" style={{ color: '#8A8F98' }}>{callVolume} calls × {avgDuration} min</p>
                </div>
                <span className="font-mono text-lg font-bold" style={{ color: '#D1FF26' }}>
                  ${((callVolume * dialPerCall) + (callVolume * avgDuration * dialPerMinute)).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => openRegistrationModal()}
              className="block text-center mt-4 font-mono text-xs tracking-widest uppercase px-5 py-3.5 transition-all duration-300 hover:shadow-[0_0_30px_rgba(209,255,38,0.2)]"
              style={{ background: '#D1FF26', color: '#05070A' }}
            >
              Start Saving — Register Now
            </button>
          </motion.div>
        </div>

        <p className="font-mono text-[10px] text-center mt-8" style={{ color: '#8A8F98' }}>
          * Estimates based on 1 CALL AWAY™ flat access ($15/mo) + $0.05/call + $0.02/min. Actual savings vary by usage.
        </p>
      </div>
    </section>
  );
}