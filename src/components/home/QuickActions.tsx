"use client";

import {
  CalendarPlus,
  Zap,
  ChevronRight,
  Plane,
  CalendarClock,
  Calendar,
  ClipboardList,
  Settings,
  Wand2,
} from "lucide-react";
import { format, addYears } from "date-fns";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaveBalance } from "@/hooks/participations/useParticipations";

function BalanceBar({
  label,
  used,
  total,
  colorClass,
}: {
  label: string;
  used: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const remaining = Math.max(total - used, 0);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {remaining.toFixed(1)}
          <span className="text-muted-foreground font-normal">
            /{total} days left
          </span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function QuickActions() {
  const { data: session } = useSession();
  const { data: balance, isLoading } = useLeaveBalance();

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
      {/* LEFT SIDE: Greeting + Quick Actions */}
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            Hello, <span className="text-primary">{firstName}</span>!
          </h2>
          <p className="text-sm text-muted-foreground">
            Here's what you can do today
          </p>
        </div>

        {/* Quick Actions Grid - 3 columns */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-4 gap-2 text-xs hover:bg-primary/5 transition-colors"
            asChild
          >
            <Link href="/leave/new">
              <Plane className="h-5 w-5" />
              <span>Create A Plan</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-4 gap-2 text-xs hover:bg-primary/5 transition-colors"
            asChild
          >
            <Link href="/events/new">
              <CalendarPlus className="h-5 w-5" />
              <span>Create Event</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-4 gap-2 text-xs hover:bg-primary/5 transition-colors"
            asChild
          >
            <Link href="/participations">
              <ClipboardList className="h-5 w-5" />
              <span>My Plans</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-4 gap-2 text-xs hover:bg-primary/5 transition-colors"
            asChild
          >
            <Link href="/schedule">
              <Calendar className="h-5 w-5" />
              <span>Schedule</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-4 gap-2 text-xs hover:bg-primary/5 transition-colors"
            asChild
          >
            <Link href="/events">
              <CalendarClock className="h-5 w-5" />
              <span>All Events</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-col h-auto py-4 gap-2 text-xs hover:bg-primary/5 transition-colors"
            asChild
          >
            <Link href="/settings/profile">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* RIGHT SIDE: Leave Balance */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Leave Balance</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 px-1"
              asChild
            >
              <Link href="/settings/leave">
                Adjust
                <ChevronRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          {balance?.cycleFrom && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3 w-3 shrink-0" />
              <span>
                Cycle: {format(new Date(balance.cycleFrom), "MMM d")} –{" "}
                {format(
                  addYears(new Date(balance.cycleFrom), 1),
                  "MMM d, yyyy",
                )}
              </span>
            </div>
          )}
        </div>

        <Separator className="my-3" />

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !balance ? (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Set up your job profile to track leave balance.
            </p>
            <Button
              variant="link"
              size="sm"
              className="mt-1 h-auto p-0 text-xs"
              asChild
            >
              <Link href="/settings/leave">Set up now</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <BalanceBar
              label="Annual Leave"
              used={balance.annual.used}
              total={balance.annual.total}
              colorClass="bg-emerald-500"
            />
            <BalanceBar
              label="Sick Leave"
              used={balance.sick.used}
              total={balance.sick.total}
              colorClass="bg-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
