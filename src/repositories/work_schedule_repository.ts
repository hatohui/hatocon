import { db } from "@/config/prisma";

const workScheduleRepository = {
  getByUserId: async (userId: string) => {
    return db.workSchedule.findUnique({ where: { userId } });
  },

  upsert: async (
    userId: string,
    data: {
      sunday: boolean;
      monday: boolean;
      tuesday: boolean;
      wednesday: boolean;
      thursday: boolean;
      friday: boolean;
      saturday: boolean;
    },
  ) => {
    return db.workSchedule.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },

  getScheduleExceptions: async (
    userId: string,
    from?: Date,
    to?: Date,
  ) => {
    return db.scheduleException.findMany({
      where: {
        userId,
        ...(from && to ? { date: { gte: from, lte: to } } : {}),
      },
      orderBy: { date: "asc" },
    });
  },

  createScheduleException: async (
    userId: string,
    data: { date: Date; isWorkDay: boolean; reason?: string },
  ) => {
    return db.scheduleException.create({
      data: { userId, ...data },
    });
  },

  deleteScheduleException: async (id: string, userId: string) => {
    return db.scheduleException.deleteMany({
      where: { id, userId },
    });
  },

  getCustomHolidays: async (userId: string, from?: Date, to?: Date) => {
    return db.customHoliday.findMany({
      where: {
        userId,
        ...(from && to ? { date: { gte: from, lte: to } } : {}),
      },
      orderBy: { date: "asc" },
    });
  },

  createCustomHoliday: async (
    userId: string,
    data: { date: Date; name: string },
  ) => {
    return db.customHoliday.create({
      data: { userId, ...data },
    });
  },

  deleteCustomHoliday: async (id: string, userId: string) => {
    return db.customHoliday.deleteMany({
      where: { id, userId },
    });
  },

  getHolidays: async (from: Date, to: Date, country?: string) => {
    return db.holiday.findMany({
      where: {
        OR: [
          // Recurring holidays (match any year)
          { isRecurring: true, ...(country ? { country } : {}) },
          // Non-recurring holidays in range
          {
            isRecurring: false,
            date: { gte: from, lte: to },
            ...(country ? { country } : {}),
          },
        ],
      },
      orderBy: { date: "asc" },
    });
  },
};

export default workScheduleRepository;
