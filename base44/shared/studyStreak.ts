// Daily study-streak tracking for Dial Certified Courses. Shared by the
// telephony engine (course-voice-delivery, on lesson advance) and the grading
// pipeline (grade-exam-attempt, on a passed quiz/test/exam). Bumps the
// learner's consecutive-day streak, records the activity, and unlocks digital
// milestone badges. One StudyStreak record per learner; writes use the service
// role so both authenticated (SDK) and Twilio-webhook code paths can update it.

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export const STREAK_BADGES_META = {
  3: { name: "3-Day Spark", emoji: "🔥", description: "Studied 3 days in a row" },
  7: { name: "Week Warrior", emoji: "⚡", description: "A full week of daily study" },
  14: { name: "Fortnight Focus", emoji: "🎯", description: "14 consecutive days" },
  30: { name: "Monthly Master", emoji: "🏆", description: "30 days of consistency" },
  60: { name: "Doubled Down", emoji: "💎", description: "60 consecutive days" },
  100: { name: "Centurion", emoji: "👑", description: "100 days of mastery" },
};

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86400000);
}

export async function bumpStudyStreak(base44: any, userId: string, activityType: "lesson" | "quiz") {
  if (!userId) return null;
  const today = todayUTC();

  const existing = await base44.asServiceRole.entities.StudyStreak.filter(
    { owner_user_id: userId }, "-created_date", 5
  );
  const streak = (existing || [])[0];

  let current = 0;
  let longest = 0;
  let totalActive = 0;
  let lessons = 0;
  let quizzes = 0;
  let unlocked: number[] = [];

  if (streak) {
    current = streak.current_streak || 0;
    longest = streak.longest_streak || 0;
    totalActive = streak.total_active_days || 0;
    lessons = streak.total_lessons_completed || 0;
    quizzes = streak.total_quizzes_passed || 0;
    unlocked = Array.isArray(streak.unlocked_milestones) ? streak.unlocked_milestones.map(Number) : [];
  }

  const alreadyActiveToday = streak?.last_activity_date === today;

  // Only advance the streak on the first activity of a new day.
  if (!alreadyActiveToday) {
    if (streak?.last_activity_date) {
      const gap = daysBetween(streak.last_activity_date, today);
      if (gap === 1) current += 1;
      else current = 1; // gap > 1 (skipped a day) or corrupt date → reset
    } else {
      current = 1;
    }
    totalActive += 1;
  }

  if (activityType === "lesson") lessons += 1;
  if (activityType === "quiz") quizzes += 1;
  if (current > longest) longest = current;

  const newMilestones: number[] = [];
  for (const m of STREAK_MILESTONES) {
    if (current >= m && !unlocked.includes(m)) {
      unlocked.push(m);
      newMilestones.push(m);
    }
  }

  const payload = {
    owner_user_id: userId,
    current_streak: current,
    longest_streak: longest,
    last_activity_date: today,
    total_active_days: totalActive,
    total_lessons_completed: lessons,
    total_quizzes_passed: quizzes,
    unlocked_milestones: unlocked,
  };

  if (streak) {
    await base44.asServiceRole.entities.StudyStreak.update(streak.id, payload);
  } else {
    await base44.asServiceRole.entities.StudyStreak.create(payload);
  }

  return {
    current_streak: current,
    longest_streak: longest,
    total_active_days: totalActive,
    total_lessons_completed: lessons,
    total_quizzes_passed: quizzes,
    unlocked_milestones: unlocked,
    new_milestones: newMilestones,
  };
}