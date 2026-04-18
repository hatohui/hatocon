import { useCallback, useEffect } from "react";
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

const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participationId: string) =>
      participationService.deleteGroup(participationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participations"] });
      queryClient.invalidateQueries({ queryKey: ["participation"] });
    },
  });
};

const useLeaveGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participationId: string) =>
      participationService.leaveGroup(participationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participations"] });
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

export function useMediaNavigation({
  index,
  total,
  onIndexChange,
}: {
  index: number | null;
  total: number;
  onIndexChange: (i: number | null) => void;
}) {
  const goPrev = useCallback(() => {
    if (index !== null && index > 0) onIndexChange(index - 1);
  }, [index, onIndexChange]);

  const goNext = useCallback(() => {
    if (index !== null && index < total - 1) onIndexChange(index + 1);
  }, [index, total, onIndexChange]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, goPrev, goNext]);

  return {
    goPrev,
    goNext,
    hasPrev: index !== null && index > 0,
    hasNext: index !== null && index < total - 1,
  };
}

export {
  useJoinRequests,
  useKickMember,
  useTransferOwnership,
  useUpdateGroupSettings,
  useRequestToJoin,
  useApproveJoinRequest,
  useRejectJoinRequest,
  useDeleteGroup,
  useLeaveGroup,
};
