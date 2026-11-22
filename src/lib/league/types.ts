/** Calendar date as YYYY-MM-DD in the league's local time zone. */
export type DateString = string;
/** 24-hour time as HH:MM in the league's local time zone. */
export type TimeString = string;

export type TimeSlot = {
  id: string;
  date: DateString;
  start: TimeString;
  durationMinutes: number;
};

export type Venue = {
  id: string;
  name: string;
  slots: TimeSlot[];
};

export type Team = {
  id: string;
  name: string;
};

export type Division = {
  id: string;
  name: string;
  teams: Team[];
};

export type League = {
  id: string;
  name: string;
  sport: string;
  seasonStart: DateString;
  seasonEnd: DateString;
  divisions: Division[];
  venues: Venue[];
};

export type LeagueError =
  | { code: "INVALID_INPUT"; path: string; message: string }
  | { code: "SEASON_END_BEFORE_START"; seasonStart: DateString; seasonEnd: DateString }
  | { code: "SLOT_OUTSIDE_SEASON"; venueId: string; slotId: string }
  | { code: "SLOT_CROSSES_MIDNIGHT"; venueId: string; slotId: string }
  | { code: "SLOT_OVERLAP"; venueId: string; slotIds: [string, string] }
  | { code: "DUPLICATE_ID"; kind: "division" | "team" | "venue" | "slot"; id: string };
