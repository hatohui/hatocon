import type { Event, EventVisibility } from "@prisma/client";

export type EventCreateDTO = {
  title: string;
  description?: string;
  image?: string;
  startAt: Date | string;
  endAt: Date | string;
  location?: string;
  locationUrl?: string;
  reference?: string;
  isYearly?: boolean;
  visibility?: EventVisibility;
  inviteeIds?: string[];
};

export type EventUpdateDTO = Partial<EventCreateDTO>;

export type EventWithCreator = Event & {
  createdByUser: { id: string; name: string; image: string | null };
};
