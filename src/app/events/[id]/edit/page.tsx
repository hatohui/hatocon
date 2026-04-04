"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import type { Event, User } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteOwnEvent, useUpdateOwnEvent } from "@/hooks/events/useEvents";
import { useSearchUsers } from "@/hooks/users/useUsers";
import {
  AlertTriangle,
  ArrowLeft,
  Globe,
  Loader2,
  Lock,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type ApiOk<T> = { data: T };

type EventEditResponse = Event & {
  invitees: { userId: string }[];
  inviteeUsers: Omit<User, "password">[];
};

type VisibilityDecision = "PUBLIC_TO_PRIVATE" | "PRIVATE_TO_PUBLIC";

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

function InviteePicker({
  selected,
  onChange,
  ownerId,
}: {
  selected: Omit<User, "password">[];
  onChange: (users: Omit<User, "password">[]) => void;
  ownerId: string;
}) {
  const [searchQ, setSearchQ] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQ), 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const { data: results, isLoading } = useSearchUsers(debouncedQ);

  const filtered = React.useMemo(() => {
    if (!results) return [];
    return results.filter(
      (u) => u.id !== ownerId && !selected.some((s) => s.id === u.id),
    );
  }, [results, selected, ownerId]);

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((u) => (
            <Badge key={u.id} variant="secondary" className="gap-1.5 pr-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={u.image ?? undefined} />
                <AvatarFallback className="text-[8px]">
                  {u.name?.[0]}
                </AvatarFallback>
              </Avatar>
              {u.name}
              <button
                type="button"
                className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                onClick={() => onChange(selected.filter((s) => s.id !== u.id))}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search users to invite..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>

      {searchQ && debouncedQ && (
        <div className="border rounded-lg max-h-52 overflow-y-auto divide-y">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No users found
            </p>
          ) : (
            filtered.slice(0, 10).map((u) => (
              <button
                key={u.id}
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                onClick={() => {
                  onChange([...selected, u]);
                  setSearchQ("");
                }}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={u.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {u.name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.email}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function EditEventPage() {
  const params = useParams<{ id: string }>();

  const { data: event, isLoading } = useQuery({
    queryKey: ["events", params.id, "edit"],
    queryFn: () =>
      axios
        .get<ApiOk<EventEditResponse>>(`/api/events/${params.id}`)
        .then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-muted-foreground">Event not found.</p>
      </main>
    );
  }

  return <EditEventForm event={event} />;
}

function EditEventForm({ event }: { event: EventEditResponse }) {
  const router = useRouter();
  const updateEvent = useUpdateOwnEvent();
  const deleteEvent = useDeleteOwnEvent();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = React.useState(false);
  const [selectedInvitees, setSelectedInvitees] = React.useState<
    Omit<User, "password">[]
  >(event.inviteeUsers ?? []);
  const [pendingValues, setPendingValues] = React.useState<FormValues | null>(
    null,
  );
  const [visibilityDecision, setVisibilityDecision] =
    React.useState<VisibilityDecision | null>(null);
  const [visibilityConfirmOpen, setVisibilityConfirmOpen] =
    React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: event.title,
      description: event.description ?? "",
      image: event.image ?? "",
      startAt: toDateStr(event.startAt),
      endAt: toDateStr(event.endAt),
      location: event.location ?? "",
      locationUrl: event.locationUrl ?? "",
      reference: event.reference ?? "",
      visibility: event.visibility,
    },
  });

  const visibility = form.watch("visibility");

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

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
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const runSubmit = (values: FormValues) => {
    const isPrivateToPublic =
      event.visibility === "PRIVATE" && values.visibility === "PUBLIC";

    updateEvent.mutate(
      {
        id: event.id,
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
          inviteeIds:
            values.visibility === "PRIVATE"
              ? selectedInvitees.map((u) => u.id)
              : [],
        },
      },
      {
        onSuccess: () => {
          toast.success(
            isPrivateToPublic
              ? "Event submitted for public approval"
              : "Event updated",
          );
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

  const onSubmit = (values: FormValues) => {
    if (event.visibility !== values.visibility) {
      setPendingValues(values);
      setVisibilityDecision(
        event.visibility === "PUBLIC"
          ? "PUBLIC_TO_PRIVATE"
          : "PRIVATE_TO_PUBLIC",
      );
      setVisibilityConfirmOpen(true);
      return;
    }

    runSubmit(values);
  };

  const confirmVisibilityChange = () => {
    if (!pendingValues) return;
    setVisibilityConfirmOpen(false);
    runSubmit(pendingValues);
    setPendingValues(null);
    setVisibilityDecision(null);
  };

  const handleDelete = () => {
    deleteEvent.mutate(params.id, {
      onSuccess: () => {
        toast.success("Event deleted");
        router.push("/events");
      },
      onError: (err) => {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Delete failed";
        toast.error(msg);
      },
    });
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Edit Event</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update event details, privacy, and invitees.
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
                    <FormLabel>Title</FormLabel>
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
                            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/30 disabled:opacity-50"
                          >
                            <Upload className="h-5 w-5" />
                            {uploading ? "Uploading..." : "Click to upload"}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="startAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
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
                      <FormLabel>End Date</FormLabel>
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
                        placeholder="Conference room, Zoom, Bangkok..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="locationUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Maps URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://maps.google.com/..."
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
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Privacy & Invitees</CardTitle>
              <CardDescription>
                Private events can include specific invitees.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
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

              {visibility === "PRIVATE" ? (
                <div className="space-y-2">
                  <Label>Invite People</Label>
                  <InviteePicker
                    selected={selectedInvitees}
                    onChange={setSelectedInvitees}
                    ownerId={event.createdBy}
                  />
                </div>
              ) : (
                <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Public events are visible to everyone after approval and do
                  not require invitees.
                </div>
              )}

              {event.visibility === "PRIVATE" && visibility === "PUBLIC" && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  This change requires admin approval before it is visible
                  publicly.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleteEvent.isPending || updateEvent.isPending}
            >
              {deleteEvent.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Event
                </>
              )}
            </Button>

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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <AlertDialog
        open={visibilityConfirmOpen}
        onOpenChange={(open) => {
          setVisibilityConfirmOpen(open);
          if (!open) {
            setPendingValues(null);
            setVisibilityDecision(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {visibilityDecision === "PUBLIC_TO_PRIVATE"
                ? "Make this event private?"
                : "Submit this event as public?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {visibilityDecision === "PUBLIC_TO_PRIVATE"
                ? "Only you and invited users will be able to view this event."
                : "Changing to public will send this event for admin approval before it appears for everyone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVisibilityChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Delete this event?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This event will be removed from listings and can no longer be
              accessed from the calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteEvent.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
