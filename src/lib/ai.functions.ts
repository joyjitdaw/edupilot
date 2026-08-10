import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { chat, chatJson } from "@/lib/ai-gateway.server";
import type { AssessmentAnalysis, MCQ, QuizFeedback, StudyPlan } from "@/lib/edupilot-types";

export const generateDiagnostic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ subject: z.string().min(1).max(80), level: z.string().min(1).max(30) }).parse(input),
  )
  .handler(async ({ data }): Promise<{ questions: MCQ[] }> => {
    const result = await chatJson<{ questions: MCQ[] }>([
      {
        role: "system",
        content:
          "You are an expert assessment designer. You write diagnostic multiple-choice questions that spread across the key topics of a subject so a student's topic-level strengths and gaps can be measured. Respond with JSON only.",
      },
      {
        role: "user",
        content: `Create exactly 10 diagnostic multiple-choice questions for the subject "${data.subject}" at "${data.level}" level.
Cover 5 to 6 distinct core topics of the subject, ordered from foundational to advanced, with 1-2 questions per topic.
Return JSON of this exact shape:
{"questions":[{"id":"q1","topic":"Topic name","question":"...","options":["a","b","c","d"],"correct_index":0,"explanation":"why the correct answer is right"}]}
Each question must have exactly 4 options and one correct answer. Keep topic names short and consistent.`,
      },
    ]);
    const questions = (result.questions ?? []).slice(0, 10).map((q, i) => ({
      ...q,
      id: q.id || `q${i + 1}`,
      options: (q.options ?? []).slice(0, 4),
      correct_index: Math.max(0, Math.min(3, Number(q.correct_index ?? 0))),
    }));
    if (questions.length === 0) throw new Error("The AI could not generate questions. Please try again.");
    return { questions };
  });

export const analyzeAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: z.string().min(1).max(80),
        level: z.string().min(1).max(30),
        overallScore: z.number(),
        topicScores: z.array(z.object({ topic: z.string(), score: z.number() })),
        missed: z.array(z.object({ topic: z.string(), question: z.string(), chosen: z.string(), correct: z.string() })),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<AssessmentAnalysis> => {
    return await chatJson<AssessmentAnalysis>([
      {
        role: "system",
        content:
          "You are a learning diagnostician. You explain topic-level knowledge gaps concretely, never generically. Respond with JSON only.",
      },
      {
        role: "user",
        content: `Subject: ${data.subject}. Student level: ${data.level}. Overall diagnostic score: ${data.overallScore}%.
Topic scores: ${JSON.stringify(data.topicScores)}
Questions answered incorrectly: ${JSON.stringify(data.missed)}

Analyse the likely underlying knowledge gap behind each weak topic (not just "needs practice").
Return JSON:
{"summary":"2-3 sentence honest summary","topics":[{"topic":"...","score":0,"band":"Strong|Good|Needs Practice|Weak|Critical","gap":"specific concept the student is missing"}],"next_steps":["3 to 5 concrete next actions, weakest topic first"]}
Include every topic from the topic scores, using the same score values, sorted from highest score to lowest.`,
      },
    ]);
  });

export const generateStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: z.string().min(1).max(80),
        level: z.string().min(1).max(30),
        goal: z.string().max(200).default(""),
        dailyHours: z.number().min(0.5).max(16),
        daysUntilExam: z.number().int().min(1).max(180),
        analysis: z.array(z.object({ topic: z.string(), score: z.number(), gap: z.string().optional() })),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<StudyPlan> => {
    const plan = await chatJson<StudyPlan>([
      {
        role: "system",
        content:
          "You build personalised, day-by-day study roadmaps that prioritise a student's weakest topics. Never produce a generic plan. Respond with JSON only.",
      },
      {
        role: "user",
        content: `Subject: ${data.subject}. Level: ${data.level}. Goal: ${data.goal || "improve overall mastery"}.
Daily study time: ${data.dailyHours} hours. Days available before exam: ${data.daysUntilExam}.
Diagnostic topic results: ${JSON.stringify(data.analysis)}

Build a day-by-day roadmap of ${Math.min(data.daysUntilExam, 21)} days.
Rules: weakest topics get the most days and come first; add dedicated practice and revision days; each day fits within the daily study time.
Return JSON:
{"summary":"1-2 sentences on how this plan is tailored","days":[{"day":1,"topic":"Topic","focus":"what to learn that day","activities":["2-4 specific activities"],"minutes":120}]}`,
      },
    ]);
    return { summary: plan.summary ?? "", days: (plan.days ?? []).slice(0, 21) };
  });

