"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useActivities } from "@/hooks/activities/useActivities";
import ActivityInlineForm from "@/components/pages/participation/activity-inline-form";

import {
  type DisplayActivity,
  type EventActivity,
  type EventProp,
  type MemberUser,
} from "./activity-timeline.types";
import { ActivityCard } from "./activity-card";

export const ActivityOverviewSection = ({
  participationId,
  isOwner,
  members = [],
  event,
}: {
  participationId: string;
  isOwner: boolean;
  members?: MemberUser[];
  event?: EventProp;
}) => {
  const { data: activities, isLoading } = useActivities(participationId);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
};
