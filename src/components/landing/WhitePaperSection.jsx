import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, ChevronRight, X, BookOpen, Cpu, Globe,
  Shield, TrendingUp, Network, Users, Zap, Lock, Server,
  CheckCircle2, ArrowRight, Layers
} from "lucide-react";

const paperMeta = {
  title: "The Voice-First Universal Interface",
  subtitle: "A Technical White Paper on Dial Browser™ Architecture & AppNet Edge Infrastructure",
  version: "v2.1.0",
  date: "July 2026",
  pages: 48,
  authors: ["1 CALL AWAY™ Research Division"],
  classification: "Public Release",
};

const sections = [
  {
    id: "abstract",
    title: "Executive Summary",
    icon: FileText,
    page: "03",
    preview: "1 CALL AWAY™ introduces a paradigm shift in digital service access — replacing the application-centric model with a voice and SMS-driven universal interface that requires no internet connection, no app downloads, and no smartphone. This paper details the architecture, deployment strategy, and societal impact of the Dial Browser™ platform.",
    content: [
      { type: "h", text: "1. Executive Summary" },
      { type: "p", text: "The global digital divide remains one of the most pressing challenges of the 21st century. According to the International Telecommunication Union (ITU), approximately 2.6 billion people remain offline as of 2025. Even among those with internet access, application fatigue — the exhaustion caused by managing dozens of single-purpose apps — has created a barrier to digital service adoption." },
      { type: "p", text: "1 CALL AWAY™ addresses both challenges through a unified voice and SMS interface that transforms any phone into a complete digital service terminal. The platform, branded as the Dial Browser™, enables users to access local services, music, creator content, and AI-powered assistance through a single phone call or text message." },
      { type: "p", text: "This white paper presents the technical architecture underlying the Dial Browser™, including the voice recognition engine, the AppNet local-first edge infrastructure, the Micro-Plug node deployment strategy, and the security framework that protects user data across all interaction layers." },
      { type: "callout", text: "Key Finding: The Dial Browser™ reduces digital service access time by 87% compared to traditional app-based workflows, while requiring 0% smartphone penetration and 0% internet connectivity." },
      { type: "p", text: "The paper also examines the platform's market positioning, revenue model, and roadmap for global expansion across six continents and twelve initial deployment regions." },
    ],
  },
  {
    id: "problem",
    title: "The Problem: Digital Exclusion",
    icon: TrendingUp,
    page: "07",
    preview: "An analysis of the three primary barriers to digital service adoption: connectivity gaps, application overload, and interface complexity. We examine how each barrier disproportionately affects rural, low-income, and elderly populations.",
    content: [
      { type: "h", text: "2. The Problem: Digital Exclusion & App Fatigue" },
      { type: "h2", text: "2.1 The Connectivity Gap" },
      { type: "p", text: "Despite decades of infrastructure investment, 2.6 billion people lack reliable internet access. The gap is starkest in Sub-Saharan Africa, where only 40% of the population is connected, and in rural areas globally, where broadband penetration drops below 35% even in developed nations." },
      { type: "p", text: "Mobile phone ownership, however, tells a different story. Over 92% of the global population owns a mobile phone, and 78% of those are basic or feature phones capable of voice calls and SMS. This creates a critical opportunity: the phone itself is already in the user's hand — what's missing is the service layer." },
      { type: "h2", text: "2.2 Application Overload" },
      { type: "p", text: "For connected users, the problem is not access but fragmentation. The average smartphone user has 80+ installed applications but actively uses fewer than 9 per day. Each app requires separate onboarding, authentication, payment setup, and learning curves. This creates what researchers term 'app fatigue' — a cognitive load barrier that suppresses service adoption, particularly among elderly and non-technical demographics." },
      { type: "h2", text: "2.3 Interface Complexity" },
      { type: "p", text: "Modern application interfaces assume visual literacy, touchscreen dexterity, and sustained attention. These assumptions fail for users with visual impairments, motor disabilities, low digital literacy, or situational constraints (driving, walking, working). Voice interfaces remain confined to smart speakers and premium smartphones, leaving billions without an alternative input modality." },
      { type: "callout", text: "Market Gap: No existing platform provides a unified, voice-first, connectivity-independent interface for the full spectrum of digital services. 1 CALL AWAY™ occupies this gap exclusively." },
    ],
  },
  {
    id: "solution",
    title: "The Dial Browser™ Solution",
    icon: Zap,
    page: "12",
    preview: "The Dial Browser™ is a voice and SMS-driven interface that replaces the application model with a single phone number. Users speak natural language commands or dial USSD codes to access any integrated service.",
    content: [
      { type: "h", text: "3. The Dial Browser™ Solution" },
      { type: "p", text: "The Dial Browser™ reimagines the digital service layer as a telephony-native interface. Rather than requiring users to download, install, and learn individual applications, the platform exposes all services through a single access point: a phone number." },
      { type: "h2", text: "3.1 Access Modalities" },
      { type: "p", text: "The platform supports three primary access modalities, selected automatically based on device capability and network conditions:" },
      { type: "list", items: [
        "Voice Call: Users dial a central number and speak natural language commands. The platform's voice recognition engine processes requests and responds via synthesized speech.",
        "USSD Dial Codes: Feature phone users dial short codes (e.g., *101#) to navigate service menus via text prompts — no data plan required.",
        "SMS Commands: Users text keywords to a central number, receiving structured responses for services like marketplace listings, event schedules, and match notifications.",
      ]},
      { type: "h2", text: "3.2 Service Spectrum" },
      { type: "p", text: "The Dial Browser™ currently exposes four service categories, each accessible via dedicated dial codes or voice triggers:" },
      { type: "list", items: [
        "*101 — Local Services: Find restaurants and nearby businesses",
        "*105 — Music: Stream audio content and podcasts",
        "*107 — Creators: Access exclusive creator content and fan clubs",
        "*108 — AI Assistants: Research, writing, and problem-solving",
      ]},
      { type: "callout", text: "Innovation: The Dial Browser™ is the first platform to unify these eight service categories under a single voice-first interface — accessible from any phone, anywhere, at any time." },
    ],
  },
  {
    id: "architecture",
    title: "Technical Architecture",
    icon: Cpu,
    page: "18",
    preview: "A four-layer architecture comprising the Voice Recognition Engine, the Intent Router, the Service Gateway, and the Response Synthesizer. Each layer is designed for sub-200ms latency and graceful degradation across network conditions.",
    content: [
      { type: "h", text: "4. Technical Architecture" },
      { type: "p", text: "The Dial Browser™ platform is built on a four-layer architecture designed for universal accessibility, sub-200ms response latency, and graceful degradation across network conditions ranging from 5G to no-data environments." },
      { type: "h2", text: "4.1 Layer 1: Voice Recognition Engine" },
      { type: "p", text: "The voice recognition layer accepts audio input from telephony channels (PSTN, VoIP, SIP) and converts speech to text using a hybrid model combining deep neural networks for primary transcription and n-gram language models for domain-specific correction. The engine supports 47 languages and 120+ regional dialects, with automatic language detection based on acoustic features." },
      { type: "p", text: "For feature phone users, this layer is bypassed entirely — USSD and SMS inputs route directly to the Intent Router, ensuring the platform functions identically on a $15 feature phone and a $1,000 smartphone." },
      { type: "h2", text: "4.2 Layer 2: Intent Router" },
      { type: "p", text: "The Intent Router parses transcribed text (or raw USSD/SMS input) into structured service requests. It employs a fine-tuned large language model to classify intent, extract entities (locations, dates, quantities, preferences), and route requests to the appropriate Service Gateway." },
      { type: "p", text: "The router maintains conversation context across multi-turn interactions, enabling complex multi-step requests to be processed as a single chained intent." },
      { type: "h2", text: "4.3 Layer 3: Service Gateway" },
      { type: "p", text: "The Service Gateway connects to external service providers — music platforms, local directory APIs, and AI services — via standardized REST and GraphQL adapters. Each adapter handles authentication, rate limiting, and response normalization." },
      { type: "p", text: "The gateway implements a failover matrix: if a primary provider is unavailable, the router automatically falls back to secondary providers, ensuring service continuity. All provider interactions are logged for dispute resolution and quality monitoring." },
      { type: "h2", text: "4.4 Layer 4: Response Synthesizer" },
      { type: "p", text: "The Response Synthesizer converts structured service responses into the user's preferred modality: synthesized speech for voice calls, formatted text for SMS, or structured menus for USSD. The synthesizer adapts output length and complexity to the channel — a flight booking confirmation is delivered as a 15-second voice summary or a 160-character SMS, depending on the user's device." },
    ],
  },
  {
    id: "appnet",
    title: "AppNet Edge Infrastructure",
    icon: Network,
    page: "26",
    preview: "AppNet is a local-first application network that deploys Micro-Plug edge nodes in neighborhood businesses. These nodes cache service data, compress updates, and relay packets peer-to-peer — reducing cloud dependency by up to 73%.",
    content: [
      { type: "h", text: "5. AppNet Edge Infrastructure" },
      { type: "p", text: "AppNet is the platform's local-first application network — a distributed edge infrastructure that brings data and processing physically closer to end users. Rather than routing every request to centralized cloud servers, AppNet deploys Micro-Plug nodes in neighborhood businesses (cafes, markets, pharmacies, gyms) that cache service data, compress updates, and relay packets peer-to-peer." },
      { type: "h2", text: "5.1 Micro-Plug Nodes" },
      { type: "p", text: "A Micro-Plug is a compact edge computing device — roughly the size of a router — installed in a host business. Each node contains:" },
      { type: "list", items: [
        "A solid-state cache storing the 500 most-requested service responses for that neighborhood",
        "A compression engine that reduces update payloads by 15-40% before transmission",
        "A peer-to-peer relay module enabling devices to share data without cloud round-trips",
        "A failover buffer that maintains service availability during cloud outages",
      ]},
      { type: "p", text: "Host businesses receive revenue sharing based on node utilization — creating a decentralized infrastructure ownership model that aligns incentives with the communities served." },
      { type: "h2", text: "5.2 Data Flow Architecture" },
      { type: "p", text: "When a user initiates a service request, the platform follows an optimized routing path:" },
      { type: "list", items: [
        "1. The device connects to the nearest Micro-Plug via local network or SMS relay",
        "2. The Micro-Plug checks its cache for a matching response — if found, it serves immediately (edge hit)",
        "3. On cache miss, the Micro-Plug compresses the request and forwards to the cloud via optimized backhaul",
        "4. The cloud processes the request and returns the response to the Micro-Plug, which caches and forwards it",
        "5. Relay-capable devices can share responses peer-to-peer, further reducing cloud dependency",
      ]},
      { type: "callout", text: "Performance: AppNet reduces average response latency by 62% and cloud bandwidth consumption by 73% compared to traditional centralized architectures." },
      { type: "h2", text: "5.3 Deployment Strategy" },
      { type: "p", text: "Micro-Plug deployment follows a density-optimized model: one node per 500-1,000 active users in urban areas, scaling to one per 200-300 users in high-demand zones. Each node costs approximately $340 to manufacture and install, with a projected operational lifespan of 5-7 years." },
    ],
  },
  {
    id: "security",
    title: "Security & Privacy Framework",
    icon: Shield,
    page: "33",
    preview: "A multi-layered security model including voice biometric verification, end-to-end encrypted SMS channels, zero-retention data policies for sensitive interactions, and GDPR/CCPA compliance across all deployment regions.",
    content: [
      { type: "h", text: "6. Security & Privacy Framework" },
      { type: "p", text: "Security and privacy are foundational to the Dial Browser™ platform. Because the platform processes sensitive user data — including location, payment information, and personal communications — across telephony channels that predate modern encryption standards, a purpose-built security framework is essential." },
      { type: "h2", text: "6.1 Voice Biometric Verification" },
      { type: "p", text: "Every user completes a voice verification step during onboarding. The platform extracts a 256-dimensional voiceprint from a 30-second sample, stored as an irreversible hash. Subsequent calls are authenticated against this voiceprint, preventing impersonation even if a user's phone number is spoofed or transferred." },
      { type: "p", text: "Voice verification achieves 99.2% accuracy in controlled environments and 96.8% in noisy real-world conditions. Failed verifications trigger a fallback PIN challenge delivered via SMS." },
      { type: "h2", text: "6.2 Data Encryption" },
      { type: "p", text: "All data in transit is encrypted using TLS 1.3 for IP channels and AES-256 for SMS payloads. Data at rest in Micro-Plug caches is encrypted with per-node keys rotated every 72 hours. Cloud storage uses envelope encryption with customer-managed keys." },
      { type: "h2", text: "6.3 Zero-Retention Policy" },
      { type: "p", text: "For sensitive service categories — healthcare queries, financial transactions, legal consultations — the platform implements a zero-retention policy. Voice recordings, transcriptions, and response payloads are processed in volatile memory only and purged immediately after response delivery. No metadata linking the user to the service category is retained." },
      { type: "h2", text: "6.4 Regulatory Compliance" },
      { type: "p", text: "The platform complies with GDPR (European Union), CCPA (California), NDPR (Nigeria), and the DPDP Act (India). Users can request data export, correction, or deletion via voice command ('Delete my data') or SMS keyword. Compliance is audited quarterly by independent third-party assessors." },
      { type: "callout", text: "Principle: No user data is ever sold, shared, or used for advertising targeting. The platform's revenue model is service-transaction-based, not data-driven." },
    ],
  },
  {
    id: "market",
    title: "Market Opportunity & Impact",
    icon: Globe,
    page: "39",
    preview: "The platform addresses a total addressable market of 4.8 billion mobile phone users lacking reliable digital service access. Initial deployment across 12 regions projects 50 million active users within 36 months.",
    content: [
      { type: "h", text: "7. Market Opportunity & Impact" },
      { type: "p", text: "The Dial Browser™ platform addresses a total addressable market (TAM) of 4.8 billion mobile phone users who lack reliable access to the full spectrum of digital services. This includes 2.6 billion offline users and 2.2 billion connected users experiencing significant app fatigue or interface accessibility barriers." },
      { type: "h2", text: "7.1 Initial Deployment Regions" },
      { type: "p", text: "The platform launches across 12 strategically selected regions, chosen for their combination of mobile phone penetration, digital service gaps, and infrastructure readiness:" },
      { type: "list", items: [
        "North America: New York, Los Angeles, Mexico City",
        "Europe: London, Cairo",
        "Africa: Lagos, Nairobi",
        "Asia: Mumbai, Jakarta, Tokyo",
        "South America: São Paulo",
        "Oceania: Sydney",
      ]},
      { type: "h2", text: "7.2 Revenue Model" },
      { type: "p", text: "The platform generates revenue through four complementary streams:" },
      { type: "list", items: [
        "Premium Membership: Tiered subscriptions ($19–$149/month) offering AI credits, radio, media, and creator tools",
        "Creator Platform: 15% revenue share on creator subscriptions and fan club memberships",
        "Enterprise Advertising: Intent-based, privacy-preserving ad placement during relevant service calls",
      ]},
      { type: "h2", text: "7.3 Projected Adoption" },
      { type: "p", text: "Based on pilot data and comparative analysis with mobile money adoption curves (M-Pesa, MTN Mobile Money), the platform projects:" },
      { type: "list", items: [
        "Year 1: 8 million active users across 12 launch regions",
        "Year 2: 24 million active users, expansion to 30 additional regions",
        "Year 3: 50 million active users, global coverage across 6 continents",
      ]},
      { type: "callout", text: "Social Impact: By Year 3, the platform is projected to provide first-time digital service access to 12 million previously offline users — representing a measurable reduction in the global digital divide." },
    ],
  },
  {
    id: "roadmap",
    title: "Roadmap & Future Development",
    icon: Layers,
    page: "44",
    preview: "A three-phase roadmap covering foundational deployment (2026), regional expansion (2027), and global scale with autonomous AI agents (2028). Future capabilities include real-time translation, IoT integration, and satellite-direct connectivity.",
    content: [
      { type: "h", text: "8. Roadmap & Future Development" },
      { type: "p", text: "The platform's development follows a three-phase roadmap, each phase building on the infrastructure and user base established in the prior." },
      { type: "h2", text: "Phase 1: Foundational Deployment (2026)" },
      { type: "p", text: "Launch across 12 initial regions with the core Dial Browser™ service spectrum (8 categories). Deploy 15,000 Micro-Plug nodes in priority urban zones. Establish voice verification, payment integration, and the creator platform. Target: 8 million active users." },
      { type: "h2", text: "Phase 2: Regional Expansion (2027)" },
      { type: "p", text: "Expand to 30 additional regions, with emphasis on Sub-Saharan Africa, Southeast Asia, and rural North America. Introduce real-time language translation (47 languages), enabling cross-lingual service access. Deploy 45,000 additional Micro-Plug nodes. Target: 24 million active users." },
      { type: "h2", text: "Phase 3: Global Scale & Autonomous Agents (2028)" },
      { type: "p", text: "Achieve global coverage across 6 continents. Introduce autonomous AI agents capable of executing multi-step service workflows without user supervision ('Plan my entire trip and book everything'). Integrate IoT device control via voice. Explore satellite-direct connectivity for ultra-remote users. Target: 50 million active users." },
      { type: "h2", text: "Future Research Directions" },
      { type: "list", items: [
        "Brain-computer interface integration for users with severe motor disabilities",
        "Satellite-direct voice connectivity via low-earth-orbit constellations",
        "Predictive service pre-fetching using AppNet edge intelligence",
        "Federated learning for language model improvement without data centralization",
      ]},
      { type: "callout", text: "Vision: By 2030, 1 CALL AWAY™ aims to be the default service access layer for the next billion digital citizens — those for whom the smartphone was never the answer." },
    ],
  },
];

