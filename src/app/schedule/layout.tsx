import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Schedule",
  description: "View your work schedule, leave days, and upcoming calendar.",
};

export default function ScheduleLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
