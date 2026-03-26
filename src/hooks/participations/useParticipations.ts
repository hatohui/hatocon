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

export { useHeatmap, useLeaveBalance, useCreateParticipation };
