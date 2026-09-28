import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, X, Network } from "lucide-react";
import BenefitChart from "@/components/landing/BenefitChart";
import IndustryCarousel from "@/components/landing/IndustryCarousel";

const industries = [
  { name: "YouTube", category: "Media & Streaming", benefit: "Expands content discovery through voice and SMS; reaches feature-phone and accessibility users; increases watch traffic through shared links; improves discovery of creators, podcasts, and educational content." },
  { name: "Amazon Prime", category: "E-commerce & Streaming", benefit: "Voice-based shopping and entertainment discovery; easier product search; increased Prime Video discovery; potential increase in purchases from users who prefer calling or texting." },
  { name: "Facebook", category: "Social", benefit: "Simplifies access to public Pages, Marketplace listings, events, and community information through voice requests; may help reach users with lower digital literacy." },
  { name: "Instagram", category: "Social", benefit: "Improves creator and business discovery through voice search; routes users to public profiles and content; helps brands reach audiences outside traditional app navigation." },
  { name: "X (Twitter)", category: "Social", benefit: "Voice access to trending topics, news, sports updates, and public conversations; could increase visibility of public content through conversational discovery." },
  { name: "Spotify", category: "Media & Streaming", benefit: "Voice-first music and podcast discovery; personalized listening through phone calls or SMS links; expands access for users without smartphones or streaming apps." },
  { name: "Etsy", category: "E-commerce & Streaming", benefit: "Makes handmade products easier to discover through conversational shopping; supports small businesses by simplifying product search and referrals." },
  { name: "Automotive Industry", category: "Industry Vertical", benefit: "Voice-based vehicle search, dealership discovery, financing information, rentals, auctions, service appointments, recalls, and roadside assistance." },
  { name: "Movie Industry", category: "Entertainment", benefit: "Increases movie discovery, trailers, showtimes, ticket sales, and promotional reach through voice and SMS interactions." },
  { name: "Television Networks", category: "Entertainment", benefit: "Helps viewers discover programs, schedules, live broadcasts, streaming options, interviews, and promotional content." },
  { name: "Record Labels", category: "Entertainment", benefit: "Expands artist discovery; supports music promotion, ticket sales, merchandise, fan engagement, and catalog awareness through voice-driven experiences." },
  { name: "NBA", category: "Sports", benefit: "Voice access to scores, schedules, highlights, standings, player information, ticket discovery, merchandise, and fan engagement." },
  { name: "NFL", category: "Sports", benefit: "Easier access to live scores, fantasy updates, team news, schedules, tickets, and official content." },
  { name: "MLB", category: "Sports", benefit: "Voice-based game updates, statistics, schedules, ticket information, highlights, and merchandise discovery." },
  { name: "MLS", category: "Sports", benefit: "Improves visibility of teams and matches; easier ticket discovery; expands fan engagement through conversational access." },
  { name: "Boxing", category: "Sports", benefit: "Promotes fight schedules, pay-per-view events, rankings, ticket sales, boxer profiles, and historical content." },
  { name: "All Major Sports Leagues", category: "Sports", benefit: "Unified voice portal for scores, schedules, tickets, merchandise, highlights, fantasy information, and official league content." },
  { name: "Banking Industry", category: "Finance", benefit: "Voice-guided customer service, account information (subject to security controls), branch locator, financial education, loan information, and fraud alerts through secure authentication." },
  { name: "Internet Ecosystem", category: "Technology", benefit: "Provides an alternative access layer for users who cannot easily use browsers or apps; may broaden digital inclusion through telephony-based interfaces." },
  { name: "Radio Stations", category: "Media & Streaming", benefit: "New listener acquisition through voice requests; easier station discovery; local programming promotion; advertising opportunities; podcast distribution." },
  { name: "E-commerce Industry", category: "E-commerce & Streaming", benefit: "Conversational shopping, product search, order tracking, customer support, payment initiation (where supported), and simplified purchasing flows." },
];

const categoryColors = {
  "Media & Streaming": "#D1FF26",
  "E-commerce & Streaming": "#D1FF26",
  Social: "#5A8FE0",
  "Industry Vertical": "#F5A623",
  Entertainment: "#A855F7",
  Sports: "#D1FF26",
  Finance: "#F5A623",
  Technology: "#5A8FE0",
};

export default function IndustryImpact() {
  const [inView, setInView] = useState(true);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const categories = ["All", ...Array.from(new Set(industries.map((i) => i.category))).sort()];

  const filtered = industries.filter((i) => {
    const matchesCat = activeCategory === "All" || i.category === activeCategory;
    const q = query.toLowerCase().trim();
    const matchesQ = !q || i.name.toLowerCase().includes(q) || i.benefit.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  return (
    <section
      ref={sectionRef}
      className="snap-section relative flex flex-col justify-center py-20 lg:py-24 overflow-hidden"
      style={{ background: "#05070A" }}
    >
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(209,255,38,0.03) 0%, transparent 70%)" }} />

      <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Network size={16} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>
              // ECOSYSTEM IMPACT
            </p>
          </div>
          <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4" style={{ color: "#F5F5F7" }}>
            Who Benefits from <span style={{ color: "#D1FF26" }}>1 CALL AWAY™</span>
          </h2>
          <p className="text-sm font-light max-w-4xl mx-auto" style={{ color: "#8A8F98", lineHeight: "1.7" }}>
            1 CALL AWAY™ positions <span style={{ color: "#D1FF26" }}>The Dial Browser™</span> as a voice-first and text-first access layer that can complement existing digital platforms rather than replace them. Through authorized partnerships, APIs, licensing agreements, and telecom integrations, it aims to help companies extend the reach of their content, products, and services to users who prefer—or depend on—phone calls and SMS, including people with limited internet access, older devices, accessibility needs, or lower digital literacy. The concept is intended to reduce friction in discovery and access while creating new opportunities for engagement, commerce, and customer acquisition.
          </p>
        </motion.div>

        {/* Search + category filter */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col gap-3 mb-8"
        >
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: query.trim() ? "#D1FF26" : "#8A8F98" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search industries or benefits..."
              className="w-full pl-11 pr-10 py-3 font-mono text-sm tracking-wide outline-none transition-all"
              style={{
                background: "#10141D",
                border: query.trim() ? "0.5px solid rgba(209,255,38,0.35)" : "0.5px solid rgba(209,255,38,0.12)",
                color: "#F5F5F7",
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#8A8F98" }}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const color = cat === "All" ? "#D1FF26" : categoryColors[cat] || "#D1FF26";
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-all duration-300"
                  style={{
                    background: isActive ? `${color}15` : "transparent",
                    border: `0.5px solid ${isActive ? `${color}80` : "rgba(209,255,38,0.12)"}`,
                    color: isActive ? color : "#8A8F98",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Benefit distribution chart */}
        <BenefitChart industries={industries} />

        {/* Count */}
        <div className="mb-4">
          <p className="font-mono text-[10px] tracking-widest" style={{ color: "#8A8F98" }}>
            {filtered.length} INDUSTRY{filtered.length !== 1 ? "S" : ""} · SWIPE TO EXPLORE
          </p>
        </div>

        {/* Carousel */}
        <IndustryCarousel industries={filtered} inView={inView} />

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="font-mono text-sm tracking-widest" style={{ color: "#8A8F98" }}>NO MATCHING INDUSTRIES</p>
          </div>
        )}
      </div>
    </section>
  );
}