// Shared navigation sections — keeps MobileNav and KeyboardNav in sync.
// `key` maps a section to a numeric keyboard shortcut (1-9, 0).
// `anchor` scrolls to a section on the current page.
// `route` navigates to an app page (takes priority over anchor).
export const primarySections = [
  { key: "1", label: "Home", anchor: "#top", code: "01" },
  { key: "2", label: "Services", anchor: "#services-tabs", code: "02" },
  { key: "3", label: "Catalog", route: "/directory", code: "03" },
  { key: "4", label: "Compare", route: "/compare", code: "04" },
  { key: "5", label: "Creators", anchor: "#creators-tabs", code: "05" },
  { key: "6", label: "Music & Radio", anchor: "#music-radio", code: "06" },
  { key: "7", label: "How It Works", route: "/how-it-works", code: "07" },
  { key: "8", label: "Network & Tech", route: "/network-tech", code: "08" },
  { key: "0", label: "Pricing", route: "/pricing", code: "10" },
  { label: "Dial Social", route: "/social", code: "37" },
  { label: "Community Gallery", route: "/community-gallery", code: "42" },
  { label: "1 Call Dating", route: "/dating", code: "38" },
  { label: "Dating Dashboard", route: "/dating-dashboard", code: "47" },
  { label: "Voice Broadcasts", route: "/voice-broadcasts", code: "40" },
  { label: "Audiobooks", route: "/audiobooks", code: "41" },
  { label: "Games", route: "/games", code: "43" },
  { label: "Free TV", route: "/tv", code: "44" },
  { label: "Dial Medical", route: "/medical", code: "45" },
  { label: "Member Dashboard", route: "/member-dashboard", code: "46" },
  { label: "Community", route: "/community", code: "11" },
  { label: "Category Alerts", route: "/category-alerts", code: "13" },
  { label: "New Member Guide", route: "/new-member-guide", code: "14" },
  { label: "Partnership", route: "/partnership", code: "20" },
  { label: "Merchant Onboarding", route: "/merchant-onboarding", code: "48" },
  { label: "Voice GPS", route: "/voice-gps", code: "49" },
  { label: "Dial World Distribution", route: "/distribution", code: "50" },
  { label: "Dial Sports", anchor: "#sports", code: "58" },
  { label: "Dial Motors", route: "/motors", code: "59" },
  { label: "Dial Real-Estate", route: "/real-estate", code: "60" },
  { label: "Dial Foods", route: "/foods", code: "61" },
  { label: "Share My Location", route: "/share-location", code: "51" },
  { label: "Dial Phone", route: "/phone", code: "52" },
  { label: "SMS Inbox", route: "/messages", code: "53" },
  { label: "Call History", route: "/call-history", code: "54" },
  { label: "Address Book", route: "/address-book", code: "55" },
  { label: "Groups", route: "/groups", code: "56" },
  { label: "Advertise With Us", route: "/advertise", code: "57" },
  { label: "Emergency Broadcast", route: "/emergency-broadcast", code: "28" },
  { label: "FAQ", anchor: "#support-tabs", code: "21" },
  { label: "Marketplace", route: "/marketplace", code: "22" },
  { label: "Artist Analytics", route: "/artist-analytics", code: "26" },
  { label: "Job Dashboard", route: "/jobs", code: "23" },
  { label: "Creator Dashboard", route: "/creator-dashboard", code: "24" },
  { label: "Disputes", route: "/disputes", code: "29" },
  { label: "Dashboard", route: "/dashboard", code: "30" },
  { label: "Directory", route: "/directory", code: "31" },
  { label: "Reports", route: "/reports", code: "32" },
  { label: "Contact Us", route: "/contact", code: "33" },
  { label: "About Us", route: "/about", code: "35" },
  { label: "Voice FAQ", route: "/faq", code: "36" },
];

// Sections that have a keyboard shortcut
export const keyboardKeyMap = primarySections.filter((s) => s.key);

// Every scroll-snap section in order — used for sequential arrow-key navigation
export const allSectionAnchors = [
  "#top", "#problem", "#voice-guide",
  "#services-tabs", "#dial-medical", "#music-radio", "#sports", "#social-synapse", "#dating",
  "#creators-tabs", "#support-tabs",
];

