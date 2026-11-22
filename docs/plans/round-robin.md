# Plan: generateRoundRobin (US-3, first slice)

## Context

US-3 needs a fair single round robin. This slice is only the pairing core: who plays whom in which round. Slots, venues, blackouts, back-to-back and late-slot rules come later and build on it. Pure TDD, five cycles.

## What exploring showed

- `src/lib/scheduler/` does not exist yet. `src/lib/league/` does (types, Zod schema, `validateLeague`, tests) and gives the conventions to copy.
- Reuse `Result`, `ok()`, `err()` from `src/lib/result.ts`. Errors there are typed codes (`LeagueError`), so the scheduler error should be a typed code too, not a string.
- Tests sit next to the code: `roundRobin.test.ts`, and `roundRobin.property.test.ts` for the property test. Vitest already collects both (`src/**/*.test.ts`).
- `fast-check` is already in devDependencies, so no dependency to ask about.
- `src/lib` is pure: no `Math.random`, no `Date`. The seed has to drive a small seeded PRNG written in the module.
- `validateLeague` already rejects duplicate team IDs league-wide, so the generator can assume IDs are unique. It still gets a cheap guard (see open items).

## PRD wording on byes is wrong

US-3 says: "With an odd number of teams, each team gets exactly one bye per round."

Read literally that is impossible: it says every team sits out every round. What is meant, and what your cycle 2 says, is two separate facts:

1. Each round has exactly one bye (one team sits out).
2. Over the season each team has exactly one bye (n teams, n rounds, n byes).

Fix in docs/PRD.md: "With an odd number of teams, each round has exactly one bye, and each team gets exactly one bye over the season." Do this as a separate `docs:` commit before the red test, and tell the user the requirement text changed.

## Design

File: `src/lib/scheduler/roundRobin.ts` (types exported from the same file, or `types.ts` if it grows).

```ts
type Round = { games: [string, string][]; bye: string | null };
type RoundRobinSchedule = Round[];
type RoundRobinError = { code: "TOO_FEW_TEAMS"; count: number };
generateRoundRobin(teamIds: string[], seed: number): Result<RoundRobinSchedule, RoundRobinError>
```

Algorithm: circle method. Pad odd counts with a `null` placeholder; whoever pairs with it has the bye. Rounds = n-1 (even) or n (odd). The seed does not change the pairing property; it only decides the starting order of the teams, via a seeded shuffle (mulberry32), so different seeds give different but equally valid schedules. Input order is not trusted for fairness: the same inputs with the same seed always give the same output.

No `Date`, no `Math.random`, explicit return types.

## Cycles

Each cycle: red commit, green commit, refactor only if needed. Run `npx vitest run src/lib/scheduler` at each step.

| #   | Test names (from the criterion)                                                                                                                        | Red because                         | Minimum green                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------ |
| 1   | "plays n-1 rounds for an even team count", "every pair meets exactly once", "each team plays exactly once per round", "has no byes for an even count" | module does not exist               | circle method, no shuffle yet, seed ignored                  |
| 2   | "plays n rounds for an odd count", "has exactly one bye in every round", "gives each team exactly one bye over the season", pairs-once for odd         | even-only code mishandles odd       | pad with a null placeholder, turn its pairing into `bye`     |
| 3   | "returns TOO_FEW_TEAMS for 0 teams", "...for 1 team" (assert `ok: false` and the code, `count` included)                                               | no guard, returns an empty schedule | early `err(...)` when `teamIds.length < 2`                   |
| 4   | "gives different schedules for different seeds", "gives the same schedule for the same seed" (call twice, `toEqual`)                                   | see note below                      | seeded shuffle of the team order before the circle method    |
| 5   | `roundRobin.property.test.ts`: for 2..20 teams, every round-robin invariant from cycles 1 and 2 over random seeds                                      | see note below                      | none expected; fix any real bug the property test finds      |

Notes on strict TDD:

- **Cycle 4:** "same seed gives the same schedule" passes on arrival against the cycle 1-3 code, because the circle method is already deterministic. A test that never failed proves nothing. So the red test is "different seeds give different schedules" (use 8 teams and two fixed seeds, checked once by hand that they differ). Keep the same-seed test too: it is what guards the shuffle later.
- **Cycle 5:** this one is a regression net, so it will probably pass on arrival. To show it can fail, break the implementation by hand once (for example drop one pairing), watch the property test fail and report the shrunk counterexample, then revert. Nothing from that check is committed.
- Property test setup: `fc.integer({ min: 2, max: 20 })` for team count, team IDs built as `t0..t(n-1)`, `fc.integer()` for the seed. Properties: round count, each pair exactly once, no team twice in a round, odd counts have one bye per round and one per team, even counts have none.

## Acceptance criteria to tests

| PRD criterion (US-3)                                                | Test                                       |
| ------------------------------------------------------------------- | ------------------------------------------ |
| Every pair of teams plays exactly once                              | cycle 1 and 2 example tests, cycle 5 property |
| Odd count: one bye per round, one bye per team (after wording fix)  | cycle 2, cycle 5                           |
| Deterministic for the same input and seed                           | cycle 4                                    |
| (added) fewer than 2 teams is an error, not an empty schedule       | cycle 3                                    |

Not in this slice (later US-3 work): same-day and back-to-back rules, blackouts, one game per slot per venue, late-slot spread, and returning unsatisfied constraints. Those need slots and dates, which this function deliberately does not take.

## Commit plan

Branch: `feat/<issue-number>-round-robin` (issue number needed, none exists in the repo).

1. `docs: save round robin plan` (this plan to `docs/plans/round-robin.md`)
2. `docs: fix prd bye wording`
3. `test: even team count round robin (red)` then `feat: even team count round robin (green)`
4. `test: odd team count byes (red)` then `feat: odd team count byes (green)`
5. `test: reject fewer than 2 teams (red)` then `feat: reject fewer than 2 teams (green)`
6. `test: seed changes the schedule (red)` then `feat: seeded team order (green)`
7. `test: round robin property tests` (plus `refactor:` if any)

Messages are short and lowercase, with no attribution lines.

## Open items

- **Duplicate team IDs** (`["a", "a"]`) are not in your five cycles. They would produce a schedule where a team plays itself. `validateLeague` already blocks them upstream, so the plan leaves them out. Say so if you want a sixth cycle (`DUPLICATE_TEAM_ID`).
- **Home/away** is not modeled; `games` is an unordered pair. Add it when the score-reporting work needs it.

## Verification

- `npx vitest run src/lib/scheduler` after each step.
- Before the final commit: `npm run typecheck && npm run lint && npm run test`, and `npm run test:coverage` to confirm `src/lib/scheduler` is well above the 90% target for `src/lib`.
- Manual check: print the schedule for 6 and 5 teams with a fixed seed and read it once.

## First action after approval

Plan mode only allows this file, so the copy to `docs/plans/round-robin.md` (what you asked for) happens as step 1 once the plan is approved.
