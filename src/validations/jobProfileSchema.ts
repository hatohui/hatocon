import { messages } from "@/common/messages";
import zod from "zod";

export const jobProfileSchema = zod.object({
  title: zod
    .string()
    .max(100, messages.jobProfile.validation.titleMax)
    .optional(),
  daysOfLeave: zod
    .number()
    .int()
    .min(0, messages.jobProfile.validation.daysOfLeaveMin)
    .max(365, messages.jobProfile.validation.daysOfLeaveMax),
  daysOfSickLeave: zod
    .number()
    .int()
    .min(0, messages.jobProfile.validation.daysOfSickLeaveMin)
    .max(365, messages.jobProfile.validation.daysOfSickLeaveMax),
  leaveCycleStart: zod.date().optional(),
});
