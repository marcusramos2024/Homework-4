import { describe, expect, it } from "vitest";
import { validLeagueInput } from "./testData";
import type { LeagueError } from "./types";
import { validateLeague } from "./validateLeague";

function errorsFor(input: unknown): LeagueError[] {
  const result = validateLeague(input);
  return result.ok ? [] : result.error;
}

describe("validateLeague", () => {
  it("returns the league when everything is valid", () => {
    const result = validateLeague(validLeagueInput());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.name).toBe("Spring Basketball");
  });

  it("reports schema problems as INVALID_INPUT with the field path", () => {
    const input = validLeagueInput();
    input.venues[0].slots[0].start = "7pm";
    expect(errorsFor(input)).toEqual([
      expect.objectContaining({ code: "INVALID_INPUT", path: "venues.0.slots.0.start" }),
    ]);
  });

  describe("season dates", () => {
    it("rejects a season that ends before it starts, without flagging every slot too", () => {
      const input = { ...validLeagueInput(), seasonStart: "2027-03-26", seasonEnd: "2027-01-18" };
      expect(errorsFor(input)).toEqual([
        { code: "SEASON_END_BEFORE_START", seasonStart: "2027-03-26", seasonEnd: "2027-01-18" },
      ]);
    });

    it("allows a one-day season", () => {
      const input = { ...validLeagueInput(), seasonEnd: "2027-01-18" };
      expect(validateLeague(input).ok).toBe(true);
    });
  });

  describe("slots outside the season", () => {
    it("rejects a slot the day before the season starts", () => {
      const input = validLeagueInput();
      input.venues[0].slots[0].date = "2027-01-17";
      expect(errorsFor(input)).toEqual([
        { code: "SLOT_OUTSIDE_SEASON", venueId: "venue-marino", slotId: "slot-1" },
      ]);
    });

    it("rejects a slot the day after the season ends", () => {
      const input = validLeagueInput();
      input.venues[1].slots[0].date = "2027-03-27";
      expect(errorsFor(input)).toEqual([
        { code: "SLOT_OUTSIDE_SEASON", venueId: "venue-cabot", slotId: "slot-3" },
      ]);
    });

    it("allows slots on the first and last day of the season", () => {
      const input = validLeagueInput();
      input.venues[0].slots[0].date = "2027-01-18";
      input.venues[0].slots[1].date = "2027-03-26";
      expect(validateLeague(input).ok).toBe(true);
    });

    it("reports every bad slot, not just the first", () => {
      const input = validLeagueInput();
      input.venues[0].slots[0].date = "2026-12-01";
      input.venues[1].slots[0].date = "2027-06-01";
      expect(errorsFor(input).map((e) => e.code)).toEqual([
        "SLOT_OUTSIDE_SEASON",
        "SLOT_OUTSIDE_SEASON",
      ]);
    });
  });

  describe("overlapping slots at the same venue", () => {
    it("rejects two slots whose times intersect", () => {
      const input = validLeagueInput();
      input.venues[0].slots[1].start = "19:30";
      expect(errorsFor(input)).toEqual([
        { code: "SLOT_OVERLAP", venueId: "venue-marino", slotIds: ["slot-1", "slot-2"] },
      ]);
    });

    it("rejects two slots with the same start time", () => {
      const input = validLeagueInput();
      input.venues[0].slots[1].start = "19:00";
      expect(errorsFor(input).map((e) => e.code)).toEqual(["SLOT_OVERLAP"]);
    });

    it("allows slots that touch end to start", () => {
      // fixture already has 19:00-20:00 and 20:00-21:00 at Marino
      expect(validateLeague(validLeagueInput()).ok).toBe(true);
    });

    it("allows the same times at different venues", () => {
      const input = validLeagueInput();
      input.venues[1].slots[0].start = "19:00";
      expect(validateLeague(input).ok).toBe(true);
    });

    it("allows the same times on different dates", () => {
      const input = validLeagueInput();
      input.venues[0].slots[1].date = "2027-01-19";
      input.venues[0].slots[1].start = "19:00";
      expect(validateLeague(input).ok).toBe(true);
    });

    it("finds every slot a long slot overlaps, regardless of input order", () => {
      const input = validLeagueInput();
      input.venues[0].slots = [
        { id: "short-b", date: "2027-01-20", start: "20:00", durationMinutes: 30 },
        { id: "long", date: "2027-01-20", start: "18:00", durationMinutes: 180 },
        { id: "short-a", date: "2027-01-20", start: "19:00", durationMinutes: 30 },
      ];
      expect(errorsFor(input)).toEqual([
        { code: "SLOT_OVERLAP", venueId: "venue-marino", slotIds: ["long", "short-a"] },
        { code: "SLOT_OVERLAP", venueId: "venue-marino", slotIds: ["long", "short-b"] },
      ]);
    });
  });

  describe("slots past midnight", () => {
    it("rejects a slot that runs past midnight", () => {
      const input = validLeagueInput();
      input.venues[0].slots[1].start = "23:00";
      input.venues[0].slots[1].durationMinutes = 120;
      expect(errorsFor(input)).toEqual([
        { code: "SLOT_CROSSES_MIDNIGHT", venueId: "venue-marino", slotId: "slot-2" },
      ]);
    });

    it("allows a slot that ends exactly at midnight", () => {
      const input = validLeagueInput();
      input.venues[0].slots[1].start = "23:00";
      input.venues[0].slots[1].durationMinutes = 60;
      expect(validateLeague(input).ok).toBe(true);
    });
  });
});
