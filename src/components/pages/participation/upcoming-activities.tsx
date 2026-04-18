"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useActivities,
  useDeleteActivity,
} from "@/hooks/activities/useActivities";

import ActivityInlineForm from "./activity-inline-form";
import EditOwnDatesDialog from "./edit-own-dates-dialog";
import UpcomingActivityItem from "./upcoming-activity-item";
import { buildUpcomingEntries, type UpcomingEntry } from "./upcoming-entries";

type Participant = {
  id: string;
  userId: string;
  from: Date | string;
  to: Date | string;
  isAlreadyHere: boolean;
  entryFlight?: string | null;
  exitFlight?: string | null;
  user: { id: string; name: string };
};

type Props = {
  participationId: string;
  participationFrom: Date | string;
  participationTo: Date | string;
  participationEntryFlight?: string | null;
  participationExitFlight?: string | null;
  participantUser?: { id: string; name: string };
  currentUserId?: string;
  isOwner: boolean;
  showActivityDetails: boolean;
  members?: { id: string; name: string; image: string | null; email: string }[];
  participants?: Participant[];
  event?: {
    title: string;
    startAt: Date | string;
    endAt: Date | string;
    location: string | null;
  } | null;
  onViewAll: () => void;
  onNavigateToActivity?: (activityId: string) => void;
};

export default function UpcomingActivities({
  participationId,
  participationFrom,
  participationTo,
  participationEntryFlight,
  participationExitFlight,
  participantUser,
  currentUserId,
  isOwner,
  showActivityDetails,
  members = [],
  participants = [],
  event,
  onViewAll,
  onNavigateToActivity,
}: Props) {
  const { data: activities, isLoading } = useActivities(
    showActivityDetails ? participationId : null,
  );
  const deleteActivity = useDeleteActivity();
  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null,
  );
  const [editDialogTarget, setEditDialogTarget] = useState<{
    id: string;
    from: Date | string;
    to: Date | string;
    entryFlight?: string | null;
    exitFlight?: string | null;
  } | null>(null);

  const upcoming = buildUpcomingEntries({
    showActivityDetails,
    participants,
    participationFrom,
    participationTo,
    participationEntryFlight,
    participationExitFlight,
    participantUser,
    currentUserId,
    isOwner,
    participationId,
    event,
    activities,
  });

  const handleEditClick = (entry: UpcomingEntry) => {
    if (!entry.editParticipationId) return;
    const participant = participants.find(
      (p) => p.id === entry.editParticipationId,
    );
    setEditDialogTarget(
      participant
        ? {
            id: participant.id,
            from: participant.from,
            to: participant.to,
            entryFlight: participant.entryFlight,
            exitFlight: participant.exitFlight,
          }
        : {
            id: entry.editParticipationId,
            from: participationFrom,
            to: participationTo,
            entryFlight: participationEntryFlight,
            exitFlight: participationExitFlight,
          },
    );
  };

  const handleDelete = (activityId: string) =>
    deleteActivity.mutate(
      { participationId, activityId },
      { onSuccess: () => toast.success("Activity deleted") },
    );

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Upcoming Activities</CardTitle>
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {isLoading && (
            <div className="space-y-2 py-1">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          )}
          {!isLoading && upcoming.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No upcoming activities
            </p>
          )}
          {!isLoading &&
            upcoming.map((entry, i) => (
              <UpcomingActivityItem
                key={entry.id}
                entry={entry}
                isNext={i === 0}
                showActivityDetails={showActivityDetails}
                isOwner={isOwner}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onOpenEditActivity={setEditingActivityId}
                onNavigate={onNavigateToActivity}
              />
            ))}
        </CardContent>
      </Card>

      {editDialogTarget && (
        <EditOwnDatesDialog
          participationId={editDialogTarget.id}
          defaultFrom={editDialogTarget.from}
          defaultTo={editDialogTarget.to}
          defaultEntryFlight={editDialogTarget.entryFlight}
          defaultExitFlight={editDialogTarget.exitFlight}
          open={editDialogTarget !== null}
          onOpenChange={(open) => {
            if (!open) setEditDialogTarget(null);
          }}
        />
      )}

      <Dialog
        open={editingActivityId !== null}
        onOpenChange={(open) => !open && setEditingActivityId(null)}
      >
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {editingActivityId && (
              <ActivityInlineForm
                participationId={participationId}
                activity={activities?.find((a) => a.id === editingActivityId)}
                allUsers={members}
                onDone={() => setEditingActivityId(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
