import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui-states";
import { generateStudyPlan } from "@/lib/ai.functions";
import { daysUntil, errorMessage, useLatestAssessment, useLatestPlan, useProfile, useTopicProgress } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({
    meta: [
      { title: "Your Personalised Roadmap — EduPilot" },
      { name: "description", content: "A day-by-day study roadmap weighted towards your weakest topics." },
      { property: "og:title", content: "Your Personalised Roadmap — EduPilot" },
      { property: "og:description", content: "A day-by-day study roadmap weighted towards your weakest topics." },
    ],
  }),
  component: Roadmap,
});

function Roadmap() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: assessment } = useLatestAssessment();
  const { data: progress } = useTopicProgress();
  const { data: plan, isLoading, error } = useLatestPlan();
  const buildPlan = useServerFn(generateStudyPlan);

  const regenerate = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Profile not loaded");
      const analysis =
        (progress ?? []).length > 0
          ? (progress ?? []).map((p) => ({ topic: p.topic, score: Number(p.mastery_score), gap: "" }))
          : (assessment?.topic_analysis?.topics ?? []).map((t) => ({ topic: t.topic, score: t.score, gap: t.gap }));
      if (analysis.length === 0) throw new Error("Take the diagnostic first so the plan can be personalised.");
      const result = await buildPlan({
        data: {
          subject: profile.subject || "",
          level: profile.current_level || "Intermediate",
          goal: profile.learning_goal || "",
          dailyHours: Number(profile.daily_study_hours) || 2,
          daysUntilExam: daysUntil(profile.exam_date) || 14,
          analysis,
        },
      });
      const { error: insertError } = await supabase
        .from("study_plans")
        .insert({ user_id: profile.id, plan_data: result as unknown as never });
      if (insertError) throw insertError;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["plan", "latest"] });
      toast.success("Roadmap updated with your latest performance");
    },
    onError: (e) => toast.error(errorMessage(e, "Could not update your roadmap.")),
  });

  if (isLoading) return <LoadingState label="Loading your roadmap…" />;
  if (error) return <ErrorState message={errorMessage(error)} />;

  const days = plan?.plan_data?.days ?? [];
  const masteryByTopic = new Map((progress ?? []).map((p) => [p.topic.toLowerCase(), Number(p.mastery_score)]));

  if (!plan || days.length === 0)
    return (
      <EmptyState
        title="No roadmap yet"
        description="Complete the diagnostic assessment, then generate a plan built around your weakest topics."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/assessment">Take diagnostic</Link>
            </Button>
            <Button variant="outline" onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
              {regenerate.isPending && <Loader2 className="size-4 animate-spin" />} Generate plan
            </Button>
          </div>
        }
      />
    );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Your roadmap</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {plan.plan_data.summary || "Built from your diagnostic results and available study time."}
          </p>
        </div>
        <Button variant="outline" onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
          {regenerate.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Adapt to latest performance
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {days.map((d) => {
          const mastery = masteryByTopic.get((d.topic ?? "").toLowerCase());
          return (
            <article key={d.day} className="surface flex flex-col gap-4 p-5 sm:flex-row">
              <div className="flex shrink-0 items-center gap-3 sm:w-28 sm:flex-col sm:items-start">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                  <CalendarDays className="size-3.5" /> Day {d.day}
                </span>
                {mastery !== undefined && (
                  <span className="text-xs text-muted-foreground">{Math.round(mastery)}% mastery</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{d.topic}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{d.focus}</p>
                {(d.activities ?? []).length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {d.activities.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        {a}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/tutor" search={{ topic: d.topic }}>
                      Study with tutor
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/quiz" search={{ topic: d.topic }}>
                      Take mini quiz
                    </Link>
                  </Button>
                  {d.minutes ? <span className="self-center text-xs text-muted-foreground">~{d.minutes} min</span> : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
