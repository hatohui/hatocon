import { notificationService } from "@/services/notification_service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { NotificationDTO } from "@/types/notification.d";

const QUERY_KEY = ["notifications"] as const;

const useNotifications = () => {
  const { status } = useSession();
  return useQuery({
    queryKey: QUERY_KEY,
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationDTO[]>(QUERY_KEY);
      queryClient.setQueryData<NotificationDTO[]>(QUERY_KEY, (old) =>
        old?.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QUERY_KEY, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationDTO[]>(QUERY_KEY);
      queryClient.setQueryData<NotificationDTO[]>(QUERY_KEY, (old) =>
        old?.map((n) => ({ ...n, isRead: true })),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QUERY_KEY, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<NotificationDTO[]>(QUERY_KEY);
      queryClient.setQueryData<NotificationDTO[]>(QUERY_KEY, (old) =>
        old?.filter((n) => n.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(QUERY_KEY, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
};

export {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
};
