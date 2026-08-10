export type Level = "Beginner" | "Intermediate" | "Advanced";

export type MCQ = {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

export type TopicAnalysis = {
  topic: string;
  score: number;
  band: "Strong" | "Good" | "Needs Practice" | "Weak" | "Critical";
  gap: string;
};

export type AssessmentAnalysis = {
  summary: string;
  topics: TopicAnalysis[];
  next_steps: string[];
};

export type PlanDay = {
  day: number;
  topic: string;
  focus: string;
  activities: string[];
  minutes: number;
};

export type StudyPlan = {
  summary: string;
  days: PlanDay[];
};

export type QuizFeedback = {
  summary: string;
  weak_concepts: string[];
  recommendation: string;
  next_action: "reinforce" | "practice" | "advance";
};

export type ProgressStatus = "not_started" | "critical" | "weak" | "needs_practice" | "improving" | "mastered";

export function bandFor(score: number): TopicAnalysis["band"] {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Practice";
  if (score >= 30) return "Weak";
  return "Critical";
}

export function statusFor(mastery: number): ProgressStatus {
  if (mastery >= 80) return "mastered";
  if (mastery >= 60) return "improving";
  if (mastery >= 45) return "needs_practice";
  if (mastery >= 25) return "weak";
  return "critical";
}

export const STATUS_LABEL: Record<ProgressStatus, string> = {
  not_started: "Not started",
  critical: "Critical",
  weak: "Weak",
  needs_practice: "Needs practice",
  improving: "Improving",
  mastered: "Mastered",
};

/** Blend the previous mastery with the newest score so progress adapts gradually. */
export function nextMastery(previous: number | null | undefined, score: number): number {
  if (previous === null || previous === undefined) return Math.round(score);
  return Math.round(previous * 0.4 + score * 0.6);
}
