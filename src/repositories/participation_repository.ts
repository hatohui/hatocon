import { db } from "@/config/prisma";
import { ParticipationCreateDTO } from "@/types/participation.d";
import { JoinRequestStatus, LeaveType } from "@prisma/client";
import type { ParticipationGroupSettingsUpdate } from "@/types/notification.d";
import workScheduleRepository from "./work_schedule_repository";
import { getPublicHolidaySet } from "@/lib/holidays";

/**
 * Counts working days between two dates inclusive, respecting:
 * - User's work schedule (default Mon–Fri)
 * - Schedule exceptions (forced work/off days)
 * - Public holidays
 * - Custom holidays
 */
async function countWorkingDays(
  from: Date,
  to: Date,
  userId: string,
): Promise<number> {
  const schedule = await workScheduleRepository.getByUserId(userId);
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { country: true },
  });
  const country = user?.country ?? "VN";

  const workDays = schedule
    ? [
        schedule.sunday,
        schedule.monday,
        schedule.tuesday,
        schedule.wednesday,
        schedule.thursday,
        schedule.friday,
        schedule.saturday,
      ]
    : [false, true, true, true, true, true, false]; // default Mon-Fri

  const years = Array.from(new Set([from.getFullYear(), to.getFullYear()]));
  const [exceptions, customHolidays, publicHolidaySet] = await Promise.all([
    workScheduleRepository.getScheduleExceptions(userId, from, to),
    workScheduleRepository.getCustomHolidays(userId, from, to),
    getPublicHolidaySet([country], years),
  ]);

  // Build lookup sets for quick date matching
  const exceptionMap = new Map<string, boolean>();
  for (const e of exceptions) {
    exceptionMap.set(new Date(e.date).toDateString(), e.isWorkDay);
  }

  const customHolidaySet = new Set<string>();
  for (const ch of customHolidays) {
    customHolidaySet.add(new Date(ch.date).toDateString());
  }

  let count = 0;
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const dateKey = cursor.toDateString();

    // 1. Check schedule exceptions first (highest priority)
    const exception = exceptionMap.get(dateKey);
    if (exception !== undefined) {
      if (exception) count++;
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    // 2. Check custom holidays
    if (customHolidaySet.has(dateKey)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    // 3. Check public holidays
    const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (publicHolidaySet.has(dateStr)) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    // 4. Check work schedule
    const day = cursor.getDay();
    if (workDays[day]) count++;

    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

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
        group: {
          include: {
            images: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });
  },

  getParticipantsByGroup: async (groupId: string) => {
    return db.participation.findMany({
      where: { groupId },
      select: {
        id: true,
        userId: true,
        from: true,
        to: true,
        isAlreadyHere: true,
        entryFlight: true,
        exitFlight: true,
        createdBy: true,
        user: { select: { id: true, name: true, image: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  getParticipantsByEvent: async (eventId: string) => {
    return db.participation.findMany({
      where: { eventId },
      select: {
        id: true,
        userId: true,
        from: true,
        to: true,
        isAlreadyHere: true,
        entryFlight: true,
        exitFlight: true,
        createdBy: true,
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

  getByUserAndGroup: async (userId: string, groupId: string) => {
    return db.participation.findFirst({
      where: { userId, groupId },
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
        group: { select: { id: true, name: true } },
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

  /** Check if user already has a participation in a group for the same event with overlapping dates */
  getOverlappingInEvent: async (
    userId: string,
    eventId: string,
    from: Date,
    to: Date,
    excludeGroupId?: string,
  ) => {
    return db.participation.findFirst({
      where: {
        userId,
        eventId,
        groupId: excludeGroupId ? { not: excludeGroupId } : undefined,
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
    const days = await Promise.all(
      participations.map((p) => countWorkingDays(p.from, p.to, userId)),
    );
    return days.reduce((sum, d) => sum + d, 0);
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
        groupId: data.groupId ?? null,
        from: new Date(data.from),
        to: new Date(data.to),
        leaveType: data.leaveType,
        createdBy: createdBy ?? null,
        ...(data.entryFlight ? { entryFlight: data.entryFlight } : {}),
        ...(data.exitFlight ? { exitFlight: data.exitFlight } : {}),
      },
    });
  },

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
            groupId: data.groupId ?? null,
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

  getAllGroupsAdmin: async (
    opts: {
      search?: string;
      eventId?: string;
      skip?: number;
      take?: number;
    } = {},
  ) => {
    const where = {
      ...(opts.eventId ? { eventId: opts.eventId } : {}),
      ...(opts.search
        ? {
            OR: [
              { name: { contains: opts.search, mode: "insensitive" as const } },
              {
                event: {
                  title: {
                    contains: opts.search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                participations: {
                  some: {
                    user: {
                      OR: [
                        {
                          name: {
                            contains: opts.search,
                            mode: "insensitive" as const,
                          },
                        },
                        {
                          email: {
                            contains: opts.search,
                            mode: "insensitive" as const,
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [total, groups] = await Promise.all([
      db.participationGroup.count({ where }),
      db.participationGroup.findMany({
        where,
        include: {
          event: {
            select: { id: true, title: true, startAt: true, endAt: true },
          },
          participations: {
            include: {
              user: {
                select: { id: true, name: true, image: true, email: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { images: true, activities: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: opts.skip ?? 0,
        take: opts.take ?? 20,
      }),
    ]);

    return { total, groups };
  },

  updateDates: async (
    id: string,
    data: {
      from: Date;
      to: Date;
      isAlreadyHere?: boolean;
      entryFlight?: string | null;
      exitFlight?: string | null;
    },
  ) => {
    return db.participation.update({
      where: { id },
      data: {
        from: data.from,
        to: data.to,
        ...(data.isAlreadyHere !== undefined && {
          isAlreadyHere: data.isAlreadyHere,
        }),
        ...(data.entryFlight !== undefined && {
          entryFlight: data.entryFlight || null,
        }),
        ...(data.exitFlight !== undefined && {
          exitFlight: data.exitFlight || null,
        }),
      },
    });
  },

  delete: async (id: string) => {
    return db.participation.delete({ where: { id } });
  },

  // ─── Group Images ──────────────────────────────────────────────────

  getImages: async (groupId: string) => {
    return db.participationImage.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
    });
  },

  addImage: async (
    groupId: string,
    url: string,
    uploadedBy: string,
    caption?: string,
  ) => {
    return db.participationImage.create({
      data: { groupId, url, uploadedBy, caption },
    });
  },

  deleteImage: async (imageId: string) => {
    return db.participationImage.delete({ where: { id: imageId } });
  },

  getImageById: async (imageId: string) => {
    return db.participationImage.findUnique({
      where: { id: imageId },
      include: { group: { select: { ownerId: true } } },
    });
  },

  /** Returns true if userId is a member of the participation's group */
  isMember: async (participationId: string, userId: string) => {
    const participation = await db.participation.findUnique({
      where: { id: participationId },
      select: { userId: true, groupId: true },
    });
    if (!participation) return false;
    if (participation.userId === userId) return true;
    if (!participation.groupId) return false;
    const groupMember = await db.participation.findFirst({
      where: { groupId: participation.groupId, userId },
      select: { id: true },
    });
    return groupMember !== null;
  },

  isGroupMember: async (groupId: string, userId: string) => {
    const member = await db.participation.findFirst({
      where: { groupId, userId },
      select: { id: true },
    });
    return member !== null;
  },

  /** Returns members of the same group, optionally filtered by name/email */
  searchMembers: async (participationId: string, search: string) => {
    const participation = await db.participation.findUnique({
      where: { id: participationId },
      select: { userId: true, groupId: true },
    });
    if (!participation) return [];

    if (!participation.groupId) {
      const user = await db.user.findUnique({
        where: { id: participation.userId },
        select: { id: true, name: true, image: true, email: true },
      });
      if (!user) return [];
      const q = search.toLowerCase();
      if (
        q &&
        !user.name.toLowerCase().includes(q) &&
        !user.email.toLowerCase().includes(q)
      )
        return [];
      return [user];
    }

    const participations = await db.participation.findMany({
      where: { groupId: participation.groupId },
      select: {
        user: { select: { id: true, name: true, image: true, email: true } },
      },
    });

    const users = participations.map((p) => p.user);
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  },

  // ─── Participation Group ────────────────────────────────────────────

  getGroupById: async (id: string) => {
    return db.participationGroup.findUnique({ where: { id } });
  },

  getGroupsByEventId: async (eventId: string) => {
    return db.participationGroup.findMany({
      where: { eventId },
      include: {
        participations: {
          include: {
            user: {
              select: { id: true, name: true, image: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  },

  createGroup: async (data: {
    eventId?: string;
    ownerId: string;
    name?: string;
  }) => {
    return db.participationGroup.create({
      data: {
        eventId: data.eventId ?? null,
        ownerId: data.ownerId,
        name: data.name ?? "My Plan",
      },
    });
  },

  /** Get or create a group for a participation */
  getOrCreateGroupForParticipation: async (
    participationId: string,
    ownerId: string,
  ) => {
    const participation = await db.participation.findUnique({
      where: { id: participationId },
      select: { groupId: true, eventId: true },
    });
    if (!participation) return null;

    if (participation.groupId) {
      return db.participationGroup.findUnique({
        where: { id: participation.groupId },
      });
    }

    const group = await db.participationGroup.create({
      data: {
        eventId: participation.eventId,
        ownerId,
      },
    });

    await db.participation.update({
      where: { id: participationId },
      data: { groupId: group.id },
    });

    return group;
  },

  updateGroupSettings: async (
    groupId: string,
    data: ParticipationGroupSettingsUpdate,
  ) => {
    return db.participationGroup.update({
      where: { id: groupId },
      data,
    });
  },

  transferOwnership: async (groupId: string, newOwnerId: string) => {
    return db.participationGroup.update({
      where: { id: groupId },
      data: { ownerId: newOwnerId },
    });
  },

  // ─── Join Requests ─────────────────────────────────────────────────

  createJoinRequest: async (groupId: string, userId: string) => {
    return db.joinRequest.create({
      data: { groupId, userId },
    });
  },

  getJoinRequest: async (id: string) => {
    return db.joinRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
      },
    });
  },

  getJoinRequestByGroupAndUser: async (groupId: string, userId: string) => {
    return db.joinRequest.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
  },

  getPendingJoinRequests: async (groupId: string) => {
    return db.joinRequest.findMany({
      where: { groupId, status: JoinRequestStatus.PENDING },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  updateJoinRequestStatus: async (id: string, status: JoinRequestStatus) => {
    return db.joinRequest.update({
      where: { id },
      data: { status },
    });
  },

  /** Fetch minimal public-facing data for a participation share page */
  getShareData: async (participationId: string) => {
    return db.participation.findUnique({
      where: { id: participationId },
      select: {
        id: true,
        from: true,
        to: true,
        leaveType: true,
        user: { select: { id: true, name: true, image: true } },
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            image: true,
            startAt: true,
            endAt: true,
            location: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            isPublic: true,
            ownerId: true,
            _count: { select: { participations: true } },
          },
        },
      },
    });
  },

  /**
   * Collect all R2 image URLs that belong to a specific user inside a group:
   * - Activities created by them (imageUrl)
   * - ActivityMedia uploaded by them in any activity of the group
   */
  getUserMediaUrlsInGroup: async (
    groupId: string,
    userId: string,
  ): Promise<string[]> => {
    const [activities, media] = await Promise.all([
      db.activity.findMany({
        where: { participationGroupId: groupId, createdBy: userId },
        select: { imageUrl: true },
      }),
      db.activityMedia.findMany({
        where: {
          uploadedBy: userId,
          activity: { participationGroupId: groupId },
        },
        select: { url: true },
      }),
    ]);
    const urls: string[] = [];
    for (const a of activities) if (a.imageUrl) urls.push(a.imageUrl);
    for (const m of media) urls.push(m.url);
    return urls;
  },

  /**
   * Collect ALL R2 image URLs for an entire group:
   * - ParticipationImage rows
   * - Activities' imageUrl
   * - ActivityMedia rows
   */
  getGroupAllMediaUrls: async (groupId: string): Promise<string[]> => {
    const group = await db.participationGroup.findUnique({
      where: { id: groupId },
      select: {
        images: { select: { url: true } },
        activities: {
          select: {
            imageUrl: true,
            media: { select: { url: true } },
          },
        },
      },
    });
    if (!group) return [];
    const urls: string[] = [];
    for (const img of group.images) urls.push(img.url);
    for (const act of group.activities) {
      if (act.imageUrl) urls.push(act.imageUrl);
      for (const m of act.media) urls.push(m.url);
    }
    return urls;
  },

  /**
   * Hard-delete an entire participation group and all its members' data.
   * Participations don't cascade from the group FK, so we delete them first.
   * DB cascades handle: activities → media, images, join requests.
   */
  deleteEntireGroup: async (groupId: string) => {
    await db.participation.deleteMany({ where: { groupId } });
    return db.participationGroup.delete({ where: { id: groupId } });
  },

  /**
   * Find the second-oldest member of a group (by participation.createdAt),
   * excluding the current owner. Used for auto-promotion when owner leaves.
   */
  getSecondOldestMember: async (groupId: string, excludeUserId: string) => {
    return db.participation.findFirst({
      where: { groupId, userId: { not: excludeUserId } },
      orderBy: { createdAt: "asc" },
      select: { id: true, userId: true },
    });
  },
};

export default participationRepository;
