import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays } from "lucide-react";
import EventCard from "./event-card";
import { Event } from "@prisma/client";

interface EventListProps {
  events: Event[] | undefined;
  isLoading: boolean;
  onSelect: (event: Event) => void;
  userId?: string;
}

const EventList = ({ events, isLoading, onSelect, userId }: EventListProps) => {
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
      <div className="flex flex-col items-centesr justify-center py-20 text-center">
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
        <EventCard
          key={e.id}
          event={e}
          onClick={() => onSelect(e)}
          isOwner={!!userId && e.createdBy === userId}
        />
      ))}
    </div>
  );
};

export default EventList;
