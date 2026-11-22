import type { LeagueInput } from "./schema";

/** A valid spring basketball league. Each call returns a fresh copy so tests can mutate it. */
export function validLeagueInput(): LeagueInput {
  return {
    id: "league-spring-bball",
    name: "Spring Basketball",
    sport: "Basketball",
    seasonStart: "2027-01-18",
    seasonEnd: "2027-03-26",
    divisions: [
      {
        id: "div-open",
        name: "Open",
        teams: [
          { id: "team-1", name: "Huskies" },
          { id: "team-2", name: "Ballers" },
        ],
      },
    ],
    venues: [
      {
        id: "venue-marino",
        name: "Marino Court 1",
        slots: [
          { id: "slot-1", date: "2027-01-18", start: "19:00", durationMinutes: 60 },
          { id: "slot-2", date: "2027-01-18", start: "20:00", durationMinutes: 60 },
        ],
      },
      {
        id: "venue-cabot",
        name: "Cabot Gym",
        slots: [{ id: "slot-3", date: "2027-01-18", start: "19:30", durationMinutes: 60 }],
      },
    ],
  };
}
