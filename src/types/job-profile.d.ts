import { JobProfile, User } from "@prisma/client";

export type JobProfileDTO = Omit<JobProfile, "id" | "createdAt" | "updatedAt">;

export type JobProfileCreateDTO = {
  title?: string;
  daysOfLeave: number;
  daysOfSickLeave: number;
  leaveCycleStart?: Date | string;
};

export type JobProfileUpdateDTO = Partial<JobProfileCreateDTO>;

export type JobProfileWithUser = JobProfile & { user: Omit<User, "password"> };
