import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Request Leave",
  description: "Submit a new leave request.",
};

export default function LeaveLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
