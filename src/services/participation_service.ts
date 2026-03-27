import type { Participation } from "@prisma/client";
import {
  HeatmapEntry,
  LeaveBalance,
  ParticipationCreateDTO,
  ParticipationImageDTO,
  ParticipationWithEvent,
} from "@/types/participation.d";
import axios from "axios";

type ApiOk<T> = { data: T };

const participationService = {
  getInRange: (from: Date | string, to: Date | string) => {
    const params = new URLSearchParams({
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
    });
    return axios.get<ApiOk<ParticipationWithEvent[]>>(
      `/api/participations?${params}`,
    );
  },

  create: (data: ParticipationCreateDTO) =>
    axios.post<ApiOk<Participation>>("/api/participations", data),

  delete: (id: string) => axios.delete(`/api/participations/${id}`),

  getImages: (participationId: string) =>
    axios.get<ApiOk<ParticipationImageDTO[]>>(
      `/api/participations/${participationId}/images`,
    ),

  uploadImage: (
    participationId: string,
    data: { contentType: string; contentLength: number; caption?: string },
  ) =>
    axios.post<ApiOk<{ uploadUrl: string; image: ParticipationImageDTO }>>(
      `/api/participations/${participationId}/images`,
      data,
    ),

  deleteImage: (participationId: string, imageId: string) =>
    axios.delete(`/api/participations/${participationId}/images/${imageId}`),

  getHeatmap: (from: Date | string, to: Date | string) => {
    const params = new URLSearchParams({
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
    });
    return axios.get<ApiOk<HeatmapEntry[]>>(`/api/heatmap?${params}`);
  },

  getLeaveBalance: () =>
    axios.get<ApiOk<LeaveBalance & { cycleFrom: string; cycleTo: string }>>(
      "/api/leave-balance",
    ),
};

export { participationService };
