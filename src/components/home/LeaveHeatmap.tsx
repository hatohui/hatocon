"use client";

import * as React from "react";
import {
  eachDayOfInterval,
  endOfYear,
  format,
  getDay,
  getMonth,
  startOfYear,
} from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHeatmap } from "@/hooks/participations/useParticipations";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** 0 = Sunday, 6 = Saturday */
const isWeekendDay = (dayIndex: number) => dayIndex === 0 || dayIndex === 6;

function getCellClass(intensity: number, weekend: boolean): string {
  if (weekend) {
    return "bg-muted/20 border border-muted/20 cursor-default opacity-40";
  }
  if (intensity === 0) return "bg-muted/50 hover:bg-muted/70";
  if (intensity <= 0.5)
    return "bg-emerald-200 hover:bg-emerald-300 dark:bg-emerald-900 dark:hover:bg-emerald-800";
  if (intensity <= 1)
    return "bg-emerald-400 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600";
  if (intensity <= 2)
    return "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-400";
  return "bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-300 dark:hover:bg-emerald-200";
}

export default function LeaveHeatmap() {
  const { data: heatmapData, isLoading } = useHeatmap();

  const year = new Date().getFullYear();
  const days = eachDayOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  });

  // Build intensity map from API data
  const intensityMap = React.useMemo(() => {
    const map = new Map<string, number>();
    heatmapData?.forEach(({ date, intensity }) => {
      map.set(date, intensity);
    });
    return map;
  }, [heatmapData]);

  // Organise days into weeks (columns), padded so week starts on Sunday
  type WeekDay = { date: Date; dayOfWeek: number } | null;
  const weeks: WeekDay[][] = [];
  let currentWeek: WeekDay[] = [];

  // Pad beginning to first Sunday
  const firstDayOfWeek = getDay(days[0]); // 0=Sun
  for (let i = 0; i < firstDayOfWeek; i++) currentWeek.push(null);

  days.forEach((day) => {
    const dow = getDay(day);
    currentWeek.push({ date: day, dayOfWeek: dow });
    if (dow === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  // Month label positions: track first week index for each month
  const monthPositions: { month: number; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    week.forEach((cell) => {
      if (cell) {
        const m = getMonth(cell.date);
        if (m !== lastMonth) {
          monthPositions.push({ month: m, col });
          lastMonth = m;
        }
      }
    });
  });

  // Cell dimensions (px): 14px cell + 2px gap = 16px column width
  const CELL = 14;
  const GAP = 2;
  const COL_W = CELL + GAP;
  const DAY_LABEL_W = 28;

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (isLoading) {
    return <Skeleton className="h-28 w-full rounded-lg" />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="inline-flex gap-0"
        style={{ minWidth: `${DAY_LABEL_W + weeks.length * COL_W}px` }}
      >
        {/* Day labels column */}
        <div
          className="flex flex-col shrink-0"
          style={{ width: DAY_LABEL_W, paddingTop: 20 }}
        >
          {DAY_NAMES.map((name, i) => (
            <div
              key={name}
              className="text-[10px] text-muted-foreground leading-none flex items-center"
              style={{
                height: CELL,
                marginBottom: i < 6 ? GAP : 0,
                opacity: isWeekendDay(i) ? 0.35 : 1,
              }}
            >
              {/* Only show Mon, Wed, Fri */}
              {i === 1 || i === 3 || i === 5 ? name : ""}
            </div>
          ))}
        </div>

        {/* Grid area */}
        <div className="flex flex-col relative" style={{ flex: 1 }}>
          {/* Month labels */}
          <div className="relative" style={{ height: 18, marginBottom: 2 }}>
            {monthPositions.map(({ month, col }) => (
              <span
                key={month}
                className="absolute text-[10px] text-muted-foreground font-medium"
                style={{ left: col * COL_W }}
              >
                {MONTH_LABELS[month]}
              </span>
            ))}
          </div>

          {/* Weeks grid */}
          <div className="flex" style={{ gap: GAP }}>
            {weeks.map((week, wi) => (
              <div
                key={wi}
                className="flex flex-col"
                style={{ gap: GAP, width: CELL }}
              >
                {week.map((cell, di) => {
                  if (!cell) {
                    return (
                      <div
                        key={di}
                        style={{ width: CELL, height: CELL }}
                        className="rounded-sm bg-transparent"
                      />
                    );
                  }

                  const dateStr = format(cell.date, "yyyy-MM-dd");
                  const intensity = intensityMap.get(dateStr) ?? 0;
                  const weekend = isWeekendDay(cell.dayOfWeek);
                  const cellClass = getCellClass(intensity, weekend);

                  if (weekend) {
                    return (
                      <div
                        key={dateStr}
                        style={{ width: CELL, height: CELL }}
                        className={cn(
                          "rounded-sm transition-colors",
                          cellClass,
                        )}
                      />
                    );
                  }

                  return (
                    <Tooltip key={dateStr}>
                      <TooltipTrigger asChild>
                        <div
                          style={{ width: CELL, height: CELL }}
                          className={cn(
                            "rounded-sm transition-colors cursor-default",
                            cellClass,
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-medium">
                          {format(cell.date, "MMM d, yyyy")}
                        </p>
                        {intensity > 0 ? (
                          <p className="text-muted-foreground">
                            {intensity.toFixed(1)} day
                            {intensity !== 1 ? "s" : ""} leave
                          </p>
                        ) : (
                          <p className="text-muted-foreground">No leave</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-muted-foreground">Less</span>
            {[0, 0.3, 0.7, 1.2, 2.5].map((v) => (
              <div
                key={v}
                style={{ width: CELL, height: CELL }}
                className={cn("rounded-sm", getCellClass(v, false))}
              />
            ))}
            <span className="text-[10px] text-muted-foreground">More</span>
            <span className="mx-2 text-muted-foreground/30">|</span>
            <div
              style={{ width: CELL, height: CELL }}
              className={cn("rounded-sm", getCellClass(0, true))}
            />
            <span className="text-[10px] text-muted-foreground">Weekend</span>
          </div>
        </div>
      </div>
    </div>
  );
}
