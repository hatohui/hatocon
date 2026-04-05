import type { Participation } from "@prisma/client";
import {
  HeatmapEntry,
  LeaveBalance,
  ParticipationCreateDTO,
  ParticipationDetail,
  ParticipationImageDTO,
  ParticipationWithEvent,
} from "@/types/participation.d";
import type {
  JoinRequestDTO,
  ParticipationGroupDTO,
  ParticipationGroupSettingsUpdate,
} from "@/types/notification.d";
import axios from "axios";

type ApiOk<T> = { data: T };

const participationService = {
  getById: (id: string) =>
    axios.get<ApiOk<ParticipationDetail>>(`/api/participations/${id}`),

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

  update: (id: string, data: { from?: Date | string; to?: Date | string; isAlreadyHere?: boolean }) =>
    axios.patch(`/api/participations/${id}`, data),

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

  addMember: (participationId: string, userId: string) =>
    axios.post<ApiOk<Participation>>(
      `/api/participations/${participationId}/members`,
      { userId },
    ),

  inviteMember: (participationId: string, userId: string) =>
    axios.post<ApiOk<{ message: string }>>(
      `/api/participations/${participationId}/invite`,
      { userId },
    ),

  acceptInvite: (participationId: string, notificationId?: string) =>
    axios.post<ApiOk<Participation>>(
      `/api/participations/${participationId}/invite/accept`,
      { notificationId },
    ),
  declineInvite: (participationId: string, notificationId?: string) =>
    axios.post<ApiOk<{ message: string }>>(
      `/api/participations/${participationId}/invite/decline`,
      { notificationId },
    ),
  // ─── Group Settings ──────────────────────────────────────────────

  getSettings: (participationId: string) =>
    axios.get<ApiOk<ParticipationGroupDTO>>(
      `/api/participations/${participationId}/settings`,
    ),

  updateSettings: (
    participationId: string,
    data: ParticipationGroupSettingsUpdate,
  ) =>
    axios.patch<ApiOk<ParticipationGroupDTO>>(
      `/api/participations/${participationId}/settings`,
      data,
    ),

  kickMember: (participationId: string, userId: string) =>
    axios.post(`/api/participations/${participationId}/kick`, { userId }),

  transferOwnership: (participationId: string, userId: string) =>
    axios.post(`/api/participations/${participationId}/transfer`, { userId }),

  // ─── Join Requests ───────────────────────────────────────────────

  getJoinRequests: (participationId: string) =>
    axios.get<ApiOk<JoinRequestDTO[]>>(
      `/api/participations/${participationId}/join-requests`,
    ),

  requestToJoin: (participationId: string) =>
    axios.post(`/api/participations/${participationId}/join-requests`),

  approveJoinRequest: (participationId: string, requestId: string) =>
    axios.post(
      `/api/participations/${participationId}/join-requests/${requestId}/approve`,
    ),

  rejectJoinRequest: (participationId: string, requestId: string) =>
    axios.post(
      `/api/participations/${participationId}/join-requests/${requestId}/reject`,
    ),
};

export { participationService };
