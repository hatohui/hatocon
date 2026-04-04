import { notificationService } from "@/services/notification_service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const useNotifications = () => {
  const { status } = useSession();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.getAll().then((r) => r.data.data),
    enabled: status === "authenticated",
  });
};

const useUnreadNotificationCount = () => {
  const { status } = useSession();
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () =>
      notificationService.getUnreadCount().then((r) => r.data.data.count),
    refetchInterval: 30000,
    enabled: status === "authenticated",
  });
};

const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
};
