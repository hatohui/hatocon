"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CalendarDays, User } from "lucide-react";

const links = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/leave", label: "Leave", icon: CalendarDays },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="flex gap-6">
        <nav className="w-48 shrink-0">
          <ul className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname === href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
