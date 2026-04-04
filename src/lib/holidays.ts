import { Lunar, Solar } from "lunar-typescript";

export type HolidayDefinition = {
  description: string;
  country: string;
  isLunar: boolean;
  /** For solar holidays: month (1-12) */
  month?: number;
  /** For solar holidays: day (1-31) */
  day?: number;
  /** For lunar holidays: lunar month (1-12) */
  lunarMonth?: number;
  /** For lunar holidays: lunar day (1-30) */
  lunarDay?: number;
  /** Number of consecutive days (defaults to 1) */
  duration?: number;
};

/**
 * Convert a lunar date to a Gregorian Date for a specific year.
 */
export function lunarToSolar(
  year: number,
  lunarMonth: number,
  lunarDay: number,
): Date {
  const lunar = Lunar.fromYmd(year, lunarMonth, lunarDay);
  const solar = lunar.getSolar();
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
}

/**
 * Get the Gregorian date of a holiday for a given year.
 * Returns an array of dates (for multi-day holidays).
 */
export function getHolidayDates(def: HolidayDefinition, year: number): Date[] {
  const duration = def.duration ?? 1;
  let baseDate: Date;

  if (def.isLunar && def.lunarMonth != null && def.lunarDay != null) {
    baseDate = lunarToSolar(year, def.lunarMonth, def.lunarDay);
  } else if (def.month != null && def.day != null) {
    baseDate = new Date(year, def.month - 1, def.day);
  } else {
    return [];
  }

  const dates: Date[] = [];
  for (let i = 0; i < duration; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/**
 * Check if a specific date is a public holiday for any of the given countries.
 */
export function isPublicHoliday(
  date: Date,
  countries: string[],
  holidays: Array<{
    date: Date;
    country: string | null;
    isGlobal: boolean;
    isLunar: boolean;
    isRecurring: boolean;
    lunarMonth: number | null;
    lunarDay: number | null;
  }>,
): boolean {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  for (const h of holidays) {
    // Country filter
    if (!h.isGlobal && h.country && !countries.includes(h.country)) continue;

    if (h.isLunar && h.lunarMonth != null && h.lunarDay != null) {
      // For lunar holidays, compute the solar date for the target year
      const solarDate = lunarToSolar(d.getFullYear(), h.lunarMonth, h.lunarDay);
      solarDate.setHours(0, 0, 0, 0);
      if (solarDate.getTime() === d.getTime()) return true;
    } else {
      const hDate = new Date(h.date);
      hDate.setHours(0, 0, 0, 0);
      if (h.isRecurring) {
        // Match month and day regardless of year
        if (
          hDate.getMonth() === d.getMonth() &&
          hDate.getDate() === d.getDate()
        )
          return true;
      } else {
        if (hDate.getTime() === d.getTime()) return true;
      }
    }
  }
  return false;
}

// ─── Holiday definitions ─────────────────────────────────────────────────────

export const VIETNAM_HOLIDAYS: HolidayDefinition[] = [
  {
    description: "New Year's Day",
    country: "VN",
    isLunar: false,
    month: 1,
    day: 1,
  },
  {
    description: "Tết (Lunar New Year's Eve)",
    country: "VN",
    isLunar: true,
    lunarMonth: 12,
    lunarDay: 30,
  },
  {
    description: "Tết (Lunar New Year Day 1)",
    country: "VN",
    isLunar: true,
    lunarMonth: 1,
    lunarDay: 1,
  },
  {
    description: "Tết (Lunar New Year Day 2)",
    country: "VN",
    isLunar: true,
    lunarMonth: 1,
    lunarDay: 2,
  },
  {
    description: "Tết (Lunar New Year Day 3)",
    country: "VN",
    isLunar: true,
    lunarMonth: 1,
    lunarDay: 3,
  },
  {
    description: "Tết (Lunar New Year Day 4)",
    country: "VN",
    isLunar: true,
    lunarMonth: 1,
    lunarDay: 4,
  },
  {
    description: "Hung Kings' Festival",
    country: "VN",
    isLunar: true,
    lunarMonth: 3,
    lunarDay: 10,
  },
  {
    description: "Reunification Day",
    country: "VN",
    isLunar: false,
    month: 4,
    day: 30,
  },
  {
    description: "Labour Day",
    country: "VN",
    isLunar: false,
    month: 5,
    day: 1,
  },
  {
    description: "National Day",
    country: "VN",
    isLunar: false,
    month: 9,
    day: 2,
  },
  {
    description: "National Day holiday",
    country: "VN",
    isLunar: false,
    month: 9,
    day: 3,
  },
];

export const SINGAPORE_HOLIDAYS: HolidayDefinition[] = [
  {
    description: "New Year's Day",
    country: "SG",
    isLunar: false,
    month: 1,
    day: 1,
  },
  {
    description: "Chinese New Year Day 1",
    country: "SG",
    isLunar: true,
    lunarMonth: 1,
    lunarDay: 1,
  },
  {
    description: "Chinese New Year Day 2",
    country: "SG",
    isLunar: true,
    lunarMonth: 1,
    lunarDay: 2,
  },
  {
    description: "Good Friday",
    country: "SG",
    isLunar: false,
    month: 3,
    day: 29,
  }, // 2026 approximate; varies
  {
    description: "Labour Day",
    country: "SG",
    isLunar: false,
    month: 5,
    day: 1,
  },
  {
    description: "Vesak Day",
    country: "SG",
    isLunar: true,
    lunarMonth: 4,
    lunarDay: 15,
  },
  {
    description: "Hari Raya Puasa",
    country: "SG",
    isLunar: false,
    month: 3,
    day: 31,
  }, // 2026 approximate
  {
    description: "Hari Raya Haji",
    country: "SG",
    isLunar: false,
    month: 6,
    day: 7,
  }, // 2026 approximate
  {
    description: "National Day",
    country: "SG",
    isLunar: false,
    month: 8,
    day: 9,
  },
  {
    description: "Deepavali",
    country: "SG",
    isLunar: false,
    month: 10,
    day: 20,
  }, // 2026 approximate
  {
    description: "Christmas Day",
    country: "SG",
    isLunar: false,
    month: 12,
    day: 25,
  },
];

export const ALL_HOLIDAY_DEFINITIONS = [
  ...VIETNAM_HOLIDAYS,
  ...SINGAPORE_HOLIDAYS,
];
