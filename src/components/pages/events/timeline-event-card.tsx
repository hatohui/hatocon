import { Card, CardContent } from "@/components/ui/card";
import { durationLabel } from "@/lib/utils";
import { Event } from "@prisma/client";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

const TimelineEventCard = ({
  event,
  onSelect,
}: {
  event: Event;
  onSelect: (e: Event) => void;
}): React.ReactElement => {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);

  return (
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
          <Separator orientation="vertical" className="h-auto self-stretch" />
          {event.image && (
            <div className="relative h-14 w-20 rounded-md overflow-hidden shrink-0">
              <div className="h-6 w-2" />
              asdasdas
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-shadow-muted-foreground text-xs"> in 2 days</p>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm">{event.title}</p>
              <Badge variant="secondary" className="shrink-0 text-[10px]">
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
  );
};

export default TimelineEventCard;
