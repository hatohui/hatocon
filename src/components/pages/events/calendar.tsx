import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAllEvents } from "@/hooks/events/useEvents";
import { cn } from "@/lib/utils";
import { Event } from "@prisma/client";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  startOfToday,
} from "date-fns";
import React from "react";
import EventCard from "./event-card";

interface EventCalendarProps {
  q: string;
  onSelect: (e: Event) => void;
  participationsByEventId?: Record<string, string>;
}

const EventCalendar = ({
  q,
  onSelect,
  participationsByEventId,
}: EventCalendarProps): React.ReactElement => {
  const [currentMonth, setCurrentMonth] = React.useState(startOfToday());
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);

  const year = currentMonth.getFullYear();

  // Fetch all events for the year
  const { data: yearEvents } = useAllEvents({
    q: q || undefined,
    from: new Date(year, 0, 1),
    to: new Date(year, 11, 31, 23, 59, 59),
  });

  const monthFrom = startOfMonth(currentMonth);
  const monthTo = endOfMonth(currentMonth);

  const days = eachDayOfInterval({ start: monthFrom, end: monthTo });
  // Pad start to Monday (1) – shift from Sunday-first to Monday-first
  const dayOfWeek = (monthFrom.getDay() + 6) % 7; // 0=Mon
  const padded: (Date | null)[] = [
    ...Array<null>(dayOfWeek).fill(null),
    ...days,
  ];
  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

  // Filter events for the visible month and map by date
  const events = React.useMemo(() => {
    if (!yearEvents) return [];
    return yearEvents.filter((e) => {
      const start = new Date(e.startAt);
      const end = new Date(e.endAt);
      return start <= monthTo && end >= monthFrom;
    });
  }, [yearEvents, monthFrom, monthTo]);

  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, Event[]>();
    events?.forEach((e) => {
      // Place event on every day it spans within the visible month
      const start = new Date(e.startAt);
      const end = new Date(e.endAt);
      const rangeStart = start < monthFrom ? monthFrom : start;
      const rangeEnd = end > monthTo ? monthTo : end;
      const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      for (const day of days) {
        const key = format(day, "yyyy-MM-dd");
        const list = map.get(key) ?? [];
        list.push(e);
        map.set(key, list);
      }
    });
    return map;
  }, [events, monthFrom, monthTo]);

  const selectedEvents = selectedDay
    ? (eventsByDate.get(format(selectedDay, "yyyy-MM-dd")) ?? [])
    : [];

  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(startOfToday())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              >
                →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b">
            {DAY_NAMES.map((d, i) => (
              <div
                key={d}
                className={cn(
                  "text-center text-xs font-medium py-2",
                  i >= 5 ? "text-muted-foreground/40" : "text-muted-foreground",
                )}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="border-l">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b">
                {week.map((day, di) => {
                  if (!day)
                    return (
                      <div key={di} className="min-h-20 border-r bg-muted/20" />
                    );

                  const dayKey = format(day, "yyyy-MM-dd");
                  const dayEvents = eventsByDate.get(dayKey) ?? [];
                  const isWeekendDay = di >= 5;
                  const isSel = !!(selectedDay && isSameDay(day, selectedDay));
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={dayKey}
                      onClick={() => setSelectedDay(isSel ? null : day)}
                      className={cn(
                        "min-h-20 flex flex-col items-start p-1 border-r text-sm transition-colors",
                        isWeekendDay && "bg-muted/10",
                        isSel && "bg-primary/5 ring-1 ring-inset ring-primary",
                        !isSel && "hover:bg-muted/40",
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-medium w-5 h-5 mb-1 flex items-center justify-center rounded-full shrink-0",
                          isToday
                            ? "bg-primary text-primary-foreground font-bold"
                            : isWeekendDay
                              ? "text-muted-foreground/40"
                              : "text-foreground",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="flex flex-col gap-0.5 w-full min-w-0">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className={cn(
                              "flex items-center gap-1 rounded px-1 py-0.5 w-full min-w-0",
                              !ev.isApproved
                                ? "bg-amber-500/15"
                                : ev.visibility === "PRIVATE"
                                  ? "bg-purple-500/15"
                                  : "bg-primary/10",
                            )}
                          >
                            {ev.image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={ev.image}
                                alt=""
                                className="h-3 w-3 rounded-sm object-cover shrink-0"
                              />
                            )}
                            <span
                              className={cn(
                                "text-[10px] font-medium truncate leading-tight",
                                !ev.isApproved
                                  ? "text-amber-700 dark:text-amber-400"
                                  : ev.visibility === "PRIVATE"
                                    ? "text-purple-700 dark:text-purple-400"
                                    : "text-primary",
                              )}
                            >
                              {ev.title}
                            </span>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[10px] text-muted-foreground pl-1">
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected day events */}
      {selectedDay && (
        <div className="space-y-3">
          <h3 className="font-semibold">
            Events on {format(selectedDay, "EEEE, MMMM d")}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events this day.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedEvents.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  onClick={() => onSelect(e)}
                  participationId={participationsByEventId?.[e.id]}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventCalendar;
