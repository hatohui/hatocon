"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfToday,
  startOfYear,
  endOfYear,
  differenceInCalendarDays,
} from "date-fns";
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plane,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWorkSchedule, useHolidays } from "@/hooks/schedule/useSchedule";

function countWorkingDays(from: Date, to: Date, workDays?: boolean[]): number {
  const wd = workDays ?? [false, true, true, true, true, true, false];
  let count = 0;
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cur <= end) {
    if (wd[cur.getDay()]) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMyParticipations,
  useLeaveBalance,
} from "@/hooks/participations/useParticipations";
import LeaveHeatmap from "@/components/home/LeaveHeatmap";
import type { ParticipationWithEvent } from "@/types/participation.d";

const LEAVE_COLOURS: Record<string, string> = {
  ANNUAL: "bg-blue-500",
  SICK: "bg-amber-500",
  UNPAID: "bg-gray-400",
};

const LEAVE_BADGE: Record<string, string> = {
  ANNUAL: "bg-blue-100 text-blue-800",
  SICK: "bg-amber-100 text-amber-800",
  UNPAID: "bg-gray-100 text-gray-800",
};

// ─── Calendar ────────────────────────────────────────────────────────────────

function ScheduleCalendar({
  participations,
}: {
  participations: ParticipationWithEvent[];
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const today = startOfToday();

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = getDay(days[0]);

  const { data: schedule } = useWorkSchedule();
  const workDays = schedule
    ? [
        schedule.sunday,
        schedule.monday,
        schedule.tuesday,
        schedule.wednesday,
        schedule.thursday,
        schedule.friday,
        schedule.saturday,
      ]
    : [false, true, true, true, true, true, false];

  const monthFrom = startOfMonth(currentMonth).toISOString();
  const monthTo = endOfMonth(currentMonth).toISOString();
  const { data: holidays } = useHolidays(monthFrom, monthTo);

  // Build a map of date → holiday name for quick lookup
  const holidayMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!holidays) return map;
    for (const h of holidays) {
      const d = new Date(h.date + "T00:00:00");
      map.set(d.toDateString(), h.name);
    }
    return map;
  }, [holidays]);

  const getLeaveForDay = (day: Date) =>
    participations.filter((p) =>
      isWithinInterval(day, {
        start: new Date(p.from),
        end: new Date(p.to),
      }),
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-center text-xs text-muted-foreground font-medium py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {/* leading blank cells */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`blank-${i}`} className="h-16" />
        ))}
        {days.map((day) => {
          const leaves = getLeaveForDay(day);
          const isToday = isSameDay(day, today);
          const isOffDay = !workDays[getDay(day)];
          const holidayName = holidayMap.get(day.toDateString());
          const isHoliday = !!holidayName;

          return (
            <div
              key={day.toISOString()}
              className={`h-16 border-t p-1 ${isHoliday ? "bg-red-50 dark:bg-red-950/20" : isOffDay ? "bg-muted/30" : ""}`}
              title={holidayName}
            >
              <span
                className={`text-xs font-medium inline-flex items-center justify-center w-5 h-5 rounded-full ${
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : isHoliday
                      ? "text-red-600 dark:text-red-400"
                      : ""
                }`}
              >
                {format(day, "d")}
              </span>
              {isHoliday && (
                <p className="text-[8px] leading-tight text-red-600 dark:text-red-400 truncate">
                  {holidayName}
                </p>
              )}
              <div className="flex flex-wrap gap-0.5 mt-0.5">
                {leaves.map((l) => (
                  <div
                    key={l.id}
                    className={`h-1.5 w-1.5 rounded-full ${LEAVE_COLOURS[l.leaveType] ?? "bg-gray-400"}`}
                    title={l.event?.title ?? l.leaveType}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Upcoming Leave List ─────────────────────────────────────────────────────

function UpcomingLeaveList({
  participations,
}: {
  participations: ParticipationWithEvent[];
}) {
  const { data: schedule } = useWorkSchedule();
  const workDays = schedule
    ? [
        schedule.sunday,
        schedule.monday,
        schedule.tuesday,
        schedule.wednesday,
        schedule.thursday,
        schedule.friday,
        schedule.saturday,
      ]
    : undefined;

  const upcoming = participations
    .filter((p) => new Date(p.to) >= new Date())
    .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime());

  if (!upcoming.length)
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Plane className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No upcoming leave scheduled</p>
        <Button variant="link" size="sm" asChild className="mt-1">
          <Link href="/leave/new">Create a plan</Link>
        </Button>
      </div>
    );

  return (
    <div className="space-y-3">
      {upcoming.map((p) => {
        const days = countWorkingDays(
          new Date(p.from),
          new Date(p.to),
          workDays,
        );
        const daysUntil = differenceInCalendarDays(
          new Date(p.from),
          new Date(),
        );
        return (
          <div key={p.id} className="flex items-center gap-3 group">
            <div
              className={`w-1 h-10 rounded-full shrink-0 ${LEAVE_COLOURS[p.leaveType] ?? "bg-gray-400"}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {p.event ? (
                  <Link
                    href={`/participations/${p.id}`}
                    className="hover:underline"
                  >
                    {p.event.title}
                  </Link>
                ) : (
                  "Stand-alone leave"
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {format(new Date(p.from), "MMM d")} –{" "}
                  {format(new Date(p.to), "MMM d")}
                </span>
                <span>·</span>
                <span>
                  {days} {days === 1 ? "day" : "days"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant="secondary"
                className={`text-[10px] ${LEAVE_BADGE[p.leaveType] ?? ""}`}
              >
                {p.leaveType.charAt(0) + p.leaveType.slice(1).toLowerCase()}
              </Badge>
              {daysUntil > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  in {daysUntil}d
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Summary Stats ───────────────────────────────────────────────────────────

function LeaveStats({
  participations,
}: {
  participations: ParticipationWithEvent[];
}) {
  const { data: balance } = useLeaveBalance();
  const { data: schedule } = useWorkSchedule();
  const workDays = schedule
    ? [
        schedule.sunday,
        schedule.monday,
        schedule.tuesday,
        schedule.wednesday,
        schedule.thursday,
        schedule.friday,
        schedule.saturday,
      ]
    : undefined;
  const totalDays = participations.reduce(
    (sum, p) =>
      sum + countWorkingDays(new Date(p.from), new Date(p.to), workDays),
    0,
  );
  const totalTrips = participations.filter((p) => p.event).length;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-lg border p-3 text-center">
        <p className="text-2xl font-bold tabular-nums">{totalDays}</p>
        <p className="text-xs text-muted-foreground">Days Used</p>
      </div>
      <div className="rounded-lg border p-3 text-center">
        <p className="text-2xl font-bold tabular-nums">{totalTrips}</p>
        <p className="text-xs text-muted-foreground">Trips</p>
      </div>
      <div className="rounded-lg border p-3 text-center">
        <p className="text-2xl font-bold tabular-nums">
          {balance?.annual.remaining.toFixed(0) ?? "–"}
        </p>
        <p className="text-xs text-muted-foreground">Days Left</p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const from = startOfYear(new Date());
  const to = endOfYear(new Date());
  const { data, isLoading } = useMyParticipations(from, to);
  const participations = data ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Schedule</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} leave calendar &amp; activity
          </p>
        </div>
        <Button asChild>
          <Link href="/leave/new">
            <Plane className="h-4 w-4 mr-1.5" />
            New Plan
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <LeaveStats participations={participations} />

          {/* Heatmap */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Leave Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <LeaveHeatmap />
            </CardContent>
          </Card>

          {/* Calendar + Upcoming */}
          <div className="grid gap-6 md:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScheduleCalendar participations={participations} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Upcoming Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingLeaveList participations={participations} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}
