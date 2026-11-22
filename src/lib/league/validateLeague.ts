import { err, ok, type Result } from "../result";
import { leagueInputSchema, timeSlotSchema } from "./schema";
import { isRealDate, MINUTES_PER_DAY, toMinutes } from "./time";
import type { DateString, League, LeagueError, TimeSlot } from "./types";

type Season = { start: DateString; end: DateString };
type VenueSlots = { id: string; slots: TimeSlot[] };

/**
 * Validates raw "create league" input. Returns the league, or every problem found
 * so a coordinator can fix all bad slots in one pass. If some fields are malformed,
 * the rule checks still run on the parts that are well-formed.
 */
export function validateLeague(input: unknown): Result<League, LeagueError[]> {
  const parsed = leagueInputSchema.safeParse(input);
  if (parsed.success) {
    const league: League = parsed.data;
    const errors = [
      ...findDuplicateIds(league),
      ...checkRules({ start: league.seasonStart, end: league.seasonEnd }, league.venues),
    ];
    return errors.length > 0 ? err(errors) : ok(league);
  }

  const inputErrors: LeagueError[] = parsed.error.issues.map((issue) => ({
    code: "INVALID_INPUT",
    path: issue.path.join("."),
    message: issue.message,
  }));
  const partial = salvage(input);
  return err([...inputErrors, ...checkRules(partial.season, partial.venues)]);
}

function checkRules(season: Season | null, venues: VenueSlots[]): LeagueError[] {
  const errors: LeagueError[] = [];

  // YYYY-MM-DD strings sort the same way the dates do, so plain comparison works.
  const seasonIsValid = season !== null && season.end >= season.start;
  if (season !== null && !seasonIsValid) {
    errors.push({
      code: "SEASON_END_BEFORE_START",
      seasonStart: season.start,
      seasonEnd: season.end,
    });
  }

  for (const venue of venues) {
    errors.push(...findOverlaps(venue));
    for (const slot of venue.slots) {
      // With backwards season dates every slot would look "outside", which is just noise.
      if (seasonIsValid && (slot.date < season.start || slot.date > season.end)) {
        errors.push({ code: "SLOT_OUTSIDE_SEASON", venueId: venue.id, slotId: slot.id });
      }
      if (toMinutes(slot.start) + slot.durationMinutes > MINUTES_PER_DAY) {
        errors.push({ code: "SLOT_CROSSES_MIDNIGHT", venueId: venue.id, slotId: slot.id });
      }
    }
  }
  return errors;
}

/**
 * Pairs of slots at one venue whose time ranges intersect. Slots never cross midnight,
 * so only slots on the same date can overlap. Touching slots (19:00-20:00 and
 * 20:00-21:00) are fine.
 */
function findOverlaps(venue: VenueSlots): LeagueError[] {
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

/** IDs must be unique within their kind across the whole league, or error IDs are ambiguous. */
function findDuplicateIds(league: League): LeagueError[] {
  const groups = {
    division: league.divisions.map((d) => d.id),
    team: league.divisions.flatMap((d) => d.teams.map((t) => t.id)),
    venue: league.venues.map((v) => v.id),
    slot: league.venues.flatMap((v) => v.slots.map((s) => s.id)),
  } as const;

  const errors: LeagueError[] = [];
  for (const [kind, ids] of Object.entries(groups) as [keyof typeof groups, string[]][]) {
    const seen = new Set<string>();
    const reported = new Set<string>();
    for (const id of ids) {
      if (seen.has(id) && !reported.has(id)) {
        errors.push({ code: "DUPLICATE_ID", kind, id });
        reported.add(id);
      }
      seen.add(id);
    }
  }
  return errors;
}

/** Pulls out the season and the well-formed slots from input that failed the schema. */
function salvage(input: unknown): { season: Season | null; venues: VenueSlots[] } {
  const raw = isRecord(input) ? input : {};
  const start = raw.seasonStart;
  const end = raw.seasonEnd;
  const season =
    typeof start === "string" && typeof end === "string" && isRealDate(start) && isRealDate(end)
      ? { start, end }
      : null;

  const venues: VenueSlots[] = [];
  for (const venue of Array.isArray(raw.venues) ? raw.venues : []) {
    if (!isRecord(venue) || typeof venue.id !== "string" || !Array.isArray(venue.slots)) continue;
    const slots = venue.slots.flatMap((slot) => {
      const result = timeSlotSchema.safeParse(slot);
      return result.success ? [result.data] : [];
    });
    venues.push({ id: venue.id, slots });
  }
  return { season, venues };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
