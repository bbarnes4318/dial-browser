// Shared service data — used by DialDirectory and DialServiceDetail.
// Access is by calling the 1 Call Away voice number and speaking naturally;
// there are no USSD dial codes (carriers intercept those, not the app).
export const dialServices = [
  { id: "03", name: "Restaurant Finder", category: "Food", region: "Local", icon: "🍽️", desc: "Discover nearby restaurants and read reviews.", tags: ["food", "restaurant", "dining", "local"], example: "Call the 1 Call Away number and say 'Find a restaurant near me'" },
  { id: "08", name: "Creator Access", category: "Entertainment", region: "Global", icon: "🎤", desc: "Connect with creators, join fan clubs, and access exclusive content.", tags: ["creator", "fan", "content", "influencer"], example: "Call the 1 Call Away number and say 'Connect me to creators'" },
  { id: "09", name: "AI Assistant", category: "Productivity", region: "Global", icon: "🤖", desc: "Ask questions, get research, draft writing, and solve problems with AI.", tags: ["ai", "assistant", "research", "help"], example: "Call the 1 Call Away number and say 'Talk to AI'" },
  { id: "10", name: "Weather Forecast", category: "Local", region: "Local", icon: "🌤️", desc: "Get real-time weather and forecasts for any location.", tags: ["weather", "forecast", "climate", "local"], example: "Call the 1 Call Away number and say 'What's the weather in Chicago'" },
  { id: "11", name: "Pharmacy Locator", category: "Health", region: "Local", icon: "💊", desc: "Find nearby pharmacies and get their location and hours.", tags: ["pharmacy", "health", "medicine", "local"], example: "Call the 1 Call Away number and say 'Find a pharmacy nearby'" },
  { id: "12", name: "Job Search", category: "Productivity", region: "National", icon: "💼", desc: "Search job listings and get career guidance.", tags: ["job", "career", "employment", "work"], example: "Call the 1 Call Away number and say 'Search for jobs'" },
  { id: "15", name: "Local Directory", category: "Local", region: "Local", icon: "📍", desc: "Find any local business or service — plumbers, electricians, salons, and more.", tags: ["local", "business", "directory", "services"], example: "Call the 1 Call Away number and say 'Find a plumber'" },
  { id: "16", name: "Emergency Contacts Broadcast", category: "Health", region: "Local", icon: "🚑", desc: "Instantly alert your saved emergency contacts with your location. For a real emergency, call your local emergency number (911) directly.", tags: ["emergency", "contacts", "safety", "alert"], example: "Call the 1 Call Away number and say 'Alert my emergency contacts'" },
  { id: "21", name: "Find Nearby Doctors", category: "Health", region: "Local", icon: "🩺", desc: "Find nearby doctors and clinics by voice and get their contact info to book directly.", tags: ["doctor", "clinic", "health", "medical", "local"], example: "Call the 1 Call Away number and say 'Find a doctor near me'" },
  { id: "23", name: "Marketplace Listings", category: "Shopping", region: "National", icon: "🏷️", desc: "Browse and post classified listings for buying, selling, and trading.", tags: ["marketplace", "buy", "sell", "trade", "shopping"], example: "Call the 1 Call Away number and say 'Browse marketplace'" },
];

// Deterministic pseudo-random stats generator — stable per service ID.
// Displayed only as clearly-labeled illustrative samples (not live metrics).
function seededStats(id) {
  const seed = parseInt(id, 10) * 9301 + 49297;
  const rand = (offset = 0) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };
  const totalCalls = Math.floor(8000 + rand(1) * 45000);
  const uniqueUsers = Math.floor(totalCalls * (0.4 + rand(2) * 0.3));
  const avgDuration = Math.floor(45 + rand(3) * 180);
  const successRate = Math.floor(92 + rand(4) * 7);
  const peakHour = Math.floor(8 + rand(5) * 12);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dailyData = days.map((day, i) => ({
    day,
    calls: Math.floor(totalCalls / 7 * (0.7 + rand(6 + i) * 0.6)),
  }));
  const trend = rand(7) > 0.5 ? "up" : "down";
  const trendPercent = Math.floor(5 + rand(8) * 25);
  return { totalCalls, uniqueUsers, avgDuration, successRate, peakHour, dailyData, trend, trendPercent };
}

export function getServiceStats(id) {
  return seededStats(id);
}

// Deterministic service status — stable per ID, no external state
export function getServiceStatus(id) {
  const seed = parseInt(id, 10) * 9301 + 49297;
  const x = Math.sin(seed) * 10000;
  const r = x - Math.floor(x);
  // ~85% active, ~15% maintenance
  return r > 0.85 ? "maintenance" : "active";
}