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
        isDeleted: false,
        ...(opts.q ? { title: { contains: opts.q, mode: "insensitive" } } : {}),
        ...(opts.from ? { endAt: { gte: opts.from } } : {}),
        ...(opts.to ? { startAt: { lte: opts.to } } : {}),
        OR: [
          // 1. All approved public events
          { isApproved: true, visibility: "PUBLIC" },
          // 2. Private events the user has a participation in
          ...(opts.userId
            ? [
                {
                  visibility: "PRIVATE" as const,
                  participations: { some: { userId: opts.userId } },
                },
                // 3. Pending (unapproved) events created by the user
                { isApproved: false, createdBy: opts.userId },
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

  /** Collect all R2 image URLs associated with an event (for pre-deletion cleanup). */
  getImageUrls: async (id: string): Promise<string[]> => {
    const event = await db.event.findUnique({
      where: { id },
      select: {
        image: true,
        participationGroups: {
          select: {
            images: { select: { url: true } },
            activities: {
              select: {
                imageUrl: true,
                media: { select: { url: true } },
              },
            },
          },
        },
      },
    });
    if (!event) return [];

    const urls: string[] = [];
    if (event.image) urls.push(event.image);
    for (const group of event.participationGroups) {
      for (const img of group.images) urls.push(img.url);
      for (const act of group.activities) {
        if (act.imageUrl) urls.push(act.imageUrl);
        for (const m of act.media) urls.push(m.url);
      }
    }
    return urls;
  },

  /** Hard-delete an event and all child records (participations, groups, activities, media). */
  hardDelete: async (id: string) => {
    // Participations have no DB cascade from Event, delete them first.
    await db.participation.deleteMany({ where: { eventId: id } });
    // Event hard-delete; DB cascades remove groups → activities → media, images, join requests, invitees.
    return db.event.delete({ where: { id } });
  },

  getInvitees: async (eventId: string) => {
    return db.eventInvitee.findMany({
      where: { eventId },
      select: { userId: true },
    });
  },
};

export default eventRepository;
