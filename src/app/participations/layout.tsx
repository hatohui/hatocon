import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "My Plans",
  description: "View and manage all your travel plans and participations.",
};

export default function ParticipationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
