import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tutorReply } from "@/lib/ai.functions";
import { errorMessage, useLatestPlan, useProfile, useTopicProgress } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tutor")({
  validateSearch: (search: Record<string, unknown>) => ({
    topic: typeof search["topic"] === "string" ? search["topic"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "AI Tutor — EduPilot" },
      { name: "description", content: "Ask your AI tutor for explanations, examples and analogies at your level." },
      { property: "og:title", content: "AI Tutor — EduPilot" },
      { property: "og:description", content: "Ask your AI tutor for explanations, examples and analogies." },
    ],
  }),
  component: Tutor,
});

const QUICK = [
  { label: "Explain Simply", prompt: "Explain this topic simply, as if I'm new to it." },
  { label: "Give an Example", prompt: "Give me a concrete worked example for this topic." },
  { label: "Give an Analogy", prompt: "Give me an everyday analogy that makes this topic click." },
  { label: "Quiz Me", prompt: "Ask me one challenging question on this topic and wait for my answer." },
  { label: "Explain Again", prompt: "I still don't get it. Explain again from a different angle, more slowly." },
];

type Message = { role: "user" | "assistant"; content: string };

function Tutor() {
  const { topic: topicParam } = Route.useSearch();
  const { data: profile } = useProfile();
  const { data: progress } = useTopicProgress();
  const { data: plan } = useLatestPlan();
  const ask = useServerFn(tutorReply);

  const [topic, setTopic] = useState(topicParam ?? "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const topics = Array.from(
    new Set([
      ...(topicParam ? [topicParam] : []),
      ...(progress ?? []).map((p) => p.topic),
      ...((plan?.plan_data?.days ?? []).map((d) => d.topic) ?? []),
    ]),
  ).filter(Boolean);

  useEffect(() => {
    if (!topic && topics.length > 0) setTopic(topics[0]!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    if (!topic) {
      toast.error("Pick a topic first.");
      return;
    }
    const history = messages.slice(-10);
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setPending(true);
    try {
      const mastery = (progress ?? []).find((p) => p.topic === topic)?.mastery_score;
      const res = await ask({
        data: {
          subject: profile?.subject ?? "",
          level: profile?.current_level ?? "Intermediate",
          topic,
          mastery: mastery === undefined ? null : Number(mastery),
          history,
          message: trimmed,
        },
      });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e) {
      toast.error(errorMessage(e, "The tutor could not respond."));
      setMessages((m) => m.slice(0, -1));
      setInput(trimmed);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-4xl flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI Tutor</h1>
          <p className="text-sm text-muted-foreground">Tuned to your {profile?.current_level ?? "current"} level.</p>
        </div>
        {topics.length > 0 ? (
          <Select value={topic} onValueChange={(v) => setTopic(v)}>
            <SelectTrigger className="w-full sm:w-64">
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
        ) : (
          <span className="text-sm text-muted-foreground">Take the diagnostic to unlock your topics.</span>
        )}
      </div>

      <div className="surface mt-4 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <Sparkles className="size-6 text-primary" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Ask anything about <span className="font-medium text-foreground">{topic || "your topic"}</span>, or use
                a quick action below.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border p-4">
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <Button key={q.label} size="sm" variant="outline" disabled={pending} onClick={() => void send(q.prompt)}>
                {q.label}
              </Button>
            ))}
          </div>
          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <Textarea
              rows={2}
              value={input}
              maxLength={2000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder={`Ask about ${topic || "your topic"}…`}
              className="min-h-[52px] resize-none"
            />
            <Button type="submit" size="icon" className="size-[52px]" disabled={pending || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
