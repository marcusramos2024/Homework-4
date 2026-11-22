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
    const expected = teams(6).flatMap((a, i) => teams(6).slice(i + 1).map((b) => pairKey(a, b)));

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
