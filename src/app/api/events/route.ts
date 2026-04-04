import { auth } from "@/auth";
import { BadRequest, Created, OK, Unauthorized } from "@/common/response";
import { cacheDelPattern, cacheGet, cacheSet } from "@/config/redis";
import eventRepository from "@/repositories/event_repository";
import { eventSchema } from "@/validations/eventSchema";
import type { NextRequest } from "next/server";

const GET = async (req: NextRequest) => {
  const session = await auth();
  const userId = session?.user?.id;

  const { searchParams } = req.nextUrl;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const q = searchParams.get("q") ?? undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const from = fromParam ? new Date(fromParam) : undefined;
  const to = toParam ? new Date(toParam) : undefined;

  if (from && isNaN(from.getTime()))
    return BadRequest("Invalid date format for 'from'");
  if (to && isNaN(to.getTime()))
    return BadRequest("Invalid date format for 'to'");

  // Cache the full per-user list; filter in memory so date/query params don't fragment the cache
  const cacheKey = `events:list:${userId ?? "anon"}`;
  type EventRow = Awaited<
    ReturnType<typeof eventRepository.getAllFiltered>
  >[number];
  let events = await cacheGet<EventRow[]>(cacheKey);

  if (!events) {
    events = await eventRepository.getAllFiltered({ userId });
    await cacheSet(cacheKey, events, 3600);
  }

  if (from) events = events.filter((e) => new Date(e.endAt) >= from);
  if (to) events = events.filter((e) => new Date(e.startAt) <= to);
  if (q) {
    const lower = q.toLowerCase();
    events = events.filter((e) => e.title.toLowerCase().includes(lower));
  }
  if (limit) events = events.slice(0, limit);

  return OK(events);
};

const POST = async (req: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return Unauthorized();
  }

  const data = await req.json();
  const result = eventSchema.safeParse(data);

  if (!result.success) {
    return BadRequest(result.error.issues.map((i) => i.message).join(", "));
  }

  const event = await eventRepository.create(
    session.user.id,
    result.data,
    session.user.isAdmin ?? false,
  );

  await cacheDelPattern("events:*");
  return Created(event);
};

export { GET, POST };
