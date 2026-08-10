import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState, MasteryBar } from "@/components/ui-states";
import { Badge } from "@/components/ui/badge";
import { generateStudyPlan } from "@/lib/ai.functions";
import { bandFor } from "@/lib/edupilot-types";
import { daysUntil, errorMessage, useLatestAssessment, useProfile } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/assessment-results")({
  head: () => ({
    meta: [
      { title: "Your Knowledge Gap Analysis — EduPilot" },
      { name: "description", content: "See your topic-level strengths, gaps and recommended next steps." },
      { property: "og:title", content: "Your Knowledge Gap Analysis — EduPilot" },
      { property: "og:description", content: "See your topic-level strengths, gaps and recommended next steps." },
    ],
  }),
  component: Results,
});

const BAND_TONE: Record<string, string> = {
  Strong: "border-success/40 bg-success/10 text-success",
  Good: "border-primary/40 bg-primary/10 text-primary",
  "Needs Practice": "border-warning/50 bg-warning/15 text-warning-foreground",
  Weak: "border-destructive/40 bg-destructive/10 text-destructive",
  Critical: "border-destructive/50 bg-destructive/15 text-destructive",
};

function Results() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: assessment, isLoading, error } = useLatestAssessment();
  const buildPlan = useServerFn(generateStudyPlan);

  const plan = useMutation({
    mutationFn: async () => {
      if (!profile || !assessment) throw new Error("Missing data");
      const topics = (assessment.topic_analysis?.topics ?? []).map((t) => ({
        topic: t.topic,
        score: t.score,
        gap: t.gap,
      }));
      const result = await buildPlan({
        data: {
          subject: profile.subject || assessment.subject,
          level: profile.current_level || "Intermediate",
          goal: profile.learning_goal || "",
          dailyHours: Number(profile.daily_study_hours) || 2,
          daysUntilExam: daysUntil(profile.exam_date) || 14,
          analysis: topics,
        },
      });
      const { error: insertError } = await supabase
        .from("study_plans")
        .insert({ user_id: profile.id, plan_data: result as unknown as never });
      if (insertError) throw insertError;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["plan", "latest"] });
      toast.success("Your roadmap is ready");
      navigate({ to: "/roadmap" });
    },
    onError: (e) => toast.error(errorMessage(e, "Could not build your roadmap.")),
  });

  if (isLoading) return <LoadingState label="Loading your analysis…" />;
  if (error) return <ErrorState message={errorMessage(error)} />;
  if (!assessment)
    return (
      <EmptyState
        title="No assessment yet"
        description="Take the AI diagnostic to see your topic-level strengths and knowledge gaps."
        action={
          <Button asChild>
            <Link to="/assessment">Start diagnostic</Link>
          </Button>
        }
      />
    );

  const analysis = assessment.topic_analysis ?? { summary: "", topics: [], next_steps: [] };
  const topics = [...(analysis.topics ?? [])].sort((a, b) => b.score - a.score);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold sm:text-3xl">Knowledge Gap Analysis</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {assessment.subject} · {new Date(assessment.created_at).toLocaleDateString()}
      </p>

      <div className="surface mt-6 flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="text-center sm:text-left">
          <p className="text-sm text-muted-foreground">Overall score</p>
          <p className="text-5xl font-bold text-primary">{Math.round(assessment.score)}%</p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground sm:border-l sm:border-border sm:pl-6">
          {analysis.summary || "Your topic breakdown is below."}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Topic breakdown</h2>
        <div className="mt-4 space-y-4">
          {topics.map((t) => (
            <div key={t.topic} className="surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{t.topic}</span>
                  <Badge variant="outline" className={cn("font-medium", BAND_TONE[t.band ?? bandFor(t.score)])}>
                    {t.band ?? bandFor(t.score)}
                  </Badge>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{Math.round(t.score)}%</span>
              </div>
              <div className="mt-3">
                <MasteryBar value={t.score} />
              </div>
              {t.gap && <p className="mt-3 text-sm text-muted-foreground">{t.gap}</p>}
            </div>
          ))}
        </div>
      </section>

      {(analysis.next_steps ?? []).length > 0 && (
        <section className="surface mt-8 p-6">
          <h2 className="text-lg font-semibold">Recommended next steps</h2>
          <ol className="mt-4 space-y-3">
            {analysis.next_steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-muted-foreground">{s}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" onClick={() => plan.mutate()} disabled={plan.isPending}>
          {plan.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Generate my roadmap
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
