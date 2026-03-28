# 1. Product Requirement Summary

SKCT Prep MVP is an SKCT simulator, wrong-answer training system, and AI strategy coach. The product focuses on realistic timed solving, low-friction wrong-answer review, and personalized coaching that teaches faster solving patterns instead of only textbook explanations.

## Core Jobs

- Simulate an SKCT-like timed solving environment.
- Remove review friction by chaining short timers automatically in wrong-answer mode.
- Rebuild personalized mock tests in fixed SKCT section order from weakness history.
- Give concise AI review that explains the answer, the fastest route, the trap, and the takeaway.
- Summarize weakness patterns at the session and dashboard level.

# 2. Architecture Decision Summary

- Next.js App Router is used for both UI and route handlers to keep the MVP deployable and simple.
- Prisma + PostgreSQL provides structured persistence for questions, attempts, sessions, wrong-answer history, memos, and AI logs.
- A simple phone/password auth flow with cookie sessions is used for MVP speed.
- Zustand manages solving-session state on the client so the solving UI stays responsive without round-tripping every interaction.
- The AI layer is isolated behind an OpenAI-compatible adapter. If no credentials are present, deterministic fallback coaching keeps the product usable.
- Session generation logic lives in a reusable service so the dashboard, APIs, and future background jobs share the same prioritization rules.
- `standalone` Next.js output supports AWS App Runner, ECS, or EC2 deployment.

# 3. Folder Structure

```text
app/
  api/
    mock-tests/generate/route.ts
    review/route.ts
    sessions/[sessionId]/route.ts
    sessions/[sessionId]/submit/route.ts
  dashboard/page.tsx
  sessions/[sessionId]/results/page.tsx
  solve/[sessionId]/page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  dashboard/
  solve/
  ui/
docs/
  mvp-spec.md
lib/
  ai/
  services/
  stores/
  auth.ts
  prisma.ts
  types.ts
  utils.ts
prisma/
  schema.prisma
  seed.ts
```

# 4. Database Schema

## Main Entities

- `User`: learner identity
- `QuestionType`: SKCT section/type metadata and ordering
- `Question`: prompt, metadata, strategy hints
- `AnswerChoice`: choice rows with correctness
- `MockTestSession`: generated simulator session
- `MockTestSessionQuestion`: ordered questions within a session
- `UserAttempt`: answer event with time and self-assessment
- `WrongAnswerHistory`: long-lived weakness memory per user and question
- `AIReviewLog`: prompt/response audit trail
- `Memo`: per-question notes captured during solving

## Behavioral Rules

- Question types are ordered and used when generating personalized mock tests.
- Wrong-answer history accumulates counts and a `strengthScore` to rank weak items.
- Recent attempts are down-weighted to avoid immediate repetition.
- Sessions can be general full mocks or wrong-answer focused mocks.

# 5. Implementation Plan

1. Build a clean Next.js application shell with a simple login flow.
2. Create Prisma schema for realistic SKCT practice and review history.
3. Seed representative question types and SKCT-style questions.
4. Implement dashboard metrics and mock-test generation service.
5. Build the solving workspace with timer, memo, calculator, OMR, keyboard controls, and auto-advance behavior.
6. Implement submission flow to persist attempts, memos, wrong-answer history, and result summaries.
7. Add AI review API and a results page that exposes explanation and coaching outputs.
8. Document setup, testing, and next-step improvements.

# 6. Actual Code Files

The actual code is in the repository files created alongside this document.

# 7. Seed Data

Seed data includes:

- three ordered SKCT-style question types
- nine sample multiple-choice questions
- a clean member state so signup can start without seeded account data

# 8. Setup Instructions

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

# 9. Test Strategy

- Unit test generation logic for type ordering, recent-attempt exclusion, and weak-type prioritization.
- Unit test result scoring and wrong-answer history updates.
- Component test the solver for keyboard input, auto-advance, and unanswered highlighting.
- Route-handler tests for session generation, submission, and AI review fallback.
- E2E smoke test for dashboard -> solve -> submit -> results.

# 10. Future Improvement Suggestions

- Add real authentication and multi-user organizations.
- Import larger licensed question banks and richer SKCT taxonomy.
- Persist draft solving state during an active session.
- Add adaptive timing recommendations based on per-type speed.
- Stream AI coaching and session-level habit analysis.
- Add instructor/admin tooling for question curation.
- Introduce spaced repetition scheduling beyond simple wrong-answer requeue logic.
