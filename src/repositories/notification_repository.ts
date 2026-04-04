import { db } from "@/config/prisma";
import type { NotificationType, Prisma } from "@prisma/client";

const notificationRepository = {
  getByUserId: async (userId: string, limit = 50) => {
    return db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },

  getUnreadCount: async (userId: string) => {
    return db.notification.count({
      where: { userId, isRead: false },
    });
  },

  create: async (
    userId: string,
    type: NotificationType,
    data: Record<string, unknown>,
  ) => {
    return db.notification.create({
      data: { userId, type, data: data as Prisma.InputJsonValue },
    });
  },

  createMany: async (
    userIds: string[],
    type: NotificationType,
    data: Record<string, unknown>,
  ) => {
    if (userIds.length === 0) return;
    return db.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        data: data as Prisma.InputJsonValue,
      })),
    });
  },

  markAsRead: async (id: string, userId: string) => {
    return db.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  },

  markAllAsRead: async (userId: string) => {
    return db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  getById: async (id: string) => {
    return db.notification.findUnique({ where: { id } });
  },
};

export default notificationRepository;
