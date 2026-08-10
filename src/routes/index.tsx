import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  GraduationCap,
  LineChart,
  MessageSquareText,
  Route as RouteIcon,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduPilot — Your AI-Powered Learning Guide" },
      {
        name: "description",
        content:
          "EduPilot finds your knowledge gaps with an AI diagnostic, builds a personalised study roadmap, and adapts it as you learn.",
      },
      { property: "og:title", content: "EduPilot — Your AI-Powered Learning Guide" },
      {
        property: "og:description",
        content: "Stop studying everything. Start studying what you actually need, with an adaptive AI learning guide.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "AI Diagnostic Assessment",
    body: "A 10-question adaptive diagnostic built for your subject and level, covering every core topic.",
  },
  {
    icon: BrainCircuit,
    title: "Knowledge Gap Detection",
    body: "Topic-level analysis that names the concept you're missing — not just a percentage score.",
  },
  {
    icon: RouteIcon,
    title: "Personalised Roadmap",
    body: "A day-by-day plan weighted towards your weak areas, your exam date and your available study time.",
  },
  {
    icon: MessageSquareText,
    title: "AI Tutor",
    body: "Ask anything about your current topic. Explanations, examples and analogies matched to your level.",
  },
  {
    icon: Target,
    title: "Adaptive Quizzes",
    body: "Short mastery checks after each topic, with explanations for every answer you get wrong.",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    body: "Mastery per topic, quiz history and a clear view of what still needs attention.",
  },
];

const STEPS = [
  { n: "01", t: "Assess", d: "Take the AI diagnostic for your subject." },
  { n: "02", t: "Analyze", d: "See topic-level strengths and gaps." },
  { n: "03", t: "Plan", d: "Get a roadmap built around your weak areas." },
  { n: "04", t: "Learn", d: "Study with an AI tutor that knows your level." },
  { n: "05", t: "Test", d: "Take a short quiz to prove mastery." },
  { n: "06", t: "Adapt", d: "The plan changes based on how you performed." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            EduPilot
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 lg:pb-24 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Your AI-Powered Learning Guide
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] sm:text-5xl lg:text-6xl">
              Stop studying everything.
              <br />
              <span className="text-primary">Start studying what you need.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              EduPilot uses AI to understand your strengths and knowledge gaps, then builds a personalized learning
              path around what you actually need to learn.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/signup">
                  Start Learning <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#how-it-works">How It Works</a>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
              {[
                ["10", "diagnostic questions"],
                ["6", "step learning cycle"],
                ["1", "plan built for you"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-2xl font-semibold text-foreground">{v}</dt>
                  <dd className="text-xs text-muted-foreground">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="surface p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sample gap analysis</p>
            <div className="mt-5 space-y-4">
              {[
                ["Arrays", 90, "bg-success"],
                ["Linked Lists", 80, "bg-success"],
                ["Trees", 55, "bg-warning"],
                ["Graphs", 30, "bg-destructive"],
                ["Dynamic Programming", 20, "bg-destructive"],
              ].map(([topic, score, tone]) => (
                <div key={topic as string}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{topic}</span>
                    <span className="text-muted-foreground">{score}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${tone}`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              “Your weakest area is Dynamic Programming. Start with overlapping subproblems before attempting
              optimisation problems.”
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="text-2xl font-bold sm:text-3xl">How EduPilot works</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            One continuous learning cycle: assess, analyze, plan, learn, test, adapt.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-xl border border-border bg-background p-5">
                <span className="text-xs font-semibold text-primary">{s.n}</span>
                <h3 className="mt-2 font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <h2 className="text-2xl font-bold sm:text-3xl">Everything you need to close the gap</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="surface p-6 transition-shadow hover:shadow-[var(--shadow-lift)]">
              <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6 lg:py-20">
          <h2 className="text-2xl font-bold sm:text-3xl">Find out what you actually need to study</h2>
          <p className="max-w-xl text-muted-foreground">
            Take the diagnostic, get your personalised roadmap, and let EduPilot adapt as you improve.
          </p>
          <Button asChild size="lg">
            <Link to="/signup">
              Start Learning <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} EduPilot</span>
          <span>Your AI-Powered Learning Guide</span>
        </div>
      </footer>
    </div>
  );
}

