import Holidays from "date-holidays";
import { cacheGet, cacheSet } from "@/config/redis";

export type HolidayEntry = {
  date: string;    // YYYY-MM-DD
  name: string;
  type: string;
  country: string;
};

const CACHE_TTL = 60 * 60 * 24; // 24 hours

/**
 * Get all public holidays for a country and year.
 * Results are cached in Redis for 24 hours.
 */
export async function getPublicHolidaysForYear(
  country: string,
  year: number,
): Promise<HolidayEntry[]> {
  const cacheKey = `holidays:${country}:${year}`;
  const cached = await cacheGet<HolidayEntry[]>(cacheKey);
  if (cached) return cached;

  const hd = new Holidays(country);
  const raw = hd.getHolidays(year);
  const entries: HolidayEntry[] = raw
    .filter((h) => h.type === "public" || h.type === "bank")
    .map((h) => ({
      date: h.date.slice(0, 10), // "YYYY-MM-DD"
      name: h.name,
      type: h.type,
      country,
    }));

  await cacheSet(cacheKey, entries, CACHE_TTL);
  return entries;
}

/**
 * Build a Set of YYYY-MM-DD strings for the given countries and years.
 * Efficient for range-based leave counting.
 */
export async function getPublicHolidaySet(
  countries: string[],
  years: number[],
): Promise<Set<string>> {
  const set = new Set<string>();
  await Promise.all(
    countries.flatMap((country) =>
      years.map(async (year) => {
        const holidays = await getPublicHolidaysForYear(country, year);
        for (const h of holidays) set.add(h.date);
      }),
    ),
  );
  return set;
}
