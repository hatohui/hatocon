import type { Metadata } from "next";
import type { ReactNode } from "react";
import SettingsNav from "@/components/settings/settings-nav";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, leave settings, schedule, and holidays.",
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-bold md:mb-6">Settings</h1>
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <SettingsNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
