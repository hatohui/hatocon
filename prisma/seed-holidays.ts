import { db } from "../src/config/prisma";
import { ALL_HOLIDAY_DEFINITIONS, getHolidayDates } from "../src/lib/holidays";

/**
 * Seeds Vietnam and Singapore public holidays for years 2025-2030.
 * Lunar holidays store their lunar coordinates; solar holidays store the fixed date.
 */
async function main() {
  const YEARS = [2025, 2026, 2027, 2028, 2029, 2030];

  // Clear existing seeded holidays (not user custom ones since those are in CustomHoliday)
  await db.holiday.deleteMany({});

  const records: Array<{
    date: Date;
    description: string;
    country: string;
    isGlobal: boolean;
    isRecurring: boolean;
    isLunar: boolean;
    lunarMonth: number | null;
    lunarDay: number | null;
  }> = [];

  for (const def of ALL_HOLIDAY_DEFINITIONS) {
    if (def.isLunar) {
      // For lunar holidays, compute the specific Gregorian date per year
      for (const year of YEARS) {
        const dates = getHolidayDates(def, year);
        for (const date of dates) {
          records.push({
            date,
            description: `${def.description} (${year})`,
            country: def.country,
            isGlobal: false,
            isRecurring: false, // each row is year-specific
            isLunar: true,
            lunarMonth: def.lunarMonth ?? null,
            lunarDay: def.lunarDay ?? null,
          });
        }
      }
    } else {
      // Solar holidays: store once with isRecurring=true, using year 2000 as base
      const date = new Date(2000, (def.month ?? 1) - 1, def.day ?? 1);
      records.push({
        date,
        description: def.description ?? "",
        country: def.country,
        isGlobal: false,
        isRecurring: true,
        isLunar: false,
        lunarMonth: null,
        lunarDay: null,
      });
    }
  }

  await db.holiday.createMany({ data: records });

  console.log(`Seeded ${records.length} holiday records.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
