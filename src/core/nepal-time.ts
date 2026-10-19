import { EPOCH_AD_MS, MS_PER_DAY } from "./days.js";

const MINUTE_MS = 60_000;

/**
 * Changes to Nepal's UTC offset, newest first: each applies from `since` (UTC ms) until the
 * row above. Before the last row Nepal used local mean time. Matches Asia/Kathmandu in the
 * IANA time zone database.
 */
const OFFSET_CHANGES: readonly { since: number; offsetMs: number }[] = [
  // 1986-01-01 00:00 at +05:30: clocks jumped to 00:15
  { since: Date.UTC(1985, 11, 31, 18, 30), offsetMs: (5 * 60 + 45) * MINUTE_MS },
  // 1920-01-01 00:00 local mean time: clocks went back to 23:48:44
  { since: Date.UTC(1919, 11, 31, 18, 18, 44), offsetMs: (5 * 60 + 30) * MINUTE_MS },
];

/** Kathmandu local mean time, +05:41:16, used before 1920. */
const LOCAL_MEAN_TIME_MS = ((5 * 60 + 41) * 60 + 16) * 1000;

/** Nepal's UTC offset at a UTC timestamp, in ms. */
export function nepalOffsetMs(utcMs: number): number {
  for (const { since, offsetMs } of OFFSET_CHANGES) {
    if (utcMs >= since) return offsetMs;
  }
  return LOCAL_MEAN_TIME_MS;
}

/**
 * Day number of the date in Nepal at a UTC timestamp. Pass `offsetMs` to use a fixed offset
 * instead. Does not check the range: the result can fall outside the table.
 */
export function instantToDays(utcMs: number, offsetMs = nepalOffsetMs(utcMs)): number {
  return Math.floor((utcMs + offsetMs - EPOCH_AD_MS) / MS_PER_DAY);
}

/**
 * The UTC timestamp when a day starts in Nepal. Both offset changes happened at local
 * midnight, so the newest offset whose period contains that midnight is the right one.
 * On 1986-01-01, whose first 15 minutes never existed, this gives the moment of the change.
 * Pass `fixedOffsetMs` to get the start of the day at that offset instead.
 */
export function daysToStartInstant(days: number, fixedOffsetMs?: number): number {
  const midnightMs = EPOCH_AD_MS + days * MS_PER_DAY;
  if (fixedOffsetMs !== undefined) return midnightMs - fixedOffsetMs;
  for (const { since, offsetMs } of OFFSET_CHANGES) {
    if (midnightMs - offsetMs >= since) return midnightMs - offsetMs;
  }
  return midnightMs - LOCAL_MEAN_TIME_MS;
}
