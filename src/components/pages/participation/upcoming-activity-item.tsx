import { format } from "date-fns";
import { MapPin, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { UpcomingEntry } from "./upcoming-entries";

type Props = {
  entry: UpcomingEntry;
  isNext: boolean;
  showActivityDetails: boolean;
  isOwner: boolean;
  onEdit: (entry: UpcomingEntry) => void;
  onDelete: (activityId: string) => void;
  onOpenEditActivity: (id: string) => void;
  onNavigate?: (activityId: string) => void;
};

export default function UpcomingActivityItem({
  entry,
  isNext,
  showActivityDetails,
  isOwner,
  onEdit,
  onDelete,
  onOpenEditActivity,
  onNavigate,
}: Props) {
  const isEditable = !!entry.editParticipationId && !!entry.dateField;
  const isNavigable = !!onNavigate;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors",
        isNext
          ? "bg-primary/[0.07] border border-primary/20"
          : "hover:bg-muted/50",
        isNavigable && "cursor-pointer",
      )}
      onClick={isNavigable ? () => onNavigate!(entry.id) : undefined}
    >
      <div className="shrink-0 text-center w-14">
        <p
          className={cn(
            "font-mono tabular-nums",
            isNext ? "text-primary font-semibold" : "text-muted-foreground",
          )}
        >
          {format(new Date(entry.from), "MMM d")}
        </p>
        <p className="font-mono tabular-nums text-muted-foreground/70">
          {format(new Date(entry.from), "HH:mm")}
        </p>
      </div>
      <div
        className={cn(
          "h-8 w-px shrink-0",
          isNext ? "bg-primary/30" : "bg-border",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isNext && (
            <Badge
              variant="secondary"
              className="shrink-0 text-[10px] px-1.5 py-0 h-4 font-semibold text-primary bg-primary/10 border-primary/20"
            >
              Next
            </Badge>
          )}
          <p
            className={cn("font-medium truncate", isNext && "text-foreground")}
          >
            {entry.syntheticKind || showActivityDetails
              ? entry.name
              : "Activity"}
          </p>
        </div>
        {(entry.syntheticKind || showActivityDetails) && entry.location && (
          <div className="flex items-center gap-1 min-w-0 text-muted-foreground">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{entry.location}</span>
          </div>
        )}
      </div>

      {isEditable && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(entry);
          }}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      )}
      {!entry.syntheticKind && entry.activityId && isOwner && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onOpenEditActivity(entry.activityId!);
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive/70 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(entry.activityId!);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </>
      )}
      {entry.syntheticKind && !isEditable && (
        <Badge
          variant="secondary"
          className="shrink-0 text-[10px] px-1.5 py-0 h-4 font-normal"
        >
          milestone
        </Badge>
      )}
    </div>
  );
}
