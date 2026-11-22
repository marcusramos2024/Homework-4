# Fixture: Product Requirements

Intramural league scheduling for university rec programs. Team: Marcus Ramos, Theodore Pei.

## Problem

Intramural coordinators build season schedules by hand in spreadsheets from the registered teams, the courts and fields they have, and the time slots the facility gives them. Captains email in dates they can't play, venues get booked for events, and games get cancelled for weather, so the schedule keeps getting reworked. Teams end up with uneven weeks or always get the late slot, and standings are updated manually.

Fixture generates a fair season schedule from the league's teams, venues, and time slots. It respects blackout dates, reschedules only the affected games when something is cancelled, and calculates standings and playoff seeding automatically.

## Roles

| Role              | Can do                                                                                                                                                   | Cannot do                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Coordinator       | Create leagues, divisions, venues, and time slots. Generate, edit, and publish schedules. Cancel games and approve reschedules. Resolve disputed scores. | n/a (admin of their own leagues only)                |
| Captain           | Manage own roster. Submit blackout dates for own team. Report and confirm scores for own team's games.                                                   | Edit another team's data. See unpublished schedules. |
| Player            | View own team's schedule. RSVP to games.                                                                                                                 | Report scores. Edit the roster.                      |
| Public (no login) | View published schedules, standings, and brackets.                                                                                                       | Any write. See rosters, RSVPs, or emails.            |

## User stories and acceptance criteria

Each acceptance criterion is written so it maps to one or more tests.

### US-1 Create a league

As a coordinator, I want to create a league with divisions, venues, and available time slots, so that the schedule is built from what the facility actually has.

- A league has a name, sport, season start and end dates, and one or more divisions.
- A venue has a name and a list of time slots (date, start time, duration).
- Time slots outside the season dates are rejected.
- Two time slots at the same venue cannot overlap.
- Only coordinators can create or edit leagues (others get 403).

### US-2 Blackout dates

As a captain, I want to submit dates my team can't play before the season is generated, so that we don't get scheduled during exams.

- A captain can add and remove blackout dates for their own team only.
- Blackouts are locked once the schedule is published.
- A team can have at most N blackout dates (configurable per league, default 3).

### US-3 Generate a fair season (scheduler core)

As a coordinator, I want to generate a round-robin season automatically that is fair across teams, so that I'm not building it by hand.

- Every pair of teams in a division plays exactly once (single round robin).
- With an odd number of teams, each round has exactly one bye, and each team gets exactly one bye over the season.
- No team plays twice on the same day.
- No team plays on consecutive days ("no back to back nights").
- No game is placed on a team's blackout date.
- Each slot holds at most one game per venue.
- Late slots (start at or after 21:00) are spread evenly: the difference between the most and fewest late games across teams is at most 1.
- Generation is deterministic for the same input and seed.
- If no valid schedule exists, the generator returns the unsatisfied constraints instead of a partial schedule.

### US-4 Cancel and reschedule

As a coordinator, I want to cancel a game or close a venue for a day and get suggested new times for just the affected games, so that the rest of the schedule doesn't change.

- Only the cancelled games are moved; every other game keeps its slot.
- Suggested times satisfy all US-3 constraints.
- Suggestions stay in "proposed" state until the coordinator approves them.
- Approving publishes the change and records who approved it and when.

### US-5 Score reporting

As a captain, I want to report the final score and have the other captain confirm it, so that standings are accurate.

- Either captain can report; the opposing captain confirms or disputes.
- Only confirmed scores count toward standings.
- A disputed score is flagged for the coordinator, whose decision is final.
- Scores cannot be reported for games that have not started.

### US-6 Schedule and RSVP

As a player, I want to see my team's upcoming games and RSVP, so that my captain knows if we have enough people and we don't forfeit.

- Players see only their own team's RSVPs.
- The captain sees a count of "yes" responses against the sport's minimum roster size and a warning when it is below the minimum.

### US-7 Standings and bracket

As anyone, I want to view standings with tiebreakers and a playoff bracket seeded from them, so that I know where my team stands.

- Standings rank by wins, then head-to-head record, then point differential, then points scored, then an alphabetical fallback.
- Head-to-head among three or more tied teams uses the mini-league of only those teams.
- The bracket seeds the top K teams (configurable) as 1 vs K, 2 vs K-1, and so on.
- Public pages show only published data.

### Stretch: US-8 Natural-language reschedule

As a coordinator, I want to type a change in plain English like "west gym closed next thursday" and get a proposed reschedule to review.

- The model only produces a structured request (venue, date range, reason). The deterministic rescheduler from US-4 computes the moves.
- Nothing is applied without coordinator approval.

## Out of scope (v1)

Team registration and payments, referee assignment, multiple sports seasons running in parallel per league, and mobile apps.

## Security acceptance criteria (applies to every story)

- Every mutation checks the caller's role and team membership on the server, never only in the UI.
- Input is validated with Zod at the server boundary.
- Public endpoints never return emails, rosters, or RSVPs.
- No secrets in the repo; `.env*` is git-ignored and denied to Claude Code.
