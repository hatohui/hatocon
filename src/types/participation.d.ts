import type { Participation } from "@prisma/client";
import { LeaveType } from "@/types/leave-type";

export type ParticipationCreateDTO = {
  eventId?: string;
  from: Date | string;
  to: Date | string;
  leaveType: LeaveType;
  coTravelerIds?: string[];
};

export type ParticipationImageDTO = {
  id: string;
  participationId: string;
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
};
