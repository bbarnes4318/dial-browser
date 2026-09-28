// Frontend display metadata for the daily-streak milestone badges. Mirrors the
// STREAK_MILESTONES / STREAK_BADGES_META in base44/shared/studyStreak.ts (which
// the frontend cannot import because base44/ is server-side only).
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export const STREAK_BADGES_META = {
  3: { name: "3-Day Spark", emoji: "🔥", description: "Studied 3 days in a row" },
  7: { name: "Week Warrior", emoji: "⚡", description: "A full week of daily study" },
  14: { name: "Fortnight Focus", emoji: "🎯", description: "14 consecutive days" },
  30: { name: "Monthly Master", emoji: "🏆", description: "30 days of consistency" },
  60: { name: "Doubled Down", emoji: "💎", description: "60 consecutive days" },
  100: { name: "Centurion", emoji: "👑", description: "100 days of mastery" },
};