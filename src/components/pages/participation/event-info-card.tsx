import Image from "next/image";
import Link from "next/link";
import { Calendar, ExternalLink, Lock, MapPin } from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type EventInfo = {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  startAt: Date | string;
  endAt: Date | string;
  location?: string | null;
  locationUrl?: string | null;
  visibility: string;
};

export default function EventInfoCard({ event }: { event: EventInfo }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {event.image && (
            <div className="relative h-20 w-28 rounded-lg overflow-hidden shrink-0">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-1 space-x-3">
            <Link
              href={`/events?selected=${event.id}`}
              className="font-semibold hover:underline"
            >
              {event.title}
            </Link>
            {event.visibility === "PRIVATE" && (
              <Badge className="mt-1 text-[10px] h-4 px-1.5 gap-0.5 bg-violet-500/15 text-violet-700 border border-violet-300 hover:bg-violet-500/15 dark:text-violet-400 dark:border-violet-700">
                <Lock className="h-2.5 w-2.5" />
                Private
              </Badge>
            )}
            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(event.startAt), "MMM d")} –{" "}
                {format(new Date(event.endAt), "MMM d, yyyy")}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                  {event.locationUrl && (
                    <a
                      href={event.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
