import type { Event, Participation } from "@prisma/client";
import { EventCreateDTO, EventUpdateDTO } from "@/types/event.d";
import axios from "axios";

type ApiOk<T> = { data: T };

const eventService = {
  getInRange: (from: Date | string, to: Date | string) => {
    const params = new URLSearchParams({
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
    });
    return axios.get<ApiOk<Event[]>>(`/api/events?${params}`);
  },

  getById: (id: string) => axios.get<ApiOk<Event>>(`/api/events/${id}`),

  getMyParticipation: (eventId: string) =>
    axios.get<ApiOk<Participation | null>>(
      `/api/events/${eventId}/my-participation`,
    ),

  create: (data: EventCreateDTO) =>
    axios.post<ApiOk<Event>>("/api/events", data),

  updateOwn: (id: string, data: EventUpdateDTO) =>
    axios.patch<ApiOk<Event>>(`/api/events/${id}`, data),

  deleteOwn: (id: string) =>
    axios.delete<ApiOk<{ id: string }>>(`/api/events/${id}`),

  getAllAdmin: (opts: { q?: string; approved?: "true" | "false" } = {}) => {
    const params = new URLSearchParams();
    if (opts.q) params.set("q", opts.q);
    if (opts.approved !== undefined) params.set("approved", opts.approved);
    return axios.get<ApiOk<Event[]>>(`/api/admin/events?${params}`);
  },

  approve: (id: string) =>
    axios.post<ApiOk<Event>>(`/api/admin/events/${id}/approve`),

  update: (id: string, data: EventUpdateDTO) =>
    axios.patch<ApiOk<Event>>(`/api/admin/events/${id}`, data),

  delete: (id: string) => axios.delete<ApiOk<void>>(`/api/admin/events/${id}`),
};

export { eventService };
