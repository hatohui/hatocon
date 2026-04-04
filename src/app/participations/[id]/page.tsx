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
  startOfMonth,
  endOfMonth,
  addMonths,
} from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Camera,
  Clock,
  ExternalLink,
  ImageIcon,
  MapPin,
  Plane,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  useParticipationById,
  useDeleteParticipation,
  useUploadParticipationImage,
  useDeleteParticipationImage,
} from "@/hooks/participations/useParticipations";
import { useActivities } from "@/hooks/activities/useActivities";
import { cn } from "@/lib/utils";
import ActivityTimeline, {
  ActivityOverviewSection,
} from "@/components/pages/participation/activity-timeline";
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

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ─── Photo Gallery ───────────────────────────────────────────────────────────

function PhotoGallery({
  images,
  participationId,
}: {
  images: { id: string; url: string; caption?: string | null }[];
  participationId: string;
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
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/participations/${participationId}/gallery`}>
                Open Gallery
              </Link>
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
            <Link
              href={`/participations/${participationId}/gallery`}
              className="text-xs text-primary hover:underline"
            >
              View all →
            </Link>
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
                        isLeave && LEAVE_DOT_COLOURS[leaveType]
                          ? `${LEAVE_DOT_COLOURS[leaveType].replace("bg-", "bg-")}/15`
                          : "",
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

// ─── Schedule Timeline View ──────────────────────────────────────────────────

function ScheduleTimeline({
  participationId,
  from,
  to,
  leaveType,
  event,
}: {
  participationId: string;
  from: Date;
  to: Date;
  leaveType: string;
  event: {
    title: string;
    startAt: Date | string;
    endAt: Date | string;
    location?: string | null;
  } | null;
}) {
  const start = new Date(from);
  const end = new Date(to);
  const totalDays = differenceInCalendarDays(end, start) + 1;
  const { data: activities } = useActivities(participationId);

  type LogItem = {
    id: string;
    from: Date;
    name: string;
    isSynthetic?: boolean;
  };

  const items: LogItem[] = [
    ...(event
      ? [
          {
            id: "event-start",
            from: new Date(event.startAt),
            name: `${event.title} – Starts`,
            isSynthetic: true,
          },
          {
            id: "event-end",
            from: new Date(event.endAt),
            name: `${event.title} – Ends`,
            isSynthetic: true,
          },
        ]
      : []),
    ...(activities ?? []).map((a) => ({
      id: a.id,
      from: new Date(a.from),
      name: a.name,
    })),
  ].sort((a, b) => a.from.getTime() - b.from.getTime());

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{format(start, "MMM d, yyyy")}</span>
            <span>
              {totalDays} {totalDays === 1 ? "day" : "days"}
            </span>
            <span>{format(end, "MMM d, yyyy")}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            {(() => {
              const now = new Date();
              if (now < start) return <div className="h-full w-0" />;
              if (now > end)
                return (
                  <div className="h-full w-full rounded-full bg-primary" />
                );
              const elapsed = differenceInCalendarDays(now, start) + 1;
              const pct = Math.min(100, (elapsed / totalDays) * 100);
              return (
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              );
            })()}
          </div>
        </div>

        <Separator />

        {/* Activity log */}
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            No activities yet
          </p>
        ) : (
          <div className="space-y-0 max-h-64 overflow-y-auto">
            {items.map((item) => {
              const isPast = item.from < new Date();
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 px-2 py-1.5 rounded-md text-xs",
                    isPast && !item.isSynthetic && "text-muted-foreground",
                    item.isSynthetic && "text-muted-foreground",
                  )}
                >
                  <span className="shrink-0 w-18 tabular-nums font-mono">
                    {format(item.from, "MMM d")}
                  </span>
                  <span className="shrink-0 w-10 tabular-nums text-muted-foreground">
                    {format(item.from, "HH:mm")}
                  </span>
                  {item.isSynthetic ? (
                    <Plane className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <div
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        LEAVE_DOT_COLOURS[leaveType] ?? "bg-gray-400",
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "flex-1 truncate",
                      !item.isSynthetic && "font-medium",
                    )}
                  >
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ParticipationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const session = useSession();
  const { data: participation, isLoading } = useParticipationById(params.id);

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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
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
            <h1 className="text-2xl font-bold tracking-tight">
              {participation.event?.title ?? "Stand-alone Leave"}
            </h1>
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
        </div>
      </div>

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
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <PhotoGallery
                images={participation.group?.images ?? []}
                participationId={participation.id}
              />
              <ScheduleTimeline
                participationId={participation.id}
                from={new Date(participation.from)}
                to={new Date(participation.to)}
                leaveType={participation.leaveType}
                event={participation.event}
              />
            </div>
            <div className="space-y-6">
              <ParticipationCalendar
                from={new Date(participation.from)}
                to={new Date(participation.to)}
                leaveType={participation.leaveType}
              />
              {participation.eventId &&
                participation.participants.length > 0 && (
                  <>
                    <MembersList
                      participants={participation.participants}
                      participationId={participation.id}
                      group={participation.group}
                      currentUserId={currentUserId}
                      isAdmin={session.data?.user?.isAdmin ?? false}
                    />
                    <JoinRequestsPanel participationId={participation.id} />
                  </>
                )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="timeline">
          <ActivityTimeline
            participationId={participation.id}
            isOwner={isOwner}
            members={members}
            event={participation.event}
          />
        </TabsContent>

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
