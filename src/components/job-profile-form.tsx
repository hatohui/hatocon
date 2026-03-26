"use client";

import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { jobProfileSchema } from "@/validations/jobProfileSchema";

export type JobProfileFormValues = z.infer<typeof jobProfileSchema>;

export function JobProfileForm({
  form,
  onSubmit,
  children,
}: {
  form: UseFormReturn<JobProfileFormValues>;
  onSubmit: (values: JobProfileFormValues) => void;
  children?: React.ReactNode;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {children}
      </form>
    </Form>
  );
}
