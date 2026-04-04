"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Clock,
  ExternalLink,
  GripVertical,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useActivities,
  useDeleteActivity,
} from "@/hooks/activities/useActivities";
import { ActivityMediaDTO, ActivityWithMedia } from "@/types/activity.d";
import { cn } from "@/lib/utils";
import ActivityInlineForm from "@/components/pages/participation/activity-inline-form";

// ─── Local types ─────────────────────────────────────────────────────────────

type MemberUser = {
  id: string;
  name: string;
  image: string | null;
  email: string;
};

type EventProp = {
  id: string;
  title: string;
  startAt: Date | string;
  endAt: Date | string;
  location: string | null;
  locationUrl: string | null;
  image: string | null;
} | null;

type EventActivity = {
  id: string;
  name: string;
  from: Date | string;
  to: Date | string;
  location: string | null;
  locationUrl: string | null;
  imageUrl: string | null;
  involvedPeople: string[];
  note: null;
  media: ActivityMediaDTO[];
  isSynthetic: true;
};

type DisplayActivity = ActivityWithMedia | EventActivity;

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ─── User Popover ────────────────────────────────────────────────────────────

function UserPopover({
  userId,
  allUsers,
}: {
  userId: string;
  allUsers: { id: string; name: string; image: string | null; email: string }[];
}) {
  const user = allUsers.find((u) => u.id === userId);
  if (!user) return <Badge variant="secondary">Unknown</Badge>;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium hover:bg-secondary/80 transition-colors"
        >
          <Avatar className="h-4 w-4">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="text-[8px]">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          {user.name}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Activity Card ───────────────────────────────────────────────────────────

function ActivityCard({
  activity,
  participationId,
  isOwner,
  allUsers,
  onEdit,
}: {
  activity: DisplayActivity;
  participationId: string;
  isOwner: boolean;
  allUsers: MemberUser[];
  onEdit?: () => void;
}) {
  const deleteMutation = useDeleteActivity();
  const isSynthetic = "isSynthetic" in activity && activity.isSynthetic;
  const from = new Date(activity.from);
  const to = new Date(activity.to);
  const sameTime = from.getTime() === to.getTime();

  const handleDelete = () => {
    deleteMutation.mutate(
      { participationId, activityId: activity.id },
      {
        onSuccess: () => toast.success("Activity deleted"),
        onError: () => toast.error("Failed to delete activity"),
      },
    );
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Drag handle placeholder */}
          {isOwner && !isSynthetic && (
            <div className="flex items-start pt-1 opacity-0 group-hover:opacity-50 transition-opacity cursor-grab">
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          {/* Image thumbnail */}
          {activity.imageUrl && (
            <div className="relative h-16 w-16 rounded-lg overflow-hidden shrink-0">
              <Image
                src={activity.imageUrl}
                alt={activity.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <h4 className="font-semibold text-sm leading-tight">
                  {activity.name}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {sameTime ? (
                    <span>{format(from, "MMM d, yyyy 'at' h:mm a")}</span>
                  ) : (
                    <span>
                      {format(from, "MMM d, h:mm a")} –{" "}
                      {format(to, "MMM d, h:mm a, yyyy")}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {isOwner && !isSynthetic && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit?.()}>
                      <Pencil className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Location */}
            {activity.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{activity.location}</span>
                {activity.locationUrl && (
                  <a
                    href={activity.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {/* Involved people */}
            {activity.involvedPeople.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                {activity.involvedPeople.map((uid) => (
                  <UserPopover key={uid} userId={uid} allUsers={allUsers} />
                ))}
              </div>
            )}

            {/* Note */}
            {activity.note && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {activity.note}
              </p>
            )}

            {/* Media count */}
            {activity.media.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ImageIcon className="h-3 w-3" />
                {activity.media.length}{" "}
                {activity.media.length === 1 ? "photo" : "photos"}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Activity Timeline ───────────────────────────────────────────────────────

export default function ActivityTimeline({
  participationId,
  isOwner,
  members = [],
  event,
}: {
  participationId: string;
  isOwner: boolean;
  members?: MemberUser[];
  event?: EventProp;
}) {
  const { data: activities, isLoading } = useActivities(participationId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    ...syntheticItems,
    ...(activities ?? []),
  ].sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime());

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
          {isOwner && !showAddForm && (
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
  allItems.forEach((a) => {
    const label = format(new Date(a.from), "EEEE, MMMM d, yyyy");
    const list = groups.get(label) ?? [];
    list.push(a);
    groups.set(label, list);
  });

  return (
    <div className="space-y-4">
      {/* Add button */}
      {isOwner && !showAddForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Activity
          </Button>
        </div>
      )}

      {/* Inline add form */}
      {showAddForm && (
        <ActivityInlineForm
          participationId={participationId}
          allUsers={members}
          onDone={() => setShowAddForm(false)}
        />
      )}

      {/* Timeline */}
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
              {dayActivities.map((activity) => (
                <div key={activity.id} className="contents">
                  <div className="flex items-center justify-center self-stretch">
                    <div className="h-3 w-3 shrink-0 rounded-full border-2 border-primary bg-background z-10" />
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
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Activity Overview Section ───────────────────────────────────────────────

export function ActivityOverviewSection({
  participationId,
  isOwner,
  members = [],
  event,
}: {
  participationId: string;
  isOwner: boolean;
  members?: MemberUser[];
  event?: EventProp;
}) {
  const { data: activities, isLoading } = useActivities(participationId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    ...syntheticItems,
    ...(activities ?? []),
  ].sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime());

  const totalReal = activities?.length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            Activities{totalReal > 0 ? ` (${totalReal})` : ""}
          </CardTitle>
          {isOwner && !showAddForm && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {isLoading && (
          <div className="space-y-2 py-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading &&
          allItems.map((activity) => {
            if (editingId === activity.id) {
              return (
                <ActivityInlineForm
                  key={activity.id}
                  participationId={participationId}
                  activity={"isSynthetic" in activity ? undefined : activity}
                  allUsers={members}
                  onDone={() => setEditingId(null)}
                />
              );
            }
            return (
              <ActivityCard
                key={activity.id}
                activity={activity}
                participationId={participationId}
                isOwner={isOwner}
                allUsers={members}
                onEdit={
                  "isSynthetic" in activity
                    ? undefined
                    : () => setEditingId(activity.id)
                }
              />
            );
          })}

        {!isLoading && allItems.length === 0 && !showAddForm && (
          <p className="text-xs text-muted-foreground text-center py-6">
            No activities yet.{" "}
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="underline underline-offset-2"
              >
                Add one?
              </button>
            )}
          </p>
        )}

        {showAddForm && (
          <ActivityInlineForm
            participationId={participationId}
            allUsers={members}
            onDone={() => setShowAddForm(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}
