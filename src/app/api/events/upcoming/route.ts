import { auth } from "@/auth";
import { OK } from "@/common/response";
import eventRepository from "@/repositories/event_repository";

const GET = async () => {
  const session = await auth();
  const events = await eventRepository.getUpcoming(10, session?.user?.id);
  return OK(events);
};

export { GET };
