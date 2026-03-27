import { participationService } from "@/services/participation_service";
import { ParticipationCreateDTO } from "@/types/participation.d";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endOfYear, startOfYear } from "date-fns";

const useHeatmap = () => {
  const from = startOfYear(new Date());
  const to = endOfYear(new Date());

  return useQuery({
    queryKey: ["heatmap", from.getFullYear()],
    queryFn: () =>
      participationService.getHeatmap(from, to).then((r) => r.data.data),
  });
};

const useLeaveBalance = () =>
  useQuery({
    queryKey: ["leave-balance"],
    queryFn: () =>
      participationService.getLeaveBalance().then((r) => r.data.data),
    retry: false,
  });

const useCreateParticipation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ParticipationCreateDTO) =>
      participationService.create(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heatmap"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
      queryClient.invalidateQueries({ queryKey: ["participations"] });
    },
  });
};

const useMyParticipations = (from: Date, to: Date) =>
  useQuery({
    queryKey: ["participations", from.toISOString(), to.toISOString()],
    queryFn: () =>
      participationService.getInRange(from, to).then((r) => r.data.data),
  });

const useDeleteParticipation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => participationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participations"] });
      queryClient.invalidateQueries({ queryKey: ["heatmap"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balance"] });
    },
  });
};

const useParticipationImages = (participationId: string | null) =>
  useQuery({
    queryKey: ["participation-images", participationId],
    queryFn: () =>
      participationService.getImages(participationId!).then((r) => r.data.data),
    enabled: !!participationId,
  });

const useDeleteParticipationImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participationId,
      imageId,
    }: {
      participationId: string;
      imageId: string;
    }) => participationService.deleteImage(participationId, imageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["participation-images", variables.participationId],
      });
    },
  });
};

const useUploadParticipationImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      participationId,
      file,
      caption,
    }: {
      participationId: string;
      file: File;
      caption?: string;
    }) => {
      const { data } = await participationService.uploadImage(participationId, {
        contentType: file.type,
        contentLength: file.size,
        caption,
      });
      await fetch(data.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      return data.data.image;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["participation-images", variables.participationId],
      });
    },
  });
};

export {
  useHeatmap,
  useLeaveBalance,
  useCreateParticipation,
  useMyParticipations,
  useDeleteParticipation,
  useParticipationImages,
  useDeleteParticipationImage,
  useUploadParticipationImage,
};
