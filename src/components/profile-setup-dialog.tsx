"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobProfileSchema } from "@/validations/jobProfileSchema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCreateJobProfile } from "@/hooks/job-profiles/useJobProfiles";
import {
  JobProfileForm,
  type JobProfileFormValues,
} from "@/components/job-profile-form";

export default function ProfileSetupDialog({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: () => void;
}) {
  const form = useForm<JobProfileFormValues>({
    resolver: zodResolver(jobProfileSchema),
    defaultValues: {
      title: "",
      daysOfLeave: 0,
      daysOfSickLeave: 0,
    },
  });

  const createProfile = useCreateJobProfile();

  const handleSubmit = (values: JobProfileFormValues) => {
    createProfile.mutate(
      {
        title: values.title || undefined,
        daysOfLeave: values.daysOfLeave,
        daysOfSickLeave: values.daysOfSickLeave,
      },
      {
        onSuccess: () => onComplete(),
        onError: () =>
          form.setError("root", {
            message: "Failed to create profile. Please try again.",
          }),
      },
    );
  };

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Set Up Your Profile</DialogTitle>
          <DialogDescription>
            Please fill in your job profile details to get started.
          </DialogDescription>
        </DialogHeader>

        <JobProfileForm form={form} onSubmit={handleSubmit}>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="daysOfLeave"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Paid Leave (per year)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    placeholder="e.g. 20"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="daysOfSickLeave"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Days of Sick Leave (per year)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    placeholder="e.g. 10"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={createProfile.isPending}
          >
            {createProfile.isPending ? "Saving..." : "Complete Setup"}
          </Button>
        </JobProfileForm>
      </DialogContent>
    </Dialog>
  );
}
