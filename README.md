# EduPilot: Your AI Learning Compass

Create EduPilot as a complete modern EdTech application. Use Supabase as the backend/database and authentication provider. I will connect my existing Supabase project through Lovable's Supabase integration. Do not create a separate database.Build a complete, modern, premium, responsive EdTech web application called "EduPilot".

TAGLINE:

"Your AI-Powered Learning Guide"

CORE IDEA:

EduPilot is an adaptive AI learning platform for students.

Instead of giving every student the same study plan, EduPilot first evaluates the student's actual knowledge, identifies strengths and knowledge gaps, creates a personalized learning roadmap, provides an AI tutor, and continuously adapts recommendations based on quiz performance.

The core learning cycle is:

ASSESS → ANALYZE → PLAN → LEARN → TEST → ADAPT

==================================================

TECH STACK

==================================================

Use:

- React / TypeScript

- Tailwind CSS

- Supabase for authentication and PostgreSQL database

- Gemini API for AI features

- Responsive design for desktop, tablet and mobile

- Production-ready architecture suitable for Vercel deployment

Do NOT create an unnecessary traditional backend such as Express or Django.

Use Supabase and secure server-side/serverless functions where necessary.

==================================================

SUPABASE

==================================================

Use the connected Supabase project for this application.

Use Supabase for:

- Authentication

- PostgreSQL database

- Student profiles

- Diagnostic assessments

- Study plans

- Topic progress

- Quiz results

- Learning history

Do not create a separate database.

Create the required database tables, relationships, indexes and Row Level Security policies.

DATABASE TABLES:

1. profiles

Fields:

- id

- name

- email

- subject

- current_level

- exam_date

- daily_study_hours

- learning_goal

- created_at

- updated_at

2. assessments

Fields:

- id

- user_id

- subject

- questions

- answers

- score

- topic_analysis

- created_at

3. study_plans

Fields:

- id

- user_id

- plan_data

- created_at

- updated_at

4. topic_progress

Fields:

- id

- user_id

- topic

- mastery_score

- status

- attempts

- last_score

- updated_at

5. quiz_results

Fields:

- id

- user_id

- topic

- questions

- answers

- score

- feedback

- created_at

Use appropriate PostgreSQL data types.

Add foreign-key relationships where appropriate.

Enable Row Level Security.

A user must only be able to access their own:

- profile

- assessments

- study plans

- topic progress

- quiz results

==================================================

AUTHENTICATION

==================================================

Implement Supabase Authentication.

Include:

- Sign Up

- Login

- Logout

- Session persistence

- Protected dashboard

- User profile

After signup, guide the student through onboarding.

==================================================

PAGE STRUCTURE

==================================================

Create these main pages:

1. Landing Page

2. Login

3. Sign Up

4. Onboarding

5. Dashboard

6. Diagnostic Assessment

7. Assessment Results

8. Personalized Roadmap

9. AI Tutor

10. Mini Quiz

11. Progress

12. Profile

Create a clean navigation system between these pages.

==================================================

1. LANDING PAGE

==================================================

Create a premium modern EdTech landing page.

Hero headline:

"Stop studying everything.

Start studying what you need."

Supporting text:

"EduPilot uses AI to understand your strengths and knowledge gaps, then builds a personalized learning path around what you actually need to learn."

Primary CTA:

"Start Learning"

Secondary CTA:

"How It Works"

Include sections explaining:

- AI Diagnostic Assessment

- Knowledge Gap Detection

- Personalized Learning Roadmap

- AI Tutor

- Adaptive Quizzes

- Progress Tracking

Use a professional startup-style design.

Avoid excessive animations and visual clutter.

==================================================

2. ONBOARDING

==================================================

After signup, collect:

- Student name

- Subject

- Current knowledge level

- Exam date

- Daily available study time

- Learning goal

Example:

Subject:

Data Structures

Level:

Intermediate

Exam:

25 days

Daily study:

2 hours

Goal:

Score 85%+

Save this information to the profiles table.

Make onboarding simple and visually polished.

==================================================

3. AI DIAGNOSTIC ASSESSMENT

==================================================

This is one of the core features.

The AI should generate approximately 10 diagnostic questions based on:

- selected subject

- current knowledge level

Questions should cover important topics within the selected subject.

Initially support multiple-choice questions.

Create:

- Question card

- Answer options

- Question number

- Progress indicator

- Previous button

- Next button

- Submit Assessment button

After submission, analyze the answers using Gemini.

==================================================

4. AI KNOWLEDGE GAP ANALYSIS

==================================================

After the diagnostic test, display a clear knowledge analysis.

Show:

- Overall score

- Strong topics

- Good topics

- Topics needing practice

- Critical weak topics

- Recommended next steps

Example:

Arrays

90% — Strong

Linked Lists

80% — Good

Trees

55% — Needs Practice

Graphs

30% — Weak

Dynamic Programming

20% — Critical

Do not only display the total score.

Use AI to identify topic-level weaknesses and explain the likely knowledge gaps.

Save the assessment and analysis in Supabase.

==================================================

5. PERSONALIZED STUDY ROADMAP

==================================================

Generate a personalized study plan using:

- Diagnostic results

- Weak topics

- Current level

- Exam date

