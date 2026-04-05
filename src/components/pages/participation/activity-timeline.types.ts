// Types live in @/types/activity.d; utility in @/lib/utils.
// This file re-exports them for backward compatibility.
export type {
  MemberUser,
  EventProp,
  EventActivity,
  DisplayActivity,
} from "@/types/activity.d";
export { initials } from "@/lib/utils";
