"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
} from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function CalendarDay({
  day,
  leaveDaySet,
  leaveType,
  start,
  end,
}: {
  day: Date | null;
  leaveDaySet: Set<string>;
  leaveType: string;
  start: Date;
  end: Date;
}) {
  if (!day) return <div className="h-8" />;
  const key = format(day, "yyyy-MM-dd");
  const isLeave = leaveDaySet.has(key);
  const isToday = isSameDay(day, new Date());
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "h-8 flex items-center justify-center text-xs relative",
              isLeave && "font-semibold",
              isSameDay(day, start) && "rounded-l-md",
              isSameDay(day, end) && "rounded-r-md",
              isLeave &&
                (leaveType === "ANNUAL"
                  ? "bg-blue-100 text-blue-900"
                  : leaveType === "SICK"
                    ? "bg-amber-100 text-amber-900"
                    : "bg-gray-100 text-gray-900"),
            )}
          >
            <span
              className={cn(
                "w-6 h-6 flex items-center justify-center rounded-full",
                isToday &&
                  !isLeave &&
                  "bg-primary text-primary-foreground font-bold",
                isToday && isLeave && "ring-2 ring-primary",
              )}
            >
              {format(day, "d")}
            </span>
          </div>
        </TooltipTrigger>
        {isLeave && (
          <TooltipContent>
            <p>{format(day, "EEEE, MMMM d")}</p>
            <p className="text-xs text-muted-foreground">
              {leaveType.charAt(0) + leaveType.slice(1).toLowerCase()} leave
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

type Props = { from: Date; to: Date; leaveType: string };

export default function ParticipationCalendar({ from, to, leaveType }: Props) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(from));
  const monthFrom = startOfMonth(currentMonth);
  const monthTo = endOfMonth(currentMonth);
  const leaveDaySet = new Set(
    eachDayOfInterval({ start: from, end: to }).map((d) =>
      format(d, "yyyy-MM-dd"),
    ),
  );
  const days = eachDayOfInterval({ start: monthFrom, end: monthTo });
  const dayOfWeek = (monthFrom.getDay() + 6) % 7;
  const padded: (Date | null)[] = [
    ...Array<null>(dayOfWeek).fill(null),
    ...days,
  ];
  while (padded.length % 7 !== 0) padded.push(null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
            >
              ←
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-0">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-medium text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
          {padded.map((day, i) => (
            <CalendarDay
              key={day ? format(day, "yyyy-MM-dd") : `empty-${i}`}
              day={day}
              leaveDaySet={leaveDaySet}
              leaveType={leaveType}
              start={from}
              end={to}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
