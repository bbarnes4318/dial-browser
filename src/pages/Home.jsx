import React, { Suspense, lazy } from "react";
import HeroSection from "@/components/landing/HeroSection";

import RegistrationModal from "@/components/landing/RegistrationModal";
import AppSidebar from "@/components/landing/AppSidebar";
import MobileTabBar from "@/components/landing/MobileTabBar";
import FloatingControls from "@/components/landing/FloatingControls";
import LazySection from "@/components/landing/LazySection";
import SectionFallback from "@/components/landing/categories/SectionFallback";
import ChapterDivider from "@/components/landing/ChapterDivider";
import MarketplaceDirectoryPortal from "@/components/landing/MarketplaceDirectoryPortal";
import ServiceSearchBar from "@/components/landing/ServiceSearchBar";
import ServiceQuiz from "@/components/landing/ServiceQuiz";
import DialInFAQ from "@/components/landing/DialInFAQ";
import DatingHeroBanner from "@/components/landing/DatingHeroBanner";
import SocialEntryButton from "@/components/landing/SocialEntryButton";
import SocialSynapseGateway from "@/components/landing/SocialSynapseGateway";
import PopularSocialFeed from "@/components/landing/PopularSocialFeed";
import HomeSearchHeader from "@/components/landing/HomeSearchHeader";
import { HOMEPAGE_BOTTOM_BANNER_URL } from "@/lib/brandLogo";

// Lazy-loaded sections
const ProblemSolution = lazy(() => import("@/components/landing/ProblemSolution"));
const VoiceCommandGuide = lazy(() => import("@/components/landing/VoiceCommandGuide"));
const ServiceAudioDemos = lazy(() => import("@/components/landing/ServiceAudioDemos"));

// Consolidated category chunks
const ServicesCategory = lazy(() => import("@/components/landing/categories/ServicesCategory"));
const CreatorsCategory = lazy(() => import("@/components/landing/categories/CreatorsCategory"));
const SupportCategory = lazy(() => import("@/components/landing/categories/SupportCategory"));

const PremiumMembership = lazy(() => import("@/components/landing/PremiumMembership"));

const VoiceprintDemo = lazy(() => import("@/components/landing/VoiceprintDemo"));
const HomeDialer = lazy(() => import("@/components/landing/HomeDialer"));
const DatingSection = lazy(() => import("@/components/landing/DatingSection"));
const DialFMTablet = lazy(() => import("@/components/landing/DialFMTablet"));
const GamesShowcase = lazy(() => import("@/components/landing/GamesShowcase"));
const DialSports = lazy(() => import("@/components/landing/DialSports"));
// Motors / Real-Estate / Foods marketplaces live on dedicated directory pages
// (/motors, /real-estate, /foods); the homepage shows a search portal to each.
const DialMedicalSection = lazy(() => import("@/components/landing/DialMedicalSection"));
const MediaSection = lazy(() => import("@/components/landing/MediaSection"));
const ConsortiumNexusBanner = lazy(() => import("@/components/landing/ConsortiumNexusBanner"));
const CreatorAccessBanner = lazy(() => import("@/components/landing/CreatorAccessBanner"));
const TropicalConnectionBanner = lazy(() => import("@/components/landing/TropicalConnectionBanner"));
const HelpDeskBanner = lazy(() => import("@/components/landing/HelpDeskBanner"));
const DialWorldDistribution = lazy(() => import("@/components/landing/DialWorldDistribution"));

const HERO_IMG = "https://images.unsplash.com/photo-1531973576160-7125cd663d86?q=80&w=6000&auto=format&fit=crop";
const CREATOR_IMG = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=6000&auto=format&fit=crop";

