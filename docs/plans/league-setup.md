# Plan: US-1 league setup

## Goal

Turn raw "create league" input into a validated `League` the scheduler can trust, covering the US-1 acceptance criteria in docs/PRD.md.

## What exploring the repo showed

- `src/` only has the Next.js scaffold, so there is no existing league code to reuse or conflict with.
- `zod` is not installed yet, even though CLAUDE.md says every server boundary uses it.
- CLAUDE.md says `src/lib` must stay pure (no Next, Prisma, Auth.js, no `new Date()`), and that the scheduler works with plain `"YYYY-MM-DD"` dates and `"HH:MM"` times in the league's local time zone.
- Vitest only picks up `src/**/*.test.ts`, so tests go next to the code.

## Scope

In:

- League, division, team, venue, and time slot types.
- A Zod schema for the input shape (formats, required fields, at least one division).
- `validateLeague(input)` that checks the rules Zod can't express cleanly.

Out (and why):

- "Only coordinators can create or edit leagues (403)". This needs Auth.js and the `Membership` table, which don't exist yet. It will be covered by `requireRole()` in `src/server/auth.ts` and an integration test when the server action is added. Logged as a follow-up rather than faked now.
- Saving to the database and the create-league form. Those come with the Prisma work; the validation here is what the server action will call.

## Design

Files:

```
src/lib/result.ts                    Result<T, E> + ok() / err()
src/lib/league/types.ts              League, Division, Team, Venue, TimeSlot, LeagueError
src/lib/league/time.ts               isRealDate(), toMinutes()
src/lib/league/schema.ts             leagueInputSchema (Zod)
src/lib/league/validateLeague.ts     validateLeague(input): Result<League, LeagueError[]>
```

Decisions:

1. **Return every error, not just the first.** A coordinator entering 40 time slots should see all the bad ones at once. So the result is `Result<League, LeagueError[]>`.
2. **Typed error codes instead of strings.** `SLOT_OUTSIDE_SEASON`, `SLOT_OVERLAP`, and so on, each with the venue and slot IDs. The UI can highlight the exact slot, and tests can assert on codes instead of message wording.
3. **Dates stay as `"YYYY-MM-DD"` strings.** Same-format date strings compare correctly with `<` and `>`, so "inside the season" is a string comparison and needs no `Date` object or time zone handling. `isRealDate()` checks the calendar by hand so `2027-02-30` is rejected.
4. **A slot cannot run past midnight.** A 23:00 slot lasting 120 minutes is rejected. Intramural slots never cross midnight in practice, and this rule means two slots can only overlap if they're on the same date, which keeps the overlap check simple.
5. **Overlap means the time ranges intersect.** Slots that touch end-to-start (18:00-19:00 and 19:00-20:00) are fine. Only slots at the same venue are compared.
6. **Duration is a whole number of minutes, 15 to 480.** Stops typos like `0` or `6000`.

## Acceptance criteria to tests

| Criterion                                                   | Test                                                                                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| League has name, sport, season dates, one or more divisions | schema rejects a missing name, a bad date format, and zero divisions                                           |
| Venue has a name and slots (date, start, duration)          | schema rejects a bad `HH:MM` and an out-of-range duration                                                      |
| Slots outside the season are rejected                       | `SLOT_OUTSIDE_SEASON` for a slot one day before the start and one day after the end; boundary days are allowed |
| Two slots at the same venue cannot overlap                  | `SLOT_OVERLAP` for intersecting slots; touching slots and slots at different venues pass                       |
| (added) season end before start                             | `SEASON_END_BEFORE_START`                                                                                      |
| (added) slot past midnight                                  | `SLOT_CROSSES_MIDNIGHT`                                                                                        |
| Only coordinators (403)                                     | deferred, see Scope                                                                                            |

## Commit plan

1. This plan.
2. Zod, the types, the result helper, and the input schema with its tests.
3. Season date checks, slots outside the season, slots past midnight.
4. Overlapping slots at the same venue.
