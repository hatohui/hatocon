import { messages } from "@/common/messages";
import { LeaveType } from "@prisma/client";
import zod from "zod";

export const participationBaseSchema = zod.object({
  eventId: zod.uuid().optional(),
  groupId: zod.uuid().optional(),
  from: zod.coerce.date({
    message: messages.participation.validation.fromRequired,
  }),
  to: zod.coerce.date({
    message: messages.participation.validation.toRequired,
  }),
  leaveType: zod.enum(LeaveType, {
    message: messages.participation.validation.leaveTypeInvalid,
  }),
  coTravelerIds: zod.array(zod.uuid()).optional(),
});

export const participationSchema = participationBaseSchema.refine(
  (data) => data.to > data.from,
  {
    message: messages.participation.validation.toAfterFrom,
    path: ["to"],
  },
);

export const participationGroupSettingsSchema = zod.object({
  isMemberInviteAllowed: zod.boolean().optional(),
  isPublic: zod.boolean().optional(),
  isActivityPublicVisible: zod.boolean().optional(),
  isMemberListPublicVisible: zod.boolean().optional(),
});
