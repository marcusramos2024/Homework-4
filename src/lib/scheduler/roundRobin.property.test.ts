import fc from "fast-check";
import { describe, it } from "vitest";
import { generateRoundRobin, type RoundRobinSchedule } from "./roundRobin";

const teamCount = fc.integer({ min: 2, max: 20 });
const seed = fc.integer();

function teams(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `t${i}`);
}

function scheduleFor(count: number, seedValue: number): RoundRobinSchedule {
  const result = generateRoundRobin(teams(count), seedValue);
  if (!result.ok) throw new Error(`expected a schedule for ${count} teams`);
  return result.value;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

describe("generateRoundRobin properties (2 to 20 teams, any seed)", () => {
  it("plays n-1 rounds for an even count and n rounds for an odd count", () => {
    fc.assert(
      fc.property(teamCount, seed, (n, s) => {
        return scheduleFor(n, s).length === (n % 2 === 0 ? n - 1 : n);
      }),
    );
  });

  it("has every pair of teams meet exactly once", () => {
    fc.assert(
      fc.property(teamCount, seed, (n, s) => {
        const meetings = scheduleFor(n, s).flatMap((round) =>
          round.games.map(([a, b]) => pairKey(a, b)),
        );
        const expected = teams(n).flatMap((a, i) =>
          teams(n)
            .slice(i + 1)
            .map((b) => pairKey(a, b)),
        );
        return (
          meetings.length === expected.length &&
          [...meetings].sort().join(",") === [...expected].sort().join(",")
        );
      }),
    );
  });

  it("has every team play at most once per round, and never itself", () => {
    fc.assert(
      fc.property(teamCount, seed, (n, s) => {
        return scheduleFor(n, s).every((round) => {
          const playing = round.games.flat();
          return new Set(playing).size === playing.length && round.games.every(([a, b]) => a !== b);
        });
      }),
    );
  });

  it("has every team either play or sit out in each round", () => {
    fc.assert(
      fc.property(teamCount, seed, (n, s) => {
        return scheduleFor(n, s).every((round) => {
          const present =
            round.bye === null ? round.games.flat() : [...round.games.flat(), round.bye];
          return [...present].sort().join(",") === [...teams(n)].sort().join(",");
        });
      }),
    );
  });

  it("has no byes for an even count", () => {
    fc.assert(
      fc.property(
        teamCount.filter((n) => n % 2 === 0),
        seed,
        (n, s) => scheduleFor(n, s).every((round) => round.bye === null),
      ),
    );
  });

  it("has exactly one bye per round and one bye per team for an odd count", () => {
    fc.assert(
      fc.property(
        teamCount.filter((n) => n % 2 === 1),
        seed,
        (n, s) => {
          const byes = scheduleFor(n, s).map((round) => round.bye);
          return (
            byes.every((bye) => bye !== null) &&
            [...byes].sort().join(",") === [...teams(n)].sort().join(",")
          );
        },
      ),
    );
  });

  it("gives the same schedule for the same seed", () => {
    fc.assert(
      fc.property(teamCount, seed, (n, s) => {
        return (
          JSON.stringify(generateRoundRobin(teams(n), s)) ===
          JSON.stringify(generateRoundRobin(teams(n), s))
        );
      }),
    );
  });
});
