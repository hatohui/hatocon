import type { Activity } from "@prisma/client";
import {
  ActivityCreateDTO,
  ActivityMediaDTO,
  ActivityUpdateDTO,
  ActivityWithMedia,
} from "@/types/activity.d";
import axios from "axios";

type ApiOk<T> = { data: T };

const activityService = {
  getByParticipation: (participationId: string) =>
    axios
      .get<
        ApiOk<ActivityWithMedia[]>
      >(`/api/participations/${participationId}/activities`)
      .then((r) => r.data.data),

  create: (participationId: string, data: ActivityCreateDTO) =>
    axios
      .post<
        ApiOk<ActivityWithMedia>
      >(`/api/participations/${participationId}/activities`, data)
      .then((r) => r.data.data),

  update: (
    participationId: string,
    activityId: string,
    data: ActivityUpdateDTO,
  ) =>
    axios
      .patch<
        ApiOk<ActivityWithMedia>
      >(`/api/participations/${participationId}/activities/${activityId}`, data)
      .then((r) => r.data.data),

  delete: (participationId: string, activityId: string) =>
    axios.delete(
      `/api/participations/${participationId}/activities/${activityId}`,
    ),

  // Activity media
  getMedia: (
    participationId: string,
    filters?: { activityId?: string; uploadedBy?: string },
  ) => {
    const params = new URLSearchParams();
    if (filters?.activityId) params.set("activityId", filters.activityId);
    if (filters?.uploadedBy) params.set("uploadedBy", filters.uploadedBy);
    return axios
      .get<
        ApiOk<(ActivityMediaDTO & { activity: { id: string; name: string } })[]>
      >(`/api/participations/${participationId}/activities/media?${params}`)
      .then((r) => r.data.data);
  },

  uploadMedia: (
    participationId: string,
    activityId: string,
    data: { contentType: string; contentLength: number; caption?: string },
  ) =>
    axios
      .post<
        ApiOk<{ uploadUrl: string; media: ActivityMediaDTO }>
      >(`/api/participations/${participationId}/activities/${activityId}/media`, data)
      .then((r) => r.data.data),

  deleteMedia: (participationId: string, activityId: string, mediaId: string) =>
    axios.delete(
      `/api/participations/${participationId}/activities/${activityId}/media/${mediaId}`,
    ),

  // Upload reference image for activity (presigned URL)
  uploadActivityImage: (
    participationId: string,
    data: { contentType: string; contentLength: number },
  ) =>
    axios
      .post<
        ApiOk<{ uploadUrl: string; publicUrl: string }>
      >(`/api/participations/${participationId}/activities/upload-image`, data)
      .then((r) => r.data.data),

  searchMembers: (participationId: string, search: string) =>
    axios
      .get<
        ApiOk<
          { id: string; name: string; image: string | null; email: string }[]
        >
      >(`/api/participations/${participationId}/members?search=${encodeURIComponent(search)}`)
      .then((r) => r.data.data),
};

export { activityService };
