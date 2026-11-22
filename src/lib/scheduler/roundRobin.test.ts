import { describe, expect, it } from "vitest";
import { generateRoundRobin, type RoundRobinSchedule } from "./roundRobin";

const SEED = 1;

function teams(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `t${i}`);
}

function scheduleFor(count: number): RoundRobinSchedule {
  const result = generateRoundRobin(teams(count), SEED);
  if (!result.ok) throw new Error(`expected a schedule for ${count} teams`);
  return result.value;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

describe("generateRoundRobin with an even team count", () => {
  it("plays n-1 rounds", () => {
    expect(scheduleFor(6)).toHaveLength(5);
  });

  it("has every pair of teams meet exactly once", () => {
    const meetings = scheduleFor(6).flatMap((round) => round.games.map(([a, b]) => pairKey(a, b)));
    const expected = teams(6).flatMap((a, i) =>
      teams(6)
        .slice(i + 1)
        .map((b) => pairKey(a, b)),
    );

    expect(meetings).toHaveLength(15);
    expect([...meetings].sort()).toEqual([...expected].sort());
  });

  it("has every team play exactly once per round", () => {
    for (const round of scheduleFor(6)) {
      const playing = round.games.flat();
      expect([...playing].sort()).toEqual(teams(6));
    }
  });

  it("has no byes", () => {
    for (const round of scheduleFor(6)) {
      expect(round.bye).toBeNull();
    }
  });
});

describe("generateRoundRobin with an odd team count", () => {
  it("plays n rounds", () => {
    expect(scheduleFor(5)).toHaveLength(5);
  });

  it("has exactly one bye in every round", () => {
    for (const round of scheduleFor(5)) {
      expect(round.bye).not.toBeNull();
      expect(round.games).toHaveLength(2);
    }
  });

  it("gives each team exactly one bye over the season", () => {
    const byes = scheduleFor(5).map((round) => round.bye);
    expect([...byes].sort()).toEqual(teams(5));
  });

  it("has every pair of teams meet exactly once", () => {
    const meetings = scheduleFor(5).flatMap((round) => round.games.map(([a, b]) => pairKey(a, b)));
    const expected = teams(5).flatMap((a, i) =>
      teams(5)
        .slice(i + 1)
        .map((b) => pairKey(a, b)),
    );

    expect(meetings).toHaveLength(10);
    expect([...meetings].sort()).toEqual([...expected].sort());
  });

  it("has every team either play once or sit out in each round", () => {
    for (const round of scheduleFor(5)) {
      const present = [...round.games.flat(), round.bye];
      expect([...present].sort()).toEqual(teams(5));
    }
  });
});

describe("generateRoundRobin seeding", () => {
  it("gives the same schedule for the same seed", () => {
    expect(generateRoundRobin(teams(8), 42)).toEqual(generateRoundRobin(teams(8), 42));
  });

  it("gives different schedules for different seeds", () => {
    expect(generateRoundRobin(teams(8), 1)).not.toEqual(generateRoundRobin(teams(8), 2));
  });
});

describe("generateRoundRobin with fewer than 2 teams", () => {
  it("returns TOO_FEW_TEAMS with the count for 0 teams", () => {
    expect(generateRoundRobin([], SEED)).toEqual({
      ok: false,
      error: { code: "TOO_FEW_TEAMS", count: 0 },
    });
  });

  it("returns TOO_FEW_TEAMS with the count for 1 team", () => {
    expect(generateRoundRobin(teams(1), SEED)).toEqual({
      ok: false,
      error: { code: "TOO_FEW_TEAMS", count: 1 },
    });
  });
});
