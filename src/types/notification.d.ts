import type { NotificationType } from "@prisma/client";

export type NotificationData = {
  eventId?: string;
  eventTitle?: string;
  participationId?: string;
  userId?: string;
  userName?: string;
  joinRequestId?: string;
};

export type NotificationDTO = {
  id: string;
  userId: string;
  type: NotificationType;
  data: NotificationData;
  isRead: boolean;
  createdAt: Date;
};

export type JoinRequestDTO = {
  id: string;
  groupId: string;
  userId: string;
  status: string;
  createdAt: Date;
  user: { id: string; name: string; image: string | null; email: string };
};

export type ParticipationGroupDTO = {
  id: string;
  eventId: string | null;
  ownerId: string;
  name: string;
  isMemberInviteAllowed: boolean;
  isPublic: boolean;
  isActivityPublicVisible: boolean;
  isMemberListPublicVisible: boolean;
};

export type ParticipationGroupSettingsUpdate = {
  isMemberInviteAllowed?: boolean;
  isPublic?: boolean;
  isActivityPublicVisible?: boolean;
  isMemberListPublicVisible?: boolean;
};
