"use client";

import { format, isSameDay } from "date-fns";
import {
  Clock,
  ExternalLink,
  Image as ImageIcon,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plane,
  Trash2,
  Users,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useDeleteActivity } from "@/hooks/activities/useActivities";

import {
  initials,
  type DisplayActivity,
  type MemberUser,
} from "./activity-timeline.types";
import { UserPopover } from "./user-popover";

export function ActivityCard({
  activity,
  participationId,
  isOwner,
  allUsers,
  onEdit,
  onEditDates,
}: {
  activity: DisplayActivity;
  participationId: string;
  isOwner: boolean;
  allUsers: MemberUser[];
  onEdit?: () => void;
  onEditDates?: (
    participationId: string,
    field: "from" | "to",
    current: Date | string,
    personName?: string | null,
  ) => void;
}) {
  const deleteMutation = useDeleteActivity();
  const isSynthetic = "isSynthetic" in activity && activity.isSynthetic;
  const editableDateField =
    "editableDateField" in activity ? activity.editableDateField : undefined;
  const activityParticipationId =
    "participationId" in activity ? activity.participationId : undefined;
  const mergedMembers =
    "mergedMembers" in activity ? activity.mergedMembers : undefined;
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
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex gap-2.5">
          {/* Image thumbnail */}
          {activity.imageUrl && (
            <div className="relative w-24 shrink-0 self-stretch min-h-13.5 rounded-md overflow-hidden">
              <Image
                src={activity.imageUrl}
                alt={activity.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h4 className="font-semibold pb-0.5 font-sans leading-tight">
                  {activity.name}
                </h4>
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {sameTime ? (
                    <span className="font-medium tabular-nums">
                      {format(from, "h:mm a")}
                    </span>
                  ) : (
                    <span className="font-medium tabular-nums">
                      {isSameDay(from, to)
                        ? `${format(from, "h:mm a")} – ${format(to, "h:mm a")}`
                        : `${format(from, "h:mm a, MMM d")} – ${format(to, "h:mm a, MMM d")}`}
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

              {/* Single-person editable arrival/departure */}
              {isOwner &&
                isSynthetic &&
                editableDateField &&
                activityParticipationId &&
                !mergedMembers?.length && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() =>
                      onEditDates?.(
                        activityParticipationId,
                        editableDateField,
                        activity.from,
                        activity.involvedPeople[0]
                          ? (allUsers.find(
                              (u) => u.id === activity.involvedPeople[0],
                            )?.name ?? null)
                          : null,
                      )
                    }
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}

              {/* Merged-card: dropdown to pick which member to edit */}
              {isOwner &&
                isSynthetic &&
                mergedMembers &&
                mergedMembers.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {mergedMembers.map((m) => (
                        <DropdownMenuItem
                          key={m.userId}
                          onClick={() =>
                            onEditDates?.(
                              m.participationId,
                              m.dateField,
                              m.datetime,
                              m.name,
                            )
                          }
                        >
                          <Avatar className="h-5 w-5 shrink-0">
                            <AvatarImage
                              src={
                                allUsers.find((u) => u.id === m.userId)
                                  ?.image ?? undefined
                              }
                            />
                            <AvatarFallback className="text-[8px]">
                              {initials(m.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex-1 truncate">{m.name}</span>
                        </DropdownMenuItem>
                      ))}
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

            {/* Flight number (for arrival/departure synthetic cards) */}
            {"flightNumber" in activity && activity.flightNumber && (
              <div className="flex items-center gap-1.5 text-xs">
                <Plane className="h-3 w-3 shrink-0 text-muted-foreground" />
                <a
                  href={`https://www.flightaware.com/live/flight/${activity.flightNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  {activity.flightNumber}
                  <ExternalLink className="h-2.5 w-2.5 inline ml-0.5 opacity-70" />
                </a>
              </div>
            )}

            {/* Involved people */}
            {(() => {
              const isExclude =
                "isExcludeMode" in activity && activity.isExcludeMode;
              const hasPeople = activity.involvedPeople.length > 0;
              if (!hasPeople) {
                return (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Badge
                      variant="secondary"
                      className="text-xs h-5 px-2 font-normal"
                    >
                      @Everyone
                    </Badge>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                  {isExclude && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Everyone except
                    </span>
                  )}
                  {activity.involvedPeople.map((uid) => (
                    <UserPopover key={uid} userId={uid} allUsers={allUsers} />
                  ))}
                </div>
              );
            })()}

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
