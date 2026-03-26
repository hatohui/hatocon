import { messages } from "@/common/messages";
import { LeaveType } from "@prisma/client";
import zod from "zod";

export const participationSchema = zod
  .object({
    eventId: zod.string().uuid().optional(),
    from: zod.coerce.date({
      message: messages.participation.validation.fromRequired,
    }),
    to: zod.coerce.date({
      message: messages.participation.validation.toRequired,
    }),
    leaveType: zod.nativeEnum(LeaveType, {
      message: messages.participation.validation.leaveTypeInvalid,
    }),
  })
  .refine((data) => data.to > data.from, {
    message: messages.participation.validation.toAfterFrom,
    path: ["to"],
  });
