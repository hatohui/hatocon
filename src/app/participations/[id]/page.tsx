"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isSameDay,
  isAfter,
  startOfMonth,
  endOfMonth,
  addMonths,
} from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Camera,
  ChevronRight,
  Clock,
  ExternalLink,
  ImageIcon,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Plane,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  useParticipationById,
  useUploadParticipationImage,
  useDeleteParticipationImage,
  useUpdateParticipationDates,
  useAcceptInvite,
  useDeclineInvite,
} from "@/hooks/participations/useParticipations";
import { useNotifications } from "@/hooks/notifications/useNotifications";
import { useActivities, useDeleteActivity } from "@/hooks/activities/useActivities";
import { useUpdateGroupSettings } from "@/hooks/participations/useParticipationGroup";
import { cn } from "@/lib/utils";
import ActivityTimeline from "@/components/pages/participation/activity-timeline";
import ActivityInlineForm from "@/components/pages/participation/activity-inline-form";
import MediaGallery from "@/components/pages/participation/media-gallery";
import ParticipationSettings from "@/components/pages/participation/participation-settings";
import MembersList from "@/components/pages/participation/members-list";
import JoinRequestsPanel from "@/components/pages/participation/join-requests-panel";

const LEAVE_COLOURS: Record<string, string> = {
  ANNUAL: "bg-blue-100 text-blue-800",
  SICK: "bg-amber-100 text-amber-800",
  UNPAID: "bg-gray-100 text-gray-800",
};

const LEAVE_DOT_COLOURS: Record<string, string> = {
  ANNUAL: "bg-blue-500",
  SICK: "bg-amber-500",
  UNPAID: "bg-gray-500",
};

// ─── Edit Group Name Dialog ──────────────────────────────────────────────────

