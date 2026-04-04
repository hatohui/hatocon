import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { CalendarCheck, Lock, Pencil, Clock, MapPin } from "lucide-react";
import type { Event } from "@prisma/client";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { durationLabel } from "@/lib/utils";
import Link from "next/link";

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  isOwner?: boolean;
  participationId?: string;
}

const EventCard = ({
  event,
  onClick,
  isOwner,
  participationId,
}: EventCardProps) => {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden relative group"
      onClick={onClick}
    >
      {isOwner && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          asChild
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={`/events/${event.id}/edit`}>
            <Pencil className="h-3.5 w-3.5" />
          </Link>
        </Button>
      )}
      {event.image && (
        <div className="relative w-full aspect-video">
          <Image
            src={event.image}
            alt={event.title}
            fill
            sizes="33vw"
            className="object-cover rounded-xl p-2"
          />
        </div>
      )}
      <CardContent className="px-4 flex h-full flex-col justify-between">
        <div>
          <p className="font-semibold leading-tight">{event.title}</p>
          {event.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
          </span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {durationLabel(start, end)}
          </Badge>
          {event.visibility === "PRIVATE" && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5">
              <Lock className="h-2.5 w-2.5" />
              Private
            </Badge>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-45">
              <MapPin className="h-3 w-3 shrink-0" />
              {event.location}
            </span>
          )}
          {participationId && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-1 h-7 gap-1.5 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <Link href={`/participations/${participationId}`}>
                <CalendarCheck className="h-3 w-3" />
                See your plan
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
