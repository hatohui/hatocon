"use client";

import * as React from "react";
import Image from "next/image";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
  startOfToday,
} from "date-fns";
import type { Event } from "@prisma/client";
import {
  Calendar,
  CalendarDays,
  Clock,
  ExternalLink,
  LayoutList,
  List,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllEvents } from "@/hooks/events/useEvents";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function durationLabel(start: Date, end: Date) {
  const days = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return days === 1 ? "1 day" : `${days} days`;
}

// ─── Event Detail Sheet ───────────────────────────────────────────────────────

function EventDetailSheet({
  event,
  onClose,
}: {
  event: Event | null;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const start = event ? new Date(event.startAt) : null;
  const end = event ? new Date(event.endAt) : null;
  const canEdit =
    event &&
    session?.user &&
    (event.createdBy === session.user.id || session.user.isAdmin);

  return (
    <Sheet open={!!event} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {event && start && end && (
          <>
            {event.image && (
              <div className="relative w-full aspect-video">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6 space-y-5">
              <SheetHeader className="p-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <SheetTitle className="text-xl leading-tight">
                    {event.title}
                  </SheetTitle>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 shrink-0"
                      asChild
                    >
                      <Link href={`/events/${event.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{durationLabel(start, end)}</Badge>
                </div>
              </SheetHeader>

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">
                      {format(start, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-muted-foreground">
                      to {format(end, "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{event.location}</p>
                      {event.locationUrl && (
                        <a
                          href={event.locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center gap-1 hover:underline mt-0.5"
                        >
                          View on map
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {event.reference && (
                  <div className="flex items-start gap-3">
                    <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <a
                      href={event.reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm truncate"
                    >
                      {event.reference}
                    </a>
                  </div>
                )}
              </div>

              {event.description && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold">About</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Event Card ───────────────────────────────────────────────────────────────

function EventCard({ event, onClick }: { event: Event; onClick?: () => void }) {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {event.image && (
        <div className="relative w-full aspect-video">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardContent className="p-4">
        <p className="font-semibold text-sm leading-tight">{event.title}</p>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {event.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
          </span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {durationLabel(start, end)}
          </Badge>
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-45">
              <MapPin className="h-3 w-3 shrink-0" />
              {event.location}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── List View ───────────────────────────────────────────────────────────────

function ListView({
  events,
  isLoading,
  onSelect,
}: {
  events: Event[] | undefined;
  isLoading: boolean;
  onSelect: (e: Event) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-5 mb-4">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-semibold">No events found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search or date range.
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => (
        <EventCard key={e.id} event={e} onClick={() => onSelect(e)} />
      ))}
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({
  q,
  onSelect,
}: {
  q: string;
  onSelect: (e: Event) => void;
}) {
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
                            className="flex items-center gap-1 rounded px-1 py-0.5 bg-primary/10 w-full min-w-0"
                          >
                            {ev.image && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={ev.image}
                                alt=""
                                className="h-3 w-3 rounded-sm object-cover shrink-0"
                              />
                            )}
                            <span className="text-[10px] font-medium text-primary truncate leading-tight">
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
                <EventCard key={e.id} event={e} onClick={() => onSelect(e)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Timeline View ────────────────────────────────────────────────────────────

function TimelineView({
  events,
  isLoading,
  onSelect,
}: {
  events: Event[] | undefined;
  isLoading: boolean;
  onSelect: (e: Event) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((g) => (
          <div key={g} className="space-y-3">
            <Skeleton className="h-5 w-24" />
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-muted p-5 mb-4">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-semibold">No events found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search or date range.
        </p>
      </div>
    );
  }

  // Group by "Month Year"
  const groups = new Map<string, Event[]>();
  events.forEach((e) => {
    const label = format(new Date(e.startAt), "MMMM yyyy");
    const list = groups.get(label) ?? [];
    list.push(e);
    groups.set(label, list);
  });

  return (
    <div className="space-y-10">
      {Array.from(groups.entries()).map(([month, monthEvents]) => (
        <div key={month} className="relative">
          {/* Month separator */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-semibold text-muted-foreground px-2">
              {month}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {monthEvents.map((event) => {
                const start = new Date(event.startAt);
                const end = new Date(event.endAt);
                return (
                  <div key={event.id} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-4 top-4 h-3 w-3 rounded-full border-2 border-primary bg-background" />

                    <Card
                      className="hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => onSelect(event)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Date range column */}
                          <div className="shrink-0 text-center w-14">
                            <p className="text-xs font-medium tabular-nums">
                              {format(start, "dd EEE")}
                            </p>
                            <p className="text-[10px] text-muted-foreground leading-none my-0.5">
                              -&gt;
                            </p>
                            <p className="text-xs font-medium tabular-nums">
                              {format(end, "dd EEE")}
                            </p>
                          </div>
                          <Separator
                            orientation="vertical"
                            className="h-auto self-stretch"
                          />
                          {event.image && (
                            <div className="relative h-14 w-20 rounded-md overflow-hidden shrink-0">
                              <Image
                                src={event.image}
                                alt={event.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm">
                                {event.title}
                              </p>
                              <Badge
                                variant="secondary"
                                className="shrink-0 text-[10px]"
                              >
                                {durationLabel(start, end)}
                              </Badge>
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {event.description}
                              </p>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: "This year", days: 365 },
  { label: "Next 6 months", days: 180 },
  { label: "Next 3 months", days: 90 },
  { label: "Next 30 days", days: 30 },
];

export default function EventsPage() {
  const [q, setQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [rangeDays, setRangeDays] = React.useState(365);
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const from = startOfToday();
  const to = new Date(from.getTime() + rangeDays * 24 * 60 * 60 * 1000);

  const { data: events, isLoading } = useAllEvents({
    q: debouncedQ || undefined,
    from,
    to,
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Browse, search and track all approved events
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/events/new">
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search events…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          value={String(rangeDays)}
          onValueChange={(v) => setRangeDays(Number(v))}
        >
          <SelectTrigger className="w-40">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map(({ label, days }) => (
              <SelectItem key={days} value={String(days)}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {events && (
          <span className="text-sm text-muted-foreground">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="list">
        <TabsList className="mb-6">
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <LayoutList className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <ListView
            events={events}
            isLoading={isLoading}
            onSelect={setSelectedEvent}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView q={debouncedQ} onSelect={setSelectedEvent} />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineView
            events={events}
            isLoading={isLoading}
            onSelect={setSelectedEvent}
          />
        </TabsContent>
      </Tabs>

      <EventDetailSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </main>
  );
}
