import {
  JobProfileCreateDTO,
  JobProfileUpdateDTO,
  JobProfileWithUser,
} from "@/types/job-profile";
import { JobProfile } from "@prisma/client";
import axios from "axios";

type ApiOk<T> = { data: T };

const jobProfileService = {
  getMine: () => axios.get<ApiOk<JobProfile>>("/api/job-profiles/me"),
  getAll: () => axios.get<ApiOk<JobProfileWithUser[]>>("/api/job-profiles"),
  getById: (id: string) =>
    axios.get<ApiOk<JobProfile>>(`/api/job-profiles/${id}`),
  create: (data: JobProfileCreateDTO) =>
    axios.post<ApiOk<JobProfile>>("/api/job-profiles", data),
  update: (id: string, data: JobProfileUpdateDTO) =>
    axios.put<ApiOk<JobProfile>>(`/api/job-profiles/${id}`, data),
  delete: (id: string) => axios.delete(`/api/job-profiles/${id}`),
};

export { jobProfileService };
