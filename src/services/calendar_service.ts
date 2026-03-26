import type { Event } from "@prisma/client";
import { ParticipationWithEvent } from "@/types/participation.d";
import axios from "axios";

type ApiOk<T> = { data: T };
type CalendarData = {
  events: Event[];
  participations: ParticipationWithEvent[];
};

const calendarService = {
  get: (from: Date | string, to: Date | string) => {
    const params = new URLSearchParams({
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
    });
    return axios.get<ApiOk<CalendarData>>(`/api/calendar?${params}`);
  },
};

export { calendarService };
