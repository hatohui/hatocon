import { jobProfileService } from "@/services/job_profile_service";
import { JobProfileCreateDTO, JobProfileUpdateDTO } from "@/types/job-profile";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const useMyJobProfile = () =>
  useQuery({
    queryKey: ["job-profile", "me"],
    queryFn: () => jobProfileService.getMine().then((res) => res.data.data),
    retry: false,
  });

const useJobProfiles = () =>
  useQuery({
    queryKey: ["job-profiles"],
    queryFn: () => jobProfileService.getAll().then((res) => res.data.data),
    retry: 1,
  });

const useCreateJobProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: JobProfileCreateDTO) => jobProfileService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-profile", "me"] });
      queryClient.invalidateQueries({ queryKey: ["job-profiles"] });
    },
  });
};

const useUpdateJobProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: JobProfileUpdateDTO }) =>
      jobProfileService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-profile", "me"] });
      queryClient.invalidateQueries({ queryKey: ["job-profiles"] });
    },
  });
};

const useDeleteJobProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobProfileService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-profiles"] });
    },
  });
};

export {
  useMyJobProfile,
  useJobProfiles,
  useCreateJobProfile,
  useUpdateJobProfile,
  useDeleteJobProfile,
};
