"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import type { Event } from "@prisma/client";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateOwnEvent } from "@/hooks/events/useEvents";
import { Globe, Loader2, Lock, Upload, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type ApiOk<T> = { data: T };

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
    visibility: z.enum(["PUBLIC", "PRIVATE"]),
  })
  .refine((d) => new Date(d.endAt) >= new Date(d.startAt), {
    message: "End must be on or after start",
    path: ["endAt"],
  });

type FormValues = z.infer<typeof schema>;

function toDateStr(d: string | Date): string {
  return new Date(d).toISOString().split("T")[0];
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const updateEvent = useUpdateOwnEvent();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["events", params.id],
    queryFn: () =>
      axios
        .get<ApiOk<Event>>(`/api/events/${params.id}`)
        .then((r) => r.data.data),
  });

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
      visibility: "PUBLIC",
    },
  });

  React.useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description ?? "",
        image: event.image ?? "",
        startAt: toDateStr(event.startAt),
        endAt: toDateStr(event.endAt),
        location: event.location ?? "",
        locationUrl: event.locationUrl ?? "",
        reference: event.reference ?? "",
        visibility: event.visibility ?? "PUBLIC",
      });
    }
  }, [event, form]);

  const watched = useWatch({ control: form.control });

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    try {
      const { data } = await axios.post("/api/upload", {
        filename: file.name,
        contentType: file.type,
      });
      await axios.put(data.data.uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });
      form.setValue("image", data.data.publicUrl, { shouldValidate: true });
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    updateEvent.mutate(
      {
        id: params.id,
        data: {
          title: values.title,
          description: values.description || undefined,
          image: values.image || undefined,
          startAt: new Date(values.startAt),
          endAt: new Date(values.endAt),
          location: values.location || undefined,
          locationUrl: values.locationUrl || undefined,
          reference: values.reference || undefined,
          visibility: values.visibility,
        },
      },
      {
        onSuccess: () => {
          toast.success("Event updated");
          router.push("/events");
        },
        onError: (err) => {
          const msg =
            axios.isAxiosError(err) && err.response?.data?.message
              ? err.response.data.message
              : "Update failed";
          toast.error(msg);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-100 rounded-xl" />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-muted-foreground">Event not found.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Event</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your event details.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Event Details</CardTitle>
              <CardDescription>Basic info about your event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Event title" {...field} />
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
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                              alt="Banner"
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
                            {uploading ? "Uploading…" : "Click to upload"}
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
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>End Date *</FormLabel>
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
                    <FormLabel>Reference URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Visibility</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PUBLIC">
                          <span className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Public
                          </span>
                        </SelectItem>
                        <SelectItem value="PRIVATE">
                          <span className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Private
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                updateEvent.isPending || uploading || !form.formState.isDirty
              }
            >
              {updateEvent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
