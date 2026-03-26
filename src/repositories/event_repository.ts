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

  create: async (createdBy: string, data: EventCreateDTO) => {
    return db.event.create({
      data: {
        ...data,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        createdBy,
        isApproved: false,
      },
    });
  },
};

export default eventRepository;
