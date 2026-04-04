import {
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialog,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { differenceInCalendarDays } from "date-fns";
import { Calendar, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { ParticipationWithEvent } from "@/types/participation.d";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const LEAVE_COLOURS: Record<string, string> = {
  ANNUAL: "bg-blue-100 text-blue-800",
  SICK: "bg-amber-100 text-amber-800",
  UNPAID: "bg-gray-100 text-gray-800",
};

interface ParticipationCardProps {
  p: ParticipationWithEvent;
  onDelete: () => void;
  isDeleting: boolean;
}

const ParticipationCard = ({
  p,
  onDelete,
  isDeleting,
}: ParticipationCardProps) => {
  const days = differenceInCalendarDays(new Date(p.to), new Date(p.from)) + 1;

  return (
    <Link href={`/participations/${p.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Event title or stand-alone leave */}
              {p.event ? (
                <p className="font-medium line-clamp-1">{p.event.title}</p>
              ) : (
                <p className="font-medium text-muted-foreground">
                  Stand-alone leave
                </p>
              )}

              {/* Dates + duration */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(p.from), "MMM d")} -{" "}
                  {format(new Date(p.to), "MMM d, yyyy")}
                </span>
                <span>
                  {days} {days === 1 ? "day" : "days"}
                </span>
              </div>

              {/* Leave type badge */}
              <Badge
                variant="secondary"
                className={LEAVE_COLOURS[p.leaveType] ?? ""}
              >
                {p.leaveType.charAt(0) + p.leaveType.slice(1).toLowerCase()}
              </Badge>
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.preventDefault()}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Your leave record and any
                      associated photos will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ParticipationCard;
