import type { NotificationDTO } from "@/types/notification.d";
import axios from "axios";

type ApiOk<T> = { data: T };

const notificationService = {
  getAll: () => axios.get<ApiOk<NotificationDTO[]>>("/api/notifications"),

  getUnreadCount: () =>
    axios.get<ApiOk<{ count: number }>>("/api/notifications/unread-count"),

  markAsRead: (id: string) => axios.patch(`/api/notifications/${id}/read`),

  markAllAsRead: () => axios.post("/api/notifications/mark-all-read"),
};

export { notificationService };
