import { z } from "zod";
import { isRealDate, isTime } from "./time";

const id = z.string().trim().min(1);
const name = z.string().trim().min(1).max(100);
const date = z.string().refine(isRealDate, "must be a real date in YYYY-MM-DD format");
const time = z.string().refine(isTime, "must be a 24-hour time in HH:MM format");

export const MIN_SLOT_MINUTES = 15;
export const MAX_SLOT_MINUTES = 480;

export const timeSlotSchema = z.object({
  id,
  date,
  start: time,
  durationMinutes: z.number().int().min(MIN_SLOT_MINUTES).max(MAX_SLOT_MINUTES),
});

export const venueSchema = z.object({
  id,
  name,
  slots: z.array(timeSlotSchema),
});

export const teamSchema = z.object({ id, name });

export const divisionSchema = z.object({
  id,
  name,
  teams: z.array(teamSchema).default([]),
});

export const leagueInputSchema = z.object({
  id,
  name,
  sport: name,
  seasonStart: date,
  seasonEnd: date,
  divisions: z.array(divisionSchema).min(1, "a league needs at least one division"),
  venues: z.array(venueSchema),
});

export type LeagueInput = z.input<typeof leagueInputSchema>;
