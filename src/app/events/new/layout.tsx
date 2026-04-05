import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "New Event",
  description: "Create a new event for your group.",
};

export default function NewEventLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
