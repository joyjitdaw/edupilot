import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, LoadingState } from "@/components/ui-states";
import { generateQuiz, reviewQuiz } from "@/lib/ai.functions";
import { nextMastery, statusFor, type MCQ, type QuizFeedback } from "@/lib/edupilot-types";
import { errorMessage, useLatestPlan, useProfile, useTopicProgress } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/quiz")({
  validateSearch: (search: Record<string, unknown>) => ({
    topic: typeof search["topic"] === "string" ? search["topic"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Mini Quiz — EduPilot" },
      { name: "description", content: "Take a short adaptive quiz and update your topic mastery." },
      { property: "og:title", content: "Mini Quiz — EduPilot" },
      { property: "og:description", content: "Take a short adaptive quiz and update your topic mastery." },
    ],
  }),
  component: Quiz,
});

function Quiz() {
  const { topic: topicParam } = Route.useSearch();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: progress, isLoading } = useTopicProgress();
  const { data: plan } = useLatestPlan();
  const makeQuiz = useServerFn(generateQuiz);
  const review = useServerFn(reviewQuiz);

  const [topic, setTopic] = useState(topicParam ?? "");
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; feedback: QuizFeedback } | null>(null);

  const topics = Array.from(
    new Set([
      ...(topicParam ? [topicParam] : []),
      ...(progress ?? []).map((p) => p.topic),
      ...((plan?.plan_data?.days ?? []).map((d) => d.topic) ?? []),
    ]),
  ).filter(Boolean);

  const record = (progress ?? []).find((p) => p.topic === topic);

  async function start() {
    if (!topic) {
      toast.error("Choose a topic first.");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const res = await makeQuiz({
        data: {
          subject: profile?.subject ?? "",
          level: profile?.current_level ?? "Intermediate",
          topic,
          mastery: record ? Number(record.mastery_score) : null,
        },
      });
      setQuestions(res.questions);
      setAnswers(new Array(res.questions.length).fill(-1));
    } catch (e) {
      toast.error(errorMessage(e, "Could not generate the quiz."));
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    if (!profile) return;
    setSubmitting(true);
    try {
      const correct = questions.map((q, i) => answers[i] === q.correct_index);
      const score = Math.round((correct.filter(Boolean).length / questions.length) * 100);
      const missed = questions
        .map((q, i) => ({ q, i }))
        .filter(({ i }) => !correct[i])
        .map(({ q, i }) => {
          const choice = answers[i] ?? -1;
          return {
            question: q.question,
            chosen: choice >= 0 ? (q.options[choice] ?? "no answer") : "no answer",
            correct: q.options[q.correct_index] ?? "",
          };
        });

      let feedback: QuizFeedback;
      try {
        feedback = await review({
          data: {
            subject: profile.subject ?? "",
            topic,
            score,
            previousMastery: record ? Number(record.mastery_score) : null,
            attempts: record?.attempts ?? 0,
            missed,
          },
        });
      } catch (e) {
        toast.error(errorMessage(e, "AI feedback failed — your score was still saved."));
        feedback = {
          summary: `You scored ${score}% on ${topic}.`,
          weak_concepts: [],
          recommendation: score >= 80 ? "Move on to the next topic." : "Review this topic and try again.",
          next_action: score >= 80 ? "advance" : score >= 60 ? "practice" : "reinforce",
        };
      }

      const { error } = await supabase.from("quiz_results").insert({
        user_id: profile.id,
        topic,
        questions: questions as unknown as never,
        answers: answers as unknown as never,
        score,
        feedback: feedback as unknown as never,
      });
      if (error) throw error;

      const mastery = nextMastery(record ? Number(record.mastery_score) : null, score);
      await supabase.from("topic_progress").upsert(
        {
          user_id: profile.id,
          topic,
          mastery_score: mastery,
          status: statusFor(mastery),
          attempts: (record?.attempts ?? 0) + 1,
          last_score: score,
        },
        { onConflict: "user_id,topic" },
      );

      await queryClient.invalidateQueries();
      setResult({ score, feedback });
    } catch (e) {
      toast.error(errorMessage(e, "Could not save your quiz."));
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return <LoadingState />;

  if (topics.length === 0)
    return (
      <EmptyState
        title="No topics yet"
        description="Take the diagnostic assessment first so EduPilot knows which topics to quiz you on."
        action={
          <Button asChild>
            <Link to="/assessment">Take diagnostic</Link>
          </Button>
        }
      />
    );

  const answered = answers.filter((a) => a >= 0).length;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold sm:text-3xl">Mini Quiz</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        A short mastery check. Your result updates your topic mastery and your next recommendation.
      </p>

      <div className="surface mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Topic</label>
          <Select
            value={topic}
            onValueChange={(v) => {
              setTopic(v);
              setQuestions([]);
              setResult(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a topic" />
            </SelectTrigger>
            <SelectContent>
              {topics.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => void start()} disabled={generating || !topic}>
          {generating ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
          {questions.length ? "New quiz" : "Start quiz"}
        </Button>
      </div>

      {record && (
        <p className="mt-3 text-sm text-muted-foreground">
          Current mastery for {record.topic}: <span className="font-medium text-foreground">{Math.round(Number(record.mastery_score))}%</span>{" "}
          · {record.attempts} attempt{record.attempts === 1 ? "" : "s"}
        </p>
      )}

      {generating && <LoadingState label="Writing your quiz…" />}

      {questions.length > 0 && !result && (
        <>
          <div className="mt-6 space-y-4">
            {questions.map((q, qi) => (
              <div key={q.id} className="surface p-5">
                <p className="text-sm font-semibold">
                  {qi + 1}. {q.question}
                </p>
                <div className="mt-4 space-y-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[qi] === oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left text-sm transition-colors hover:bg-muted",
                          selected && "border-primary bg-accent text-accent-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-full border border-border text-[11px] font-semibold",
                            selected && "border-primary bg-primary text-primary-foreground",
                          )}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <Button
            className="mt-6 w-full"
            size="lg"
            onClick={() => void submit()}
            disabled={submitting || answered < questions.length}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />} Submit quiz
          </Button>
          {answered < questions.length && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {answered}/{questions.length} answered
            </p>
          )}
        </>
      )}

      {result && (
        <div className="mt-6 space-y-6">
          <div className="surface flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-muted-foreground">Your score</p>
              <p
                className={cn(
                  "text-4xl font-bold",
                  result.score >= 80 ? "text-success" : result.score >= 60 ? "text-primary" : "text-destructive",
                )}
              >
                {result.score}%
              </p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground sm:border-l sm:border-border sm:pl-6">
              {result.feedback.summary}
            </p>
          </div>

          {result.feedback.weak_concepts.length > 0 && (
            <div className="surface p-5">
              <h2 className="text-sm font-semibold">Concepts to reinforce</h2>
              <ul className="mt-3 space-y-2">
                {result.feedback.weak_concepts.map((c, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="surface border-primary/30 p-5">
            <h2 className="text-sm font-semibold text-primary">EduPilot recommends</h2>
            <p className="mt-2 text-sm text-muted-foreground">{result.feedback.recommendation}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {result.feedback.next_action === "advance" ? (
                <Button asChild size="sm">
                  <Link to="/roadmap">Continue roadmap</Link>
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to="/tutor" search={{ topic }}>
                    Reinforce with tutor
                  </Link>
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => void start()}>
                Retake quiz
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Answer review</h2>
            {questions.map((q, qi) => {
              const chosen = answers[qi] ?? -1;
              const ok = chosen === q.correct_index;
              return (
                <div key={q.id} className="surface p-5">
                  <div className="flex items-start gap-2">
                    {ok ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <p className="text-sm font-medium">{q.question}</p>
                  </div>
                  {!ok && (
                    <p className="mt-2 pl-6 text-sm text-muted-foreground">
                      You chose “{chosen >= 0 ? q.options[chosen] : "nothing"}”. Correct answer:{" "}
                      <span className="font-medium text-foreground">{q.options[q.correct_index]}</span>
                    </p>
                  )}
                  <p className="mt-2 pl-6 text-sm text-muted-foreground">{q.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
