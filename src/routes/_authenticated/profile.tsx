import { createFileRoute } from "@tanstack/react-router";
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
import { LoadingState } from "@/components/ui-states";
import { errorMessage, useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — EduPilot" },
      { name: "description", content: "Update your subject, level, exam date, study time and learning goal." },
      { property: "og:title", content: "Profile — EduPilot" },
      { property: "og:description", content: "Update your subject, level, exam date, study time and goal." },
    ],
  }),
  component: ProfilePage,
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

function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject: "",
    current_level: "Intermediate",
    exam_date: "",
    daily_study_hours: "2",
    learning_goal: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      name: profile.name ?? "",
      subject: profile.subject ?? SUBJECTS[0]!,
      current_level: profile.current_level ?? "Intermediate",
      exam_date: profile.exam_date ?? "",
      daily_study_hours: profile.daily_study_hours ? String(profile.daily_study_hours) : "2",
      learning_goal: profile.learning_goal ?? "",
    });
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
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error(errorMessage(error, "Could not save your changes."));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile updated");
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold sm:text-3xl">Profile</h1>
      <p className="mt-1 text-muted-foreground">
        Changing these updates how EduPilot generates your diagnostics, plans and quizzes.
      </p>

      <form onSubmit={onSubmit} className="surface mt-8 space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={profile?.email ?? ""} disabled />
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
            <Label>Level</Label>
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
          />
        </div>

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />} Save changes
        </Button>
      </form>
    </div>
  );
}
