import { err, ok, type Result } from "../result";
import { leagueInputSchema } from "./schema";
import { MINUTES_PER_DAY, toMinutes } from "./time";
import type { League, LeagueError, Venue } from "./types";

/**
 * Validates raw "create league" input. Returns the league, or every problem found
 * so a coordinator can fix all bad slots in one pass.
 */
export function validateLeague(input: unknown): Result<League, LeagueError[]> {
  const parsed = leagueInputSchema.safeParse(input);
  if (!parsed.success) {
    return err(
      parsed.error.issues.map((issue) => ({
        code: "INVALID_INPUT" as const,
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }

  const league: League = parsed.data;
  const errors: LeagueError[] = [];

  // YYYY-MM-DD strings sort the same way the dates do, so plain comparison works.
  const seasonIsValid = league.seasonEnd >= league.seasonStart;
  if (!seasonIsValid) {
    errors.push({
      code: "SEASON_END_BEFORE_START",
      seasonStart: league.seasonStart,
      seasonEnd: league.seasonEnd,
    });
  }

  for (const venue of league.venues) {
    errors.push(...findOverlaps(venue));
    for (const slot of venue.slots) {
      // With backwards season dates every slot would look "outside", which is just noise.
      if (seasonIsValid && (slot.date < league.seasonStart || slot.date > league.seasonEnd)) {
        errors.push({ code: "SLOT_OUTSIDE_SEASON", venueId: venue.id, slotId: slot.id });
      }
      if (toMinutes(slot.start) + slot.durationMinutes > MINUTES_PER_DAY) {
        errors.push({ code: "SLOT_CROSSES_MIDNIGHT", venueId: venue.id, slotId: slot.id });
      }
    }
  }

  return errors.length > 0 ? err(errors) : ok(league);
}

/**
 * Pairs of slots at one venue whose time ranges intersect. Slots never cross midnight,
 * so only slots on the same date can overlap. Touching slots (19:00-20:00 and
 * 20:00-21:00) are fine.
 */
function findOverlaps(venue: Venue): LeagueError[] {
  const errors: LeagueError[] = [];
  const sorted = [...venue.slots].sort(
    (a, b) => a.date.localeCompare(b.date) || toMinutes(a.start) - toMinutes(b.start),
  );

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const currentEnd = toMinutes(current.start) + current.durationMinutes;
    // Compare against every later slot that starts before this one ends, not just the
    // next one: a long slot can overlap several short ones.
    for (let j = i + 1; j < sorted.length; j++) {
      const next = sorted[j];
      if (next.date !== current.date || toMinutes(next.start) >= currentEnd) break;
      errors.push({ code: "SLOT_OVERLAP", venueId: venue.id, slotIds: [current.id, next.id] });
    }
  }
  return errors;
}
