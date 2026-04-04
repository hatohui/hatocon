import { Skeleton } from "@/components/ui/skeleton";
import { Event } from "@prisma/client";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import React from "react";
import TimelineEventCard from "./timeline-event-card";

interface EventTimeLineProps {
  events: Event[] | undefined;
  isLoading: boolean;
  onSelect: (e: Event) => void;
  participationsByEventId?: Record<string, string>;
}

const EventTimeLine = ({
  events,
  isLoading,
  onSelect,
  participationsByEventId,
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

  const groups = new Map<string, Event[]>();
  events.forEach((e) => {
    const label = format(new Date(e.startAt), "MMMM yyyy");
    const list = groups.get(label) ?? [];
    list.push(e);
    groups.set(label, list);
  });

  return (
    <div className="relative grid grid-cols-[10px_1fr] items-start gap-x-4 gap-y-4">
      <div className="absolute left-1 top-0 bottom-0 w-px bg-border" />

      {Array.from(groups.entries()).map(([month, monthEvents]) => (
        <React.Fragment key={month}>
          <div className="col-span-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm font-semibold text-muted-foreground px-2">
              {month}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {monthEvents.map((event) => (
            <React.Fragment key={event.id}>
              <div className="flex items-center justify-center self-stretch">
                <div className="h-3 w-3 shrink-0 rounded-full border-2 border-primary bg-background z-10" />
              </div>
              <TimelineEventCard
                event={event}
                onSelect={onSelect}
                participationId={participationsByEventId?.[event.id]}
              />
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

export default EventTimeLine;
