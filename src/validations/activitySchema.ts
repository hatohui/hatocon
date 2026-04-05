import { messages } from "@/common/messages";
import zod from "zod";

export const activitySchema = zod.object({
  name: zod
    .string()
    .min(1, messages.activity.validation.nameRequired)
    .max(200, messages.activity.validation.nameMax),
  from: zod.coerce.date({
    message: messages.activity.validation.fromRequired,
  }),
  to: zod.coerce.date({
    message: messages.activity.validation.toRequired,
  }),
  location: zod.string().optional(),
  locationUrl: zod.string().url().optional().or(zod.literal("")),
  involvedPeople: zod.array(zod.string().uuid()).default([]),
  isExcludeMode: zod.boolean().default(false),
  note: zod.string().optional(),
  imageUrl: zod.string().url().optional().or(zod.literal("")),
  sortOrder: zod.number().int().optional(),
});

export const activityUpdateSchema = activitySchema.partial();
