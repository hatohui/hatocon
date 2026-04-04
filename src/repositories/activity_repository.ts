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
      orderBy: [{ from: "asc" }, { sortOrder: "asc" }],
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
        note: data.note || null,
        imageUrl: data.imageUrl || null,
        sortOrder: data.sortOrder ?? 0,
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
        ...(data.note !== undefined && { note: data.note || null }),
        ...(data.imageUrl !== undefined && {
          imageUrl: data.imageUrl || null,
        }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: { media: true },
    });
  },

  delete: async (id: string) => {
    return db.activity.delete({ where: { id } });
  },

  reorder: async (groupId: string, orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) =>
      db.activity.update({
        where: { id },
        data: { sortOrder: index },
      }),
    );
    return db.$transaction(updates);
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