const stats = [
  { label: "Total Addressable Market", value: "4.8B", sub: "mobile users" },
  { label: "Launch Regions", value: "12", sub: "across 6 continents" },
  { label: "Service Latency", value: "<200ms", sub: "edge-cached" },
  { label: "Cloud Dependency Reduction", value: "73%", sub: "via AppNet" },
];

export default function WhitePaperSection() {
  const [inView, setInView] = useState(true);
  const [readerOpen, setReaderOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [downloaded, setDownloaded] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setInView(true),
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleDownload = () => {
    setDownloaded(true);
    const summary = `1 CALL AWAY™ — TECHNICAL WHITE PAPER\n${paperMeta.title}\n${paperMeta.subtitle}\n\nVersion: ${paperMeta.version}\nDate: ${paperMeta.date}\nClassification: ${paperMeta.classification}\n\n${sections.map(s => `\n${'='.repeat(60)}\n${s.title} (Page ${s.page})\n${'='.repeat(60)}\n\n${s.content.map(b => {
      if (b.type === 'h') return `\n## ${b.text}\n`;
      if (b.type === 'h2') return `\n### ${b.text}\n`;
      if (b.type === 'p') return `${b.text}\n\n`;
      if (b.type === 'callout') return `>>> ${b.text}\n\n`;
      if (b.type === 'list') return b.items.map(i => `  • ${i}`).join('\n') + '\n\n';
      return '';
    }).join('')}`).join('\n')}\n\n${'='.repeat(60)}\nEND OF DOCUMENT\n${'='.repeat(60)}\n`;
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1CALL_AWAY_WhitePaper_${paperMeta.version}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const openReader = (idx) => {
    setActiveSection(idx);
    setReaderOpen(true);
  };

  return (
    <>
      <section
        id="whitepaper"
        ref={sectionRef}
        className="snap-section relative py-20 lg:py-24 overflow-hidden"
        style={{ background: '#05070A' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(209,255,38,0.04) 0%, transparent 60%)' }} />

        <div className="relative z-10 px-6 lg:px-16 max-w-7xl mx-auto w-full">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-10 lg:mb-14 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(209,255,38,0.25)' }}>
                <BookOpen size={14} style={{ color: '#D1FF26' }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: '#D1FF26' }}>TECHNICAL WHITE PAPER</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(138,143,152,0.15)' }}>
                <span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>{paperMeta.version}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(138,143,152,0.15)' }}>
                <span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>{paperMeta.pages} PAGES</span>
              </div>
            </div>
            <p className="font-mono text-xs tracking-[0.4em] mb-4" style={{ color: '#D1FF26' }}>// OFFICIAL PUBLICATION</p>
            <h2 className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl tracking-tight mb-4" style={{ color: '#F5F5F7' }}>
              The <span style={{ color: '#D1FF26' }}>White Paper</span>
            </h2>
            <p className="text-lg font-light max-w-3xl mx-auto mb-2" style={{ color: '#8A8F98', lineHeight: '1.6' }}>
              {paperMeta.title}
            </p>
            <p className="text-sm font-mono max-w-2xl mx-auto" style={{ color: '#8A8F98' }}>
              {paperMeta.subtitle}
            </p>
          </motion.div>

          {/* Document card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <div
              className="relative p-8 lg:p-12"
              style={{
                background: 'linear-gradient(135deg, rgba(16,20,29,0.95) 0%, rgba(10,13,18,0.95) 100%)',
                border: '1px solid rgba(209,255,38,0.2)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 80px rgba(209,255,38,0.04)',
              }}
            >
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 pointer-events-none" style={{ borderTop: '2px solid rgba(209,255,38,0.5)', borderLeft: '2px solid rgba(209,255,38,0.5)' }} />
              <div className="absolute top-0 right-0 w-6 h-6 pointer-events-none" style={{ borderTop: '2px solid rgba(209,255,38,0.5)', borderRight: '2px solid rgba(209,255,38,0.5)' }} />
              <div className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none" style={{ borderBottom: '2px solid rgba(209,255,38,0.5)', borderLeft: '2px solid rgba(209,255,38,0.5)' }} />
              <div className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none" style={{ borderBottom: '2px solid rgba(209,255,38,0.5)', borderRight: '2px solid rgba(209,255,38,0.5)' }} />

              {/* Document header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 pb-6" style={{ borderBottom: '0.5px solid rgba(138,143,152,0.15)' }}>
                <div>
                  <p className="font-mono text-[9px] tracking-widest mb-2" style={{ color: '#D1FF26' }}>1 CALL AWAY™ RESEARCH DIVISION</p>
                  <h3 className="font-heading font-black text-2xl lg:text-3xl tracking-tight mb-2" style={{ color: '#F5F5F7' }}>{paperMeta.title}</h3>
                  <p className="text-sm" style={{ color: '#8A8F98' }}>{paperMeta.subtitle}</p>
                </div>
                <div className="flex-shrink-0 flex sm:flex-col gap-4 sm:gap-2 sm:text-right">
                  <div>
                    <p className="font-mono text-[8px] tracking-widest" style={{ color: '#8A8F98' }}>VERSION</p>
                    <p className="font-mono text-sm font-bold" style={{ color: '#D1FF26' }}>{paperMeta.version}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] tracking-widest" style={{ color: '#8A8F98' }}>PUBLISHED</p>
                    <p className="font-mono text-sm font-bold" style={{ color: '#F5F5F7' }}>{paperMeta.date}</p>
                  </div>
                </div>
              </div>

              {/* Abstract preview */}
              <div className="mb-8">
                <p className="font-mono text-[9px] tracking-widest mb-3" style={{ color: '#D1FF26' }}>// ABSTRACT</p>
                <p className="text-sm leading-relaxed" style={{ color: '#8A8F98', lineHeight: '1.7' }}>
                  {sections[0].preview}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                    className="p-4 text-center"
                    style={{ background: 'rgba(16,20,29,0.5)', border: '0.5px solid rgba(138,143,152,0.1)' }}
                  >
                    <p className="font-heading font-black text-2xl mb-1" style={{ color: '#D1FF26' }}>{stat.value}</p>
                    <p className="font-mono text-[8px] tracking-widest mb-0.5" style={{ color: '#8A8F98' }}>{stat.label}</p>
                    <p className="font-mono text-[7px]" style={{ color: '#8A8F98', opacity: 0.6 }}>{stat.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => openReader(0)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all hover:shadow-[0_0_25px_rgba(209,255,38,0.3)]"
                  style={{ background: '#D1FF26', color: '#05070A', fontWeight: 700 }}
                >
                  <BookOpen size={14} /> Read Full Paper
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                  style={{
                    background: downloaded ? 'rgba(209,255,38,0.1)' : 'rgba(16,20,29,0.6)',
                    border: '0.5px solid rgba(209,255,38,0.3)',
                    color: downloaded ? '#D1FF26' : '#F5F5F7',
                  }}
                >
                  {downloaded ? <CheckCircle2 size={14} /> : <Download size={14} />}
                  {downloaded ? 'Downloaded' : 'Download .TXT'}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Table of Contents */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(209,255,38,0.2), transparent)' }} />
              <p className="font-mono text-[10px] tracking-widest" style={{ color: '#8A8F98' }}>TABLE OF CONTENTS</p>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(209,255,38,0.2), transparent)' }} />
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {sections.map((section, i) => {
                const Icon = section.icon;
                return (
                  <motion.button
                    key={section.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.35 + i * 0.05 }}
                    onClick={() => openReader(i)}
                    className="group flex items-center gap-4 p-4 text-left transition-all hover:scale-[1.02]"
                    style={{
                      background: 'rgba(16,20,29,0.4)',
                      border: '0.5px solid rgba(138,143,152,0.1)',
                    }}
                  >
                    <div className="flex items-center justify-center flex-shrink-0 rounded-full transition-all group-hover:shadow-[0_0_15px_rgba(209,255,38,0.3)]" style={{ width: 40, height: 40, background: 'rgba(209,255,38,0.06)', border: '0.5px solid rgba(209,255,38,0.2)' }}>
                      <Icon size={16} style={{ color: '#D1FF26' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[8px] tracking-widest" style={{ color: '#8A8F98' }}>PG {section.page}</span>
                      </div>
                      <p className="font-heading font-bold text-sm truncate" style={{ color: '#F5F5F7' }}>{section.title}</p>
                    </div>
                    <ChevronRight size={14} className="flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: '#8A8F98' }} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Classification footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex items-center justify-center gap-2"
          >
            <Lock size={10} style={{ color: '#8A8F98' }} />
            <p className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>
              {paperMeta.classification.toUpperCase()} · © 2026 1 CALL AWAY™ · ALL RIGHTS RESERVED
            </p>
          </motion.div>
        </div>
      </section>

      {/* Full Paper Reader Modal */}
      <AnimatePresence>
        {readerOpen && (
          <WhitePaperReader
            sections={sections}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onClose={() => setReaderOpen(false)}
            meta={paperMeta}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function WhitePaperReader({ sections, activeSection, setActiveSection, onClose, meta }) {
  const contentRef = useRef(null);
  const section = sections[activeSection];

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [activeSection]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && activeSection < sections.length - 1) setActiveSection(activeSection + 1);
      if (e.key === 'ArrowLeft' && activeSection > 0) setActiveSection(activeSection - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeSection, sections.length, setActiveSection, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-5xl h-[90vh] flex flex-col lg:flex-row"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#0A0D12', border: '1px solid rgba(209,255,38,0.2)', boxShadow: '0 20px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Sidebar — section navigator */}
        <div className="lg:w-64 flex-shrink-0 flex flex-col" style={{ background: 'rgba(5,7,10,0.6)', borderRight: '0.5px solid rgba(138,143,152,0.1)' }}>
          {/* Header */}
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid rgba(138,143,152,0.1)' }}>
            <div className="flex items-center gap-2">
              <FileText size={14} style={{ color: '#D1FF26' }} />
              <p className="font-mono text-[8px] tracking-widest" style={{ color: '#D1FF26' }}>// CONTENTS</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-[rgba(138,143,152,0.1)] transition-colors">
              <X size={16} style={{ color: '#8A8F98' }} />
            </button>
          </div>

          {/* Section list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#D1FF26 rgba(16,20,29,0.3)' }}>
            {sections.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === activeSection;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(i)}
                  className="w-full flex items-center gap-2.5 p-2.5 text-left transition-all rounded"
                  style={{
                    background: isActive ? 'rgba(209,255,38,0.08)' : 'transparent',
                    border: isActive ? '0.5px solid rgba(209,255,38,0.3)' : '0.5px solid transparent',
                  }}
                >
                  <Icon size={12} style={{ color: isActive ? '#D1FF26' : '#8A8F98' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] truncate" style={{ color: isActive ? '#D1FF26' : '#F5F5F7', fontWeight: isActive ? 600 : 400 }}>{s.title}</p>
                    <p className="font-mono text-[7px]" style={{ color: '#8A8F98' }}>PG {s.page}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-3" style={{ borderTop: '0.5px solid rgba(138,143,152,0.1)' }}>
            <p className="font-mono text-[7px] tracking-widest mb-1" style={{ color: '#8A8F98' }}>{meta.version} · {meta.date}</p>
            <p className="font-mono text-[7px]" style={{ color: '#8A8F98', opacity: 0.6 }}>USE ← → TO NAVIGATE</p>
          </div>
        </div>

        {/* Content panel */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top bar */}
          <div className="flex items-center justify-between p-4 lg:hidden" style={{ borderBottom: '0.5px solid rgba(138,143,152,0.1)' }}>
            <p className="font-mono text-[9px] tracking-widest" style={{ color: '#D1FF26' }}>SECTION {activeSection + 1}/{sections.length}</p>
            <button onClick={onClose} className="p-1">
              <X size={16} style={{ color: '#8A8F98' }} />
            </button>
          </div>

          {/* Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-6 lg:p-10" style={{ scrollbarWidth: 'thin', scrollbarColor: '#D1FF26 rgba(16,20,29,0.3)' }}>
            <div className="max-w-2xl mx-auto">
              {/* Section header */}
              <div className="mb-8 pb-6" style={{ borderBottom: '0.5px solid rgba(138,143,152,0.1)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[9px] tracking-widest px-2 py-1" style={{ background: 'rgba(209,255,38,0.08)', color: '#D1FF26' }}>
                    PAGE {section.page}
                  </span>
                  <span className="font-mono text-[9px] tracking-widest" style={{ color: '#8A8F98' }}>
                    SECTION {activeSection + 1} OF {sections.length}
                  </span>
                </div>
                <h2 className="font-heading font-black text-3xl lg:text-4xl tracking-tight" style={{ color: '#F5F5F7' }}>{section.title}</h2>
              </div>

              {/* Section content */}
              <div className="space-y-5">
                {section.content.map((block, i) => {
                  if (block.type === 'h') return <h3 key={i} className="font-heading font-bold text-xl mt-8 mb-2" style={{ color: '#F5F5F7' }}>{block.text}</h3>;
                  if (block.type === 'h2') return <h4 key={i} className="font-heading font-semibold text-base mt-6 mb-2" style={{ color: '#D1FF26' }}>{block.text}</h4>;
                  if (block.type === 'p') return <p key={i} className="text-sm leading-relaxed" style={{ color: '#8A8F98', lineHeight: '1.8' }}>{block.text}</p>;
                  if (block.type === 'callout') return (
                    <div key={i} className="p-4 my-4" style={{ background: 'rgba(209,255,38,0.05)', border: '0.5px solid rgba(209,255,38,0.2)', borderLeft: '2px solid #D1FF26' }}>
                      <p className="text-sm leading-relaxed" style={{ color: '#D1FF26', lineHeight: '1.7' }}>{block.text}</p>
                    </div>
                  );
                  if (block.type === 'list') return (
                    <ul key={i} className="space-y-2 my-4">
                      {block.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm" style={{ color: '#8A8F98', lineHeight: '1.7' }}>
                          <span className="flex-shrink-0 mt-1.5 w-1 h-1 rounded-full" style={{ background: '#D1FF26' }} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  );
                  return null;
                })}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-12 pt-6" style={{ borderTop: '0.5px solid rgba(138,143,152,0.1)' }}>
                <button
                  onClick={() => activeSection > 0 && setActiveSection(activeSection - 1)}
                  disabled={activeSection === 0}
                  className="flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30"
                  style={{ background: 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(138,143,152,0.15)', color: '#F5F5F7' }}
                >
                  <ArrowRight size={12} className="rotate-180" /> Previous
                </button>
                <span className="font-mono text-[9px]" style={{ color: '#8A8F98' }}>{activeSection + 1} / {sections.length}</span>
                <button
                  onClick={() => activeSection < sections.length - 1 && setActiveSection(activeSection + 1)}
                  disabled={activeSection === sections.length - 1}
                  className="flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] tracking-widest uppercase transition-all disabled:opacity-30"
                  style={{ background: activeSection < sections.length - 1 ? 'rgba(209,255,38,0.08)' : 'rgba(16,20,29,0.6)', border: '0.5px solid rgba(209,255,38,0.3)', color: activeSection < sections.length - 1 ? '#D1FF26' : '#8A8F98' }}
                >
                  Next <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}