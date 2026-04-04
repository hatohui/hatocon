import { auth } from "@/auth";
import { OK, Unauthorized } from "@/common/response";
import { getPublicHolidaysForYear } from "@/lib/holidays";
import type { NextRequest } from "next/server";

const GET = async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user?.id) return Unauthorized();

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) {
    return OK([]);
  }

  const fromYear = new Date(from).getFullYear();
  const toYear = new Date(to).getFullYear();
  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, i) => fromYear + i,
  );

  const results = await Promise.all(
    ["VN", "SG"].flatMap((country) =>
      years.map((year) => getPublicHolidaysForYear(country, year)),
    ),
  );

  const fromStr = from.slice(0, 10);
  const toStr = to.slice(0, 10);
  const holidays = results
    .flat()
    .filter((h) => h.date >= fromStr && h.date <= toStr);

  return OK(holidays);
};

export { GET };
