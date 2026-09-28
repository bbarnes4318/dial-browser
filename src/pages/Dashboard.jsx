import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, LogOut, Loader2, Search, Package, ShieldAlert, PhoneCall, Video, Users, Bell, Siren, Gauge, CalendarClock, MapPin, Bookmark, Gift, Crown, Activity, HardHat, Shield, Clock, Calculator, Mic, AudioLines, History, Zap, Award, Trophy, Star, Radio, Terminal, Radar, Medal } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import ListingForm from "@/components/marketplace/ListingForm";
import ListingCard from "@/components/marketplace/ListingCard";
import FilterSidebar from "@/components/marketplace/FilterSidebar";
import TrendingCategories from "@/components/marketplace/TrendingCategories";
import MemberProfile from "@/components/marketplace/MemberProfile";
import CompleteTradeDialog from "@/components/marketplace/CompleteTradeDialog";
import DisputeForm from "@/components/marketplace/DisputeForm";
import SignalTipsCard from "@/components/marketplace/SignalTipsCard";
import PremiumMembership from "@/components/landing/PremiumMembership";
import DashboardRoadmap from "@/components/dashboard/DashboardRoadmap";
import ServiceRecommendations from "@/components/dashboard/ServiceRecommendations";
import TrendingNow from "@/components/dashboard/TrendingNow";
import VoiceNoteRecorder from "@/components/dashboard/VoiceNoteRecorder";
import VoiceNotesDashboard from "@/components/profile/VoiceNotesDashboard";
import VoiceMessageInbox from "@/components/dashboard/VoiceMessageInbox";
import CallHistoryTab from "@/components/dashboard/CallHistoryTab";
import RecentActivityTab from "@/components/dashboard/RecentActivityTab";
import VideoMeetingsTab from "@/components/dashboard/VideoMeetingsTab";
import ContactsTab from "@/components/dashboard/ContactsTab";
import NotificationsTab from "@/components/dashboard/NotificationsTab";
import EmergencyAlertButton from "@/components/dashboard/EmergencyAlertButton";
import EmergencyContactsManager from "@/components/dashboard/EmergencyContactsManager";
import StatusDashboard from "@/components/dashboard/StatusDashboard";
import BroadcastButton from "@/components/dashboard/BroadcastButton";
import EmergencyContactsMap from "@/components/dashboard/EmergencyContactsMap";
import SmsCalendar from "@/components/dashboard/SmsCalendar";
import DigitalServiceBrowser from "@/components/marketplace/DigitalServiceBrowser";
import TrendingDialServices from "@/components/dashboard/TrendingDialServices";
import SavedServicesTab from "@/components/dashboard/SavedServicesTab";
import ReferAFriend from "@/components/dashboard/ReferAFriend";
import FloatingShareWidget from "@/components/dashboard/FloatingShareWidget";
import LoyaltyBalance from "@/components/dashboard/LoyaltyBalance";
import ShareMyLinkButton from "@/components/dashboard/ShareMyLinkButton";
import SubscriptionManager from "@/components/dashboard/SubscriptionManager";
import DashboardCallForwarding from "@/components/phone/DashboardCallForwarding";
import LiveActivityFeed from "@/components/dashboard/LiveActivityFeed";
import VoiceCommandSummaryCard from "@/components/dashboard/VoiceCommandSummaryCard";
import VoiceVerificationSecurity from "@/components/dashboard/VoiceVerificationSecurity";
import SensitiveActionGuard from "@/components/dashboard/SensitiveActionGuard";
import VoiceServicePopularityChart from "@/components/dashboard/VoiceServicePopularityChart";
import VoiceCommandGeoMap from "@/components/dashboard/VoiceCommandGeoMap";
import ServiceActivityMap from "@/components/dashboard/ServiceActivityMap";
import SmsSubscriptionManager from "@/components/dashboard/SmsSubscriptionManager";
import ServiceStatusTracker from "@/components/dashboard/ServiceStatusTracker";
import VoiceTipWidget from "@/components/dashboard/VoiceTipWidget";
import ServiceStatusBoard from "@/components/dashboard/ServiceStatusBoard";
import PriorityAlertPopup from "@/components/dashboard/PriorityAlertPopup";
import PriceRangeEstimator from "@/components/dashboard/PriceRangeEstimator";
import VoiceTrainingSection from "@/components/dashboard/VoiceTrainingSection";
import VoiceHistorySection from "@/components/dashboard/VoiceHistorySection";
import QuickCommandsPanel from "@/components/dashboard/QuickCommandsPanel";
import DailyVoiceTipBanner from "@/components/dashboard/DailyVoiceTipBanner";
import VoiceCommandLeaderboard from "@/components/dashboard/VoiceCommandLeaderboard";
import CreatorLeaderboardHolographic from "@/components/dashboard/CreatorLeaderboardHolographic";
import AudioClarityFeedback from "@/components/dashboard/AudioClarityFeedback";
import LiveTranscriptViewer from "@/components/dashboard/LiveTranscriptViewer";
import DashboardRadioStation from "@/components/dashboard/DashboardRadioStation";
import PersonalGreetingManager from "@/components/dashboard/PersonalGreetingManager";
import VoiceprintBadge from "@/components/dashboard/VoiceprintBadge";
import VoiceCommandLogViewer from "@/components/dashboard/VoiceCommandLogViewer";
import LiveTrafficGlow from "@/components/dashboard/LiveTrafficGlow";
import LiveCoverageMap from "@/components/dashboard/LiveCoverageMap";
import FavoritesBar from "@/components/dashboard/FavoritesBar";
import CallCreditDisplay from "@/components/dashboard/CallCreditDisplay";