// Grouped navigation for dropdown-style menus — organizes all routes and
// anchors into logical categories so users aren't overwhelmed by a flat list.
export const navGroups = [
  {
    label: "Explore",
    items: [
      { label: "Home", anchor: "#top" },
      { label: "Services", anchor: "#services-tabs" },
      { label: "Creators", anchor: "#creators-tabs" },
      { label: "Music & Radio", anchor: "#music-radio" },
      { label: "Catalog", route: "/directory" },
      { label: "Community", route: "/community" },
      { label: "Network & Tech", route: "/network-tech" },
      { label: "About Us", route: "/about" },
    ],
  },
  {
    label: "Social & Dating",
    items: [
      { label: "Dial Social", route: "/social" },
      { label: "Community Gallery", route: "/community-gallery" },
      { label: "1 Call Dating", route: "/dating" },
      { label: "Dating Dashboard", route: "/dating-dashboard" },
    ],
  },
  {
    label: "Music & Radio",
    items: [
      { label: "Music & Radio Hub", anchor: "#music-radio" },
      { label: "Dial Sports", anchor: "#sports" },
      { label: "Voice Broadcasts", route: "/voice-broadcasts" },
      { label: "Audiobooks", route: "/audiobooks" },
      { label: "Games", route: "/games" },
      { label: "Free TV", route: "/tv" },
      { label: "Artist Analytics", route: "/artist-analytics" },
      { label: "Dial World Distribution", route: "/distribution" },
    ],
  },
  {
    label: "How It Works",
    items: [
      { label: "How It Works", route: "/how-it-works" },
      { label: "Voice GPS", route: "/voice-gps" },
      { label: "Share My Location", route: "/share-location" },
      { label: "New Member Guide", route: "/new-member-guide" },
      { label: "Category Alerts", route: "/category-alerts" },
    ],
  },
  {
    label: "Dashboard",
    items: [
      { label: "Member Dashboard", route: "/member-dashboard" },
      { label: "Dashboard", route: "/dashboard" },
      { label: "My Profile", route: "/my-profile" },
      { label: "Creator Onboarding", route: "/creator-onboarding" },
      { label: "Merchant Onboarding", route: "/merchant-onboarding" },
      { label: "Creator Admin", route: "/creator-admin" },
      { label: "Reports", route: "/reports" },
      { label: "Creator Dashboard", route: "/creator-dashboard" },
      { label: "Job Dashboard", route: "/jobs" },
      { label: "Disputes", route: "/disputes" },
    ],
  },
  {
    label: "Service Marketplace",
    items: [
      { label: "Marketplace", route: "/marketplace" },
      { label: "Directory", route: "/directory" },
      { label: "Compare Services", route: "/compare" },
      { label: "Dial Medical", route: "/medical" },
      { label: "Dial Motors", route: "/motors" },
      { label: "Dial Real-Estate", route: "/real-estate" },
      { label: "Dial Foods", route: "/foods" },
    ],
  },
  {
    label: "Help & Guides",
    items: [
      { label: "FAQ", anchor: "#support-tabs" },
      { label: "Voice FAQ", route: "/faq" },
      { label: "Voice Instruction Guide", route: "/voice-guide" },
      { label: "Contact Us", route: "/contact" },
    ],
  },
  {
    label: "Business & Ads",
    items: [
      { label: "Advertise With Us", route: "/advertise" },
      { label: "Partnership", route: "/partnership" },
      { label: "Merchant Onboarding", route: "/merchant-onboarding" },
      { label: "Dial World Distribution", route: "/distribution" },
    ],
  },
  {
    label: "Premium",
    items: [
      { label: "Pricing", route: "/pricing" },
    ],
  },
];

// Returns the anchor of the section currently nearest the top of the viewport
export const getActiveAnchor = (offsetRatio = 0.3) => {
  const mid = window.scrollY + window.innerHeight * offsetRatio;
  let current = primarySections[0].anchor;
  for (const s of primarySections) {
    if (s.route) continue;
    const el = document.querySelector(s.anchor);
    if (el && el.getBoundingClientRect().top + window.scrollY <= mid) {
      current = s.anchor;
    }
  }
  return current;
};

// Robustly scroll to an in-page anchor, waiting for lazy-loaded sections to
// mount before scrolling. Used by the sidebar and mobile tab bar so menu tabs
// always land on the right section even when the target is inside a
// code-split component that hasn't finished loading yet.
export const scrollToAnchor = (anchor, { navigate, pathname }) => {
  const doScroll = () => {
    let tries = 0;
    const tick = () => {
      const el = document.querySelector(anchor);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 12;
        const html = document.documentElement;
        const prev = html.style.scrollBehavior;
        html.style.scrollBehavior = "auto"; // snappy jump, ignore CSS smooth
        window.scrollTo(0, y);
        html.style.scrollBehavior = prev;
        return;
      }
      if (tries++ < 40) setTimeout(tick, 50); // wait up to ~2s for the lazy chunk
    };
    tick();
  };
  if (pathname !== "/") {
    navigate("/");
    setTimeout(doScroll, 350);
  } else {
    doScroll();
  }
};