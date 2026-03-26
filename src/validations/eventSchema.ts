import { messages } from "@/common/messages";
import zod from "zod";

export const eventBaseSchema = zod.object({
  title: zod
    .string()
    .min(1, messages.event.validation.titleRequired)
    .max(200, messages.event.validation.titleMax),
  description: zod.string().optional(),
  image: zod.string().url().optional(),
  startAt: zod.coerce.date({
    message: messages.event.validation.startAtRequired,
  }),
  endAt: zod.coerce.date({
    message: messages.event.validation.endAtRequired,
  }),
  location: zod.string().optional(),
  locationUrl: zod.string().url().optional(),
  reference: zod.string().optional(),
});

export const eventSchema = eventBaseSchema.refine(
  (data) => data.endAt > data.startAt,
  {
    message: messages.event.validation.endAtAfterStartAt,
    path: ["endAt"],
  },
);
