import { describe, expect, it } from "vitest";
import { leagueInputSchema } from "./schema";
import { validLeagueInput } from "./testData";

describe("leagueInputSchema", () => {
  it("accepts a complete league", () => {
    expect(leagueInputSchema.safeParse(validLeagueInput()).success).toBe(true);
  });

  it("defaults a division's teams to an empty list", () => {
    const input = validLeagueInput();
    input.divisions = [{ id: "div-open", name: "Open" }];
    const parsed = leagueInputSchema.parse(input);
    expect(parsed.divisions[0].teams).toEqual([]);
  });

  it("rejects a blank league name", () => {
    const input = { ...validLeagueInput(), name: "   " };
    expect(leagueInputSchema.safeParse(input).success).toBe(false);
  });

  it("rejects a season date that is not a real date", () => {
    const input = { ...validLeagueInput(), seasonEnd: "2027-02-30" };
    expect(leagueInputSchema.safeParse(input).success).toBe(false);
  });

  it("requires at least one division", () => {
    const input = { ...validLeagueInput(), divisions: [] };
    expect(leagueInputSchema.safeParse(input).success).toBe(false);
  });

  it("rejects a slot start that is not HH:MM", () => {
    const input = validLeagueInput();
    input.venues[0].slots[0].start = "7pm";
    expect(leagueInputSchema.safeParse(input).success).toBe(false);
  });

  it("rejects slot durations outside 15 to 480 minutes or not whole minutes", () => {
    for (const durationMinutes of [0, 10, 481, 60.5]) {
      const input = validLeagueInput();
      input.venues[0].slots[0].durationMinutes = durationMinutes;
      expect(leagueInputSchema.safeParse(input).success).toBe(false);
    }
  });
});
