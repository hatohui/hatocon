"use client";

import { addYears, startOfToday } from "date-fns";
import type { Event } from "@prisma/client";
import { Calendar, LayoutList, List, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllEvents } from "@/hooks/events/useEvents";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import EventTimeLine from "@/components/pages/events/timeline";
import EventCalendar from "@/components/pages/events/calendar";
import EventDetailSheet from "@/components/pages/events/event-detail-sheet";
import EventList from "@/components/pages/events/event-list";
import { useCallback, useEffect, useState } from "react";

const EventPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const from = startOfToday();
  const to = addYears(from, 1);

  const { data: events, isLoading } = useAllEvents({
    q: debouncedQ || undefined,
    from,
    to,
  });

  useEffect(() => {
    const selectedId = searchParams.get("selected");
    if (!selectedId || !events) return;
    if (selectedEvent?.id === selectedId) return;

    const found = events.find((e) => e.id === selectedId);
    if (found) setSelectedEvent(found);
  }, [searchParams, events, selectedEvent?.id]);

  const handleCloseDetailSheet = useCallback(() => {
    setSelectedEvent(null);

    if (!searchParams.has("selected")) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("selected");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

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
          <EventList
            events={events}
            isLoading={isLoading}
            onSelect={setSelectedEvent}
            userId={userId}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <EventCalendar q={debouncedQ} onSelect={setSelectedEvent} />
        </TabsContent>

        <TabsContent value="timeline">
          <EventTimeLine
            events={events}
            isLoading={isLoading}
            onSelect={setSelectedEvent}
          />
        </TabsContent>
      </Tabs>

      <EventDetailSheet
        event={selectedEvent}
        onClose={handleCloseDetailSheet}
      />
    </main>
  );
};

export default EventPage;
