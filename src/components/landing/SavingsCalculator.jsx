import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { openRegistrationModal } from "@/components/landing/RegistrationModal";
import { Smartphone, Wifi, DollarSign, TrendingDown, RotateCcw } from "lucide-react";

export default function SavingsCalculator() {
  const [inView, setInView] = useState(true);
  const sectionRef = useRef(null);

  // User inputs
  const [appsUsed, setAppsUsed] = useState(12);
  const [dataPerApp, setDataPerApp] = useState(1.5); // GB per app per month
  const [subscriptions, setSubscriptions] = useState(3);
  const [avgSubCost, setAvgSubCost] = useState(9.99);
  const [dataPlanCost, setDataPlanCost] = useState(60);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculations
  const totalData = appsUsed * dataPerApp;
  const totalSubCost = subscriptions * avgSubCost;
  const monthlyAppCost = totalSubCost + dataPlanCost;
  const yearlyAppCost = monthlyAppCost * 12;

  // Dial Browser savings estimates
  const dialMonthlyFlat = 15; // flat access fee
  const dialDataSaved = totalData * 0.85; // 85% data reduction (GB)
  const dialSubsSaved = totalSubCost * 0.7; // 70% subscription reduction
  const dataValuePerGB = 3; // estimated $/GB value of mobile data
  const monthlySavings = (dataPlanCost * 0.85) + (totalSubCost * 0.7) + (dialDataSaved * dataValuePerGB) - dialMonthlyFlat;
  const yearlySavings = monthlySavings * 12;
  const dataSavedYearly = dialDataSaved * 12;

  const reset = () => {
    setAppsUsed(12);
    setDataPerApp(1.5);
    setSubscriptions(3);
    setAvgSubCost(9.99);
    setDataPlanCost(60);
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
            // SAVINGS CALCULATOR
          </p>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
            See What You Save
          </h2>
          <p className="text-lg font-light max-w-2xl mx-auto" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
            Adjust your monthly app habits to calculate your potential savings with the Dial Browser™.
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
                YOUR CURRENT USAGE
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
                icon={Smartphone}
                label="Apps installed"
                value={appsUsed}
                min={1}
                max={50}
                step={1}
                onChange={setAppsUsed}
                format={(v) => `${v} apps`}
              />
              <Slider
                icon={Wifi}
                label="Data per app / month"
                value={dataPerApp}
                min={0.1}
                max={10}
                step={0.1}
                onChange={setDataPerApp}
                format={(v) => `${v.toFixed(1)} GB`}
              />
              <Slider
                icon={DollarSign}
                label="Paid subscriptions"
                value={subscriptions}
                min={0}
                max={20}
                step={1}
                onChange={setSubscriptions}
                format={(v) => `${v} subs`}
              />
              <Slider
                icon={DollarSign}
                label="Avg. subscription cost"
                value={avgSubCost}
                min={0}
                max={50}
                step={0.99}
                onChange={setAvgSubCost}
                format={(v) => `$${v.toFixed(2)}`}
              />
              <Slider
                icon={Wifi}
                label="Monthly data plan cost"
                value={dataPlanCost}
                min={0}
                max={150}
                step={5}
                onChange={setDataPlanCost}
                format={(v) => `$${v}`}
              />
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <p className="font-mono text-[10px] tracking-widest mb-4" style={{ color: '#8A8F98' }}>
              WITH 1 CALL AWAY™
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
                ${Math.max(0, monthlySavings).toFixed(2)} / month saved
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}>
                <div>
                  <p className="text-sm" style={{ color: '#F5F5F7' }}>Data saved / year</p>
                  <p className="font-mono text-[10px]" style={{ color: '#8A8F98' }}>85% reduction</p>
                </div>
                <span className="font-mono text-lg font-bold" style={{ color: '#D1FF26' }}>
                  {dataSavedYearly.toFixed(0)} GB
                </span>
              </div>
              <div className="flex items-center justify-between p-4" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}>
                <div>
                  <p className="text-sm" style={{ color: '#F5F5F7' }}>Subscriptions eliminated</p>
                  <p className="font-mono text-[10px]" style={{ color: '#8A8F98' }}>70% reduction</p>
                </div>
                <span className="font-mono text-lg font-bold" style={{ color: '#D1FF26' }}>
                  ${(dialSubsSaved * 12).toFixed(0)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}>
                <div>
                  <p className="text-sm" style={{ color: '#F5F5F7' }}>Current monthly cost</p>
                  <p className="font-mono text-[10px]" style={{ color: '#8A8F98' }}>Apps + data + subs</p>
                </div>
                <span className="font-mono text-lg font-bold" style={{ color: '#8A8F98' }}>
                  ${monthlyAppCost.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between p-4" style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}>
                <div>
                  <p className="text-sm" style={{ color: '#F5F5F7' }}>Dial Browser monthly</p>
                  <p className="font-mono text-[10px]" style={{ color: '#8A8F98' }}>Flat access fee</p>
                </div>
                <span className="font-mono text-lg font-bold" style={{ color: '#D1FF26' }}>
                  $15.00
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
          * Estimates based on average Dial Browser™ efficiency data. Actual savings vary by usage.
        </p>
      </div>
    </section>
  );
}