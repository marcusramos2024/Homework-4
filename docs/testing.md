# Testing strategy

## Test pyramid

| Layer       | Tool                | Location                            | What it covers                                                        |
| ----------- | ------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| Unit        | Vitest              | `src/**/*.test.ts` next to the code | Scheduler, rescheduler, standings, seeding, Zod schemas, auth helpers |
| Property    | Vitest + fast-check | `src/lib/**/*.property.test.ts`     | Scheduler and standings invariants over random leagues                |
| Integration | Vitest              | `tests/integration/`                | Services against a test Postgres database, including role checks      |
| E2E         | Playwright          | `tests/e2e/`                        | Main flows in a real browser                                          |

## TDD rules

- New domain logic is written test first: commit the failing test (`test: ... (red)`), then the minimum implementation (`feat: ... (green)`), then any cleanup (`refactor: ...`).
- One acceptance criterion from docs/PRD.md becomes at least one test. Name tests after the criterion, for example `it("never schedules a team on consecutive days")`.
- Do not change a test to make it pass unless the requirement changed; say so in the commit message if it did.

## Property tests worth having

- Every pair of teams in a division meets exactly once.
- No team appears twice on one day, or on consecutive days.
- No game lands on a blackout date.
- Late-slot count spread across teams is at most 1.
- Rescheduling moves only the cancelled games.
- Standings order is a total order and does not depend on input order.

## E2E flows (minimum)

1. Coordinator creates a league, generates a schedule, and publishes it.
2. Captain reports a score, the other captain confirms it, and public standings update.

## Coverage

Target 70% lines overall and 90% for `src/lib/`. Run `npm run test:coverage`. CI fails below the threshold.

## Commands

```
npm run test            # unit + integration, single run
npm run test:watch      # watch mode while doing TDD
npm run test:coverage   # with coverage report
npm run test:e2e        # Playwright
npm run typecheck       # tsc --noEmit
npm run lint            # ESLint
npm run format          # Prettier write
```
