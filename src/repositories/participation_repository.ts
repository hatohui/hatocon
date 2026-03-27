import { db } from "@/config/prisma";
import { ParticipationCreateDTO } from "@/types/participation.d";
import { LeaveType } from "@prisma/client";

const participationRepository = {
  getById: async (id: string) => {
    return db.participation.findUnique({ where: { id } });
  },

  getByIdDetailed: async (id: string) => {
    return db.participation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            image: true,
            startAt: true,
            endAt: true,
            location: true,
            locationUrl: true,
            visibility: true,
          },
        },
        images: { orderBy: { createdAt: "desc" } },
      },
    });
  },

  getParticipantsByEvent: async (eventId: string) => {
    return db.participation.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  getByUserAndEvent: async (userId: string, eventId: string) => {
    return db.participation.findFirst({
      where: { userId, eventId },
    });
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

  getSumByLeaveType: async (
    userId: string,
    leaveType: LeaveType,
    cycleFrom?: Date,
    cycleTo?: Date,
  ) => {
    const participations = await db.participation.findMany({
      where: {
        userId,
        leaveType,
        ...(cycleFrom && cycleTo
          ? { from: { gte: cycleFrom }, to: { lte: cycleTo } }
          : {}),
      },
      select: { from: true, to: true },
    });
    return participations.reduce(
      (sum, p) =>
        sum + (p.to.getTime() - p.from.getTime()) / (1000 * 60 * 60 * 24),
      0,
    );
  },

  create: async (
    userId: string,
    data: ParticipationCreateDTO,
    createdBy?: string,
  ) => {
    return db.participation.create({
      data: {
        userId,
        eventId: data.eventId ?? null,
        from: new Date(data.from),
        to: new Date(data.to),
        leaveType: data.leaveType,
        createdBy: createdBy ?? null,
      },
    });
  },

  // Bulk create for co-travelers
  createMany: async (
    userIds: string[],
    data: Omit<ParticipationCreateDTO, "coTravelerIds">,
    createdBy: string,
  ) => {
    const results = [];
    for (const uid of userIds) {
      const existing = await db.participation.findFirst({
        where: {
          userId: uid,
          from: { lt: new Date(data.to) },
          to: { gt: new Date(data.from) },
        },
      });
      if (!existing) {
        const p = await db.participation.create({
          data: {
            userId: uid,
            eventId: data.eventId ?? null,
            from: new Date(data.from),
            to: new Date(data.to),
            leaveType: data.leaveType,
            createdBy,
          },
        });
        results.push(p);
      }
    }
    return results;
  },

  // Admin: get all participations
  getAllAdmin: async (opts: { userId?: string; eventId?: string } = {}) => {
    return db.participation.findMany({
      where: {
        ...(opts.userId ? { userId: opts.userId } : {}),
        ...(opts.eventId ? { eventId: opts.eventId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
        event: {
          select: { id: true, title: true, startAt: true, endAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  delete: async (id: string) => {
    return db.participation.delete({ where: { id } });
  },

  // ─── Participation Images ──────────────────────────────────────────
  getImages: async (participationId: string) => {
    return db.participationImage.findMany({
      where: { participationId },
      orderBy: { createdAt: "desc" },
    });
  },

  addImage: async (participationId: string, url: string, caption?: string) => {
    return db.participationImage.create({
      data: { participationId, url, caption },
    });
  },

  deleteImage: async (imageId: string) => {
    return db.participationImage.delete({ where: { id: imageId } });
  },

  getImageById: async (imageId: string) => {
    return db.participationImage.findUnique({
      where: { id: imageId },
      include: { participation: { select: { userId: true } } },
    });
  },
};

export default participationRepository;
