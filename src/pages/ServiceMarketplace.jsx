import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Wrench, Loader2, ArrowLeft, ShieldAlert, MapPin, BadgeCheck, Star, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ProviderListingCard from "@/components/marketplace/ProviderListingCard";
import VoiceSearchBar from "@/components/marketplace/VoiceSearchBar";

const CATEGORIES = [
  { value: "all", label: "All" }, { value: "construction", label: "Construction" },
  { value: "plumbing", label: "Plumbing" }, { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC" }, { value: "roofing", label: "Roofing" },
  { value: "landscaping", label: "Landscaping" }, { value: "automotive", label: "Automotive" },
  { value: "cleaning", label: "Cleaning" }, { value: "legal", label: "Legal" },
  { value: "medical", label: "Medical" }, { value: "it", label: "IT" },
  { value: "real_estate", label: "Real Estate" }, { value: "other", label: "Other" },
];

const REGIONS = [
  { value: "all", label: "All Regions" },
  { value: "northeast", label: "Northeast" },
  { value: "southeast", label: "Southeast" },
  { value: "midwest", label: "Midwest" },
  { value: "southwest", label: "Southwest" },
  { value: "west", label: "West" },
  { value: "national", label: "National" },
];

const US_STATES = [
  "all","AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
];

// Maps a US state code to the platform's regional grouping.
const STATE_TO_REGION = {
  CT:"northeast",ME:"northeast",MA:"northeast",NH:"northeast",RI:"northeast",VT:"northeast",NJ:"northeast",NY:"northeast",PA:"northeast",
  DE:"southeast",FL:"southeast",GA:"southeast",MD:"southeast",NC:"southeast",SC:"southeast",VA:"southeast",WV:"southeast",DC:"southeast",AL:"southeast",KY:"southeast",MS:"southeast",TN:"southeast",AR:"southeast",LA:"southeast",
  IL:"midwest",IN:"midwest",MI:"midwest",OH:"midwest",WI:"midwest",IA:"midwest",KS:"midwest",MN:"midwest",MO:"midwest",NE:"midwest",ND:"midwest",SD:"midwest",
  TX:"southwest",OK:"southwest",AZ:"southwest",NM:"southwest",
  CA:"west",OR:"west",WA:"west",NV:"west",UT:"west",CO:"west",ID:"west",MT:"west",WY:"west",AK:"west",HI:"west",
};

export default function ServiceMarketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeRegion, setActiveRegion] = useState("all");
  const [activeState, setActiveState] = useState("all");
  const [citySearch, setCitySearch] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [serviceType, setServiceType] = useState("all");
  const [locating, setLocating] = useState(false);

  // Unique specialty list across all listings — drives the service-type filter
  // and the voice-command matching for "show me plumbers / brakes / …".
  const serviceTypes = useMemo(() => {
    const set = new Set();
    listings.forEach((l) => (l.specialties || []).forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [listings]);

  const loadListings = useCallback(async () => {
    try {
      const list = await base44.entities.DialServiceListing.list("-updated_date", 100);
      setListings((list || []).filter(l => l.active));
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  // Auto-detect the visitor's state + region from their browser location.
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
        const d = await r.json();
        const stateCode = (d.principalSubdivisionCode || "").split("-")[1]?.toUpperCase();
        if (stateCode && US_STATES.includes(stateCode)) {
          setActiveState(stateCode);
          if (STATE_TO_REGION[stateCode]) setActiveRegion(STATE_TO_REGION[stateCode]);
        }
      } catch { /* ignore — leave filters unchanged */ } finally {
        setLocating(false);
      }
    }, () => setLocating(false), { timeout: 8000 });
  };

  const filtered = listings.filter(l => {
    const matchesCategory = activeCategory === "all" || l.service_category === activeCategory;
    // "national" providers serve every region, so include them in any regional filter.
    const matchesRegion = activeRegion === "all" || l.region === activeRegion || l.region === "national";
    const matchesState = activeState === "all" || (l.state || "").toUpperCase() === activeState;
    const matchesCity = !citySearch.trim() || (l.city || "").toLowerCase().includes(citySearch.toLowerCase());
    const matchesVerified = !verifiedOnly || l.verified;
    const matchesRating = !minRating || (l.rating || 0) >= minRating;
    const matchesServiceType = serviceType === "all" || (l.specialties || []).some((s) => s.toLowerCase() === serviceType.toLowerCase());
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      l.provider_name?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.specialties?.some(s => s.toLowerCase().includes(q));
    return matchesCategory && matchesRegion && matchesState && matchesCity && matchesVerified && matchesRating && matchesServiceType && matchesSearch;
  });

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(209,255,38,0.06) 0%, transparent 60%)" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 pt-8 pb-20">
        <Link to="/" className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] tracking-widest uppercase transition-colors hover:text-[#D1FF26]" style={{ color: "#8A8F98" }}>
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Wrench size={20} style={{ color: "#D1FF26" }} />
            <p className="font-mono text-xs tracking-[0.4em]" style={{ color: "#D1FF26" }}>// SERVICE MARKETPLACE</p>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-3" style={{ color: "#F5F5F7" }}>
            Local Providers. <span style={{ color: "#D1FF26" }}>One Call Away.</span>
          </h1>
          <p className="text-sm max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            Browse verified local contractors and service providers. Check ratings, compare specialties, and request a callback — all from your phone.
          </p>
        </div>

        {/* Dispute center link */}
        <div className="mb-6">
          <Link to="/disputes" className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[9px] tracking-widest uppercase transition-all hover:shadow-[0_0_12px_rgba(209,255,38,0.2)]" style={{ background: "rgba(209,255,38,0.06)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
            <ShieldAlert size={12} /> File a Dispute / Resolution Center
          </Link>
        </div>

        <div className="mb-6 space-y-3">
          <VoiceSearchBar
            value={search}
            onChange={setSearch}
            categories={CATEGORIES}
            onCategoryMatch={setActiveCategory}
            onRatingMatch={setMinRating}
            onServiceTypeMatch={(st) => setServiceType(st)}
            serviceTypes={serviceTypes}
          />
          {/* Verified toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{
                background: verifiedOnly ? "rgba(209,255,38,0.15)" : "rgba(16,20,29,0.4)",
                border: `0.5px solid ${verifiedOnly ? "rgba(209,255,38,0.5)" : "rgba(138,143,152,0.15)"}`,
                color: verifiedOnly ? "#D1FF26" : "#8A8F98",
              }}
            >
              <BadgeCheck size={11} /> {verifiedOnly ? "VERIFIED ONLY ✓" : "VERIFIED ONLY"}
            </button>
          </div>
          {/* Region filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <MapPin size={11} style={{ color: "#8A8F98" }} />
            <button onClick={useMyLocation} disabled={locating} className="flex items-center gap-1 px-2.5 py-1 font-mono text-[8px] tracking-widest uppercase transition-all disabled:opacity-50" style={{ background: "rgba(209,255,38,0.08)", border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}>
              {locating ? <Loader2 size={10} className="animate-spin" /> : <MapPin size={10} />} USE MY LOCATION
            </button>
            {REGIONS.map(reg => {
              const isActive = activeRegion === reg.value;
              return (
                <button key={reg.value} onClick={() => setActiveRegion(reg.value)} className="px-2.5 py-1 font-mono text-[8px] tracking-widest uppercase transition-all" style={{ background: isActive ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: isActive ? "#D1FF26" : "#8A8F98" }}>
                  {reg.label}
                </button>
              );
            })}
          </div>
          {/* State + City location filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={activeState}
              onChange={(e) => setActiveState(e.target.value)}
              className="px-3 py-2 font-mono text-[9px] tracking-widest uppercase outline-none cursor-pointer flex-1"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
            >
              {US_STATES.map(s => (
                <option key={s} value={s} style={{ color: "#F5F5F7", background: "#10141D" }}>
                  {s === "all" ? "All States" : s}
                </option>
              ))}
            </select>
            <input
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder="Filter by city..."
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(209,255,38,0.2)", color: "#F5F5F7" }}
            />
          </div>
          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.value;
              return (
                <button key={cat.value} onClick={() => setActiveCategory(cat.value)} className="px-3 py-1.5 font-mono text-[9px] tracking-widest uppercase transition-all" style={{ background: isActive ? "rgba(209,255,38,0.1)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: isActive ? "#D1FF26" : "#8A8F98" }}>
                  {cat.label}
                </button>
              );
            })}
          </div>
          {/* Rating filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Star size={11} style={{ color: "#8A8F98" }} />
            <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>RATING:</span>
            {[{v:0,label:"Any"},{v:4,label:"4★+"},{v:4.5,label:"4.5★+"},{v:5,label:"5★"}].map(r => {
              const isActive = minRating === r.v;
              return (
                <button key={r.v} onClick={() => setMinRating(r.v)} className="flex items-center gap-1 px-2.5 py-1 font-mono text-[8px] tracking-widest uppercase transition-all" style={{ background: isActive ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: isActive ? "#D1FF26" : "#8A8F98" }}>
                  {r.label}
                </button>
              );
            })}
          </div>
          {/* Service type (specialty) filter */}
          {serviceTypes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={11} style={{ color: "#8A8F98" }} />
              <span className="font-mono text-[8px] tracking-widest uppercase" style={{ color: "#8A8F98" }}>SERVICE TYPE:</span>
              <button onClick={() => setServiceType("all")} className="px-2.5 py-1 font-mono text-[8px] tracking-widest uppercase transition-all" style={{ background: serviceType === "all" ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${serviceType === "all" ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: serviceType === "all" ? "#D1FF26" : "#8A8F98" }}>
                All
              </button>
              {serviceTypes.map(st => {
                const isActive = serviceType.toLowerCase() === st.toLowerCase();
                return (
                  <button key={st} onClick={() => setServiceType(isActive ? "all" : st)} className="px-2.5 py-1 font-mono text-[8px] tracking-widest uppercase transition-all" style={{ background: isActive ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.4)", border: `0.5px solid ${isActive ? "rgba(209,255,38,0.4)" : "rgba(138,143,152,0.1)"}`, color: isActive ? "#D1FF26" : "#8A8F98" }}>
                    {st}
                  </button>
                );
              })}
            </div>
          )}
          {/* Voice command hint */}
          <p className="font-mono text-[8px] tracking-widest uppercase pt-1" style={{ color: "rgba(138,143,152,0.7)" }}>
            🎙 TAP MIC & SAY: "FOUR STAR PLUMBERS" · "HIGHLY RATED" · "BRAKES" · "FIND ELECTRICIANS"
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Wrench size={40} className="mx-auto mb-4" style={{ color: "rgba(209,255,38,0.3)" }} />
            <p className="font-mono text-sm tracking-widest mb-2" style={{ color: "#8A8F98" }}>NO PROVIDERS FOUND</p>
            <p className="text-sm" style={{ color: "#8A8F98" }}>Try a different search or category filter.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(listing => <ProviderListingCard key={listing.id} listing={listing} />)}
          </div>
        )}
      </div>
    </div>
  );
}