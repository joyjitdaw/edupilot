import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorMessage, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your learning profile — EduPilot" },
      { name: "description", content: "Tell EduPilot your subject, level, exam date and goal to personalise your plan." },
      { property: "og:title", content: "Set up your learning profile — EduPilot" },
      { property: "og:description", content: "Personalise your EduPilot learning roadmap in under a minute." },
    ],
  }),
  component: Onboarding,
});

const SUBJECTS = [
  "Data Structures",
  "Algorithms",
  "Operating Systems",
  "Database Systems",
  "Computer Networks",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Machine Learning",
];

function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "Data Structures",
    current_level: "Intermediate",
    exam_date: "",
    daily_study_hours: "2",
    learning_goal: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm((f) => ({
      ...f,
      name: profile.name || f.name,
      subject: profile.subject || f.subject,
      current_level: profile.current_level || f.current_level,
      exam_date: profile.exam_date || f.exam_date,
      daily_study_hours: profile.daily_study_hours ? String(profile.daily_study_hours) : f.daily_study_hours,
      learning_goal: profile.learning_goal || f.learning_goal,
    }));
  }, [profile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: form.name.trim().slice(0, 80),
        subject: form.subject,
        current_level: form.current_level,
        exam_date: form.exam_date || null,
        daily_study_hours: Number(form.daily_study_hours) || 1,
        learning_goal: form.learning_goal.trim().slice(0, 200),
        onboarded: true,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error(errorMessage(error, "Could not save your profile."));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile saved. Let's find your knowledge gaps.");
    navigate({ to: "/assessment" });
  }

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Let's personalise your plan</h1>
      <p className="mt-2 text-muted-foreground">
        Six quick answers. EduPilot uses these to shape your diagnostic and your roadmap.
      </p>

      <form onSubmit={onSubmit} className="surface mt-8 space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Alex Kumar"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Current knowledge level</Label>
            <Select value={form.current_level} onValueChange={(v) => setForm({ ...form, current_level: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Beginner", "Intermediate", "Advanced"].map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam">Exam date</Label>
            <Input
              id="exam"
              type="date"
              min={minDate}
              required
              value={form.exam_date}
              onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Daily study time (hours)</Label>
            <Input
              id="hours"
              type="number"
              min="0.5"
              max="16"
              step="0.5"
              required
              value={form.daily_study_hours}
              onChange={(e) => setForm({ ...form, daily_study_hours: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal">Learning goal</Label>
          <Textarea
            id="goal"
            rows={3}
            maxLength={200}
            value={form.learning_goal}
            onChange={(e) => setForm({ ...form, learning_goal: e.target.value })}
            placeholder="Score 85%+ in my end-semester exam"
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />} Save and start diagnostic
        </Button>
      </form>
    </div>
  );
}
