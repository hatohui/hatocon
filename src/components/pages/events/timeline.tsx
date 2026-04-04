import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { durationLabel } from "@/lib/utils";
import { Event } from "@prisma/client";
import { format } from "date-fns";
import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import React from "react";

interface EventTimeLineProps {
  events: Event[] | undefined;
  isLoading: boolean;
  onSelect: (e: Event) => void;
}

const EventTimeLine = ({
  events,
  isLoading,
  onSelect,
}: EventTimeLineProps): React.ReactElement => {
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
};

export default EventTimeLine;