function EditGroupNameDialog({
  participationId,
  currentName,
  open,
  onOpenChange,
}: {
  participationId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState(currentName);
  const updateSettings = useUpdateGroupSettings();

  const handleSave = () => {
    if (!name.trim()) return;
    updateSettings.mutate(
      { participationId, data: { name: name.trim() } },
      {
        onSuccess: () => {
          toast.success("Name updated");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to update name"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Plan name"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!name.trim() || updateSettings.isPending}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Own Dates Dialog ───────────────────────────────────────────────────

function EditOwnDatesDialog({
  participationId,
  defaultFrom,
  defaultTo,
  open,
  onOpenChange,
}: {
  participationId: string;
  defaultFrom: Date | string;
  defaultTo: Date | string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [fromVal, setFromVal] = useState(
    format(new Date(defaultFrom), "yyyy-MM-dd'T'HH:mm"),
  );
  const [toVal, setToVal] = useState(
    format(new Date(defaultTo), "yyyy-MM-dd'T'HH:mm"),
  );
  const updateDates = useUpdateParticipationDates();

  const handleSave = () => {
    if (!fromVal || !toVal) return;
    updateDates.mutate(
      {
        id: participationId,
        data: {
          from: new Date(fromVal).toISOString(),
          to: new Date(toVal).toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Your dates updated");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to update dates"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit your arrival &amp; departure</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Set your personal arrival and departure times within the group plan.
        </p>
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Your arrival</label>
            <Input
              type="datetime-local"
              value={fromVal}
              onChange={(e) => setFromVal(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Your departure</label>
            <Input
              type="datetime-local"
              value={toVal}
              onChange={(e) => setToVal(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!fromVal || !toVal || updateDates.isPending}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Photo Gallery ───────────────────────────────────────────────────────────

function PhotoGallery({
  images,
  participationId,
  onViewAll,
}: {
  images: { id: string; url: string; caption?: string | null }[];
  participationId: string;
  onViewAll: () => void;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const uploadMutation = useUploadParticipationImage();
  const deleteMutation = useDeleteParticipationImage();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    try {
      await uploadMutation.mutateAsync({ participationId, file });
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Upload failed");
    }
    e.target.value = "";
  };

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mb-4">No photos yet</p>
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <label className="cursor-pointer">
                <Camera className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Upload First Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploadMutation.isPending}
                />
              </label>
            </Button>
            <Button size="sm" variant="ghost" onClick={onViewAll}>
              <span className="hidden sm:inline">Open Gallery</span>
              <span className="sm:hidden">Gallery</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Photos ({images.length})</h3>
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs text-primary hover:underline"
            >
              View all →
            </button>
          </div>
          <Button size="sm" variant="outline" asChild>
            <label className="cursor-pointer gap-0 sm:gap-1.5">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploadMutation.isPending}
              />
            </label>
          </Button>
        </div>
        <div className="relative px-8">
          <Carousel className="w-full" opts={{ align: "start", loop: false }}>
            <CarouselContent className="-ml-2">
              {images.map((img) => (
                <CarouselItem
                  key={img.id}
                  className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4"
                >
                  <div className="group relative">
                    <button
                      type="button"
                      className="w-full"
                      onClick={() => setLightbox(img.url)}
                    >
                      <Image
                        src={img.url}
                        alt={img.caption || "Trip photo"}
                        width={300}
                        height={300}
                        className="aspect-square rounded-lg object-cover"
                      />
                    </button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() =>
                        deleteMutation.mutate({
                          participationId,
                          imageId: img.id,
                        })
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    {img.caption && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {img.caption}
                      </p>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 3 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            )}
          </Carousel>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-0">
          <button
            type="button"
            className="absolute top-2 right-2 z-50 text-white/80 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="h-6 w-6" />
          </button>
          {lightbox && (
            <Image
              src={lightbox}
              alt="Full size"
              width={1200}
              height={800}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Mini Calendar View ──────────────────────────────────────────────────────

function ParticipationCalendar({
  from,
  to,
  leaveType,
}: {
  from: Date;
  to: Date;
  leaveType: string;
}) {
  const start = new Date(from);
  const end = new Date(to);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(start));
  const monthFrom = startOfMonth(currentMonth);
  const monthTo = endOfMonth(currentMonth);

  const leaveDays = eachDayOfInterval({ start, end });
  const leaveDaySet = new Set(leaveDays.map((d) => format(d, "yyyy-MM-dd")));

  const days = eachDayOfInterval({ start: monthFrom, end: monthTo });
  const dayOfWeek = (monthFrom.getDay() + 6) % 7;
  const padded: (Date | null)[] = [
    ...Array<null>(dayOfWeek).fill(null),
    ...days,
  ];
  while (padded.length % 7 !== 0) padded.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

  const DAY_NAMES = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
            >
              ←
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-0">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-medium text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
          {weeks.flat().map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="h-8" />;

            const key = format(day, "yyyy-MM-dd");
            const isLeave = leaveDaySet.has(key);
            const isToday = isSameDay(day, new Date());
            const isStart = isSameDay(day, start);
            const isEnd = isSameDay(day, end);

            return (
              <TooltipProvider key={key} delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "h-8 flex items-center justify-center text-xs relative",
                        isLeave && "font-semibold",
                        isStart && "rounded-l-md",
                        isEnd && "rounded-r-md",
                        isLeave &&
                          (leaveType === "ANNUAL"
                            ? "bg-blue-100 text-blue-900"
                            : leaveType === "SICK"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-gray-100 text-gray-900"),
                      )}
                    >
                      <span
                        className={cn(
                          "w-6 h-6 flex items-center justify-center rounded-full",
                          isToday &&
                            !isLeave &&
                            "bg-primary text-primary-foreground font-bold",
                          isToday && isLeave && "ring-2 ring-primary",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  </TooltipTrigger>
                  {isLeave && (
                    <TooltipContent>
                      <p>{format(day, "EEEE, MMMM d")}</p>
                      <p className="text-xs text-muted-foreground">
                        {leaveType.charAt(0) + leaveType.slice(1).toLowerCase()}{" "}
                        leave
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Upcoming Activities ─────────────────────────────────────────────────────

type UpcomingEntry = {
  id: string;
  name: string;
  from: Date | string;
  location?: string | null;
  /** Synthetic kind identifier, or false for real activities */
  syntheticKind: string | false;
  /** For real activities: their ID (used for edit/delete) */
  activityId?: string;
  /** For editable arrival/departure items: which participation to PATCH */
  editParticipationId?: string;
  /** "from" | "to" – which date field to PATCH */
  dateField?: "from" | "to";
};

function UpcomingActivities({
  participationId,
  participationFrom,
  participationTo,
  participantUser,
  currentUserId,
  isOwner,
  showActivityDetails,
  participants = [],
  event,
  onViewAll,
}: {
  participationId: string;
  participationFrom: Date | string;
  participationTo: Date | string;
  participantUser?: { id: string; name: string };
  currentUserId?: string;
  isOwner: boolean;
  showActivityDetails: boolean;
  participants?: Array<{
    id: string;
    userId: string;
    from: Date | string;
    to: Date | string;
    isAlreadyHere: boolean;
    user: { id: string; name: string };
  }>;
  event?: {
    title: string;
    startAt: Date | string;
    endAt: Date | string;
    location: string | null;
  } | null;
  onViewAll: () => void;
}) {
  const { data: activities, isLoading } = useActivities(
    showActivityDetails ? participationId : null,
  );
  const updateDates = useUpdateParticipationDates();
  const deleteActivity = useDeleteActivity();
  // which date field is being edited: "from" (arrival) | "to" (departure) | null
  const [editingField, setEditingField] = useState<"from" | "to" | null>(null);
  const [editingParticipationId, setEditingParticipationId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const now = new Date();

  const openEdit = (participationId: string, field: "from" | "to", currentValue: Date | string) => {
    setEditValue(format(new Date(currentValue), "yyyy-MM-dd'T'HH:mm"));
    setEditingField(field);
    setEditingParticipationId(participationId);
  };

  const handleSave = () => {
    if (!editingField || !editValue || !editingParticipationId) return;
    const newDate = new Date(editValue).toISOString();
    updateDates.mutate(
      {
        id: editingParticipationId,
        data: { [editingField]: newDate },
      },
      {
        onSuccess: () => {
          toast.success(
            editingField === "from"
              ? "Arrival time updated"
              : "Departure time updated",
          );
          setEditingField(null);
          setEditingParticipationId(null);
        },
        onError: () => toast.error("Failed to update"),
      },
    );
  };

  const perParticipantEntries: UpcomingEntry[] =
    showActivityDetails && participants.length > 0
      ? participants
          .filter((p) => !p.isAlreadyHere)
          .flatMap((p) => {
            const isMe = p.userId === currentUserId;
            const isViewed = p.userId === participantUser?.id;
            const canEdit = isOwner || isViewed;
            return [
              {
                id: `__arriving_${p.userId}`,
                name: isMe ? "You arrive" : `${p.user.name} arrives`,
                from: p.from,
                syntheticKind: "__arrival_departure",
                editParticipationId: canEdit ? p.id : undefined,
                dateField: "from" as const,
              },
              {
                id: `__departing_${p.userId}`,
                name: isMe ? "You depart" : `${p.user.name} departs`,
                from: p.to,
                syntheticKind: "__arrival_departure",
                editParticipationId: canEdit ? p.id : undefined,
                dateField: "to" as const,
              },
            ];
          })
      : showActivityDetails
        ? [
            {
              id: "__arriving",
              name:
                !participantUser || participantUser.id === currentUserId
                  ? "You arrive"
                  : `${participantUser.name} arrives`,
              from: participationFrom,
              syntheticKind: "__arrival_departure",
              editParticipationId: isOwner ? participationId : undefined,
              dateField: "from" as const,
            },
            {
              id: "__departing",
              name:
                !participantUser || participantUser.id === currentUserId
                  ? "You depart"
                  : `${participantUser.name} departs`,
              from: participationTo,
              syntheticKind: "__arrival_departure",
              editParticipationId: isOwner ? participationId : undefined,
              dateField: "to" as const,
            },
          ]
        : [];

  const syntheticEntries: UpcomingEntry[] = [
    ...perParticipantEntries,
    ...(event
      ? [
          {
            id: "__event_start",
            name: `${event.title} starts`,
            from: event.startAt,
            location: event.location,
            syntheticKind: "__event_start",
          },
          {
            id: "__event_end",
            name: `${event.title} ends`,
            from: event.endAt,
            location: event.location,
            syntheticKind: "__event_end",
          },
        ]
      : []),
  ];

  const activityEntries: UpcomingEntry[] = (activities ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    from: a.from,
    location: a.location,
    syntheticKind: false,
    activityId: a.id,
  }));

  const upcoming = [...syntheticEntries, ...activityEntries]
    .filter((a) => isAfter(new Date(a.from), now))
    .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime())
    .slice(0, 5);

  const isEditable = (entry: UpcomingEntry) =>
    !!entry.editParticipationId && !!entry.dateField;

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
              View all
              <ChevronRight className="h-3 w-3" />
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
            upcoming.map((a) => (
              <div
                key={a.id}
                className="group flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50 text-xs"
              >
                <div className="shrink-0 text-center w-14">
                  <p className="font-mono tabular-nums text-muted-foreground">
                    {format(new Date(a.from), "MMM d")}
                  </p>
                  <p className="font-mono tabular-nums text-muted-foreground/70">
                    {format(new Date(a.from), "HH:mm")}
                  </p>
                </div>
                <div className="h-8 w-px bg-border shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {a.syntheticKind || showActivityDetails
                      ? a.name
                      : "Activity"}
                  </p>
                  {(a.syntheticKind || showActivityDetails) && a.location && (
                    <div className="flex items-center gap-1 min-w-0 text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{a.location}</span>
                    </div>
                  )}
                </div>
                {/* Arrival/departure edit */}
                {isEditable(a) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                    onClick={() =>
                      openEdit(a.editParticipationId!, a.dateField!, a.from)
                    }
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
                {/* Activity edit + delete */}
                {!a.syntheticKind && a.activityId && isOwner && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                      onClick={() => setEditingActivityId(a.activityId!)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive/70 hover:text-destructive"
                      onClick={() =>
                        deleteActivity.mutate(
                          { participationId, activityId: a.activityId! },
                          { onSuccess: () => toast.success("Activity deleted") },
                        )
                      }
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {/* Milestone badge for non-editable synthetic items */}
                {a.syntheticKind && !isEditable(a) && (
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[10px] px-1.5 py-0 h-4 font-normal"
                  >
                    milestone
                  </Badge>
                )}
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Edit arrival / departure dialog */}
      <Dialog
        open={editingField !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingField(null);
            setEditingParticipationId(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingField === "from"
                ? "Edit arrival time"
                : "Edit departure time"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              type="datetime-local"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingField(null);
                  setEditingParticipationId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!editValue || updateDates.isPending}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity inline edit dialog */}
      <Dialog
        open={editingActivityId !== null}
        onOpenChange={(open) => !open && setEditingActivityId(null)}
      >
        <DialogContent className="max-w-xl p-0 gap-0 overflow-y-auto max-h-[90vh]">
          <div className="p-4">
            {editingActivityId && (
              <ActivityInlineForm
                participationId={participationId}
                activity={activities?.find((a) => a.id === editingActivityId)}
                allUsers={[]}
                onDone={() => setEditingActivityId(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ParticipationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const session = useSession();
  const { data: participation, isLoading } = useParticipationById(params.id);
  const [activeTab, setActiveTab] = useState("overview");
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [acceptDatesOpen, setAcceptDatesOpen] = useState(false);
  const [acceptFromInput, setAcceptFromInput] = useState("");
  const [acceptToInput, setAcceptToInput] = useState("");
  const [editOwnDatesOpen, setEditOwnDatesOpen] = useState(false);

  // All hooks must be declared before any early returns (rules of hooks)
  const { data: notifications } = useNotifications();
  const acceptInvite = useAcceptInvite();
  const declineInvite = useDeclineInvite();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </main>
    );
  }

  if (!participation) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center py-20">
          <Plane className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-semibold">Participation not found</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/participations">Back to My Plans</Link>
          </Button>
        </div>
      </main>
    );
  }

  const days =
    differenceInCalendarDays(
      new Date(participation.to),
      new Date(participation.from),
    ) + 1;

  const isOwner = session.data?.user?.id === participation.userId;
  const currentUserId = session.data?.user?.id ?? "";
  const members = participation.participants.map((p) => p.user);
  const groupName = participation.group?.name ?? "My Plan";
  const isGroupPublic = participation.group?.isPublic ?? false;
  const isMediaVisible = participation.group?.isMediaPublicVisible ?? true;
  const isActivityVisible =
    participation.group?.isActivityPublicVisible ?? true;
  const isMemberListVisible =
    participation.group?.isMemberListPublicVisible ?? true;
  const isAdmin = session.data?.user?.isAdmin ?? false;

  // Current user's own participation record within this group (may differ from the plan owner's)
  const myParticipationRecord = participation.participants.find(
    (p) => p.userId === currentUserId,
  );

  const handleShare = () => {
    const url = `${window.location.origin}/share/p/${params.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
  };

  // Banner shows only for pending invites (not yet accepted/declined)
  const pendingInviteNotification = notifications?.find(
    (n) =>
      n.type === "INVITED_TO_JOIN" &&
      (n.data as { participationId?: string }).participationId === params.id,
  );
  // Only show the banner if the current user is NOT already a member
  const isMemberOfGroup = participation.participants.some(
    (p) => p.userId === currentUserId,
  );
  const showInviteBanner =
    !!pendingInviteNotification && !isMemberOfGroup && !!currentUserId;

  const handleBannerAccept = (from?: string, to?: string) => {
    acceptInvite.mutate(
      {
        participationId: params.id,
        notificationId: pendingInviteNotification?.id,
        from,
        to,
      },
      {
        onSuccess: () => {
          toast.success("Welcome! You've joined the plan.");
          setAcceptDatesOpen(false);
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })
            ?.response?.data?.message;
          if (msg === "ALREADY_MEMBER") {
            toast.info("You are already a member");
          } else {
            toast.error("Failed to accept invitation");
          }
        },
      },
    );
  };

  const handleBannerDecline = () => {
    declineInvite.mutate(
      {
        participationId: params.id,
        notificationId: pendingInviteNotification?.id,
      },
      {
        onSuccess: () => toast("Invitation declined"),
        onError: () => toast.error("Failed to decline invitation"),
      },
    );
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Invite banner — shown when the current user has a pending invitation */}
      {showInviteBanner && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Mail className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">
                You&apos;ve been invited to join this plan
              </p>
              {(pendingInviteNotification?.data as { userName?: string })
                ?.userName && (
                <p className="text-xs text-muted-foreground">
                  Invited by{" "}
                  <strong>
                    {
                      (pendingInviteNotification?.data as { userName?: string })
                        .userName
                    }
                  </strong>
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="default"
              className="h-7 gap-1.5 text-xs"
              onClick={() => {
                setAcceptFromInput(
                  format(new Date(participation.from), "yyyy-MM-dd'T'HH:mm"),
                );
                setAcceptToInput(
                  format(new Date(participation.to), "yyyy-MM-dd'T'HH:mm"),
                );
                setAcceptDatesOpen(true);
              }}
              disabled={acceptInvite.isPending || declineInvite.isPending}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              onClick={handleBannerDecline}
              disabled={acceptInvite.isPending || declineInvite.isPending}
            >
              <UserX className="h-3.5 w-3.5" />
              Decline
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        {session.data && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{groupName}</h1>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditNameOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={LEAVE_COLOURS[participation.leaveType] ?? ""}
              >
                {participation.leaveType.charAt(0) +
                  participation.leaveType.slice(1).toLowerCase()}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {days} {days === 1 ? "day" : "days"}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-default">
                        {format(new Date(participation.from), "MMM d")} –{" "}
                        {format(new Date(participation.to), "MMM d, yyyy")}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-56 text-center">
                      <p className="font-medium">Group plan dates</p>
                      {isMemberOfGroup && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Your arrival &amp; departure may differ — use the pencil to edit.
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {isMemberOfGroup && myParticipationRecord && (
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditOwnDatesOpen(true)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Edit your arrival &amp; departure
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
            </div>
          </div>
          {isGroupPublic && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-0 sm:gap-1.5"
              onClick={handleShare}
            >
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          )}
        </div>
      </div>

      <EditGroupNameDialog
        participationId={participation.id}
        currentName={groupName}
        open={editNameOpen}
        onOpenChange={setEditNameOpen}
      />

      {/* Accept-with-dates dialog — opens when user clicks Accept on the invite banner */}
      {acceptDatesOpen && (
        <Dialog open={acceptDatesOpen} onOpenChange={setAcceptDatesOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Set your arrival &amp; departure</DialogTitle>
            </DialogHeader>
            {participation.event && (
              <p className="text-sm text-muted-foreground -mt-2">
                Group plan:{" "}
                {format(new Date(participation.event.startAt), "MMM d")} &ndash;{" "}
                {format(new Date(participation.event.endAt), "MMM d, yyyy")}
              </p>
            )}
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Your arrival</label>
                <Input
                  type="datetime-local"
                  value={acceptFromInput}
                  onChange={(e) => setAcceptFromInput(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Your departure</label>
                <Input
                  type="datetime-local"
                  value={acceptToInput}
                  onChange={(e) => setAcceptToInput(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAcceptDatesOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    handleBannerAccept(
                      new Date(acceptFromInput).toISOString(),
                      new Date(acceptToInput).toISOString(),
                    )
                  }
                  disabled={
                    !acceptFromInput ||
                    !acceptToInput ||
                    acceptInvite.isPending
                  }
                >
                  Join
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit own arrival/departure dialog */}
      {editOwnDatesOpen && myParticipationRecord && (
        <EditOwnDatesDialog
          participationId={myParticipationRecord.id}
          defaultFrom={myParticipationRecord.from}
          defaultTo={myParticipationRecord.to}
          open={editOwnDatesOpen}
          onOpenChange={setEditOwnDatesOpen}
        />
      )}

      {/* Event info banner */}
      {participation.event && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {participation.event.image && (
                <div className="relative h-20 w-28 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={participation.event.image}
                    alt={participation.event.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <Link
                  href={`/events?selected=${participation.event.id}`}
                  className="font-semibold hover:underline"
                >
                  {participation.event.title}
                </Link>
                {participation.event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {participation.event.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(
                      new Date(participation.event.startAt),
                      "MMM d",
                    )} –{" "}
                    {format(new Date(participation.event.endAt), "MMM d, yyyy")}
                  </span>
                  {participation.event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {participation.event.location}
                      {participation.event.locationUrl && (
                        <a
                          href={participation.event.locationUrl}
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
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {(isMemberOfGroup || isAdmin || isActivityVisible) && (
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          )}
          {(isMemberOfGroup || isMediaVisible) && (
            <TabsTrigger value="media">Media</TabsTrigger>
          )}
          {isMemberOfGroup && (
            <TabsTrigger value="settings">Settings</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6 min-w-0">
              {(isMemberOfGroup || isMediaVisible) && (
                <PhotoGallery
                  images={participation.group?.images ?? []}
                  participationId={participation.id}
                  onViewAll={() => setActiveTab("media")}
                />
              )}
              <UpcomingActivities
                participationId={participation.id}
                participationFrom={participation.from}
                participationTo={participation.to}
                participantUser={participation.user}
                currentUserId={currentUserId}
                isOwner={isOwner}
                showActivityDetails={
                  isMemberOfGroup || isAdmin || isActivityVisible
                }
                participants={participation.participants}
                event={participation.event}
                onViewAll={() => setActiveTab("timeline")}
              />
            </div>
            <div className="space-y-6">
              <ParticipationCalendar
                from={new Date(participation.from)}
                to={new Date(participation.to)}
                leaveType={participation.leaveType}
              />
              {participation.eventId &&
                participation.participants.length > 0 &&
                (isMemberOfGroup || isAdmin || isMemberListVisible) && (
                  <>
                    <MembersList
                      participants={participation.participants}
                      participationId={participation.id}
                      group={participation.group}
                      currentUserId={currentUserId}
                      isAdmin={isAdmin}
                    />
                    <JoinRequestsPanel participationId={participation.id} />
                  </>
                )}
            </div>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        {(isMemberOfGroup || isAdmin || isActivityVisible) && (
          <TabsContent value="timeline">
            <ActivityTimeline
              participationId={participation.id}
              isOwner={isOwner}
              participationFrom={participation.from}
              participationTo={participation.to}
              participantUser={participation.user}
              currentUserId={currentUserId}
              members={members}
              participants={participation.participants}
              event={participation.event}
            />
          </TabsContent>
        )}

        {/* Media Tab */}
        <TabsContent value="media">
          <MediaGallery
            participationId={participation.id}
            isOwner={isOwner}
            userId={currentUserId}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <ParticipationSettings
            participation={participation}
            isOwner={isOwner}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
