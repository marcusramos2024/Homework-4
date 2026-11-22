# Architecture decisions

Short ADR-style log. Add a new entry when a decision changes rather than rewriting an old one.

## ADR-1 Stack

- **Framework:** Next.js 16 (App Router) with TypeScript in strict mode, deployed on Vercel.
- **Database:** PostgreSQL on Neon, accessed through Prisma.
- **Auth:** Auth.js (NextAuth v5) with Google sign-in. Roles are stored on our own `Membership` table, not in the identity provider.
- **Validation:** Zod schemas at every server boundary (server actions, route handlers).
- **Styling:** Tailwind CSS v4.
- **Testing:** Vitest for unit and integration, Playwright for E2E (see testing.md).

## ADR-2 The scheduler is a pure domain module

All scheduling, rescheduling, standings, and seeding logic lives in `src/lib/scheduler/` and `src/lib/standings/`.

- These modules import nothing from Next.js, React, Prisma, or Auth.js.
- Input and output are plain typed objects; no I/O, no `Date.now()` (the caller passes "now" and a seed).
- Reason: this is the most complex part of the app and it needs fast, exhaustive unit and property tests. Keeping it pure also lets us use it from server actions, scripts, and the stretch AI feature without changes.

## ADR-3 Layering

```
src/app/            routes, pages, server actions (thin: auth check, validate, call service)
src/server/         services and Prisma data access; the only layer that touches the DB
src/server/auth.ts  session helpers: requireUser(), requireRole(leagueId, role), requireCaptainOf(teamId)
src/lib/            pure domain logic (scheduler, standings) and shared types
src/components/     UI components
```

Rule: `src/lib` may not import from `src/server` or `src/app`. `src/app` does not import Prisma directly.

## ADR-4 Server-side authorization

Authorization is enforced in services, through the `require*` helpers, on every mutation and every non-public read. UI hiding is a convenience only. Public pages read through a dedicated `publicReadService` that only selects published, non-personal fields.

## ADR-5 Reschedules are proposals

Cancelling a game creates a `RescheduleProposal`. Games only move when a coordinator approves it. The same proposal path is used by the stretch natural-language feature, so the AI never writes to the schedule directly.

## ADR-6 Deterministic generation

The generator takes an explicit seed, so the same input always produces the same schedule. This makes bugs reproducible and lets tests assert exact outputs where needed.
