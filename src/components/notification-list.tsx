"use client";

import { formatDistanceToNow } from "date-fns";
import {
  CheckCheck,
  CheckCircle2,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";

import {
  useDeclineInvite,
} from "@/hooks/participations/useParticipations";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from "@/hooks/notifications/useNotifications";
import {
  useApproveJoinRequest,
  useRejectJoinRequest,
} from "@/hooks/participations/useParticipationGroup";
import type { NotificationDTO, NotificationData } from "@/types/notification.d";

const NOTIFICATION_LABELS: Record<string, string> = {
  JOIN_REQUEST: "wants to join",
  JOIN_REQUEST_APPROVED: "Your join request was approved for",
  JOIN_REQUEST_REJECTED: "Your join request was rejected for",
  OWNERSHIP_TRANSFERRED: "You are now the owner of",
  USER_KICKED: "You were removed from",
  INVITED_TO_JOIN: "invited you to join",
  INVITE_ACCEPTED: "You accepted the invitation to",
  INVITE_DECLINED: "You declined the invitation to",
};

function NotificationMessage({
  notification,
}: {
  notification: NotificationDTO;
}) {
  const data = notification.data as NotificationData;
  const type = notification.type;

  if (type === "JOIN_REQUEST") {
    return (
      <span>
        <strong>{data.userName}</strong> {NOTIFICATION_LABELS[type]}{" "}
        <strong>{data.eventTitle}</strong>
      </span>
    );
  }
  if (type === "INVITED_TO_JOIN") {
    return (
      <span>
        <strong>{data.userName}</strong> {NOTIFICATION_LABELS[type]}{" "}
        <strong>{data.eventTitle}</strong>
      </span>
    );
  }
  if (type === "INVITE_ACCEPTED" || type === "INVITE_DECLINED") {
    return (
      <span>
        {NOTIFICATION_LABELS[type]} <strong>{data.eventTitle}</strong>
      </span>
    );
  }
  return (
    <span>
      {NOTIFICATION_LABELS[type]} <strong>{data.eventTitle}</strong>
    </span>
  );
}

function NotificationItem({
  notification,
  onClose,
}: {
  notification: NotificationDTO;
  onClose: () => void;
}) {
  const router = useRouter();
  const markAsRead = useMarkNotificationAsRead();
  const approveJoin = useApproveJoinRequest();
  const rejectJoin = useRejectJoinRequest();
  const data = notification.data as NotificationData;
  const isJoinRequest = notification.type === "JOIN_REQUEST";
  const isInvite = notification.type === "INVITED_TO_JOIN";
  const isAccepted = notification.type === "INVITE_ACCEPTED";
  const isDeclined = notification.type === "INVITE_DECLINED";
  const declineInvite = useDeclineInvite();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    if (data.participationId) {
      router.push(`/participations/${data.participationId}`);
      onClose();
    }
  };

  const handleApprove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.participationId || !data.joinRequestId) return;
    approveJoin.mutate(
      { participationId: data.participationId, requestId: data.joinRequestId },
      {
        onSuccess: () => {
          toast.success("Request approved");
          markAsRead.mutate(notification.id);
        },
        onError: () => toast.error("Failed to approve"),
      },
    );
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.participationId || !data.joinRequestId) return;
    rejectJoin.mutate(
      { participationId: data.participationId, requestId: data.joinRequestId },
      {
        onSuccess: () => {
          toast.success("Request rejected");
          markAsRead.mutate(notification.id);
        },
        onError: () => toast.error("Failed to reject"),
      },
    );
  };

  const handleAcceptInvite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.participationId) return;
    // Navigate to the participation page — the invite banner there handles date-setting
    router.push(`/participations/${data.participationId}`);
    onClose();
  };

  const handleDeclineInvite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data.participationId) return;
    declineInvite.mutate(
      {
        participationId: data.participationId,
        notificationId: notification.id,
      },
      {
        onSuccess: () => toast.success("Invitation declined"),
        onError: () => toast.error("Failed to decline invitation"),
      },
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className={cn(
        "w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-0 cursor-pointer",
        !notification.isRead && "bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Always reserve dot space to avoid layout shift */}
        <div className="mt-1.5 h-2 w-2 shrink-0">
          {!notification.isRead && (
            <span className="block h-2 w-2 rounded-full bg-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm leading-snug wrap-break-word">
            <NotificationMessage notification={notification} />
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
          {isJoinRequest && !notification.isRead && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs gap-1"
                onClick={handleApprove}
                disabled={approveJoin.isPending}
              >
                <UserCheck className="h-3 w-3" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={handleReject}
                disabled={rejectJoin.isPending}
              >
                <UserX className="h-3 w-3" />
                Reject
              </Button>
            </div>
          )}
          {isInvite && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs gap-1"
                onClick={handleAcceptInvite}
              >
                <UserCheck className="h-3 w-3" />
                View & Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={handleDeclineInvite}
                disabled={declineInvite.isPending}
              >
                <UserX className="h-3 w-3" />
                Decline
              </Button>
            </div>
          )}
          {isAccepted && (
            <div className="flex items-center gap-1 pt-1 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Accepted
            </div>
          )}
          {isDeclined && (
            <div className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
              <XCircle className="h-3.5 w-3.5" />
              Declined
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationList({ onClose }: { onClose: () => void }) {
  const { data: notifications, isLoading } = useNotifications();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const hasUnread = notifications?.some((n) => !n.isRead);

  return (
    <div className="w-[min(20rem,calc(100vw-2rem))]">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-3 w-3" />
            Mark all read
          </Button>
        )}
      </div>
      <ScrollArea className="max-h-96">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : !notifications?.length ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClose={onClose} />
          ))
        )}
      </ScrollArea>
    </div>
  );
}
