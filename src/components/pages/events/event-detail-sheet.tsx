import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMyParticipationForEvent } from "@/hooks/events/useEvents";
import { cn, durationLabel } from "@/lib/utils";
import { Event } from "@prisma/client";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Pencil,
  Plane,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

interface EventDetailSheetProps {
  event: Event | null;
  onClose: () => void;
}

const EventDetailSheet = ({
  event,
  onClose,
}: EventDetailSheetProps): React.ReactElement => {
  const { data: session } = useSession();
  const { data: myParticipation } = useMyParticipationForEvent(
    event?.id ?? null,
  );
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

              <Separator />

              {myParticipation ? (
                <Link
                  href={`/participations/${myParticipation.id}`}
                  className="block"
                >
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2 hover:bg-muted transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold flex items-center gap-1.5">
                        <Plane className="h-4 w-4 text-primary" />
                        Your Plan
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          myParticipation.leaveType === "ANNUAL"
                            ? "bg-blue-100 text-blue-800"
                            : myParticipation.leaveType === "SICK"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800",
                        )}
                      >
                        {myParticipation.leaveType.charAt(0) +
                          myParticipation.leaveType.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(myParticipation.from), "MMM d")} –{" "}
                        {format(new Date(myParticipation.to), "MMM d, yyyy")}
                      </span>
                      <span className="text-muted-foreground">
                        ·{" "}
                        {Math.ceil(
                          (new Date(myParticipation.to).getTime() -
                            new Date(myParticipation.from).getTime()) /
                            (1000 * 60 * 60 * 24),
                        ) + 1}{" "}
                        days
                      </span>
                    </div>
                    <p className="text-xs text-primary font-medium">
                      View details →
                    </p>
                  </div>
                </Link>
              ) : (
                <Button className="w-full gap-2" asChild>
                  <Link href={`/leave/new?eventId=${event.id}`}>
                    <Plane className="h-4 w-4" />
                    Create a Plan for This Event
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
export default EventDetailSheet;
