import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AssessmentAnalysis, MCQ, StudyPlan } from "@/lib/edupilot-types";

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  subject: string | null;
  current_level: string | null;
  exam_date: string | null;
  daily_study_hours: number | null;
  learning_goal: string | null;
  onboarded: boolean;
};

export type AssessmentRow = {
  id: string;
  subject: string;
  questions: MCQ[];
  answers: number[];
  score: number;
  topic_analysis: AssessmentAnalysis;
  created_at: string;
};

export type PlanRow = { id: string; plan_data: StudyPlan; created_at: string; updated_at: string };

export type TopicProgressRow = {
  id: string;
  topic: string;
  mastery_score: number;
  status: string;
  attempts: number;
  last_score: number | null;
  updated_at: string;
};

export type QuizRow = {
  id: string;
  topic: string;
  questions: MCQ[];
  answers: number[];
  score: number;
  feedback: { summary?: string; weak_concepts?: string[]; recommendation?: string; next_action?: string };
  created_at: string;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
  });
}

export function useLatestAssessment() {
  return useQuery({
    queryKey: ["assessment", "latest"],
    queryFn: async (): Promise<AssessmentRow | null> => {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as AssessmentRow | null) ?? null;
    },
  });
}

export function useLatestPlan() {
  return useQuery({
    queryKey: ["plan", "latest"],
    queryFn: async (): Promise<PlanRow | null> => {
      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as PlanRow | null) ?? null;
    },
  });
}

export function useTopicProgress() {
  return useQuery({
    queryKey: ["topic_progress"],
    queryFn: async (): Promise<TopicProgressRow[]> => {
      const { data, error } = await supabase
        .from("topic_progress")
        .select("*")
        .order("mastery_score", { ascending: true });
      if (error) throw error;
      return (data as unknown as TopicProgressRow[]) ?? [];
    },
  });
}

export function useQuizResults(limit = 20) {
  return useQuery({
    queryKey: ["quiz_results", limit],
    queryFn: async (): Promise<QuizRow[]> => {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as unknown as QuizRow[]) ?? [];
    },
  });
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

/** A simple day streak based on distinct days with quiz activity. */
export function studyStreak(rows: { created_at: string }[]): number {
  const days = new Set(rows.map((r) => new Date(r.created_at).toDateString()));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}