const PRICE_PRESETS = {
  all: { min: 0, max: Infinity },
  under50: { min: 0, max: 50 },
  "50to200": { min: 50, max: 200 },
  "200to1000": { min: 200, max: 1000 },
  "1000plus": { min: 1000, max: Infinity },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [filters, setFilters] = useState({ category: "all", priceRange: "all", location: "all" });
  const [completingListing, setCompletingListing] = useState(null);
  const [repRefreshKey, setRepRefreshKey] = useState(0);
  const [showDispute, setShowDispute] = useState(false);
  const [notesKey, setNotesKey] = useState(0);
  const [activeTab, setActiveTab] = useState("marketplace");
  const sellerName = user?.full_name || user?.email || "Member";

  const TABS = [
    { id: "saved", label: "Saved", icon: Bookmark },
    { id: "estimator", label: "Price Estimator", icon: Calculator },
    { id: "training", label: "Voice Training", icon: Mic },
    { id: "history", label: "Voice History", icon: History },
    { id: "logs", label: "Voice Logs", icon: Terminal },
    { id: "quick", label: "Quick Commands", icon: Zap },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "creators", label: "Top Creators", icon: Medal },
    { id: "clarity", label: "Audio Clarity", icon: Star },
    { id: "radio", label: "Radio Station", icon: Radio },
    { id: "transcript", label: "Live Transcript", icon: Radio },
    { id: "voice-inbox", label: "Voice Inbox", icon: AudioLines },
    { id: "marketplace", label: "Marketplace", icon: Package },
    { id: "status", label: "Status", icon: Gauge },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "calls", label: "Call History", icon: PhoneCall },
    { id: "activity-log", label: "Recent Activity", icon: History },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "video", label: "Video Meetings", icon: Video },
    { id: "calendar", label: "SMS Calendar", icon: CalendarClock },
    { id: "emergency", label: "Emergency", icon: Siren },
    { id: "subscription", label: "Subscription", icon: Crown },
    { id: "refer", label: "Refer & Earn", icon: Gift },
    { id: "loyalty", label: "Loyalty", icon: Award },
    { id: "activity", label: "Live Feed", icon: Activity },
    { id: "map", label: "Activity Map", icon: MapPin },
    { id: "coverage", label: "Coverage", icon: Radar },
    { id: "alerts", label: "SMS Alerts", icon: Bell },
    { id: "tracker", label: "My Requests", icon: Clock },
    { id: "greeting", label: "Call Greeting", icon: PhoneCall },
    { id: "security", label: "Security", icon: Shield },
  ];

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.MarketplaceListing.filter({ status: "active" }, "-created_date", 100);
      setListings(data);
    } catch {
      // silently fail — empty state shows
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleCreated = (newListing) => {
    setListings((prev) => [newListing, ...prev]);
  };

  const handleDelete = async (listing) => {
    try {
      await base44.entities.MarketplaceListing.update(listing.id, { status: "removed" });
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
    } catch {
      // ignore
    }
  };

  const handleCompleteTrade = (listing) => setCompletingListing(listing);

  const handleTradeCompleted = () => {
    setCompletingListing(null);
    setRepRefreshKey((k) => k + 1);
    loadListings();
  };

  const handleLogout = () => logout();

  const resetFilters = () => setFilters({ category: "all", priceRange: "all", location: "all" });

  const filtered = listings.filter((l) => {
    const matchesType = typeFilter === "all" || l.listing_type === typeFilter;
    const q = query.toLowerCase();
    const matchesQuery = !q ||
      (l.title || "").toLowerCase().includes(q) ||
      (l.description || "").toLowerCase().includes(q) ||
      (l.category || "").toLowerCase().includes(q) ||
      (l.location || "").toLowerCase().includes(q) ||
      (l.seller_name || "").toLowerCase().includes(q);
    const matchesCategory = filters.category === "all" || l.category === filters.category;
    const matchesLocation = filters.location === "all" || (l.location || "").trim() === filters.location;
    let matchesPrice = true;
    if (filters.priceRange !== "all") {
      const range = PRICE_PRESETS[filters.priceRange];
      matchesPrice = l.price != null && l.price >= range.min && l.price <= range.max;
    }
    return matchesType && matchesQuery && matchesCategory && matchesLocation && matchesPrice;
  });

  return (
    <div className="min-h-screen" style={{ background: "#05070A" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between" style={{ background: "rgba(5,7,10,0.9)", borderBottom: "0.5px solid rgba(209,255,38,0.15)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]" style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#D1FF26" }}>
            <Home size={12} /> Home
          </Link>
          <div className="hidden sm:block">
            <p className="font-heading font-black text-lg" style={{ color: "#F5F5F7" }}>
              1 CALL <span style={{ color: "#D1FF26" }}>MARKETPLACE</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden sm:block font-mono text-[9px] tracking-widest" style={{ color: "#8A8F98" }}>
              {user.email}
            </span>
          )}
          <Link
            to="/member-dashboard"
            className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]"
            style={{ border: "0.5px solid rgba(209,255,38,0.3)", color: "#D1FF26" }}
            title="View your subscription tier & usage"
          >
            <Gauge size={12} /> My Usage
          </Link>
          <ShareMyLinkButton />
          <VoiceprintBadge />
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-all hover:bg-[rgba(209,255,38,0.08)]" style={{ border: "0.5px solid rgba(209,255,38,0.2)", color: "#8A8F98" }}>
            <LogOut size={12} /> Logout
          </button>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-8 pb-24 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
          <p className="font-mono text-xs tracking-[0.4em] mb-3" style={{ color: "#D1FF26" }}>// MEMBER DASHBOARD</p>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-2" style={{ color: "#F5F5F7" }}>
            Trade & Sell <span style={{ color: "#D1FF26" }}>Freely.</span>
          </h1>
          <p className="text-sm lg:text-base max-w-2xl" style={{ color: "#8A8F98", lineHeight: 1.6 }}>
            List items for sale or trade. Upload a photo, describe what you're offering, and connect with other members.
          </p>
        </motion.div>

        {/* Favorites — pinned food & transport services for quick access */}
        <FavoritesBar />

        {/* Daily AI-generated voice tip banner */}
        <DailyVoiceTipBanner />

        {/* Call Credit display — remaining minutes, billing cycle & bonus credits */}
        <div className="mb-6 max-w-md">
          <CallCreditDisplay />
        </div>

        {/* Live service status board — real-time request counts */}
        <div className="mb-6">
          <ServiceStatusBoard />
        </div>

        {/* Live call volume & service usage trends — glowing data points */}
        <LiveTrafficGlow />

        {/* Emergency Alert + Broadcast buttons — always visible */}
        <div className="mb-6 space-y-3">
          <EmergencyAlertButton onManageContacts={() => setActiveTab("emergency")} />
          <BroadcastButton />
        </div>

        {/* Call forwarding — route incoming calls to a secondary number */}
        <div className="mb-6">
          <DashboardCallForwarding />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 font-mono text-[10px] tracking-widest uppercase transition-all whitespace-nowrap"
                style={{
                  background: active ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                  border: `0.5px solid ${active ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                  color: active ? "#D1FF26" : "#8A8F98",
                }}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "saved" && <SavedServicesTab />}
        {activeTab === "status" && <StatusDashboard />}
        {activeTab === "calendar" && <SmsCalendar user={user} />}
        {activeTab === "emergency" && (
          <>
            <EmergencyContactsMap />
            <div className="mt-6">
              <EmergencyContactsManager />
            </div>
          </>
        )}
        {activeTab === "calls" && <CallHistoryTab />}
        {activeTab === "activity-log" && <RecentActivityTab />}
        {activeTab === "video" && <VideoMeetingsTab />}
        {activeTab === "contacts" && <ContactsTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "subscription" && <SubscriptionManager />}
        {activeTab === "refer" && <ReferAFriend />}
        {activeTab === "loyalty" && <LoyaltyBalance />}
        {activeTab === "activity" && <LiveActivityFeed />}
        {activeTab === "map" && <ServiceActivityMap />}
        {activeTab === "coverage" && <LiveCoverageMap />}
        {activeTab === "alerts" && <SmsSubscriptionManager />}
        {activeTab === "tracker" && <ServiceStatusTracker />}
        {activeTab === "greeting" && <PersonalGreetingManager />}
        {activeTab === "security" && (
          <>
            <VoiceVerificationSecurity />
            <div className="mt-6">
              <SensitiveActionGuard />
            </div>
          </>
        )}

        {activeTab === "estimator" && <PriceRangeEstimator />}
        {activeTab === "training" && <VoiceTrainingSection />}
        {activeTab === "history" && <VoiceHistorySection />}
        {activeTab === "logs" && <VoiceCommandLogViewer />}
        {activeTab === "quick" && <QuickCommandsPanel />}
        {activeTab === "leaderboard" && <VoiceCommandLeaderboard />}
        {activeTab === "creators" && <CreatorLeaderboardHolographic />}
        {activeTab === "clarity" && <AudioClarityFeedback />}
        {activeTab === "radio" && <DashboardRadioStation />}
        {activeTab === "transcript" && <LiveTranscriptViewer />}
        {activeTab === "voice-inbox" && <VoiceMessageInbox />}
        {activeTab === "marketplace" && (
        <>
        {/* Voice command demand summary */}
        <div className="mb-6">
          <VoiceCommandSummaryCard />
        </div>
        {/* Voice service popularity chart */}
        <div className="mb-6">
          <VoiceServicePopularityChart />
        </div>
        {/* Voice command geo map */}
        <div className="mb-6">
          <VoiceCommandGeoMap />
        </div>
        {/* Live activity feed — global service usage */}
        <div className="mb-6">
          <LiveActivityFeed />
        </div>

        {/* Digital Services Browser with category filter */}
        <DigitalServiceBrowser />

        {/* Trending dial services — top rated & most accessed */}
        <TrendingDialServices />

        {/* Consolidated pricing — all tiers in one place */}
        <PremiumMembership />

        {/* Platform roadmap */}
        <div className="mb-6">
          <DashboardRoadmap />
        </div>

        {/* Recommendation engine + Trending now */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <ServiceRecommendations user={user} />
          <TrendingNow />
        </div>

        {/* Voice note recorder + notes dashboard */}
        <div className="mb-6 space-y-4">
          <VoiceNoteRecorder onRecorded={() => setNotesKey((k) => k + 1)} />
          <VoiceNotesDashboard key={notesKey} />
        </div>

        {/* Reputation + Trending */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <MemberProfile memberName={sellerName} refreshKey={repRefreshKey} />
          <div className="space-y-4">
            <SignalTipsCard />
            <TrendingCategories listings={listings} />
            <button
              onClick={() => setShowDispute(true)}
              className="w-full flex items-center justify-center gap-2 py-3 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
            >
              <ShieldAlert size={14} /> Report a Problem
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Form */}
          <div className="lg:col-span-1 lg:sticky lg:top-20 h-fit">
            <ListingForm onCreated={handleCreated} sellerName={sellerName} />
          </div>

          {/* Filter Sidebar */}
          <div className="lg:col-span-1 lg:sticky lg:top-20 h-fit">
            <FilterSidebar
              listings={listings}
              filters={filters}
              onFilterChange={setFilters}
              onReset={resetFilters}
            />
          </div>

          {/* Listings */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex items-center gap-2 px-3 py-2.5 flex-1" style={{ background: "rgba(16,20,29,0.6)", border: "0.5px solid rgba(138,143,152,0.15)" }}>
                <Search size={14} style={{ color: "#8A8F98" }} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search listings…" className="flex-1 bg-transparent text-sm outline-none" style={{ color: "#F5F5F7" }} />
              </div>
              <div className="flex gap-2">
                {[
                  { id: "all", label: "All" },
                  { id: "sale", label: "For Sale" },
                  { id: "trade", label: "For Trade" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTypeFilter(t.id)}
                    className="px-3 py-2.5 text-sm transition-all whitespace-nowrap"
                    style={{
                      background: typeFilter === t.id ? "rgba(209,255,38,0.12)" : "rgba(16,20,29,0.6)",
                      border: `0.5px solid ${typeFilter === t.id ? "rgba(209,255,38,0.5)" : "rgba(209,255,38,0.1)"}`,
                      color: typeFilter === t.id ? "#D1FF26" : "#F5F5F7",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            {!loading && filtered.length > 0 && (
              <p className="font-mono text-[9px] tracking-widest mb-4" style={{ color: "#8A8F98" }}>
                SHOWING {filtered.length} OF {listings.length} LISTINGS
              </p>
            )}

            {/* Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="animate-spin" style={{ color: "#D1FF26" }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center" style={{ border: "0.5px dashed rgba(209,255,38,0.2)" }}>
                <Package size={36} style={{ color: "rgba(209,255,38,0.3)" }} />
                <p className="font-mono text-[10px] tracking-widest mt-4" style={{ color: "#8A8F98" }}>NO LISTINGS YET</p>
                <p className="font-mono text-[9px] mt-1" style={{ color: "rgba(138,143,152,0.5)" }}>Post your first listing to get started</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {filtered.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} onDelete={handleDelete} onCompleteTrade={handleCompleteTrade} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>

      {completingListing && (
        <CompleteTradeDialog
          listing={completingListing}
          sellerName={sellerName}
          onComplete={handleTradeCompleted}
          onClose={() => setCompletingListing(null)}
        />
      )}

      {showDispute && (
        <DisputeForm
          reporterName={sellerName}
          onSubmitted={() => {
            setShowDispute(false);
            setRepRefreshKey((k) => k + 1);
          }}
          onClose={() => setShowDispute(false)}
        />
      )}

      <VoiceTipWidget />
      <PriorityAlertPopup />
      <FloatingShareWidget />
    </div>
  );
}