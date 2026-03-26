import { auth } from "@/auth";
import { BadRequest, OK, Unauthorized } from "@/common/response";
import eventRepository from "@/repositories/event_repository";
import participationRepository from "@/repositories/participation_repository";
import { cacheGet, cacheSet } from "@/config/redis";
import { startOfYear, endOfYear } from "date-fns";
import type { NextRequest } from "next/server";

const GET = async (req: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const { searchParams } = req.nextUrl;
  const yearParam = searchParams.get("year");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  let from: Date;
  let to: Date;

  // If year is provided, query the full year
  if (yearParam) {
    const year = parseInt(yearParam, 10);
    if (isNaN(year) || year < 2000 || year > 2100) {
      return BadRequest("Invalid year");
    }
    from = startOfYear(new Date(year, 0, 1));
    to = endOfYear(new Date(year, 0, 1));
  } else if (fromParam && toParam) {
    from = new Date(fromParam);
    to = new Date(toParam);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return BadRequest("Invalid date format for 'from' or 'to'");
    }
  } else {
    return BadRequest(
      "Provide 'year' or both 'from' and 'to' query params",
    );
  }

  // Try Redis cache for events (keyed by date range)
  const cacheKey = `calendar:${from.toISOString()}:${to.toISOString()}`;
  const cachedEvents = await cacheGet(cacheKey);

  const [events, participations] = await Promise.all([
    cachedEvents
      ? Promise.resolve(cachedEvents)
      : eventRepository.getInRange(from, to),
    participationRepository.getByUserId(session.user.id, from, to),
  ]);

  if (!cachedEvents) {
    await cacheSet(cacheKey, events, 600);
  }

  return OK({ events, participations });
};

export { GET };
