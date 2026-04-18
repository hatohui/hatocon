import { db } from "@/config/prisma";
import { ActivityCreateDTO, ActivityUpdateDTO } from "@/types/activity.d";

const activityRepository = {
  getById: async (id: string) => {
    return db.activity.findUnique({
      where: { id },
      include: { media: { orderBy: { createdAt: "desc" } } },
    });
  },

  getByGroup: async (groupId: string) => {
    return db.activity.findMany({
      where: { participationGroupId: groupId },
      include: { media: { orderBy: { createdAt: "desc" } } },
      orderBy: { from: "asc" },
    });
  },

  create: async (
    groupId: string,
    createdBy: string,
    data: ActivityCreateDTO,
  ) => {
    return db.activity.create({
      data: {
        participationGroupId: groupId,
        createdBy,
        name: data.name,
        from: new Date(data.from),
        to: new Date(data.to),
        location: data.location || null,
        locationUrl: data.locationUrl || null,
        involvedPeople: data.involvedPeople,
        isExcludeMode: data.isExcludeMode ?? false,
        note: data.note || null,
        imageUrl: data.imageUrl || null,
      },
      include: { media: true },
    });
  },

  update: async (id: string, data: ActivityUpdateDTO) => {
    return db.activity.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.from !== undefined && { from: new Date(data.from) }),
        ...(data.to !== undefined && { to: new Date(data.to) }),
        ...(data.location !== undefined && {
          location: data.location || null,
        }),
        ...(data.locationUrl !== undefined && {
          locationUrl: data.locationUrl || null,
        }),
        ...(data.involvedPeople !== undefined && {
          involvedPeople: data.involvedPeople,
        }),
        ...(data.isExcludeMode !== undefined && {
          isExcludeMode: data.isExcludeMode,
        }),
        ...(data.note !== undefined && { note: data.note || null }),
        ...(data.imageUrl !== undefined && {
          imageUrl: data.imageUrl || null,
        }),
      },
      include: { media: true },
    });
  },

  delete: async (id: string) => {
    return db.activity.delete({ where: { id } });
  },

  removeUserFromGroup: async (groupId: string, userId: string) => {
    // Find all include-mode activities where the user is specifically tagged
    const activities = await db.activity.findMany({
      where: {
        participationGroupId: groupId,
        isExcludeMode: false,
        involvedPeople: { has: userId },
      },
      select: { id: true, involvedPeople: true },
    });

    const toDelete: string[] = [];
    const toUpdate: { id: string; involvedPeople: string[] }[] = [];

    for (const activity of activities) {
      if (activity.involvedPeople.length === 1) {
        // Only the leaving user is tagged → delete the activity
        toDelete.push(activity.id);
      } else {
        // Tagged alongside others → remove their tag
        toUpdate.push({
          id: activity.id,
          involvedPeople: activity.involvedPeople.filter((p) => p !== userId),
        });
      }
    }

    if (toDelete.length > 0) {
      await db.activity.deleteMany({ where: { id: { in: toDelete } } });
    }

    for (const { id, involvedPeople } of toUpdate) {
      await db.activity.update({ where: { id }, data: { involvedPeople } });
    }
  },

  // ─── Activity Media ──────────────────────────────────────────────
  getMedia: async (activityId: string) => {
    return db.activityMedia.findMany({
      where: { activityId },
      orderBy: { createdAt: "desc" },
    });
  },

  getAllMediaByGroup: async (
    groupId: string,
    activityId?: string,
    uploadedBy?: string,
  ) => {
    return db.activityMedia.findMany({
      where: {
        activity: { participationGroupId: groupId },
        ...(activityId ? { activityId } : {}),
        ...(uploadedBy ? { uploadedBy } : {}),
      },
      include: {
        activity: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  addMedia: async (
    activityId: string,
    uploadedBy: string,
    url: string,
    caption?: string,
  ) => {
    return db.activityMedia.create({
      data: { activityId, uploadedBy, url, caption },
    });
  },

  deleteMedia: async (mediaId: string) => {
    return db.activityMedia.delete({ where: { id: mediaId } });
  },

  getMediaById: async (mediaId: string) => {
    return db.activityMedia.findUnique({
      where: { id: mediaId },
      include: {
        activity: {
          select: { participationGroupId: true, createdBy: true },
        },
      },
    });
  },
};

export default activityRepository;
