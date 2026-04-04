import { auth } from "@/auth";
import { OK } from "@/common/response";
import { cacheGet, cacheSet } from "@/config/redis";
import eventRepository from "@/repositories/event_repository";

const GET = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  const cacheKey = `events:upcoming:${userId ?? "anon"}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return OK(cached);

  const events = await eventRepository.getUpcoming(10, userId);
  await cacheSet(cacheKey, events, 3600);
  return OK(events);
};

export { GET };
