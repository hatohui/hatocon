import { db } from "@/config/prisma";
import { ParticipationCreateDTO } from "@/types/participation.d";
import { LeaveType } from "@prisma/client";

const participationRepository = {
  getById: async (id: string) => {
    return db.participation.findUnique({ where: { id } });
  },

  getByUserId: async (userId: string, from: Date, to: Date) => {
    return db.participation.findMany({
      where: {
        userId,
        from: { lte: to },
        to: { gte: from },
      },
      include: {
        event: {
          select: { id: true, title: true, startAt: true, endAt: true },
        },
      },
      orderBy: { from: "asc" },
    });
  },

  getOverlapping: async (
    userId: string,
    from: Date,
    to: Date,
    excludeId?: string,
  ) => {
    return db.participation.findFirst({
      where: {
        userId,
        id: excludeId ? { not: excludeId } : undefined,
        from: { lt: to },
        to: { gt: from },
      },
    });
  },

  getSumByLeaveType: async (userId: string, leaveType: LeaveType) => {
    const participations = await db.participation.findMany({
      where: { userId, leaveType },
      select: { from: true, to: true },
    });
    return participations.reduce(
      (sum, p) =>
        sum + (p.to.getTime() - p.from.getTime()) / (1000 * 60 * 60 * 24),
      0,
    );
  },

  create: async (userId: string, data: ParticipationCreateDTO) => {
    return db.participation.create({
      data: {
        userId,
        eventId: data.eventId ?? null,
        from: new Date(data.from),
        to: new Date(data.to),
        leaveType: data.leaveType,
      },
    });
  },
};

export default participationRepository;
