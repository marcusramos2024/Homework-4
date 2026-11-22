import { err, ok, type Result } from "../result";

export type Round = { games: [string, string][]; bye: string | null };
export type RoundRobinSchedule = Round[];
export type RoundRobinError = { code: "TOO_FEW_TEAMS"; count: number };

/** Small seeded PRNG (mulberry32): the same seed always yields the same sequence in [0, 1). */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle driven by the seed; returns a new array. */
function shuffled<T>(items: T[], seed: number): T[] {
  const random = mulberry32(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Single round robin using the circle method: the first team stays put while the
 * others rotate one place each round, so every pair meets exactly once. The seed
 * shuffles the team order first, so different seeds give different valid schedules.
 */
export function generateRoundRobin(
  teamIds: string[],
  seed: number,
): Result<RoundRobinSchedule, RoundRobinError> {
  if (teamIds.length < 2) return err({ code: "TOO_FEW_TEAMS", count: teamIds.length });

  // An odd count gets a null placeholder; whoever is paired with it has the bye.
  const order = shuffled(teamIds, seed);
  const entrants: (string | null)[] = order.length % 2 === 0 ? order : [...order, null];
  const [fixed, ...rest] = entrants;
  const rounds: RoundRobinSchedule = [];

  for (let r = 0; r < rest.length; r++) {
    const circle = [fixed, ...rest.slice(r), ...rest.slice(0, r)];
    const games: [string, string][] = [];
    let bye: string | null = null;
    for (let i = 0; i < circle.length / 2; i++) {
      const a = circle[i];
      const b = circle[circle.length - 1 - i];
      if (a === null) bye = b;
      else if (b === null) bye = a;
      else games.push([a, b]);
    }
    rounds.push({ games, bye });
  }

  return ok(rounds);
}
