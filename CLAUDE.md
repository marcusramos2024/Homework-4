# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Fixture: intramural league scheduling (leagues, round-robin generation, rescheduling, score reporting, standings, playoff seeding). The repo is currently a fresh Next.js scaffold; most of the architecture below is planned, not yet built. Requirements live in `docs/PRD.md` (user stories US-1 to US-8 with testable acceptance criteria), decisions in `docs/architecture.md` (ADRs), and testing rules in `docs/testing.md`.

## Next.js version warning

This is Next.js 16.4 with React 19.3, and its APIs differ from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code, and heed deprecation notices (see `AGENTS.md`). `next.config.ts` enables `cacheComponents` and `partialPrefetching`, and Tailwind v4 runs through a Turbopack CSS loader rule. Route types are generated, so `LayoutProps<"/">`-style globals exist after `next typegen`.

## Commands

```
npm run dev               # dev server on :3000
npm run build
npm run lint              # ESLint (next core-web-vitals + typescript + prettier)
npm run typecheck         # next typegen && tsc --noEmit
npm run format            # Prettier write (format:check to verify)
npm run test              # Vitest single run (unit + integration)
npm run test:watch
npm run test:coverage     # fails below 70% lines
npm run test:e2e          # Playwright; starts `npm run dev` itself
```

Single test: `npx vitest run path/to/file.test.ts -t "test name"`. Single E2E: `npx playwright test tests/e2e/file.spec.ts`.

Vitest only collects `src/**/*.test.ts` and `tests/integration/**/*.test.ts` (node environment, `.ts` not `.tsx`). Coverage excludes `src/app/**`. The `@/` alias maps to `src/`.

## Architecture (from docs/architecture.md)

Layering:

- `src/app/`: routes, pages, server actions. Keep them thin: auth check, Zod validation, call a service. Never import Prisma here.
- `src/server/`: services and Prisma data access, the only layer that touches the DB. `src/server/auth.ts` provides `requireUser()`, `requireRole(leagueId, role)`, `requireCaptainOf(teamId)`.
- `src/lib/`: pure domain logic (`scheduler/`, `standings/`) and shared types. Must not import from `src/server`, `src/app`, Next.js, React, Prisma, or Auth.js. No I/O and no `Date.now()`; callers pass "now" and a seed so generation is deterministic.
- `src/components/`: UI.

Key rules:

- Authorization is enforced server-side in services via the `require*` helpers on every mutation and non-public read; UI hiding is cosmetic. Roles live on our own `Membership` table.
- Public pages read through a dedicated `publicReadService` that selects only published, non-personal fields (never emails, rosters, or RSVPs).
- Cancelling a game creates a `RescheduleProposal`; games move only after coordinator approval. The stretch natural-language feature (US-8) only produces a structured request and goes through the same proposal path.
- If no valid schedule exists, the generator returns unsatisfied constraints, not a partial schedule.

Planned stack: Prisma on Neon Postgres, Auth.js v5 (Google), Zod at server boundaries, Tailwind v4, deployed on Vercel.

## Testing workflow (from docs/testing.md)

- Domain logic is TDD: commit the failing test (`test: ... (red)`), then the implementation (`feat: ... (green)`), then `refactor: ...`.
- Each PRD acceptance criterion maps to at least one test, named after the criterion, e.g. `it("never schedules a team on consecutive days")`.
- Don't change a test to make it pass unless the requirement changed, and say so in the commit message.
- Unit tests sit next to the code; property tests (fast-check) are `src/lib/**/*.property.test.ts`; integration tests in `tests/integration/` run against a test Postgres; E2E in `tests/e2e/`.
- Coverage target: 70% lines overall, 90% for `src/lib/`.

## Permissions and context

`.claude/settings.json` denies reading/editing `.env*` and `*.pem`, editing `prisma/migrations/**`, `rm -rf`, force push, `git reset --hard`, `git clean`, `prisma migrate reset`, and curl/wget. Installs, migrations, push/merge, PRs, and deploys require asking. See `docs/context-management.md` for session habits (one task per session, save longer plans to `docs/plans/<feature>.md`).
