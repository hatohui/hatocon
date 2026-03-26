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
import { LayoutDashboard, LogOut, Settings } from "lucide-react";
import AppIcon from "./common/AppIcon";

export default function Navbar() {
  const { data: session } = useSession();

  if (!session) return null;

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl flex items-end gap-2 justify-center font-semibold"
          >
            <AppIcon />
            <p>Hatocon</p>
          </Link>
          {session.user.isAdmin && (
            <Link
              href="/admin/job-profiles"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Job Profiles
            </Link>
          )}
        </div>

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
            {session.user.isAdmin && (
              <DropdownMenuItem asChild>
                <Link
                  href="/admin/job-profiles"
                  className="flex items-center gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              </DropdownMenuItem>
            )}
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
    </nav>
  );
}
