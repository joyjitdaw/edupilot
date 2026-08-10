import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui-states";
import { analyzeAssessment, generateDiagnostic } from "@/lib/ai.functions";
import { bandFor, statusFor, type AssessmentAnalysis, type MCQ } from "@/lib/edupilot-types";
import { errorMessage, useProfile } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/assessment")({
  head: () => ({
    meta: [
      { title: "AI Diagnostic Assessment — EduPilot" },
      { name: "description", content: "Take a 10-question AI diagnostic to reveal your topic-level knowledge gaps." },
      { property: "og:title", content: "AI Diagnostic Assessment — EduPilot" },
      { property: "og:description", content: "Take a 10-question AI diagnostic to reveal your knowledge gaps." },
    ],
  }),
  component: Assessment,
});

function Assessment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const generate = useServerFn(generateDiagnostic);
  const analyze = useServerFn(analyzeAssessment);

  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const started = useRef(false);

  async function load() {
    if (!profile?.subject) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await generate({
        data: { subject: profile.subject, level: profile.current_level || "Intermediate" },
      });
      setQuestions(res.questions);
      setAnswers(new Array(res.questions.length).fill(-1));
      setIndex(0);
    } catch (e) {
      setLoadError(errorMessage(e, "The AI could not create your diagnostic."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (started.current || !profile?.subject) return;
    started.current = true;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.subject]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Profile not loaded");
      const correct = questions.map((q, i) => answers[i] === q.correct_index);
      const score = Math.round((correct.filter(Boolean).length / questions.length) * 100);

      const byTopic = new Map<string, { right: number; total: number }>();
      questions.forEach((q, i) => {
        const entry = byTopic.get(q.topic) ?? { right: 0, total: 0 };
        entry.total += 1;
        if (correct[i]) entry.right += 1;
        byTopic.set(q.topic, entry);
      });
      const topicScores = [...byTopic.entries()].map(([topic, v]) => ({
        topic,
        score: Math.round((v.right / v.total) * 100),
      }));

      const missed = questions
        .map((q, i) => ({ q, i }))
        .filter(({ i }) => !correct[i])
        .slice(0, 10)
        .map(({ q, i }) => {
          const choice = answers[i] ?? -1;
          return {
            topic: q.topic,
            question: q.question,
            chosen: choice >= 0 ? (q.options[choice] ?? "no answer") : "no answer",
            correct: q.options[q.correct_index] ?? "",
          };
        });

      let analysis: AssessmentAnalysis;
      try {
        analysis = await analyze({
          data: {
            subject: profile.subject || "",
            level: profile.current_level || "Intermediate",
            overallScore: score,
            topicScores,
            missed,
          },
        });
      } catch (e) {
        toast.error(errorMessage(e, "AI analysis failed — saving your raw scores instead."));
        analysis = {
          summary: `You scored ${score}% on the diagnostic.`,
          topics: topicScores.map((t) => ({ ...t, band: bandFor(t.score), gap: "" })),
          next_steps: [],
        };
      }

      const { error } = await supabase.from("assessments").insert({
        user_id: profile.id,
        subject: profile.subject || "",
        questions: questions as unknown as never,
        answers: answers as unknown as never,
        score,
        topic_analysis: analysis as unknown as never,
      });
      if (error) throw error;

      const rows = topicScores.map((t) => ({
        user_id: profile.id,
        topic: t.topic,
        mastery_score: t.score,
        status: statusFor(t.score),
        attempts: 0,
        last_score: t.score,
      }));
      await supabase.from("topic_progress").upsert(rows, { onConflict: "user_id,topic" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      navigate({ to: "/assessment-results" });
    },
    onError: (e) => toast.error(errorMessage(e, "Could not save your assessment.")),
  });

  const answered = useMemo(() => answers.filter((a) => a >= 0).length, [answers]);

  if (loading) return <LoadingState label="Your AI diagnostic is being generated…" />;
  if (loadError)
    return <ErrorState message={loadError} action={<Button onClick={() => void load()}>Try again</Button>} />;
  if (questions.length === 0) return <ErrorState message="No questions were generated." />;

  const q = questions[index]!;
  const progress = Math.round(((index + 1) / questions.length) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Diagnostic Assessment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.subject} · {profile?.current_level}
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          Question {index + 1} of {questions.length}
        </span>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="surface mt-6 p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">{q.topic}</p>
        <h2 className="mt-3 text-lg font-semibold leading-relaxed">{q.question}</h2>

        <div className="mt-6 space-y-3">
          {q.options.map((opt, i) => {
            const selected = answers[index] === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setAnswers((prev) => prev.map((a, ai) => (ai === index ? i : a)))}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border border-border p-4 text-left text-sm transition-colors hover:bg-muted",
                  selected && "border-primary bg-accent text-accent-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border border-border text-xs font-semibold",
                    selected && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="pt-0.5">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <ArrowLeft className="size-4" /> Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          {answered}/{questions.length} answered
        </span>
        {index < questions.length - 1 ? (
          <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
            Next <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={() => submit.mutate()} disabled={submit.isPending || answered < questions.length}>
            {submit.isPending && <Loader2 className="size-4 animate-spin" />} Submit Assessment
          </Button>
        )}
      </div>
      {answered < questions.length && index === questions.length - 1 && (
        <p className="mt-3 text-center text-sm text-muted-foreground">Answer every question before submitting.</p>
      )}
    </div>
  );
}
