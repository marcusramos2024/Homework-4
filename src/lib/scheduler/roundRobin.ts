import { ok, type Result } from "../result";

export type Round = { games: [string, string][]; bye: string | null };
export type RoundRobinSchedule = Round[];
export type RoundRobinError = { code: "TOO_FEW_TEAMS"; count: number };

/**
 * Single round robin using the circle method: the first team stays put while the
 * others rotate one place each round, so every pair meets exactly once.
 */
export function generateRoundRobin(
  teamIds: string[],
  _seed: number,
): Result<RoundRobinSchedule, RoundRobinError> {
  // An odd count gets a null placeholder; whoever is paired with it has the bye.
  const entrants: (string | null)[] = teamIds.length % 2 === 0 ? [...teamIds] : [...teamIds, null];
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
