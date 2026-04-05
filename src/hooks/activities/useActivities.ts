import { activityService } from "@/services/activity_service";
import { ActivityCreateDTO, ActivityUpdateDTO } from "@/types/activity.d";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const useActivities = (participationId: string | null) =>
  useQuery({
    queryKey: ["activities", participationId],
    queryFn: () => activityService.getByParticipation(participationId!),
    enabled: !!participationId,
    staleTime: Infinity,
    retry: 1,
  });

const useCreateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participationId,
      data,
    }: {
      participationId: string;
      data: ActivityCreateDTO;
    }) => activityService.create(participationId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["activities", variables.participationId],
      });
    },
  });
};

const useUpdateActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participationId,
      activityId,
      data,
    }: {
      participationId: string;
      activityId: string;
      data: ActivityUpdateDTO;
    }) => activityService.update(participationId, activityId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["activities", variables.participationId],
      });
    },
  });
};

const useDeleteActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participationId,
      activityId,
    }: {
      participationId: string;
      activityId: string;
    }) => activityService.delete(participationId, activityId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["activities", variables.participationId],
      });
    },
  });
};

const useActivityMedia = (
  participationId: string | null,
  filters?: { activityId?: string; uploadedBy?: string },
) =>
  useQuery({
    queryKey: ["activity-media", participationId, filters],
    queryFn: () => activityService.getMedia(participationId!, filters),
    enabled: !!participationId,
  });

const useUploadActivityMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      participationId,
      activityId,
      file,
      caption,
    }: {
      participationId: string;
      activityId: string;
      file: File;
      caption?: string;
    }) => {
      const { uploadUrl, media } = await activityService.uploadMedia(
        participationId,
        activityId,
        {
          contentType: file.type,
          contentLength: file.size,
          caption,
        },
      );
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      return media;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["activity-media", variables.participationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["activities", variables.participationId],
      });
    },
  });
};

const useDeleteActivityMedia = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participationId,
      activityId,
      mediaId,
    }: {
      participationId: string;
      activityId: string;
      mediaId: string;
    }) => activityService.deleteMedia(participationId, activityId, mediaId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["activity-media", variables.participationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["activities", variables.participationId],
      });
    },
  });
};

const useUploadActivityImage = () => {
  return useMutation({
    mutationFn: async ({
      participationId,
      file,
    }: {
      participationId: string;
      file: File;
    }) => {
      const { uploadUrl, publicUrl } =
        await activityService.uploadActivityImage(participationId, {
          contentType: file.type,
          contentLength: file.size,
        });
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      return publicUrl;
    },
  });
};

const useSearchParticipationMembers = (
  participationId: string,
  search: string,
) =>
  useQuery({
    queryKey: ["participation-members", participationId, search],
    queryFn: () => activityService.searchMembers(participationId, search),
    enabled: !!participationId,
    staleTime: Infinity,
  });

export {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useActivityMedia,
  useUploadActivityMedia,
  useDeleteActivityMedia,
  useUploadActivityImage,
  useSearchParticipationMembers,
};
