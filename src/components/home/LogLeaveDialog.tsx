"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LeaveType } from "@/types/leave-type";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateParticipation } from "@/hooks/participations/useParticipations";

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: "Annual Leave",
  SICK: "Sick Leave",
  UNPAID: "Unpaid Leave",
};

const schema = z
  .object({
    from: z.string().min(1, "Start date is required"),
    to: z.string().min(1, "End date is required"),
    leaveType: z.nativeEnum(LeaveType, { message: "Select a leave type" }),
    eventId: z
      .string()
      .uuid("Must be a valid event ID")
      .optional()
      .or(z.literal("")),
  })
  .refine((d) => new Date(d.to) > new Date(d.from), {
    message: "End must be after start",
    path: ["to"],
  });

type FormValues = z.infer<typeof schema>;

export default function LogLeaveDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createParticipation = useCreateParticipation();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      from: "",
      to: "",
      leaveType: LeaveType.ANNUAL,
      eventId: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    const daysUsed =
      (new Date(values.to).getTime() - new Date(values.from).getTime()) /
      (1000 * 60 * 60 * 24);

    createParticipation.mutate(
      {
        from: new Date(values.from),
        to: new Date(values.to),
        leaveType: values.leaveType,
        eventId: values.eventId || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Leave logged — ${daysUsed.toFixed(1)} day(s)`, {
            description: LEAVE_TYPE_LABELS[values.leaveType],
          });
          form.reset();
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Failed to log leave";
          toast.error(msg);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Leave</DialogTitle>
          <DialogDescription>
            Record time off. Overlapping leaves will be rejected.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="leaveType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(LeaveType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {LEAVE_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Event ID{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Link to an approved event UUID…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createParticipation.isPending}>
                {createParticipation.isPending ? "Saving…" : "Log Leave"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
