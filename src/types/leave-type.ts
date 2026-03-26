/** Client-safe LeaveType constant — mirrors the Prisma enum without the Node dependency. */
export const LeaveType = {
  ANNUAL: "ANNUAL",
  SICK: "SICK",
  UNPAID: "UNPAID",
} as const;

export type LeaveType = (typeof LeaveType)[keyof typeof LeaveType];
