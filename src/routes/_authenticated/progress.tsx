import { createFileRoute, Link } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState, MasteryBar, StatusBadge } from "@/components/ui-states";
import { useQuizResults, useTopicProgress } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress — EduPilot" },
      { name: "description", content: "Track overall mastery, topic mastery and your quiz history over time." },
      { property: "og:title", content: "Progress — EduPilot" },
      { property: "og:description", content: "Track overall mastery, topic mastery and your quiz history." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { data: progress = [], isLoading } = useTopicProgress();
  const { data: quizzes = [] } = useQuizResults(30);

  if (isLoading) return <LoadingState />;

  if (progress.length === 0)
    return (
      <EmptyState
        title="No progress yet"
        description="Take the diagnostic assessment to start tracking your topic mastery."
        action={
          <Button asChild>
            <Link to="/assessment">Take diagnostic</Link>
          </Button>
        }
      />
    );

  const overall = Math.round(progress.reduce((s, p) => s + Number(p.mastery_score), 0) / progress.length);
  const completed = progress.filter((p) => Number(p.mastery_score) >= 80);
  const improving = progress.filter((p) => Number(p.mastery_score) >= 60 && Number(p.mastery_score) < 80);
  const attention = progress.filter((p) => Number(p.mastery_score) < 60);

  const chartData = [...quizzes]
    .reverse()
    .map((q, i) => ({ n: i + 1, score: Math.round(Number(q.score)), topic: q.topic }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Progress</h1>
        <p className="mt-1 text-muted-foreground">How your mastery has moved since your diagnostic.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall mastery</p>
          <p className="mt-2 text-3xl font-bold text-primary">{overall}%</p>
          <div className="mt-3">
            <MasteryBar value={overall} />
          </div>
        </div>
        <Tile label="Completed topics" value={completed.length} />
        <Tile label="Improving" value={improving.length} />
        <Tile label="Needs attention" value={attention.length} />
      </div>

      <section className="surface p-6">
        <h2 className="text-sm font-semibold">Topic mastery</h2>
        <div className="mt-5 space-y-5">
          {progress.map((p) => (
            <div key={p.id}>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{p.topic}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge mastery={Number(p.mastery_score)} status={p.status} />
                  <span className="text-muted-foreground">{Math.round(Number(p.mastery_score))}%</span>
                </div>
              </div>
              <MasteryBar value={Number(p.mastery_score)} />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {p.attempts} quiz attempt{p.attempts === 1 ? "" : "s"}
                {p.last_score !== null ? ` · last score ${Math.round(Number(p.last_score))}%` : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface p-6">
        <h2 className="text-sm font-semibold">Quiz history</h2>
        {chartData.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Take a mini quiz to start building your history.</p>
        ) : (
          <>
            <div className="mt-5 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="n" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, _n, item) => [`${value}%`, item.payload.topic]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--color-primary)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-6 divide-y divide-border">
              {quizzes.slice(0, 10).map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="truncate font-medium">{q.topic}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {Math.round(Number(q.score))}% · {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
