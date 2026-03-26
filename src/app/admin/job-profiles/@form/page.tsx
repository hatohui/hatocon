"use client";

import { Suspense } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  useCreateJobProfile,
  useUpdateJobProfile,
  useJobProfiles,
} from "@/hooks/job-profiles/useJobProfiles";
import {
  JobProfileForm,
  type JobProfileFormValues,
} from "@/components/job-profile-form";

function CreateForm({ onClose }: { onClose: () => void }) {
  const form = useForm<JobProfileFormValues>({
    resolver: zodResolver(jobProfileSchema),
    defaultValues: {
      title: "",
      daysOfLeave: 0,
      daysOfSickLeave: 0,
      leaveCycleStart: undefined,
    },
  });
  const createProfile = useCreateJobProfile();

  const handleSubmit = (values: JobProfileFormValues) => {
    createProfile.mutate(
      {
        title: values.title || undefined,
        daysOfLeave: values.daysOfLeave,
        daysOfSickLeave: values.daysOfSickLeave,
        leaveCycleStart: values.leaveCycleStart ?? undefined,
      },
      {
        onSuccess: onClose,
        onError: (error) => {
          const code =
            axios.isAxiosError(error) && error.response?.data?.message;
          const message =
            code === "JOB_PROFILE_ALREADY_EXISTS"
              ? "You already have a job profile."
              : "Operation failed. Please try again.";
          form.setError("root", { message });
        },
      },
    );
  };

  return (
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
        name="leaveCycleStart"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Leave Cycle Start (optional)</FormLabel>
            <FormControl>
              <Input
                type="date"
                value={
                  field.value
                    ? new Date(field.value).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? new Date(e.target.value) : undefined,
                  )
                }
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
        {createProfile.isPending ? "Saving..." : "Create"}
      </Button>
    </JobProfileForm>
  );
}

function EditForm({
  profileId,
  defaultValues,
  onClose,
}: {
  profileId: string;
  defaultValues: JobProfileFormValues;
  onClose: () => void;
}) {
  const form = useForm<JobProfileFormValues>({
    resolver: zodResolver(jobProfileSchema),
    defaultValues,
  });
  const updateProfile = useUpdateJobProfile();

  const handleSubmit = (values: JobProfileFormValues) => {
    updateProfile.mutate(
      {
        id: profileId,
        data: {
          title: values.title || undefined,
          daysOfLeave: values.daysOfLeave,
          daysOfSickLeave: values.daysOfSickLeave,
          leaveCycleStart: values.leaveCycleStart ?? undefined,
        },
      },
      {
        onSuccess: onClose,
        onError: () =>
          form.setError("root", {
            message: "Operation failed. Please try again.",
          }),
      },
    );
  };

  return (
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
        name="leaveCycleStart"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Leave Cycle Start (optional)</FormLabel>
            <FormControl>
              <Input
                type="date"
                value={
                  field.value
                    ? new Date(field.value).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? new Date(e.target.value) : undefined,
                  )
                }
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
        disabled={updateProfile.isPending}
      >
        {updateProfile.isPending ? "Saving..." : "Update"}
      </Button>
    </JobProfileForm>
  );
}

export default function FormSlot() {
  return (
    <Suspense>
      <FormSlotInner />
    </Suspense>
  );
}

function FormSlotInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modal = searchParams.get("modal");
  const editId = searchParams.get("id");

  const { data: profiles } = useJobProfiles();
  const editingProfile = editId
    ? (profiles ?? []).find((p) => p.id === editId)
    : undefined;

  const close = () => router.back();

  return (
    <>
      <Dialog
        open={modal === "create"}
        onOpenChange={(open) => !open && close()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Job Profile</DialogTitle>
            <DialogDescription>
              Create a new job profile for a user.
            </DialogDescription>
          </DialogHeader>
          <CreateForm onClose={close} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={modal === "edit" && !!editingProfile}
        onOpenChange={(open) => !open && close()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Profile</DialogTitle>
            <DialogDescription>
              Update the job profile details.
            </DialogDescription>
          </DialogHeader>
          {editingProfile && (
            <EditForm
              profileId={editingProfile.id}
              defaultValues={{
                title: editingProfile.title ?? "",
                daysOfLeave: editingProfile.daysOfLeave,
                daysOfSickLeave: editingProfile.daysOfSickLeave,
                leaveCycleStart: editingProfile.leaveCycleStart
                  ? new Date(editingProfile.leaveCycleStart)
                  : undefined,
              }}
              onClose={close}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
