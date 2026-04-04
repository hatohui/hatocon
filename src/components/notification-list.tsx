"use client";

import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck, UserCheck, UserX, Eye } from "lucide-react";
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

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-0",
        !notification.isRead && "bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">
        {!notification.isRead && (
          <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm leading-snug">
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
          {!isJoinRequest && !notification.isRead && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={handleClick}
              >
                <Eye className="h-3 w-3" />
                View
              </Button>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default function NotificationList({ onClose }: { onClose: () => void }) {
  const { data: notifications, isLoading } = useNotifications();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const hasUnread = notifications?.some((n) => !n.isRead);

  return (
    <div className="w-80 sm:w-96">
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
