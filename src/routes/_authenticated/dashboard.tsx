import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Sparkles, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardSkeletons, EmptyState, MasteryBar, StatusBadge } from "@/components/ui-states";
import {
  daysUntil,
  studyStreak,
  useLatestAssessment,
  useLatestPlan,
  useProfile,
  useQuizResults,
  useTopicProgress,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EduPilot" },
      { name: "description", content: "Your mastery, streak, today's goal and your next adaptive recommendation." },
      { property: "og:title", content: "Dashboard — EduPilot" },
      { property: "og:description", content: "Your mastery, streak, today's goal and next recommendation." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: assessment, isLoading: loadingAssessment } = useLatestAssessment();
  const { data: progress = [], isLoading: loadingProgress } = useTopicProgress();
  const { data: quizzes = [] } = useQuizResults(10);
  const { data: plan } = useLatestPlan();

  const loading = loadingAssessment || loadingProgress;

  const overall =
    progress.length > 0
      ? Math.round(progress.reduce((sum, p) => sum + Number(p.mastery_score), 0) / progress.length)
      : 0;
  const streak = studyStreak(quizzes);
  const weakest = [...progress].sort((a, b) => Number(a.mastery_score) - Number(b.mastery_score))[0];
  const strong = progress.filter((p) => Number(p.mastery_score) >= 80);
  const weak = progress.filter((p) => Number(p.mastery_score) < 50);
  const days = daysUntil(profile?.exam_date);
  const today = plan?.plan_data?.days?.[0];
  const latestFeedback = quizzes[0]?.feedback;

  const recommendation =
    latestFeedback?.recommendation ??
    (weakest
      ? `Your weakest area right now is ${weakest.topic}. Complete a reinforcement session on it before moving forward.`
      : "Start with the AI diagnostic so EduPilot can find your knowledge gaps.");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
        <CardSkeletons count={4} />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Welcome, {profile?.name || "student"}</h1>
          <p className="mt-1 text-muted-foreground">One diagnostic and EduPilot builds your plan.</p>
        </div>
        <EmptyState
          title="Start with your diagnostic"
          description={`We'll generate 10 questions across the core topics of ${profile?.subject ?? "your subject"} to find exactly what you need to study.`}
          action={
            <Button asChild size="lg">
              <Link to="/assessment">
                Start diagnostic <ArrowRight className="size-4" />
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Welcome back, {profile?.name || "student"}</h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.subject} · {profile?.current_level}
            {days !== null ? ` · exam in ${days} day${days === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <Button asChild>
          <Link to={today ? "/tutor" : "/quiz"} search={today ? { topic: today.topic } : { topic: undefined }}>
            Continue learning <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<TrendingUp className="size-4" />} label="Overall mastery" value={`${overall}%`}>
          <MasteryBar value={overall} />
        </StatCard>
        <StatCard icon={<Flame className="size-4" />} label="Learning streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
        <StatCard
          icon={<Target className="size-4" />}
          label="Today's goal"
          value={today ? today.topic : "Take a quiz"}
          hint={today?.focus ?? "Pick a topic and test your mastery"}
        />
        <StatCard
          icon={<Sparkles className="size-4" />}
          label="Diagnostic score"
          value={`${Math.round(assessment.score)}%`}
          hint={new Date(assessment.created_at).toLocaleDateString()}
        />
      </div>

      <section className="surface border-primary/30 p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="size-4" /> AI recommendation
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{recommendation}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/tutor" search={{ topic: weakest?.topic }}>
              Reinforce {weakest?.topic ?? "a topic"}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/quiz" search={{ topic: weakest?.topic }}>
              Test myself
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-6">
          <h2 className="text-sm font-semibold">Topic mastery</h2>
          <div className="mt-4 space-y-4">
            {progress.slice(0, 6).map((p) => (
              <div key={p.id}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{p.topic}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge mastery={Number(p.mastery_score)} status={p.status} />
                    <span className="text-muted-foreground">{Math.round(Number(p.mastery_score))}%</span>
                  </div>
                </div>
                <MasteryBar value={Number(p.mastery_score)} />
              </div>
            ))}
          </div>
          <Button asChild variant="ghost" size="sm" className="mt-4">
            <Link to="/progress">View full progress</Link>
          </Button>
        </section>

        <div className="space-y-6">
          <section className="surface p-6">
            <h2 className="text-sm font-semibold">Strong vs. weak</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Strong</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {strong.length ? (
                    strong.map((p) => <li key={p.id}>{p.topic}</li>)
                  ) : (
                    <li className="text-muted-foreground">None yet</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Needs work</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {weak.length ? (
                    weak.map((p) => <li key={p.id}>{p.topic}</li>)
                  ) : (
                    <li className="text-muted-foreground">Nothing critical</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          <section className="surface p-6">
            <h2 className="text-sm font-semibold">Recent quiz scores</h2>
            {quizzes.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No quizzes yet. Take one to update your mastery.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {quizzes.slice(0, 5).map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{q.topic}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {Math.round(Number(q.score))}% · {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {plan?.plan_data?.days?.length ? (
        <section className="surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Current roadmap</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/roadmap">Open roadmap</Link>
            </Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plan.plan_data.days.slice(0, 6).map((d) => (
              <div key={d.day} className="rounded-lg border border-border p-4">
                <p className="text-xs font-semibold text-primary">Day {d.day}</p>
                <p className="mt-1 text-sm font-medium">{d.topic}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.focus}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="No roadmap yet"
          description="Turn your diagnostic into a day-by-day plan built around your weakest topics."
          action={
            <Button asChild>
              <Link to="/assessment-results">Generate roadmap</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className="mt-2 truncate text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{hint}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
