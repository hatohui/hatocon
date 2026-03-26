"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Image from "next/image";
import axios from "axios";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCreateEvent } from "@/hooks/events/useEvents";
import {
  CalendarDays,
  MapPin,
  ExternalLink,
  Link as LinkIcon,
  Upload,
  X,
  Clock,
} from "lucide-react";

const schema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().optional(),
    image: z.string().url().optional().or(z.literal("")),
    startAt: z.string().min(1, "Start date is required"),
    endAt: z.string().min(1, "End date is required"),
    location: z.string().optional(),
    locationUrl: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),
    reference: z.string().optional(),
  })
  .refine((d) => new Date(d.endAt) > new Date(d.startAt), {
    message: "End must be after start",
    path: ["endAt"],
  });

type FormValues = z.infer<typeof schema>;

function formatDateRange(start: string, end: string) {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;

  const sameDay = s.toDateString() === e.toDateString();
  const dateOpts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };

  if (sameDay) {
    return `${s.toLocaleDateString(undefined, dateOpts)} · ${s.toLocaleTimeString(undefined, timeOpts)} – ${e.toLocaleTimeString(undefined, timeOpts)}`;
  }
  return `${s.toLocaleDateString(undefined, dateOpts)} – ${e.toLocaleDateString(undefined, dateOpts)}`;
}

export default function CreateEventPage() {
  const router = useRouter();
  const createEvent = useCreateEvent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      image: "",
      startAt: "",
      endAt: "",
      location: "",
      locationUrl: "",
      reference: "",
    },
  });

  const watched = useWatch({ control: form.control });

  const onSubmit = (values: FormValues) => {
    createEvent.mutate(
      {
        title: values.title,
        description: values.description || undefined,
        image: values.image || undefined,
        startAt: new Date(values.startAt),
        endAt: new Date(values.endAt),
        location: values.location || undefined,
        locationUrl: values.locationUrl || undefined,
        reference: values.reference || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Event submitted", {
            description: "It will appear once approved by an admin.",
          });
          router.push("/");
        },
        onError: (err: unknown) => {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ?? "Failed to create event";
          toast.error(msg);
        },
      },
    );
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data } = await axios.post<{
        data: { uploadUrl: string; publicUrl: string };
      }>("/api/upload/event-image", {
        contentType: file.type,
        contentLength: file.size,
      });
      await axios.put(data.data.uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });
      form.setValue("image", data.data.publicUrl, { shouldValidate: true });
      toast.success("Image uploaded");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const dateRange = formatDateRange(watched.startAt ?? "", watched.endAt ?? "");

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Event</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Events require admin approval before appearing on the calendar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Team offsite, Company hackathon…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's this event about?"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image upload */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      {field.value ? (
                        <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                          <Image
                            src={field.value}
                            alt="Event banner"
                            fill
                            className="object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2 h-7 w-7"
                            onClick={() =>
                              form.setValue("image", "", {
                                shouldValidate: true,
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/30 disabled:opacity-50"
                        >
                          <Upload className="h-5 w-5" />
                          {uploading
                            ? "Uploading…"
                            : "Click to upload banner image"}
                          <span className="text-xs">
                            JPEG, PNG, WebP · up to 5 MB
                          </span>
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Conference room, Zoom, Bangkok…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="locationUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Maps URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://maps.google.com/…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference / Source URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/event-details"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEvent.isPending || uploading}
              >
                {createEvent.isPending ? "Submitting…" : "Submit for Review"}
              </Button>
            </div>
          </form>
        </Form>

        {/* Live Preview */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Preview
          </p>
          <Card className="overflow-hidden">
            {watched.image && (
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={watched.image}
                  alt="Event banner preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold leading-tight">
                  {watched.title || (
                    <span className="text-muted-foreground italic">
                      Event title
                    </span>
                  )}
                </h2>
                <Badge variant="secondary">Pending</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {dateRange && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  <span>{dateRange}</span>
                </div>
              )}

              {!dateRange && (watched.startAt || watched.endAt) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span className="italic">Invalid date range</span>
                </div>
              )}

              {watched.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {watched.locationUrl ? (
                    <a
                      href={watched.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-foreground"
                    >
                      {watched.location}
                    </a>
                  ) : (
                    <span>{watched.location}</span>
                  )}
                </div>
              )}

              {watched.description && (
                <>
                  <Separator />
                  <p className="text-sm whitespace-pre-wrap">
                    {watched.description}
                  </p>
                </>
              )}

              {watched.reference && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm">
                    <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a
                      href={watched.reference}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{watched.reference}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
