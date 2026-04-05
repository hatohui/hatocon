"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  ArrowUpDown,
  ChevronDown,
  Clock,
  MapPinCheck,
  Pencil,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

import { useActivities } from "@/hooks/activities/useActivities";
import { useUpdateParticipationDates } from "@/hooks/participations/useParticipations";
import { useArrivalDepartureItems } from "@/hooks/participations/useArrivalDepartureItems";
import type { ParticipationParticipant } from "@/types/participation.d";
import { cn } from "@/lib/utils";
import ActivityInlineForm from "@/components/pages/participation/activity-inline-form";

import {
  initials,
  type DisplayActivity,
  type EventActivity,
  type EventProp,
  type MemberUser,
} from "./activity-timeline.types";
import { ActivityCard } from "./activity-card";

export { ActivityOverviewSection } from "./activity-overview-section";

// ─── Activity Timeline ───────────────────────────────────────────────────────

const ActivityTimeline = ({
  participationId,
  participationFrom,
  participationTo,
  participationEntryFlight,
  participationExitFlight,
  participantUser,
  currentUserId,
  isOwner,
  members = [],
  participants = [],
  event,
}: {
  participationId: string;
  participationFrom: Date | string | null;
  participationTo: Date | string | null;
  participationEntryFlight?: string | null;
  participationExitFlight?: string | null;
  participantUser?: MemberUser | null;
  currentUserId?: string | null;
  isOwner: boolean;
  members?: MemberUser[];
  participants?: ParticipationParticipant[];
  event?: EventProp;
}) => {
  const { data: activities, isLoading } = useActivities(participationId);
  const isGroupMember =
    !!currentUserId && participants.some((p) => p.userId === currentUserId);
  const canAdd = isOwner || isGroupMember;
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDateField, setEditingDateField] = useState<
    "from" | "to" | null
  >(null);
  const [editingParticipationId, setEditingParticipationId] = useState<
    string | null
  >(null);
  const [editingPersonName, setEditingPersonName] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showEventBoundaries, setShowEventBoundaries] = useState(true);
  const [editDateValue, setEditDateValue] = useState("");
  const [editFlightValue, setEditFlightValue] = useState("");
  const updateDates = useUpdateParticipationDates();

  const openDateEdit = (
    pid: string,
    field: "from" | "to",
    current: Date | string,
    personName?: string | null,
  ) => {
    setEditDateValue(format(new Date(current), "yyyy-MM-dd'T'HH:mm"));
    setEditingDateField(field);
    setEditingParticipationId(pid);
    setEditingPersonName(personName ?? null);
    // Pre-fill flight number from matching participant
    const match = participants.find((p) => p.id === pid);
    setEditFlightValue(
      field === "from" ? (match?.entryFlight ?? "") : (match?.exitFlight ?? ""),
    );
  };

  const saveDateEdit = () => {
    if (!editingDateField || !editDateValue || !editingParticipationId) return;
    const flightKey =
      editingDateField === "from" ? "entryFlight" : "exitFlight";
    updateDates.mutate(
      {
        id: editingParticipationId,
        data: {
          [editingDateField]: new Date(editDateValue).toISOString(),
          [flightKey]: editFlightValue.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            editingDateField === "from"
              ? "Arrival updated"
              : "Departure updated",
          );
          setEditingDateField(null);
          setEditingParticipationId(null);
          setEditingPersonName(null);
          setEditFlightValue("");
        },
        onError: () => toast.error("Failed to update"),
      },
    );
  };

  // Synthetic arrival / departure items for ALL participants
  const arrivalDepartureItems = useArrivalDepartureItems({
    participants,
    members,
    currentUserId,
    participantUser,
    participationId,
    participationFrom,
    participationTo,
    participationEntryFlight,
    participationExitFlight,
    isOwner,
  });

  // Synthetic event boundary items
  const syntheticItems: EventActivity[] = event
    ? [
        {
          id: "__event_start",
          name: `${event.title} starts`,
          from: event.startAt,
          to: event.startAt,
          location: event.location,
          locationUrl: event.locationUrl,
          imageUrl: event.image,
          involvedPeople: [],
          note: null,
          media: [],
          isSynthetic: true,
        },
        {
          id: "__event_end",
          name: `${event.title} ends`,
          from: event.endAt,
          to: event.endAt,
          location: event.location,
          locationUrl: event.locationUrl,
          imageUrl: event.image,
          involvedPeople: [],
          note: null,
          media: [],
          isSynthetic: true,
        },
      ]
    : [];

  const allItems: DisplayActivity[] = [
    ...arrivalDepartureItems,
    ...(showEventBoundaries ? syntheticItems : []),
    ...(activities ?? []),
  ];

  const visibleItems = allItems
    .filter((a) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = a.name.toLowerCase().includes(q);
        const locationMatch = a.location?.toLowerCase().includes(q) ?? false;
        const noteMatch =
          "note" in a &&
          typeof a.note === "string" &&
          a.note.toLowerCase().includes(q);
        const userMatch = a.involvedPeople.some((uid) => {
          const u = members.find((m) => m.id === uid);
          return (
            u &&
            (u.name.toLowerCase().includes(q) ||
              u.email.toLowerCase().includes(q))
          );
        });
        if (!nameMatch && !locationMatch && !noteMatch && !userMatch)
          return false;
      }
      if (selectedUsers.length > 0) {
        const isExclude = "isExcludeMode" in a && a.isExcludeMode;
        // Empty involvedPeople = @Everyone — always matches any user filter
        if (a.involvedPeople.length === 0) {
          // @Everyone: always visible
        } else if (isExclude) {
          // Exclude mode: visible if the selected users are NOT in the excluded list
          if (selectedUsers.every((uid) => a.involvedPeople.includes(uid)))
            return false;
        } else {
          // Include mode: visible if any selected user is in the involved list
          if (!a.involvedPeople.some((uid) => selectedUsers.includes(uid)))
            return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      const diff = new Date(a.from).getTime() - new Date(b.from).getTime();
      return sortOrder === "asc" ? diff : -diff;
    });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-5 mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold">No activities yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Plan your trip by adding activities to the timeline.
          </p>
          {canAdd && !showAddForm && (
            <Button size="sm" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add First Activity
            </Button>
          )}
        </div>
        {showAddForm && (
          <ActivityInlineForm
            participationId={participationId}
            allUsers={members}
            onDone={() => setShowAddForm(false)}
          />
        )}
      </div>
    );
  }

  // Group by date
  const groups = new Map<string, DisplayActivity[]>();
  visibleItems.forEach((a) => {
    const label = format(new Date(a.from), "EEEE, MMMM d, yyyy");
    const list = groups.get(label) ?? [];
    list.push(a);
    groups.set(label, list);
  });

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar: search + filter + sort + add */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-40">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search activities, people, locations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {members.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 shrink-0"
                >
                  <Users className="h-3.5 w-3.5" />
                  {selectedUsers.length > 0
                    ? `${selectedUsers.length} user${
                        selectedUsers.length > 1 ? "s" : ""
                      }`
                    : "Users"}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-2" align="end">
                <div className="space-y-0.5">
                  {members.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-input accent-primary"
                        checked={selectedUsers.includes(m.id)}
                        onChange={(e) =>
                          setSelectedUsers((prev) =>
                            e.target.checked
                              ? [...prev, m.id]
                              : prev.filter((id) => id !== m.id),
                          )
                        }
                      />
                      <Avatar className="h-5 w-5 shrink-0">
                        <AvatarImage src={m.image ?? undefined} />
                        <AvatarFallback className="text-[8px]">
                          {initials(m.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm truncate">{m.name}</span>
                    </label>
                  ))}
                </div>
                {selectedUsers.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1.5 h-7 text-xs"
                    onClick={() => setSelectedUsers([])}
                  >
                    Clear filter
                  </Button>
                )}
              </PopoverContent>
            </Popover>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 shrink-0"
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortOrder === "asc" ? "Oldest first" : "Newest first"}
          </Button>

          {event && (
            <Button
              variant={showEventBoundaries ? "secondary" : "outline"}
              size="sm"
              className="h-8 gap-1.5 shrink-0"
              onClick={() => setShowEventBoundaries((v) => !v)}
            >
              {showEventBoundaries
                ? "Hide event markers"
                : "Show event markers"}
            </Button>
          )}

          {canAdd && !showAddForm && (
            <Button
              size="sm"
              className="h-8 ml-auto shrink-0"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add
            </Button>
          )}
        </div>
        {/* "I'm already here" toggle for current user */}
        {(() => {
          const myParticipant = participants.find(
            (p) => p.userId === currentUserId,
          );
          if (!myParticipant) return null;
          return (
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors w-full",
                myParticipant.isAlreadyHere
                  ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-input bg-muted/30 text-muted-foreground hover:bg-muted/50",
              )}
              onClick={() => {
                updateDates.mutate(
                  {
                    id: participationId,
                    data: {
                      isAlreadyHere: !myParticipant.isAlreadyHere,
                    },
                  },
                  {
                    onSuccess: () =>
                      toast.success(
                        myParticipant.isAlreadyHere
                          ? "Marked as not already here"
                          : "Marked as already here — no arrival/departure shown",
                      ),
                    onError: () => toast.error("Failed to update"),
                  },
                );
              }}
              disabled={updateDates.isPending}
            >
              <MapPinCheck className="h-3.5 w-3.5 shrink-0" />
              <span>
                {myParticipant.isAlreadyHere
                  ? "You're already here (no arrival/departure shown)"
                  : "I'm already here — skip arrival & departure"}
              </span>
            </button>
          );
        })()}
        {/* Inline add form */}
        {showAddForm && (
          <ActivityInlineForm
            participationId={participationId}
            allUsers={members}
            onDone={() => setShowAddForm(false)}
          />
        )}
        {/* Timeline */}
        {groups.size === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No activities match your filters.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setSearchQuery("");
                setSelectedUsers([]);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="relative grid grid-cols-[10px_1fr] items-start gap-x-4 gap-y-3">
            <div className="absolute left-1 top-0 bottom-0 w-px bg-border" />

            {Array.from(groups.entries()).map(([dateLabel, dayActivities]) => (
              <div key={dateLabel} className="col-span-2 space-y-3">
                {/* Date header */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-muted-foreground px-2 whitespace-nowrap">
                    {dateLabel}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Activities for this date */}
                <div className="grid grid-cols-[10px_1fr] items-start gap-x-4 gap-y-3">
                  {dayActivities.map((activity) => {
                    const isSynth =
                      "isSynthetic" in activity && activity.isSynthetic;
                    const isTravel =
                      isSynth &&
                      "isTravelItem" in activity &&
                      !!activity.isTravelItem;
                    const dotClass = isTravel
                      ? "h-3 w-3 shrink-0 rounded-full border-2 border-amber-500 bg-amber-500 z-10"
                      : isSynth
                        ? "h-3 w-3 shrink-0 rounded-full border-2 border-violet-500 bg-violet-500 z-10"
                        : "h-3 w-3 shrink-0 rounded-full border-2 border-primary bg-background z-10";
                    return (
                      <div key={activity.id} className="contents">
                        <div className="flex items-center justify-center self-stretch">
                          <div className={dotClass} />
                        </div>
                        {editingId === activity.id ? (
                          <ActivityInlineForm
                            participationId={participationId}
                            activity={
                              "isSynthetic" in activity ? undefined : activity
                            }
                            allUsers={members}
                            onDone={() => setEditingId(null)}
                          />
                        ) : (
                          <ActivityCard
                            activity={activity}
                            participationId={participationId}
                            isOwner={isOwner}
                            allUsers={members}
                            onEdit={
                              "isSynthetic" in activity
                                ? undefined
                                : () => setEditingId(activity.id)
                            }
                            onEditDates={
                              "isSynthetic" in activity &&
                              activity.isSynthetic &&
                              (activity.editableDateField ||
                                activity.mergedMembers?.length)
                                ? (pid, field, current, name) =>
                                    openDateEdit(pid, field, current, name)
                                : undefined
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}{" "}
      </div>

      {/* Edit arrival / departure dialog */}
      <Dialog
        open={editingDateField !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDateField(null);
            setEditingParticipationId(null);
            setEditingPersonName(null);
            setEditFlightValue("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingDateField === "from"
                ? "Edit arrival time"
                : "Edit departure time"}
            </DialogTitle>
            {editingPersonName && (
              <p className="text-sm text-muted-foreground">
                Editing {editingPersonName}&apos;s{" "}
                {editingDateField === "from" ? "arrival" : "departure"}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              type="datetime-local"
              value={editDateValue}
              onChange={(e) => setEditDateValue(e.target.value)}
              autoFocus
            />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Flight number (optional)
              </label>
              <Input
                placeholder="e.g. TGW517"
                value={editFlightValue}
                onChange={(e) =>
                  setEditFlightValue(e.target.value.toUpperCase())
                }
                className="uppercase"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingDateField(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveDateEdit}
                disabled={!editDateValue || updateDates.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActivityTimeline;
