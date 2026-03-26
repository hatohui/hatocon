import { db } from "@/config/prisma";
import { JobProfileCreateDTO, JobProfileUpdateDTO } from "@/types/job-profile";

const jobProfileRepository = {
  getByUserId: async (userId: string) => {
    const profile = await db.jobProfile.findUnique({
      where: { userId },
    });
    return profile;
  },
  getById: async (id: string) => {
    const profile = await db.jobProfile.findUnique({
      where: { id },
    });
    return profile;
  },
  getAll: async () => {
    const profiles = await db.jobProfile.findMany({
      include: { user: { omit: { password: true } } },
    });
    return profiles;
  },
  create: async (userId: string, data: JobProfileCreateDTO) => {
    const profile = await db.jobProfile.create({
      data: { ...data, userId },
    });
    return profile;
  },
  update: async (id: string, data: JobProfileUpdateDTO) => {
    const profile = await db.jobProfile.update({
      where: { id },
      data,
    });
    return profile;
  },
  delete: async (id: string) => {
    await db.jobProfile.delete({ where: { id } });
  },
};

export default jobProfileRepository;
