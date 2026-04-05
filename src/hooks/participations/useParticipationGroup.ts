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
    onMutate: async ({ participationId, data }) => {
      // Cancel any in-flight refetch so it doesn't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: ["participation", participationId],
      });

      // Snapshot the previous value
      const previous = queryClient.getQueryData([
        "participation",
        participationId,
      ]);

      // Optimistically update the cache
      queryClient.setQueryData(
        ["participation", participationId],
        (old: { group?: Record<string, unknown> } | undefined) => {
          if (!old?.group) return old;
          return { ...old, group: { ...old.group, ...data } };
        },
      );

      return { previous, participationId };
    },
    onError: (_err, _vars, context) => {
      // Roll back on failure
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          ["participation", context.participationId],
          context.previous,
        );
      }
    },
    onSettled: (_data, _err, { participationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["participation", participationId],
      });
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
