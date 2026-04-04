"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  CalendarDays,
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AppIcon from "./common/AppIcon";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/schedule", label: "Schedule", icon: CalendarRange },
  { href: "/participations", label: "My Plans", icon: ClipboardList },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAdmin = session?.user.isAdmin;
  const [mobileOpen, setMobileOpen] = useState(false);

  if (status === "loading") {
    return (
      <nav className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-end gap-2">
              <Skeleton className="h-7 w-7 rounded" />
              <Skeleton className="hidden sm:block h-5 w-16" />
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </nav>
    );
  }

  if (!session) return null;

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const navLinkClass = (href: string) =>
    cn(
      "flex items-center gap-2 text-sm font-medium transition-colors",
      pathname.startsWith(href)
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Mobile hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="px-4 py-4 border-b">
              <SheetTitle asChild>
                <Link
                  href="/"
                  className="text-xl flex items-end gap-2 font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  <AppIcon />
                  <span>Hatocon</span>
                </Link>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-2 py-3">
              {isAdmin && (
                <Link
                  href="/admin/events"
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith("/admin")
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              )}
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith(href)
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <hr className="my-2" />
              <Link
                href="/settings/profile"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <button
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-accent transition-colors text-left"
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl flex items-end gap-2 justify-center font-semibold"
          >
            <AppIcon />
            <p className="hidden sm:block">Hatocon</p>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            {isAdmin && (
              <Link href="/admin/events" className={navLinkClass("/admin")}>
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={navLinkClass(href)}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Avatar dropdown (all screen sizes) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session.user.image ?? undefined}
                    alt={session.user.name ?? ""}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{session.user.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/settings/profile"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive focus:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
