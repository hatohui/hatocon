import { eventService } from "@/services/event_service";
import { EventCreateDTO, EventUpdateDTO } from "@/types/event.d";
import type { Event } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

type ApiOk<T> = { data: T };

const useUpcomingEvents = () =>
  useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: () =>
      axios
        .get<ApiOk<Event[]>>("/api/events/upcoming")
        .then((r) => r.data.data),
  });

const useAllEvents = (
  opts: {
    q?: string;
    from?: Date;
    to?: Date;
    limit?: number;
  } = {},
) => {
  return useQuery({
    queryKey: [
      "events",
      "all",
      opts.q,
      opts.from?.toISOString(),
      opts.to?.toISOString(),
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (opts.q) params.set("q", opts.q);
      if (opts.from) params.set("from", opts.from.toISOString());
      if (opts.to) params.set("to", opts.to.toISOString());
      if (opts.limit) params.set("limit", String(opts.limit));
      return axios
        .get<ApiOk<Event[]>>(`/api/events?${params}`)
        .then((r) => r.data.data);
    },
  });
};

const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EventCreateDTO) =>
      eventService.create(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

// Admin hooks
const useAdminEvents = (
  opts: { q?: string; approved?: "true" | "false" } = {},
) => {
  return useQuery({
    queryKey: ["admin", "events", opts.q, opts.approved],
    queryFn: () => eventService.getAllAdmin(opts).then((r) => r.data.data),
  });
};

const useApproveEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      eventService.approve(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EventUpdateDTO }) =>
      eventService.update(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

const useUpdateOwnEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EventUpdateDTO }) =>
      eventService.updateOwn(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

const useDeleteOwnEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventService.deleteOwn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

const useEventById = (id: string | null) =>
  useQuery({
    queryKey: ["events", "detail", id],
    queryFn: () =>
      axios.get<ApiOk<Event>>(`/api/events/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

export {
  useUpcomingEvents,
  useAllEvents,
  useEventById,
  useCreateEvent,
  useUpdateOwnEvent,
  useDeleteOwnEvent,
  useAdminEvents,
  useApproveEvent,
  useUpdateEvent,
  useDeleteEvent,
};
