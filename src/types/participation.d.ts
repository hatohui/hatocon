import type { Participation } from "@prisma/client";
import { LeaveType } from "@/types/leave-type";
import type { ParticipationGroupDTO } from "@/types/notification.d";

export type ParticipationCreateDTO = {
  eventId?: string;
  groupId?: string;
  from: Date | string;
  to: Date | string;
  leaveType: LeaveType;
  coTravelerIds?: string[];
};

export type ParticipationImageDTO = {
  id: string;
  groupId: string;
  url: string;
  caption?: string | null;
  createdAt: Date;
};

export type HeatmapEntry = {
  date: string; // ISO date string "YYYY-MM-DD"
  intensity: number; // total days used on that specific date (fractional for partial days)
};

export type LeaveBalance = {
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
};

export type ParticipationWithEvent = Participation & {
  event: { id: string; title: string; startAt: Date; endAt: Date } | null;
  group: { id: string; name: string } | null;
};

export type ParticipationParticipant = {
  id: string;
  userId: string;
  user: { id: string; name: string; image: string | null; email: string };
};

export type ParticipationDetail = Participation & {
  user: { id: string; name: string; image: string | null; email: string };
  event: {
    id: string;
    title: string;
    description: string | null;
    image: string | null;
    startAt: Date;
    endAt: Date;
    location: string | null;
    locationUrl: string | null;
    visibility: string;
  } | null;
  participants: ParticipationParticipant[];
  group:
    | (ParticipationGroupDTO & {
        images: ParticipationImageDTO[];
      })
    | null;
};
