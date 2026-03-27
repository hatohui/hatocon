"use client";

import * as React from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  CalendarDays,
  MapPin,
  Clock,
  Pencil,
  Plus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useUpcomingEvents } from "@/hooks/events/useEvents";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function UpcomingEvents() {
  const { data: events, isLoading } = useUpcomingEvents();
  const { data: session } = useSession();
  const navigate = useRouter();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Upcoming Events</h2>
          {!isLoading && events && events.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {events.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            asChild
          >
            <Link href="/events/new">
              <Plus className="h-3.5 w-3.5" />
              Create Event
            </Link>
          </Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" asChild>
            <Link href="/events">View all</Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : !events || events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-3">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-sm">No upcoming events</p>
          <p className="text-xs text-muted-foreground mt-1">
            Events will appear here once approved
          </p>
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href="/events/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create your first event
            </Link>
          </Button>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {events.map((event) => {
              const startsIn = formatDistanceToNow(new Date(event.startAt), {
                addSuffix: true,
              });
              const duration = Math.ceil(
                (new Date(event.endAt).getTime() -
                  new Date(event.startAt).getTime()) /
                  (1000 * 60 * 60 * 24),
              );

              return (
                <Link
                  key={event.id}
                  href={`/events?selected=${event.id}`}
                  className={cn(
                    "block py-4 px-1 hover:bg-muted/30 rounded-lg transition-colors group",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Date badge */}
                    <div className="shrink-0 w-12 text-center">
                      <div className="bg-primary/10 rounded-lg px-1 py-1.5">
                        <p className="text-[10px] font-medium text-primary uppercase">
                          {format(new Date(event.startAt), "MMM")}
                        </p>
                        <p className="text-lg font-bold leading-none text-primary">
                          {format(new Date(event.startAt), "d")}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight">
                        {event.title}
                      </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {event.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {duration === 1 ? "1 day" : `${duration} days`}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-40">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {event.location}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        {startsIn}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {session?.user?.id === event.createdBy && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          asChild
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate.push(`/events/${event.id}/edit`);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
