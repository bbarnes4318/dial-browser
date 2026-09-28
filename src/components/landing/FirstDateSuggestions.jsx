import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, DollarSign, MapPin, Clock, Volume2 } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/voiceSynthesis";

const dateIdeas = [
  { id: "d1", title: "Coffee & Park Walk", cost: 20, category: "Casual", duration: "1-2 hrs", setting: "Outdoor", description: "Grab coffee to-go and stroll through a local park. Low pressure, easy conversation." },
  { id: "d2", title: "Ice Cream & Bookstore Browse", cost: 25, category: "Casual", duration: "1-2 hrs", setting: "Indoor", description: "Sweet treats followed by wandering a bookstore. Great for discovering shared interests." },
  { id: "d3", title: "Farmers Market Morning", cost: 30, category: "Casual", duration: "2 hrs", setting: "Outdoor", description: "Sample local treats, browse handmade goods, and enjoy a relaxed morning together." },
  { id: "d4", title: "Food Truck Picnic", cost: 35, category: "Casual", duration: "1-2 hrs", setting: "Outdoor", description: "Grab bites from a food truck and find a scenic spot to sit and talk." },
  { id: "d5", title: "Mini Golf + Snacks", cost: 45, category: "Active", duration: "2 hrs", setting: "Outdoor", description: "Friendly competition with a built-in conversation starter. Loser buys snacks." },
  { id: "d6", title: "Museum Visit + Café", cost: 55, category: "Cultural", duration: "3 hrs", setting: "Indoor", description: "Explore a local art or history museum, then debrief over coffee at the museum café." },
  { id: "d7", title: "Cooking Class for Two", cost: 75, category: "Interactive", duration: "2-3 hrs", setting: "Indoor", description: "Learn to cook a new dish together. Teamwork reveals a lot about a person." },
  { id: "d8", title: "Live Comedy Show", cost: 85, category: "Entertainment", duration: "3 hrs", setting: "Indoor", description: "Share some laughs at a local comedy club. Skip the movie — you can't talk during a show." },
  { id: "d9", title: "Wine or Brewery Tasting", cost: 95, category: "Experience", duration: "3 hrs", setting: "Indoor", description: "Sample local wines or craft beers with a guided tasting. Relaxed atmosphere for deep talks." },
  { id: "d10", title: "Sunset Dinner Cruise", cost: 120, category: "Romantic", duration: "3-4 hrs", setting: "Outdoor", description: "Dine on the water as the sun sets. Memorable, scenic, and naturally intimate." },
  { id: "d11", title: "Concert + Dinner", cost: 150, category: "Entertainment", duration: "5 hrs", setting: "Indoor", description: "See a live band you both enjoy, with dinner before or after. Shared music taste is a bond." },
  { id: "d12", title: "Fine Dining Tasting Menu", cost: 200, category: "Luxury", duration: "3-4 hrs", setting: "Indoor", description: "A multi-course tasting menu at a top restaurant. The ultimate first-date splurge." },
];

const categories = ["All", "Casual", "Active", "Cultural", "Interactive", "Entertainment", "Experience", "Romantic", "Luxury"];

function costColor(cost) {
  if (cost <= 40) return "#D1FF26";
  if (cost <= 80) return "#f59e0b";
  if (cost <= 120) return "#f97316";
  return "#ef4444";
}

export default function FirstDateSuggestions() {
  const [inView, setInView] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [maxBudget, setMaxBudget] = useState(200);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setInView(true); }, { threshold: 0.12 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const [speakingId, setSpeakingId] = useState(null);

  const filtered = dateIdeas.filter((d) => (activeCategory === "All" || d.category === activeCategory) && d.cost <= maxBudget);

  const handleSpeak = (date) => {
    if (speakingId === date.id) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(date.id);
    speak(`${date.title}. ${date.description}. It costs about ${date.cost} dollars, takes ${date.duration}, and is an ${date.setting} activity.`, {
      onEnd: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  return (
    <section ref={sectionRef} className="py-16 lg:py-20" style={{ background: "#05070A" }}>
      <div className="relative z-10 px-6 lg:px-16 max-w-6xl mx-auto w-full">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// 1ST DATE PLANNER</p>
          </div>
          <h3 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            First Date <span style={{ color: "#D1FF26" }}>Suggestion Chart</span>
          </h3>
          <p className="text-base font-light max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            From $20 coffee walks to $200 fine dining — find the perfect first date idea that fits your budget and vibe.
          </p>
        </motion.div>

        {/* Budget slider */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }} className="p-5 mb-6" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign size={14} style={{ color: "#D1FF26" }} />
              <span className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>MAX BUDGET</span>
            </div>
            <span className="font-heading font-black text-2xl" style={{ color: "#D1FF26" }}>${maxBudget}</span>
          </div>
          <input type="range" min="20" max="200" step="5" value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))} className="w-full" style={{ accentColor: "#D1FF26" }} />
          <div className="flex justify-between mt-1 font-mono text-[8px]" style={{ color: "#8A8F98" }}>
            <span>$20</span><span>$50</span><span>$100</span><span>$150</span><span>$200</span>
          </div>
        </motion.div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return <button key={cat} onClick={() => setActiveCategory(cat)} className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: isActive ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: isActive ? "#D1FF26" : "#8A8F98" }}>{cat}</button>;
          })}
        </div>

        {/* Date ideas grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((date, i) => {
            const color = costColor(date.cost);
            return (
              <motion.div key={date.id} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 + i * 0.04 }} className="p-5 flex flex-col" style={{ background: "rgba(16,20,29,0.4)", border: "0.5px solid rgba(138,143,152,0.12)" }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="font-mono text-[8px] tracking-widest px-2 py-1" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>{date.category.toUpperCase()}</span>
                  <div className="flex items-center gap-1">
                    <DollarSign size={12} style={{ color }} />
                    <span className="font-heading font-black text-lg" style={{ color }}>{date.cost}</span>
                  </div>
                </div>
                <h4 className="font-heading font-bold text-sm mb-2" style={{ color: "#F5F5F7" }}>{date.title}</h4>
                <p className="text-xs mb-4 flex-1" style={{ color: "#8A8F98", lineHeight: 1.5 }}>{date.description}</p>
                <div className="flex items-center gap-3 pt-3" style={{ borderTop: "0.5px solid rgba(138,143,152,0.1)" }}>
                  <span className="flex items-center gap-1 font-mono text-[8px]" style={{ color: "#8A8F98" }}><Clock size={9} /> {date.duration}</span>
                  <span className="flex items-center gap-1 font-mono text-[8px]" style={{ color: "#8A8F98" }}><MapPin size={9} /> {date.setting}</span>
                  <button
                    onClick={() => handleSpeak(date)}
                    className="ml-auto flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase transition-all hover:shadow-[0_0_10px_rgba(209,255,38,0.2)]"
                    style={{ color: speakingId === date.id ? "#D1FF26" : "#8A8F98" }}
                  >
                    <Volume2 size={9} /> {speakingId === date.id ? "Speaking..." : "Hear"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Cost scale legend */}
        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.4 }} className="mt-6 flex flex-wrap items-center justify-center gap-4">
          {[
            { label: "$20-40 Budget", color: "#D1FF26" },
            { label: "$41-80 Moderate", color: "#f59e0b" },
            { label: "$81-120 Premium", color: "#f97316" },
            { label: "$121-200 Luxury", color: "#ef4444" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
              <span className="font-mono text-[9px]" style={{ color: "#8A8F98" }}>{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}