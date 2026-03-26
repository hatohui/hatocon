import { OK } from "@/common/response";
import eventRepository from "@/repositories/event_repository";

const GET = async () => {
  const events = await eventRepository.getUpcoming(10);
  return OK(events);
};

export { GET };
