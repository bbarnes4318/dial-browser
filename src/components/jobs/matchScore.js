import { FIELD_KEYWORDS } from "./shared";

/**
 * Compute a match score (0-100) for a candidate against a specific job.
 * Weights: Field match 30, Location match 25, Skills match 25, Experience 20.
 *
 * @param {object} candidate - aggregated candidate object (from CandidateSearch)
 * @param {object} job - JobListing record
 * @returns {{ total: number, field: number, location: number, skills: number, experience: number } | null}
 */
export function computeMatchScore(candidate, job) {
  if (!job) return null;

  let fieldPts = 0;
  let locPts = 0;
  let skillsPts = 0;
  let expPts = 0;

  // --- Field match (30 pts) ---
  if (candidate.fields?.has(job.field)) fieldPts = 30;

  // --- Location match (25 pts) ---
  const jobLoc = (job.location || "").toLowerCase().trim();
  if (jobLoc) {
    const desired = (candidate.desiredLocation || "").toLowerCase().trim();
    const appLocs = [...(candidate.locations || [])].map((l) => l.toLowerCase().trim());
    const locMatch =
      jobLoc === "remote" ||
      desired === "remote" ||
      desired.includes(jobLoc) ||
      appLocs.some((l) => l.includes(jobLoc) || jobLoc.includes(l));
    if (locMatch) locPts = 25;
  } else {
    locPts = 25; // no location requirement = full match
  }

  // --- Skills match (25 pts) ---
  const keywords = FIELD_KEYWORDS[job.field] || [];
  if (keywords.length > 0) {
    const skillsArr = [...(candidate.skills || [])];
    const matched = skillsArr.filter((s) =>
      keywords.some((kw) => s.toLowerCase().includes(kw))
    ).length;
    skillsPts = Math.min(matched * 8, 25);
  } else {
    // No keywords for this field — give credit for having any skills
    skillsPts = (candidate.skills?.size || 0) > 0 ? 15 : 0;
  }

  // --- Experience (20 pts) ---
  const yrs = candidate.experienceYears || 0;
  expPts = Math.min(yrs / 5, 1) * 20;

  const total = Math.round(fieldPts + locPts + skillsPts + expPts);

  return { total, field: fieldPts, location: locPts, skills: skillsPts, experience: expPts };
}

export function getScoreStyle(score) {
  if (score == null) return { color: "#8A8F98", bg: "rgba(138,143,152,0.1)", label: "—" };
  if (score >= 75) return { color: "#D1FF26", bg: "rgba(209,255,38,0.15)", label: "Excellent" };
  if (score >= 50) return { color: "#60A5FA", bg: "rgba(96,165,250,0.15)", label: "Good" };
  if (score >= 25) return { color: "#FBBF24", bg: "rgba(251,191,36,0.15)", label: "Fair" };
  return { color: "#8A8F98", bg: "rgba(138,143,152,0.1)", label: "Low" };
}

/**
 * Compute a match score (0-100) for a single JobApplication against a JobListing.
 * Weights: Skills 40, Field 25, Experience 20, Location 15.
 *
 * @param {object} applicant - JobApplication record
 * @param {object} job - JobListing record
 * @returns {{ total: number, field: number, skills: number, experience: number, location: number, matchedSkills: string[], missingSkills: string[] } | null}
 */
export function computeApplicantMatchScore(applicant, job) {
  if (!job || !applicant) return null;

  let fieldPts = 0;
  let skillsPts = 0;
  let expPts = 0;
  let locPts = 0;

  // --- Field match (25 pts) ---
  if (applicant.field && job.field && applicant.field === job.field) fieldPts = 25;

  // --- Skills match (40 pts) — resume skills vs job field keywords ---
  const keywords = FIELD_KEYWORDS[job.field] || [];
  const appSkills = (applicant.skills || []).map((s) => s.toLowerCase().trim());

  let matchedSkills = [];
  let missingSkills = [];

  if (keywords.length > 0) {
    for (const kw of keywords) {
      if (appSkills.some((s) => s.includes(kw) || kw.includes(s))) {
        matchedSkills.push(kw);
      } else {
        missingSkills.push(kw);
      }
    }
    skillsPts = Math.round(Math.min((matchedSkills.length / keywords.length) * 40, 40));
  } else {
    // No keywords for this field — give credit for having any skills
    skillsPts = appSkills.length > 0 ? 20 : 0;
    matchedSkills = [...appSkills];
  }

  // --- Experience (20 pts) ---
  const yrs = applicant.experience_years || 0;
  expPts = Math.round(Math.min(yrs / 5, 1) * 20);

  // --- Location match (15 pts) ---
  const jobLoc = (job.location || "").toLowerCase().trim();
  const appLoc = (applicant.desired_location || "").toLowerCase().trim();
  if (jobLoc) {
    if (jobLoc === "remote" || appLoc === "remote" || appLoc.includes(jobLoc) || jobLoc.includes(appLoc)) {
      locPts = 15;
    }
  } else {
    locPts = 15;
  }

  const total = fieldPts + skillsPts + expPts + locPts;

  return {
    total,
    field: fieldPts,
    skills: skillsPts,
    experience: expPts,
    location: locPts,
    matchedSkills,
    missingSkills: missingSkills.slice(0, 5),
  };
}

export function getExperienceLabel(years) {
  if (!years || years === 0) return "Fresher";
  if (years <= 2) return "Entry";
  if (years <= 5) return "Mid";
  return "Senior";
}