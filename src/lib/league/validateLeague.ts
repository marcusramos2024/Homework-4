import { err, ok, type Result } from "../result";
import { leagueInputSchema } from "./schema";
import { MINUTES_PER_DAY, toMinutes } from "./time";
import type { League, LeagueError } from "./types";

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
  if (league.seasonEnd < league.seasonStart) {
    errors.push({
      code: "SEASON_END_BEFORE_START",
      seasonStart: league.seasonStart,
      seasonEnd: league.seasonEnd,
    });
  }

  for (const venue of league.venues) {
    for (const slot of venue.slots) {
      if (slot.date < league.seasonStart || slot.date > league.seasonEnd) {
        errors.push({ code: "SLOT_OUTSIDE_SEASON", venueId: venue.id, slotId: slot.id });
      }
      if (toMinutes(slot.start) + slot.durationMinutes > MINUTES_PER_DAY) {
        errors.push({ code: "SLOT_CROSSES_MIDNIGHT", venueId: venue.id, slotId: slot.id });
      }
    }
  }

  return errors.length > 0 ? err(errors) : ok(league);
}
