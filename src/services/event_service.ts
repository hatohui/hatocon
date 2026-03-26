import { Event } from "@prisma/client";
import { EventCreateDTO } from "@/types/event.d";
import axios from "axios";

type ApiOk<T> = { data: T };

const eventService = {
  getInRange: (from: Date | string, to: Date | string, createdBy?: string) => {
    const params = new URLSearchParams({
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
      ...(createdBy ? { createdBy } : {}),
    });
    return axios.get<ApiOk<Event[]>>(`/api/events?${params}`);
  },

  create: (data: EventCreateDTO) =>
    axios.post<ApiOk<Event>>("/api/events", data),
};

export { eventService };