- Daily study time

- Learning goal

The plan must prioritize weak areas.

Example:

DAY 1

Graph Representation

DAY 2

BFS

DAY 3

DFS

DAY 4

BFS/DFS Practice

DAY 5

Trees Revision

DAY 6

Tree Practice

Do not generate the same generic plan for every student.

Save the generated plan in Supabase.

==================================================

6. AI TUTOR

==================================================

Create an AI Tutor interface.

Students can select a topic and ask questions.

Provide quick actions:

- Explain Simply

- Give an Example

- Give an Analogy

- Quiz Me

- Explain Again

The tutor should consider the student's current knowledge level.

It should behave like a learning assistant rather than a generic chatbot.

Keep the interface clean and conversational.

==================================================

7. AI MINI QUIZ

==================================================

Allow students to take a short quiz after studying a topic.

Generate approximately 3–5 questions using Gemini.

After submission:

- Calculate score

- Explain incorrect answers

- Identify weak concepts

- Update topic mastery

- Recommend the next action

Save the result in Supabase.

==================================================

8. ADAPTIVE LEARNING

==================================================

This is the main differentiating feature of EduPilot.

The system should adapt based on performance.

Example:

Initial Graph score:

30%

Student studies BFS.

Mini quiz:

40%

EduPilot should NOT simply move to the next topic.

Instead:

"You're still struggling with BFS. Let's reinforce this concept before moving forward."

Recommend additional explanation and practice.

If the next quiz score becomes:

85%

Then mark the topic as improving/mastered and recommend the next appropriate topic.

Use recent quiz performance to determine recommendations.

==================================================

9. DASHBOARD

==================================================

Create a polished student dashboard.

Display:

- Welcome message

- Overall mastery

- Current learning streak

- Today's goal

- Strong topics

- Weak topics

- Recent quiz scores

- Current roadmap

- AI recommendation

- Continue Learning button

Example:

"Your weakest area right now is Dynamic Programming. Complete today's reinforcement session before moving forward."

Make the dashboard visually impressive but not cluttered.

==================================================

10. PROGRESS

==================================================

Create a progress page showing:

- Overall mastery

- Topic mastery

- Quiz history

- Completed topics

- Improving topics

- Topics needing attention

Use simple charts and progress indicators.

Do not create unnecessary analytics.

==================================================

11. PROFILE

==================================================

Allow students to view and update:

- Name

- Subject

- Level

- Exam date

- Daily study time

- Learning goal

Save changes to Supabase.

==================================================

AI INTEGRATION

==================================================

Use Gemini for:

1. Diagnostic question generation

2. Answer evaluation

3. Knowledge-gap analysis

4. Personalized study plan generation

5. AI Tutor responses

6. Mini quiz generation

7. Adaptive recommendations

IMPORTANT SECURITY REQUIREMENTS:

- Never hard-code the Gemini API key.

- Never expose the Gemini API key in client-side code.

- Store the Gemini API key as a secure environment/secret variable.

- Use a secure server-side/serverless function for Gemini requests where appropriate.

- Never commit secrets to GitHub.

Use clear loading indicators during AI requests.

Handle API failures gracefully.

If Gemini fails, show a useful error message instead of breaking the application.

==================================================

UI / UX

==================================================

The design should feel like a real premium EdTech startup.

Use:

- Clean typography

- Strong visual hierarchy

- Consistent spacing

- Modern cards

- Professional buttons

- Subtle animations

- Responsive layouts

- Mobile-first design

- Loading states

- Skeleton states where appropriate

- Empty states

- Error states

- Toast notifications

Use a consistent design system throughout the entire application.

Avoid:

- Excessive gradients

- Excessive glassmorphism

- Excessive animations

- Clutter

- Too many colors

- Unnecessary features

The website must work properly on:

- Desktop

- Tablet

- Mobile

==================================================

CORE USER FLOW

==================================================

The complete working flow should be:

Landing Page

↓

Sign Up / Login

↓

Onboarding

↓

Dashboard

↓

Start Diagnostic

↓

AI generates questions

↓

Student answers

↓

AI analyzes performance

↓

Knowledge Gap Analysis

↓

Personalized Roadmap

↓

AI Tutor

↓

Mini Quiz

↓

Progress Updated

↓

AI Recommendation

↓

Adaptive Learning

Make this flow smooth and intuitive.

==================================================

PERFORMANCE

==================================================

Keep the application fast and efficient.

- Avoid unnecessary API calls.

- Do not regenerate AI content unnecessarily.

- Show loading states during AI operations.

- Cache or persist appropriate data.

- Keep database queries efficient.

- Make the production build suitable for Vercel.

==================================================

IMPORTANT

==================================================

Build a real functional application, not just a visual mockup.

Prioritize the core adaptive-learning experience.

Do not add unrelated features.

Do not create a generic ChatGPT clone.

The key innovation is:

"EduPilot identifies what a student actually knows, finds their knowledge gaps, creates a personalized learning path, and adapts that path based on future performance."

Make the application production-ready, maintainable and suitable for GitHub submission and Vercel deployment.

Do not ask unnecessary follow-up questions. Make sensible technical decisions and implement the project.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/91f30ccd-c5a4-4164-91cd-c78198097d6b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
