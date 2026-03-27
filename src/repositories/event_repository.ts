import { db } from "@/config/prisma";
import { EventCreateDTO } from "@/types/event.d";

const eventRepository = {
  getById: async (id: string) => {
    return db.event.findUnique({
      where: { id },
      include: {
        createdByUser: { select: { id: true, name: true, image: true } },
        invitees: { select: { userId: true } },
      },
    });
  },

  getInRange: async (from: Date, to: Date, userId?: string) => {
    return db.event.findMany({
      where: {
        isApproved: true,
        isDeleted: false,
        startAt: { lte: to },
        endAt: { gte: from },
        OR: [
          { visibility: "PUBLIC" },
          ...(userId
            ? [{ createdBy: userId }, { invitees: { some: { userId } } }]
            : []),
        ],
      },
      orderBy: { startAt: "asc" },
    });
  },

  getAllFiltered: async (opts: {
    q?: string;
    from?: Date;
    to?: Date;
    userId?: string;
    limit?: number;
  }) => {
    return db.event.findMany({
      where: {
        isApproved: true,
        isDeleted: false,
        ...(opts.q ? { title: { contains: opts.q, mode: "insensitive" } } : {}),
        ...(opts.from ? { endAt: { gte: opts.from } } : {}),
        ...(opts.to ? { startAt: { lte: opts.to } } : {}),
        OR: [
          { visibility: "PUBLIC" },
          ...(opts.userId
            ? [
                { createdBy: opts.userId },
                { invitees: { some: { userId: opts.userId } } },
              ]
            : []),
        ],
      },
      orderBy: { startAt: "asc" },
      take: opts.limit ?? 100,
      include: {
        createdByUser: { select: { id: true, name: true, image: true } },
      },
    });
  },

  getUpcoming: async (limit = 10, userId?: string) => {
    return db.event.findMany({
      where: {
        isApproved: true,
        isDeleted: false,
        startAt: { gt: new Date() },
        OR: [
          { visibility: "PUBLIC" },
          ...(userId
            ? [{ createdBy: userId }, { invitees: { some: { userId } } }]
            : []),
        ],
      },
      orderBy: { startAt: "asc" },
      take: limit,
      include: {
        createdByUser: { select: { id: true, name: true, image: true } },
      },
    });
  },

  create: async (
    createdBy: string,
    data: EventCreateDTO,
    isApproved = false,
  ) => {
    const { inviteeIds, ...eventData } = data;
    // Private events are auto-approved (no public review needed)
    const approved = isApproved || data.visibility === "PRIVATE";
    return db.event.create({
      data: {
        ...eventData,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        createdBy,
        isApproved: approved,
        ...(inviteeIds && inviteeIds.length > 0
          ? {
              invitees: {
                createMany: {
                  data: inviteeIds.map((userId) => ({ userId })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      },
    });
  },

  // Admin: get all events (including unapproved, excluding hard-deleted)
  getAllAdmin: async (opts: { q?: string; approved?: boolean } = {}) => {
    return db.event.findMany({
      where: {
        isDeleted: false,
        ...(opts.approved !== undefined ? { isApproved: opts.approved } : {}),
        ...(opts.q ? { title: { contains: opts.q, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdByUser: { select: { id: true, name: true, image: true } },
      },
    });
  },

  approve: async (id: string) => {
    return db.event.update({
      where: { id },
      data: { isApproved: true },
    });
  },

  update: async (id: string, data: Partial<EventCreateDTO>) => {
    const { inviteeIds, ...eventData } = data;
    const updateData: Record<string, unknown> = {
      ...eventData,
      ...(eventData.startAt ? { startAt: new Date(eventData.startAt) } : {}),
      ...(eventData.endAt ? { endAt: new Date(eventData.endAt) } : {}),
    };

    if (inviteeIds !== undefined) {
      // Replace all invitees
      await db.eventInvitee.deleteMany({ where: { eventId: id } });
      if (inviteeIds.length > 0) {
        await db.eventInvitee.createMany({
          data: inviteeIds.map((userId) => ({ eventId: id, userId })),
          skipDuplicates: true,
        });
      }
    }

    return db.event.update({
      where: { id },
      data: updateData,
    });
  },

  softDelete: async (id: string) => {
    return db.event.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },

  getInvitees: async (eventId: string) => {
    return db.eventInvitee.findMany({
      where: { eventId },
      select: { userId: true },
    });
  },
};

export default eventRepository;