export const tutorReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: z.string().max(80),
        level: z.string().max(30),
        topic: z.string().max(120),
        mastery: z.number().nullable().optional(),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
          .max(20)
          .default([]),
        message: z.string().min(1).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ reply: string }> => {
    const reply = await chat([
      {
        role: "system",
        content: `You are EduPilot's AI tutor for ${data.subject}. The student is at ${data.level} level and is studying "${data.topic}"${
          data.mastery !== null && data.mastery !== undefined ? ` with a current mastery of ${data.mastery}%` : ""
        }.
Teach, don't lecture: keep answers under 220 words, use short paragraphs or bullets, give concrete examples, and end with one short check-for-understanding question.
Match the explanation depth to the student's level and mastery. Stay on the subject; politely redirect unrelated requests back to studying.`,
      },
      ...data.history,
      { role: "user", content: data.message },
    ]);
    return { reply };
  });

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: z.string().max(80),
        level: z.string().max(30),
        topic: z.string().min(1).max(120),
        mastery: z.number().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ questions: MCQ[] }> => {
    const result = await chatJson<{ questions: MCQ[] }>([
      {
        role: "system",
        content: "You write short, targeted mastery-check quizzes. Respond with JSON only.",
      },
      {
        role: "user",
        content: `Write 4 multiple-choice questions on "${data.topic}" within ${data.subject} for a ${data.level} student${
          data.mastery !== null && data.mastery !== undefined ? ` whose current mastery is ${data.mastery}%` : ""
        }.
If mastery is below 50, focus on core fundamentals; otherwise include applied reasoning.
Return JSON:
{"questions":[{"id":"q1","topic":"${data.topic}","question":"...","options":["a","b","c","d"],"correct_index":0,"explanation":"why the correct answer is right"}]}`,
      },
    ]);
    const questions = (result.questions ?? []).slice(0, 5).map((q, i) => ({
      ...q,
      id: q.id || `q${i + 1}`,
      topic: data.topic,
      options: (q.options ?? []).slice(0, 4),
      correct_index: Math.max(0, Math.min(3, Number(q.correct_index ?? 0))),
    }));
    if (questions.length === 0) throw new Error("The AI could not generate a quiz. Please try again.");
    return { questions };
  });

export const reviewQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        subject: z.string().max(80),
        topic: z.string().max(120),
        score: z.number(),
        previousMastery: z.number().nullable().optional(),
        attempts: z.number().int().min(0).default(0),
        missed: z.array(z.object({ question: z.string(), chosen: z.string(), correct: z.string() })),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<QuizFeedback> => {
    const feedback = await chatJson<QuizFeedback>([
      {
        role: "system",
        content:
          "You are an adaptive learning coach. You decide whether a student should reinforce a topic or move on, based on their trend. Respond with JSON only.",
      },
      {
        role: "user",
        content: `Subject: ${data.subject}. Topic: ${data.topic}. Quiz score: ${data.score}%. Previous mastery: ${
          data.previousMastery ?? "none"
        }. Attempts so far: ${data.attempts}.
Incorrect answers: ${JSON.stringify(data.missed)}

Rules: score below 60 means reinforce the same topic before advancing; 60-79 means more practice on this topic; 80+ means the topic is improving/mastered and the student can advance.
Return JSON:
{"summary":"2-3 sentences, direct and encouraging","weak_concepts":["specific concepts still missing"],"recommendation":"one clear next action for the student","next_action":"reinforce|practice|advance"}`,
      },
    ]);
    return {
      summary: feedback.summary ?? "",
      weak_concepts: feedback.weak_concepts ?? [],
      recommendation: feedback.recommendation ?? "",
      next_action: feedback.next_action ?? (data.score >= 80 ? "advance" : data.score >= 60 ? "practice" : "reinforce"),
    };
  });