export default function Home() {
  return (
    <div className="relative pb-20 lg:pb-14" style={{ background: '#05070A' }}>
      <AppSidebar />
      <MobileTabBar />
      <FloatingControls />
      <RegistrationModal />
      <SocialEntryButton />

      <div id="top" className="snap-container lg:pl-[var(--sidebar-w)] transition-[padding] duration-300">
        {/* Sticky header search — find & dial any digital service */}
        <HomeSearchHeader />

        {/* ═══════════════════════════════════════════════════════════════
            INTRO — Meet Dial Browser
            Hero → brand connection → the problem solved → 30-second commercial
           ═══════════════════════════════════════════════════════════════ */}
        <HeroSection heroImage={HERO_IMG} />

        <div id="internet-call-away-flyer" className="flex justify-center px-4 py-3" style={{ background: "#05070A" }}>
          <img
            src="https://media.base44.com/images/public/6a422320311efd575ae6536c/d7cb547bb_ChatGPTImageSep20202601_27_51AM.png"
            alt="Dial Browser — The Internet is Just a Call Away. No apps, no Wi-Fi, no limits."
            style={{ width: "100%", maxWidth: "720px", height: "auto", display: "block", borderRadius: "2px" }}
          />
        </div>

        <ServiceSearchBar />

        <LazySection>
          <div id="tropical-connection">
            <TropicalConnectionBanner />
          </div>
        </LazySection>

        <LazySection>
          <div id="problem">
            <ProblemSolution />
          </div>
        </LazySection>

        <LazySection>
          <div id="commercial" className="flex justify-center px-4 py-4" style={{ background: "#05070A" }}>
            <video
              src="https://media.base44.com/videos/public/6a422320311efd575ae6536c/ea9be15a6_20260918_054448_0_UTC_0.mp4"
              autoPlay
              loop
              muted
              playsInline
              controls
              style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block", borderRadius: "2px" }}
            />
          </div>
        </LazySection>

        <LazySection>
          <div id="pay-phone-banner" className="flex justify-center px-4 py-4" style={{ background: "#05070A" }}>
            <img
              src="https://media.base44.com/images/public/6a422320311efd575ae6536c/84ddd47d7_Gemini_Generated_Image_m823izm823izm823.jpg"
              alt="Dial Browser Pay Phone — global network access terminal"
              style={{ width: "100%", maxWidth: "520px", height: "auto", display: "block", borderRadius: "2px" }}
            />
          </div>
        </LazySection>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 01 — HOW IT WORKS
            Search → quiz → voice commands → visual dial guide → FAQ → demos
            ═══════════════════════════════════════════════════════════════ */}
        <LazySection>
          <div id="dial-now-banner" className="flex justify-center px-4 py-4" style={{ background: "#05070A" }}>
            <img
              src="https://media.base44.com/images/public/6a422320311efd575ae6536c/c5a958104_ChatGPTImageSep18202610_18_02PM.png"
              alt="Dial Browser — Dial Now, Browse Now"
              style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block", borderRadius: "2px" }}
            />
          </div>
        </LazySection>

        <ChapterDivider number="01" title="How It Works" subtitle="Find, dial, and connect — see exactly how Dial Browser turns any phone into a service command center, no WiFi required." />

        <LazySection>
          <div id="service-quiz">
            <ServiceQuiz />
          </div>
        </LazySection>

        <LazySection>
          <div id="voice-guide">
            <VoiceCommandGuide />
          </div>
        </LazySection>

        <LazySection>
          <div id="dial-in-faq">
            <DialInFAQ />
          </div>
        </LazySection>

        <LazySection>
          <div id="sound-demos">
            <ServiceAudioDemos />
          </div>
        </LazySection>

        {/* Dial World — Global Connectivity Initiatives graphic */}
        <LazySection>
          <div id="dial-world-graphic" className="flex justify-center px-4 py-4" style={{ background: "#05070A" }}>
            <img
              src="https://media.base44.com/images/public/6a422320311efd575ae6536c/9d707ca74_Gemini_Generated_Image_bk5it0bk5it0bk5i.jpg"
              alt="Dial World — Global Connectivity Initiatives"
              style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block", borderRadius: "2px" }}
            />
          </div>
        </LazySection>

        {/* Live Dial Phone — functional softphone right on the homepage */}
        <LazySection>
          <div id="home-dial-phone" className="px-4 py-6" style={{ background: "#05070A" }}>
            <div className="text-center mb-6">
              <p className="font-mono text-[9px] sm:text-[10px] tracking-[0.5em] mb-2" style={{ color: "#D1FF26" }}>// TRY IT NOW</p>
              <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight" style={{ color: "#F5F5F7" }}>Place a <span style={{ color: "#D1FF26" }}>real call</span> right here.</h2>
              <p className="text-xs sm:text-sm mt-2 max-w-xl mx-auto" style={{ color: "#8A8F98" }}>No WiFi needed — the Dial Phone works straight from your browser. Sign in, go online, and dial.</p>
            </div>
            <HomeDialer />
          </div>
        </LazySection>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 02 — CORE SERVICES & TELEHEALTH
            The service marketplace, then Dial Medical AI telehealth
           ═══════════════════════════════════════════════════════════════ */}
        <ChapterDivider number="02" title="Core Services & Telehealth" subtitle="From AI telehealth to dining, weather, and your private voice vault — every essential service, one call away." />

        <Suspense fallback={<SectionFallback />}>
          <ServicesCategory />
        </Suspense>

        <LazySection>
          <div id="dial-medical">
            <DialMedicalSection />
          </div>
        </LazySection>

        {/* Telehealth support banner — moved above the Entertainment & Media section */}
        <LazySection>
          <div id="telehealth-banner" className="flex justify-center px-4 pt-4 pb-2" style={{ background: "#05070A" }}>
            <img
              src="https://media.base44.com/images/public/6a422320311efd575ae6536c/dd5dea9c2_Gemini_Generated_Image_wiesxzwiesxzwies.jpg"
              alt="Dial Medical — holographic 24/7 telehealth support over a phone call"
              style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block", borderRadius: "2px" }}
            />
          </div>
        </LazySection>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 03 — ENTERTAINMENT & MEDIA
            Free TV & audiobooks → radio & music studio → SMS-delivered games
           ═══════════════════════════════════════════════════════════════ */}
        <ChapterDivider number="03" title="Entertainment & Media" subtitle="Free TV, audiobooks, radio, a music production studio, and SMS-delivered games — entertainment for everyone, no app store needed." />

        <LazySection>
          <div id="media">
            <MediaSection />
          </div>
        </LazySection>

        <div id="music-radio">
          <LazySection>
            <DialFMTablet />
          </LazySection>
        </div>

        <LazySection>
          <div id="games-showcase">
            <GamesShowcase />
          </div>
        </LazySection>

        <LazySection>
          <div id="dial-sports-banner" className="flex justify-center px-4 py-4" style={{ background: "#05070A" }}>
            <img
              src="https://media.base44.com/images/public/6a422320311efd575ae6536c/9e5e75569_Gemini_Generated_Image_qjanjgqjanjgqjan.jpg"
              alt="Dial Sports — your connection to the game"
              style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block", borderRadius: "2px" }}
            />
          </div>
        </LazySection>
        <div id="sports">
          <LazySection>
            <DialSports />
          </LazySection>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            DIAL MOTORS — VEHICLES & MOTORS MARKETPLACE
            New & used cars, SUVs, boats & motorcycles for sale
           ═══════════════════════════════════════════════════════════════ */}
        <ChapterDivider number="04" title="Dial Motors Marketplace" subtitle="New & used cars, SUVs, boats and motorcycles — gas, hybrid and electric. Browse real listings, filter by location, and request to buy in one tap." />

        <div id="dial-motors-banner" className="flex justify-center px-4 py-4" style={{ background: "#05070A" }}>
          <img
            src="https://media.base44.com/images/public/6a422320311efd575ae6536c/79a8eb179_Gemini_Generated_Image_tp1ejmtp1ejmtp1e.jpg"
            alt="Dial Motors — New & used cars, gas, hybrid & electric. Drive your dreams."
            style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block", borderRadius: "2px" }}
          />
        </div>

        <MarketplaceDirectoryPortal
          id="dial-motors"
          glyph="🚗"
          eyebrow="// DIAL MOTORS™ DIRECTORY"
          searchPlaceholder="Search make, model, year, dealer…"
          route="/motors"
          ctaLabel="Browse Motors Directory"
        />

        {/* ═══════════════════════════════════════════════════════════════
            DIAL REAL-ESTATE — PROPERTY MARKETPLACE
            Single-family, condos, townhouses, land, commercial & waterfront
           ═══════════════════════════════════════════════════════════════ */}
        <ChapterDivider number="04" title="Dial Real-Estate Marketplace" subtitle="Find your dream home — single-family, condos, townhouses, land, commercial and waterfront. Browse real listings, filter by bedrooms and location, and request a tour or purchase in one tap." />

        <div id="dial-real-estate-banner" className="flex justify-center px-4 py-4" style={{ background: "#05070A" }}>
          <img
            src="https://media.base44.com/images/public/6a422320311efd575ae6536c/919e5de12_Gemini_Generated_Image_43fdb443fdb443fd.jpg"
            alt="Dial Real-Estate — Find your dream home. Single-family, condos, commercial & waterfront."
            style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block", borderRadius: "2px" }}
          />
        </div>

        <MarketplaceDirectoryPortal
          id="dial-real-estate"
          glyph="🏠"
          eyebrow="// DIAL REAL-ESTATE™ DIRECTORY"
          searchPlaceholder="Search title, type, agent, address…"
          route="/real-estate"
          ctaLabel="Browse Real-Estate Directory"
        />

        {/* ═══════════════════════════════════════════════════════════════
            DIAL FOODS — FOOD MARKETPLACE
            Restaurants, groceries, meal kits, catering, bakery & farm fresh
           ═══════════════════════════════════════════════════════════════ */}
        <ChapterDivider number="04" title="Dial Foods Marketplace" subtitle="Order. Eat. Repeat. — restaurants, groceries, meal kits, catering, bakeries and farm-fresh produce. Browse real vendors, filter by dietary needs and location, and order or reserve in one tap." />

        <div id="dial-foods-banner" className="flex justify-center px-4 py-4" style={{ background: "#05070A" }}>
          <img
            src="https://media.base44.com/images/public/6a422320311efd575ae6536c/aba065c10_image_fbb2e800.jpg"
            alt="Dial Foods — Catering solutions & home/office delivery. Fresh, fast, delivered."
            style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block", borderRadius: "2px" }}
          />
        </div>

        <MarketplaceDirectoryPortal
          id="dial-foods"
          glyph="🍽️"
          eyebrow="// DIAL FOODS™ DIRECTORY"
          searchPlaceholder="Search dish, cuisine, vendor…"
          route="/foods"
          ctaLabel="Browse Foods Directory"
        />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 04 — SOCIAL & DATING
            Voice-powered social posts (pulsing neon waveforms) + 1 Call Dating
           ═══════════════════════════════════════════════════════════════ */}
        <ChapterDivider number="04" title="Social & Dating" subtitle="Record a voice note straight into a post and watch it become a pulsing neon waveform on the feed. Then hear real voices and find real connections on 1 Call Dating." />

        <LazySection>
          <div id="social-dashboard-preview" className="flex justify-center px-4 py-4" style={{ background: "#05070A" }}>
            <img
              src="https://media.base44.com/images/public/6a422320311efd575ae6536c/f96930ec7_ChatGPTImageSep15202609_31_40PM.png"
              alt="Dial Browser Social — voice-powered dashboard with feed, navigation, and voice commands"
              style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block", borderRadius: "2px" }}
            />
          </div>
        </LazySection>

        <LazySection>
          <div id="social-synapse">
            <SocialSynapseGateway />
          </div>
        </LazySection>

        <LazySection>
          <div id="popular-social-feed">
            <PopularSocialFeed />
          </div>
        </LazySection>

        <DatingHeroBanner />
        <Suspense fallback={<SectionFallback />}>
          <div id="dating">
            <DatingSection />
          </div>
        </Suspense>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 05 — CREATORS & BROADCASTING
            Onboard, broadcast, monetize, and grow an audience
           ═══════════════════════════════════════════════════════════════ */}
        <ChapterDivider number="05" title="Creators & Broadcasting" subtitle="Artists, hosts, and producers — onboard, broadcast, monetize, and grow your audience on the creator economy." />

        <LazySection>
          <CreatorAccessBanner />
        </LazySection>

        <Suspense fallback={<SectionFallback />}>
          <CreatorsCategory creatorImage={CREATOR_IMG} />
        </Suspense>

        <LazySection>
          <div id="dial-world-distribution">
            <DialWorldDistribution />
          </div>
        </LazySection>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 06 — SECURITY & IDENTITY
            Voiceprint biometrics + private access HUD
           ═══════════════════════════════════════════════════════════════ */}
        <ChapterDivider number="06" title="Security & Identity" subtitle="Voiceprint biometric login and a secure private access HUD — your identity, protected by your voice." />

        <LazySection>
          <div id="consortium-nexus-top">
            <ConsortiumNexusBanner />
          </div>
        </LazySection>

        <LazySection>
          <div id="voiceprint-demo">
            <VoiceprintDemo />
          </div>
        </LazySection>

        <LazySection>
          <div id="personal-access" className="flex justify-center px-4 py-4" style={{ background: "#05070A" }}>
            <img
              src="https://media.base44.com/images/public/6a422320311efd575ae6536c/1c804f69e_Gemini_Generated_Image_npnegenpnegenpne.jpg"
              alt="Dial Browser — Personal Access HUD with fingerprint biometric hub"
              style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block", borderRadius: "2px" }}
            />
          </div>
        </LazySection>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 07 — MEMBERSHIP & PRICING
            Tier explainer → full comparison + checkout
           ═══════════════════════════════════════════════════════════════ */}
        <ChapterDivider number="07" title="Membership & Pricing" subtitle="Clear tiers, monthly AI credits, and a 7-day free trial — pick the plan that fits and start earning your time back." />

        <Suspense fallback={<SectionFallback />}>
          <div id="pricing">
            <PremiumMembership />
          </div>
        </Suspense>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 08 — HELP & SUPPORT
            Security guidance, FAQs, disputes, contact
           ═══════════════════════════════════════════════════════════════ */}
        <LazySection>
          <div id="help-support-banner" className="flex justify-center px-4 pt-4 pb-2" style={{ background: "#05070A" }}>
            <img
              src="https://media.base44.com/images/public/6a422320311efd575ae6536c/127a83daf_Gemini_Generated_Image_1jxmf81jxmf81jxm.jpg"
              alt="Dial Browser — Digital Footprint Network"
              style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block", borderRadius: "2px" }}
            />
          </div>
        </LazySection>

        <ChapterDivider number="08" title="Help & Support" subtitle="Security guidance, FAQs, dispute resolution, and direct contact — we've got your back." />

        <LazySection>
          <div id="help-desk">
            <HelpDeskBanner />
          </div>
        </LazySection>

        <Suspense fallback={<SectionFallback />}>
          <SupportCategory />
        </Suspense>

        {/* ── CLOSING BANNER ── */}
        <div id="closing-banner" className="flex justify-center px-4 pt-4 pb-2" style={{ background: "#05070A" }}>
          <img
            src={HOMEPAGE_BOTTOM_BANNER_URL}
            alt="Dial Browser — Call. Connect. Browse. No WiFi Required."
            style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}