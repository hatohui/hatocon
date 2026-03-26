import { Participation } from "@prisma/client";
import {
  HeatmapEntry,
  LeaveBalance,
  ParticipationCreateDTO,
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

  getHeatmap: (from: Date | string, to: Date | string) => {
    const params = new URLSearchParams({
      from: new Date(from).toISOString(),
      to: new Date(to).toISOString(),
    });
    return axios.get<ApiOk<HeatmapEntry[]>>(`/api/heatmap?${params}`);
  },

  getLeaveBalance: () => axios.get<ApiOk<LeaveBalance>>("/api/leave-balance"),
};

export { participationService };
