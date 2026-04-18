"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useSession } from "next-auth/react";
import { differenceInCalendarDays, format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Link2,
  Lock,
  LogIn,
  Mail,
  Pencil,
  Plane,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
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
  useUpdateParticipationDates,
  useAcceptInvite,
  useDeclineInvite,
} from "@/hooks/participations/useParticipations";
import {
  useNotifications,
  useDeleteNotification,
} from "@/hooks/notifications/useNotifications";
import { useUpdateGroupSettings } from "@/hooks/participations/useParticipationGroup";
import { cn } from "@/lib/utils";
import ActivityTimeline from "@/components/pages/participation/activity-timeline";
import MediaGallery from "@/components/pages/participation/media-gallery";
import ParticipationSettings from "@/components/pages/participation/participation-settings";
import MembersList from "@/components/pages/participation/members-list";
import JoinRequestsPanel from "@/components/pages/participation/join-requests-panel";
import AcceptDatesDialog from "@/components/pages/participation/accept-dates-dialog";
import EditGroupNameDialog from "@/components/pages/participation/edit-group-name-dialog";
import EditOwnDatesDialog from "@/components/pages/participation/edit-own-dates-dialog";
import EventInfoCard from "@/components/pages/participation/event-info-card";
import PhotoGallery from "@/components/pages/participation/photo-gallery-preview";
import ParticipationCalendar from "@/components/pages/participation/participation-calendar";
import UpcomingActivities from "@/components/pages/participation/upcoming-activities";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ParticipationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const session = useSession();
  const { data: participation, isLoading } = useParticipationById(params.id);
  const [loginPromptDismissed, setLoginPromptDismissed] = useState(false);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") ?? "overview",
  );
  const [highlightedActivityId, setHighlightedActivityId] = useState<
    string | null
  >(null);
  const [showEventBoundaries, setShowEventBoundaries] = useState(
    searchParams.get("markers") !== "0",
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("tab", tab);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  const handleToggleEventBoundaries = () => {
    const next = !showEventBoundaries;
    setShowEventBoundaries(next);
    const sp = new URLSearchParams(searchParams.toString());
    if (next) {
      sp.delete("markers");
    } else {
      sp.set("markers", "0");
    }
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [acceptDatesOpen, setAcceptDatesOpen] = useState(false);
  const [acceptFromInput, setAcceptFromInput] = useState("");
  const [acceptToInput, setAcceptToInput] = useState("");
  const [acceptEntryFlight, setAcceptEntryFlight] = useState("");
  const [acceptExitFlight, setAcceptExitFlight] = useState("");
  const [editOwnDatesOpen, setEditOwnDatesOpen] = useState(false);
  const [adminDatesPromptDismissed, setAdminDatesPromptDismissed] =
    useState(false);

  // All hooks must be declared before any early returns (rules of hooks)
  const { data: notifications } = useNotifications();
  const deleteNotification = useDeleteNotification();
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

  // User was added directly by an admin (not via invite flow) — prompt them to set their own dates
  const wasAddedByAdmin =
    isMemberOfGroup &&
    !!myParticipationRecord &&
    !!myParticipationRecord.createdBy &&
    myParticipationRecord.createdBy !== currentUserId;

  const handleBannerAccept = () => {
    acceptInvite.mutate(
      {
        participationId: params.id,
        notificationId: pendingInviteNotification?.id,
        from: acceptFromInput
          ? new Date(acceptFromInput).toISOString()
          : undefined,
        to: acceptToInput ? new Date(acceptToInput).toISOString() : undefined,
        entryFlight: acceptEntryFlight.trim() || undefined,
        exitFlight: acceptExitFlight.trim() || undefined,
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
      {/* Login prompt for unauthenticated visitors (e.g. from shared link) */}
      <Dialog
        open={session.status === "unauthenticated" && !loginPromptDismissed}
        onOpenChange={(open) => {
          if (!open) setLoginPromptDismissed(true);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign in to view this plan
            </DialogTitle>
            <DialogDescription>
              You&apos;re viewing this plan via a shared link. Sign in to join,
              interact with activities, and get the full experience.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setLoginPromptDismissed(true)}
              className="flex-1"
            >
              Continue as guest
            </Button>
            <Button asChild className="flex-1">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/participations/${params.id}`)}`}
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                Sign in
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guest banner — shown to unauthenticated visitors */}
      {session.status === "unauthenticated" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <LogIn className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              You&apos;re viewing as a guest. Sign in to join, upload photos,
              and interact.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/participations/${params.id}`)}`}
            >
              <LogIn className="h-3.5 w-3.5 mr-1.5" />
              Sign in
            </Link>
          </Button>
        </div>
      )}

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
                setAcceptEntryFlight("");
                setAcceptExitFlight("");
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

      {/* Admin-added banner — shown when the user was added directly by an admin */}
      {wasAddedByAdmin && !adminDatesPromptDismissed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/50 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">
                You&apos;ve been added to this plan
              </p>
              <p className="text-xs text-muted-foreground">
                Confirm or update your personal arrival &amp; departure times.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="default"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setEditOwnDatesOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Set my times
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => setAdminDatesPromptDismissed(true)}
            >
              Dismiss
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
                    <TooltipContent
                      side="bottom"
                      className="max-w-56 text-center"
                    >
                      <p className="font-medium">Group plan dates</p>
                      {isMemberOfGroup && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Your arrival &amp; departure may differ — use the
                          pencil to edit.
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

      <AcceptDatesDialog
        open={acceptDatesOpen}
        onOpenChange={setAcceptDatesOpen}
        fromInput={acceptFromInput}
        toInput={acceptToInput}
        entryFlight={acceptEntryFlight}
        exitFlight={acceptExitFlight}
        onFromChange={setAcceptFromInput}
        onToChange={setAcceptToInput}
        onEntryFlightChange={setAcceptEntryFlight}
        onExitFlightChange={setAcceptExitFlight}
        onAccept={handleBannerAccept}
        isPending={acceptInvite.isPending}
        eventDateRange={
          participation.event
            ? {
                from: participation.event.startAt,
                to: participation.event.endAt,
              }
            : null
        }
      />

      {/* Edit own arrival/departure dialog */}
      {editOwnDatesOpen && myParticipationRecord && (
        <EditOwnDatesDialog
          participationId={myParticipationRecord.id}
          defaultFrom={myParticipationRecord.from}
          defaultTo={myParticipationRecord.to}
          defaultEntryFlight={myParticipationRecord.entryFlight}
          defaultExitFlight={myParticipationRecord.exitFlight}
          open={editOwnDatesOpen}
          onOpenChange={setEditOwnDatesOpen}
          onSuccess={
            wasAddedByAdmin && !adminDatesPromptDismissed
              ? () => {
                  setAdminDatesPromptDismissed(true);
                  if (pendingInviteNotification) {
                    deleteNotification.mutate(pendingInviteNotification.id);
                  }
                }
              : undefined
          }
        />
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
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
          {participation.event && <EventInfoCard event={participation.event} />}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6 min-w-0">
              {(isMemberOfGroup || isMediaVisible) && (
                <PhotoGallery
                  images={participation.group?.images ?? []}
                  participationId={participation.id}
                  onViewAll={() => handleTabChange("media")}
                  isOwner={isOwner}
                  isAdmin={isAdmin}
                  userId={currentUserId}
                />
              )}
              <UpcomingActivities
                participationId={participation.id}
                participationFrom={participation.from}
                participationTo={participation.to}
                participationEntryFlight={
                  myParticipationRecord?.entryFlight ?? null
                }
                participationExitFlight={
                  myParticipationRecord?.exitFlight ?? null
                }
                participantUser={participation.user}
                currentUserId={currentUserId}
                isOwner={isOwner}
                showActivityDetails={
                  isMemberOfGroup || isAdmin || isActivityVisible
                }
                members={members}
                participants={participation.participants}
                event={participation.event}
                onViewAll={() => handleTabChange("timeline")}
                onNavigateToActivity={(id) => {
                  setHighlightedActivityId(id);
                  handleTabChange("timeline");
                }}
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
              showEventBoundaries={showEventBoundaries}
              onToggleEventBoundaries={handleToggleEventBoundaries}
              highlightedActivityId={highlightedActivityId}
              onClearHighlight={() => setHighlightedActivityId(null)}
            />
          </TabsContent>
        )}

        {/* Media Tab */}
        <TabsContent value="media">
          <MediaGallery
            participationId={participation.id}
            isOwner={isOwner}
            isMember={isMemberOfGroup}
            isAdmin={isAdmin}
            userId={currentUserId}
            members={members}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <ParticipationSettings
            participation={participation}
            isOwner={isOwner}
            myParticipationId={isOwner ? undefined : myParticipationRecord?.id}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
