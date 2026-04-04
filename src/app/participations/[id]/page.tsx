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
import { useActivities } from "@/hooks/activities/useActivities";
import { useUpdateGroupSettings } from "@/hooks/participations/useParticipationGroup";
import { cn } from "@/lib/utils";
import ActivityTimeline from "@/components/pages/participation/activity-timeline";
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
                <Camera className="h-4 w-4 mr-1.5" />
                Upload First Photo
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
              Open Gallery
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
            <label className="cursor-pointer">
              <Camera className="h-4 w-4 mr-1.5" />
              Upload
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
  /** "__arriving" | "__departing" | "__event_start" | "__event_end" | falsy */
  syntheticKind: string | false;
};

function UpcomingActivities({
  participationId,
  participationFrom,
  participationTo,
  participantUser,
  currentUserId,
  isOwner,
  event,
  onViewAll,
}: {
  participationId: string;
  participationFrom: Date | string;
  participationTo: Date | string;
  participantUser?: { id: string; name: string };
  currentUserId?: string;
  isOwner: boolean;
  event?: {
    title: string;
    startAt: Date | string;
    endAt: Date | string;
    location: string | null;
  } | null;
  onViewAll: () => void;
}) {
  const { data: activities, isLoading } = useActivities(participationId);
  const updateDates = useUpdateParticipationDates();
  // which date field is being edited: "from" (arrival) | "to" (departure) | null
  const [editingField, setEditingField] = useState<"from" | "to" | null>(null);
  const [editValue, setEditValue] = useState("");
  const now = new Date();

  const isOwnParticipation =
    !participantUser || participantUser.id === currentUserId;
  const arrivalName = isOwnParticipation
    ? "You arrive"
    : `${participantUser!.name} arrives`;
  const departureName = isOwnParticipation
    ? "You depart"
    : `${participantUser!.name} departs`;

  const openEdit = (field: "from" | "to") => {
    const current = field === "from" ? participationFrom : participationTo;
    setEditValue(format(new Date(current), "yyyy-MM-dd'T'HH:mm"));
    setEditingField(field);
  };

  const handleSave = () => {
    if (!editingField || !editValue) return;
    const newDate = new Date(editValue).toISOString();
    updateDates.mutate(
      {
        id: participationId,
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
        },
        onError: () => toast.error("Failed to update"),
      },
    );
  };

  const syntheticEntries: UpcomingEntry[] = [
    {
      id: "__arriving",
      name: arrivalName,
      from: participationFrom,
      syntheticKind: "__arriving",
    },
    {
      id: "__departing",
      name: departureName,
      from: participationTo,
      syntheticKind: "__departing",
    },
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
  }));

  const upcoming = [...syntheticEntries, ...activityEntries]
    .filter((a) => isAfter(new Date(a.from), now))
    .sort((a, b) => new Date(a.from).getTime() - new Date(b.from).getTime())
    .slice(0, 5);

  const isEditable = (kind: string | false) =>
    isOwner && (kind === "__arriving" || kind === "__departing");

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
                  <p className="font-medium truncate">{a.name}</p>
                  {a.location && (
                    <p className="text-muted-foreground truncate flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      {a.location}
                    </p>
                  )}
                </div>
                {a.syntheticKind && !isEditable(a.syntheticKind) && (
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[10px] px-1.5 py-0 h-4 font-normal"
                  >
                    milestone
                  </Badge>
                )}
                {isEditable(a.syntheticKind) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                    onClick={() =>
                      openEdit(a.syntheticKind === "__arriving" ? "from" : "to")
                    }
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Edit arrival / departure dialog */}
      <Dialog
        open={editingField !== null}
        onOpenChange={(open) => !open && setEditingField(null)}
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
                onClick={() => setEditingField(null)}
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

  const handleBannerAccept = () => {
    acceptInvite.mutate(
      {
        participationId: params.id,
        notificationId: pendingInviteNotification?.id,
      },
      {
        onSuccess: () => {
          toast.success("Welcome! You've joined the plan.");
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
              onClick={handleBannerAccept}
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
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

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
              <span className="text-sm text-muted-foreground">
                {format(new Date(participation.from), "MMM d")} –{" "}
                {format(new Date(participation.to), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          {isGroupPublic && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={handleShare}
            >
              <Link2 className="h-4 w-4" />
              Share
            </Button>
          )}
        </div>
      </div>

      {isOwner && (
        <EditGroupNameDialog
          participationId={participation.id}
          currentName={groupName}
          open={editNameOpen}
          onOpenChange={setEditNameOpen}
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
            <div className="md:col-span-2 space-y-6">
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
