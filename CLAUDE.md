# Fixture

Intramural league scheduling for university rec programs. Coordinators build leagues and publish schedules, captains manage teams and report scores, players RSVP, and the public sees schedules and standings. Built by Marcus Ramos and Theodore Pei for CS 6983 Project 3.

Status: early. The repo is a Next.js scaffold plus docs; most of the layout below is planned, not built. Check what exists before assuming a file or helper is there.

Requirements and acceptance criteria: @docs/PRD.md
Architecture decisions: @docs/architecture.md
Testing strategy: @docs/testing.md
Context management: @docs/context-management.md
Next.js version notes: @AGENTS.md

## Tech stack

- Next.js 16, App Router, React 19, TypeScript (strict)
- PostgreSQL (Neon) via Prisma
- Auth.js (NextAuth v5) with Google sign-in, roles stored in our `Membership` table
- Zod for validation, Tailwind CSS v4 for styling
- Vitest (unit, integration, property tests with fast-check), Playwright (E2E)
- Vercel for preview and production deploys, GitHub Actions for CI

## Commands

```
npm run dev             # local dev server on :3000
npm run test            # Vitest, single run
npm run test:watch      # Vitest watch mode (use during TDD)
npm run test:coverage   # coverage, fails under 70% lines
npm run test:e2e        # Playwright
npm run typecheck       # next typegen && tsc --noEmit
npm run lint            # ESLint
npm run format          # Prettier
```

Single test: `npx vitest run path/to/file.test.ts -t "test name"`. Single E2E: `npx playwright test tests/e2e/file.spec.ts`.

Vitest only collects `src/**/*.test.ts` and `tests/integration/**/*.test.ts` in a node environment (`.ts`, not `.tsx`). Coverage excludes `src/app/**`. The `@/` alias maps to `src/`.

Run `npm run typecheck && npm run lint && npm run test` before every commit.

## Next.js 16 notes

- Next.js 16 and React 19 APIs differ from older versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code, and follow deprecation notices.
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Tailwind v4 runs through a Turbopack CSS loader rule.
- Route types are generated: globals like `LayoutProps<"/">` only exist after `next typegen`, which is why `typecheck` runs it first.

## Project layout

```
src/app/         routes, pages, server actions. Thin: auth check, validate, call a service.
src/server/      services and Prisma access. Only layer that touches the DB.
src/server/auth.ts   requireUser(), requireRole(leagueId, role), requireCaptainOf(teamId)
src/lib/scheduler/   pure scheduling and rescheduling logic
src/lib/standings/   pure standings, tiebreakers, seeding
src/components/  UI components
tests/integration/   service tests against a test database
tests/e2e/       Playwright specs
docs/            PRD, ADRs, testing, plans
```

## Coding conventions

- TypeScript strict. No `any`; use `unknown` and narrow. Export explicit return types from `src/lib` and `src/server`.
- Files: `camelCase.ts` for modules, `PascalCase.tsx` for components. Tests sit next to the code as `name.test.ts`; property tests as `name.property.test.ts`.
- Server Components by default. Add `"use client"` only for interactivity.
- Mutations go through server actions that call a service. No Prisma calls in `src/app`.
- Every server action and route handler parses input with a Zod schema before doing anything else.
- Dates: store UTC in the DB. The scheduler works with plain `{ date: "YYYY-MM-DD", start: "HH:MM" }` values in the league's local time zone. Never call `new Date()` or `Date.now()` inside `src/lib`; take "now" as a parameter.
- Errors from services are typed results (`{ ok: true, value } | { ok: false, error }`) for expected failures; throw only for bugs.
- Commits follow Conventional Commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`. TDD commits are tagged `(red)`, `(green)`, or `(refactor)`.
- One branch per GitHub issue: `feat/<issue-number>-short-name`.

## Do

- Read the acceptance criteria in docs/PRD.md before touching a feature, and write tests for them first.
- Keep `src/lib` pure: no imports from Next.js, React, Prisma, Auth.js, `src/server`, or `src/app`.
- Check authorization on the server in every mutation and every non-public read, using the `require*` helpers.
- Make reschedules go through a `RescheduleProposal` that a coordinator approves.
- Keep the scheduler deterministic: pass an explicit seed.
- Use Plan mode for any change touching more than two files, and save the plan to `docs/plans/` if it spans sessions.
- When you learn something that would have saved time, suggest adding it here.

## Don't

- Don't read, print, or edit `.env` files, and never hard-code secrets or connection strings.
- Don't hand-edit files in `prisma/migrations/`. Change `schema.prisma` and generate a migration.
- Don't weaken or delete a failing test to make it pass. If the requirement changed, say so.
- Don't let public pages or endpoints return emails, rosters, or RSVPs.
- Don't trust role or team IDs sent from the client; derive them from the session.
- Don't add dependencies without asking first.
- Don't let the stretch AI feature write to the schedule. It only produces a structured request that the deterministic rescheduler turns into a proposal.

## Security (OWASP Top 10 awareness)

- **Broken access control (A01):** the biggest risk here. Captains must not edit other teams, players must not report scores. Every service checks membership; integration tests cover each role.
- **Injection (A03):** Prisma parameterizes queries. No `$queryRawUnsafe`. Zod validates every input.
- **Cryptographic failures / secrets (A02):** secrets only in Vercel env vars and local `.env`, never in the repo.
- **Insecure design (A04):** reschedules are proposals, never direct writes.
- **Security misconfiguration (A05):** no debug output in production, security headers set in `next.config.ts`.
- **Vulnerable components (A06):** `npm audit` runs in CI.
- **Auth failures (A07):** sessions come from Auth.js only; no custom auth.
- **Data integrity (A08):** score changes require confirmation from the opposing captain or a coordinator.
- **Logging (A09):** log approvals, score disputes, and role changes with user ID and time.
- **SSRF (A10):** the app makes no user-controlled outbound requests.

## Definition of done

- Acceptance criteria from docs/PRD.md have tests, and they pass.
- `typecheck`, `lint`, and `test` pass locally and in CI.
- Role checks have an integration test for the allowed role and at least one denied role.
- No new secrets, no public exposure of personal data.
- PR includes AI disclosure (tool used, rough % AI-generated, what a human reviewed).
