import { db } from "@/config/prisma";
import { EventCreateDTO } from "@/types/event.d";

const eventRepository = {
  getById: async (id: string) => {
    return db.event.findUnique({ where: { id } });
  },

  getInRange: async (from: Date, to: Date, createdBy?: string) => {
    return db.event.findMany({
      where: {
        isApproved: true,
        isDeleted: false,
        startAt: { lte: to },
        endAt: { gte: from },
        ...(createdBy ? { createdBy } : {}),
      },
      orderBy: { startAt: "asc" },
    });
  },

  getAllFiltered: async (opts: {
    q?: string;
    from?: Date;
    to?: Date;
    createdBy?: string;
    limit?: number;
  }) => {
    return db.event.findMany({
      where: {
        isApproved: true,
        isDeleted: false,
        ...(opts.q ? { title: { contains: opts.q, mode: "insensitive" } } : {}),
        ...(opts.from ? { endAt: { gte: opts.from } } : {}),
        ...(opts.to ? { startAt: { lte: opts.to } } : {}),
        ...(opts.createdBy ? { createdBy: opts.createdBy } : {}),
      },
      orderBy: { startAt: "asc" },
      take: opts.limit ?? 100,
      include: {
        createdByUser: { select: { id: true, name: true, image: true } },
      },
    });
  },

  getUpcoming: async (limit = 10) => {
    return db.event.findMany({
      where: {
        isApproved: true,
        isDeleted: false,
        startAt: { gt: new Date() },
      },
      orderBy: { startAt: "asc" },
      take: limit,
    });
  },

  create: async (
    createdBy: string,
    data: EventCreateDTO,
    isApproved = false,
  ) => {
    return db.event.create({
      data: {
        ...data,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        createdBy,
        isApproved,
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
    return db.event.update({
      where: { id },
      data: {
        ...data,
        ...(data.startAt ? { startAt: new Date(data.startAt) } : {}),
        ...(data.endAt ? { endAt: new Date(data.endAt) } : {}),
      },
    });
  },

  softDelete: async (id: string) => {
    return db.event.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  },
};

export default eventRepository;
