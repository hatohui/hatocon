"use client";

import { format, addMonths, startOfToday, differenceInDays } from "date-fns";
import { Plane, ArrowRight, ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useMyParticipations } from "@/hooks/participations/useParticipations";
import { cn } from "@/lib/utils";
import { LeaveType } from "@/types/leave-type";
import type { ParticipationWithEvent } from "@/types/participation";

const LEAVE_META: Record<
  LeaveType,
  { label: string; barClass: string; badgeClass: string }
> = {
  ANNUAL: {
    label: "Annual Leave",
    barClass: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  SICK: {
    label: "Sick Leave",
    barClass: "bg-amber-500",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  },
  UNPAID: {
    label: "Unpaid Leave",
    barClass: "bg-gray-400",
    badgeClass: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  },
};

function countWeekdays(from: Date, to: Date): number {
  let count = 0;
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function PlanRow({ plan }: { plan: ParticipationWithEvent }) {
  const from = new Date(plan.from);
  const to = new Date(plan.to);
  const meta = LEAVE_META[plan.leaveType as LeaveType] ?? LEAVE_META.ANNUAL;
  const weekdays = countWeekdays(from, to);
  const title = plan.event?.title ?? "Personal Leave";

  return (
    <Link
      href={`/participations/${plan.id}`}
      className="group flex items-start gap-3 py-3.5 px-1 hover:bg-muted/30 rounded-lg transition-colors"
    >
      {/* Colour bar + date badge */}
      <div className="shrink-0 flex flex-col items-center gap-1">
        <div className="w-1 h-full min-h-11 rounded-full relative">
          <div className={cn("absolute inset-0 rounded-full", meta.barClass)} />
        </div>
      </div>

      <div className="shrink-0 w-12 text-center">
        <div className="bg-muted rounded-lg px-1 py-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">
            {format(from, "MMM")}
          </p>
          <p className="text-lg font-bold leading-none">{format(from, "d")}</p>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight truncate">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {format(from, "MMM d")} – {format(to, "MMM d, yyyy")}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] text-muted-foreground/70">
            uses {weekdays === 1 ? "1 day" : `${weekdays} leave days`}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
          in {differenceInDays(from, startOfToday())} days
        </p>
      </div>

      <ArrowRight className="h-4 w-4 self-center shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors" />
    </Link>
  );
}

export default function UpcomingPlans() {
  const today = startOfToday();
  const sixMonthsLater = addMonths(today, 6);

  const { data: plans, isLoading } = useMyParticipations(today, sixMonthsLater);

  const upcoming = plans
    ? [...plans]
        .filter((p) => new Date(p.to) >= today)
        .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime())
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Your Upcoming Plans</h2>
          {!isLoading && upcoming.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {upcoming.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs hidden sm:flex"
            asChild
          >
            <Link href="/leave/new">
              <Plus className="h-3.5 w-3.5" />
              Create Plan
            </Link>
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" asChild>
            <Link href="/participations">View all</Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-3">
            <ClipboardList className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm">No upcoming plans</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create a leave plan to start tracking your time off
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/leave/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create your first plan
            </Link>
          </Button>
        </div>
      ) : (
        <ScrollArea className="md:h-100">
          <div className="divide-y">
            {upcoming.map((plan) => (
              <PlanRow key={plan.id} plan={plan} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
