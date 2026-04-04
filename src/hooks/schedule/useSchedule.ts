import {
  scheduleService,
  type WorkScheduleData,
} from "@/services/schedule_service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useWorkSchedule = () =>
  useQuery({
    queryKey: ["work-schedule"],
    queryFn: () => scheduleService.getWorkSchedule().then((r) => r.data.data),
  });

export const useUpdateWorkSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: WorkScheduleData) =>
      scheduleService.updateWorkSchedule(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work-schedule"] });
      qc.invalidateQueries({ queryKey: ["leave-balance"] });
    },
  });
};

export const useScheduleExceptions = (from?: string, to?: string) =>
  useQuery({
    queryKey: ["schedule-exceptions", from, to],
    queryFn: () =>
      scheduleService
        .getScheduleExceptions(from, to)
        .then((r) => r.data.data),
  });

export const useCreateScheduleException = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; isWorkDay: boolean; reason?: string }) =>
      scheduleService.createScheduleException(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule-exceptions"] });
      qc.invalidateQueries({ queryKey: ["leave-balance"] });
    },
  });
};

export const useDeleteScheduleException = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scheduleService.deleteScheduleException(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule-exceptions"] });
      qc.invalidateQueries({ queryKey: ["leave-balance"] });
    },
  });
};

export const useCustomHolidays = (from?: string, to?: string) =>
  useQuery({
    queryKey: ["custom-holidays", from, to],
    queryFn: () =>
      scheduleService.getCustomHolidays(from, to).then((r) => r.data.data),
  });

export const useCreateCustomHoliday = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; name: string }) =>
      scheduleService.createCustomHoliday(data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-holidays"] });
      qc.invalidateQueries({ queryKey: ["leave-balance"] });
    },
  });
};

export const useDeleteCustomHoliday = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scheduleService.deleteCustomHoliday(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-holidays"] });
      qc.invalidateQueries({ queryKey: ["leave-balance"] });
    },
  });
};

export const useHolidays = (from: string, to: string) =>
  useQuery({
    queryKey: ["holidays", from, to],
    queryFn: () =>
      scheduleService.getHolidays(from, to).then((r) => r.data.data),
    enabled: !!from && !!to,
  });
