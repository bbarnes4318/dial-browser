// Personalized recommendation engine for the Dial Browser.
// Tracks which content categories a user has searched and surfaces matching
// voice services from the dial directory. Uses localStorage so it works for
// anonymous/public app users with no login.

const STORAGE_KEY = "1call_dial_categories";
const MAX_ENTRIES = 50;

// Every category used in src/data/dialServices.js
export const ALL_CATEGORIES = [
  "Travel", "Food", "Transport", "Housing", "Entertainment",
  "Productivity", "Local", "Health", "Finance", "Shopping",
];

/**
 * Read the raw access log from localStorage — an array of { category, ts } entries.
 */
function readLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLog(entries) {
  try {
    const trimmed = entries.slice(-MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* storage unavailable — silently degrade to no tracking */
  }
}

/**
 * Record that the user accessed a category (from a Dial Browser search).
 * Invalid/unknown categories are ignored.
 */
export function trackCategoryAccess(category) {
  if (!category || !ALL_CATEGORIES.includes(category)) return;
  const entries = readLog();
  entries.push({ category, ts: Date.now() });
  writeLog(entries);
}

/**
 * Returns a frequency map of category -> count, sorted by count desc then recency.
 */
export function getCategoryFrequency() {
  const entries = readLog();
  const counts = {};
  for (const e of entries) {
    counts[e.category] = (counts[e.category] || 0) + 1;
  }
  return counts;
}

/**
 * Returns true if the user has any tracked access history.
 */
export function hasAccessHistory() {
  return readLog().length > 0;
}

/**
 * Returns the user's top N categories by access frequency.
 * If there is no history, returns an empty array.
 */
export function getTopCategories(limit = 3) {
  const counts = getCategoryFrequency();
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category]) => category);
}

/**
 * Given a list of dial services, returns up to `limit` recommended services
 * based on the user's most-accessed categories. Services are grouped by the
 * user's top categories, with each category contributing a few results so the
 * list feels varied. Returns [] when there is no access history.
 */
export function getRecommendedServices(services, limit = 6) {
  if (!hasAccessHistory()) return [];
  const topCats = getTopCategories(4);
  if (topCats.length === 0) return [];

  const picked = [];
  const seen = new Set();

  // Round-robin: take one service from each top category in turn, so the
  // suggestions reflect breadth across the user's interests rather than
  // dumping every service from a single category first.
  let round = 0;
  while (picked.length < limit && round < limit) {
    for (const cat of topCats) {
      if (picked.length >= limit) break;
      const matches = services.filter((s) => s.category === cat && !seen.has(s.id));
      if (matches[round]) {
        picked.push(matches[round]);
        seen.add(matches[round].id);
      }
    }
    round++;
  }

  return picked;
}