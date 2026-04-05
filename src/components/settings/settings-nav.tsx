"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/leave", label: "Leave", icon: CalendarDays },
  { href: "/settings/schedule", label: "Schedule", icon: Clock },
  { href: "/settings/holidays", label: "Holidays", icon: Star },
];

export default function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 md:w-48">
      <ul className="flex flex-row gap-1 overflow-x-auto md:flex-col md:space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href} className="shrink-0">
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
  );
}
