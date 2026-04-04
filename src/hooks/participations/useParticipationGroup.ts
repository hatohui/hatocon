import { participationService } from "@/services/participation_service";
import type { ParticipationGroupSettingsUpdate } from "@/types/notification.d";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const useJoinRequests = (participationId: string | null) =>
  useQuery({
    queryKey: ["join-requests", participationId],
    queryFn: () =>
      participationService
        .getJoinRequests(participationId!)
        .then((r) => r.data.data),
    enabled: !!participationId,
  });

const useKickMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participationId,
      userId,
    }: {
      participationId: string;
      userId: string;
    }) => participationService.kickMember(participationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participation"] });
      queryClient.invalidateQueries({ queryKey: ["participations"] });
    },
  });
};

const useTransferOwnership = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participationId,
      userId,
    }: {
      participationId: string;
      userId: string;
    }) => participationService.transferOwnership(participationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participation"] });
    },
  });
};

const useUpdateGroupSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participationId,
      data,
    }: {
      participationId: string;
      data: ParticipationGroupSettingsUpdate;
    }) => participationService.updateSettings(participationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participation"] });
    },
  });
};

const useRequestToJoin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participationId: string) =>
      participationService.requestToJoin(participationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participation"] });
    },
  });
};

const useApproveJoinRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participationId,
      requestId,
    }: {
      participationId: string;
      requestId: string;
    }) => participationService.approveJoinRequest(participationId, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["join-requests"] });
      queryClient.invalidateQueries({ queryKey: ["participation"] });
    },
  });
};

const useRejectJoinRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      participationId,
      requestId,
    }: {
      participationId: string;
      requestId: string;
    }) => participationService.rejectJoinRequest(participationId, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["join-requests"] });
    },
  });
};

export {
  useJoinRequests,
  useKickMember,
  useTransferOwnership,
  useUpdateGroupSettings,
  useRequestToJoin,
  useApproveJoinRequest,
  useRejectJoinRequest,
};
