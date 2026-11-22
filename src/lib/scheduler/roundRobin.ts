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
  const [fixed, ...rest] = teamIds;
  const rounds: RoundRobinSchedule = [];

  for (let r = 0; r < rest.length; r++) {
    const circle = [fixed, ...rest.slice(r), ...rest.slice(0, r)];
    const games: [string, string][] = [];
    for (let i = 0; i < circle.length / 2; i++) {
      games.push([circle[i], circle[circle.length - 1 - i]]);
    }
    rounds.push({ games, bye: null });
  }

  return ok(rounds);
}
