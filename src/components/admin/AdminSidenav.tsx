"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Briefcase,
  Plane,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/events", label: "Events", icon: CalendarDays, exact: false },
  {
    href: "/admin/job-profiles",
    label: "Job Profiles",
    icon: Briefcase,
    exact: false,
  },
  {
    href: "/admin/participations",
    label: "Participations",
    icon: Plane,
    exact: false,
  },
];

export default function AdminSidenav() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r bg-background min-h-[calc(100vh-3.5rem)]">
      <nav className="flex flex-col gap-1 p-3">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Admin
        </p>
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
