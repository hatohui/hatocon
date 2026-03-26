"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobProfileSchema } from "@/validations/jobProfileSchema";
import {
  useMyJobProfile,
  useUpdateJobProfile,
} from "@/hooks/job-profiles/useJobProfiles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import type { z } from "zod";
import axios from "axios";

type FormValues = z.infer<typeof jobProfileSchema>;

export default function SettingsLeavePage() {
  const { data: profile, isLoading } = useMyJobProfile();
  const update = useUpdateJobProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(jobProfileSchema),
    defaultValues: { title: "", daysOfLeave: 0, daysOfSickLeave: 0 },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        title: profile.title ?? "",
        daysOfLeave: profile.daysOfLeave,
        daysOfSickLeave: profile.daysOfSickLeave,
      });
    }
  }, [profile, form]);

  const onSubmit = (values: FormValues) => {
    if (!profile) return;
    update.mutate(
      {
        id: profile.id,
        data: {
          title: values.title || undefined,
          daysOfLeave: values.daysOfLeave,
          daysOfSickLeave: values.daysOfSickLeave,
        },
      },
      {
        onSuccess: () => form.reset(values),
        onError: (err) => {
          const msg =
            axios.isAxiosError(err) && err.response?.data?.message
              ? err.response.data.message
              : "Update failed.";
          form.setError("root", { message: msg });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[20vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Allowance</CardTitle>
          <CardDescription>
            You don&apos;t have a job profile yet. An admin will set one up for
            you.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Allowance</CardTitle>
        <CardDescription>
          View and update your leave entitlements.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
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
                  <FormLabel>Paid Leave (days/year)</FormLabel>
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
                  <FormLabel>Sick Leave (days/year)</FormLabel>
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
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            {update.isSuccess && (
              <p className="text-sm text-green-600">Saved.</p>
            )}
            <Button
              type="submit"
              disabled={update.isPending || !form.formState.isDirty}
            >
              {update.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
