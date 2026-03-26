"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useAdminEvents,
  useApproveEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "@/hooks/events/useEvents";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, Pencil, Trash2, Search, Upload, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import axios from "axios";
import type { EventWithCreator } from "@/types/event.d";

type TabValue = "pending" | "approved" | "all";

const editSchema = z
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
    isYearly: z.boolean(),
  })
  .refine((d) => new Date(d.endAt) > new Date(d.startAt), {
    message: "End must be after start",
    path: ["endAt"],
  });

type EditValues = z.infer<typeof editSchema>;

function toLocalDatetimeValue(date: Date | string) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<TabValue>("pending");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [editEvent, setEditEvent] = useState<EventWithCreator | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (status === "authenticated" && !session?.user.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  const approvedFilter =
    tab === "pending" ? "false" : tab === "approved" ? "true" : undefined;

  const { data, isLoading } = useAdminEvents({
    q: debouncedQ || undefined,
    approved: approvedFilter,
  });

  const approve = useApproveEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const openEdit = (event: EventWithCreator) => {
    setEditEvent(event);
    editForm.reset({
      title: event.title,
      description: event.description ?? "",
      image: event.image ?? "",
      startAt: toLocalDatetimeValue(event.startAt),
      endAt: toLocalDatetimeValue(event.endAt),
      location: event.location ?? "",
      locationUrl: event.locationUrl ?? "",
      reference: event.reference ?? "",
      isYearly: event.isYearly ?? false,
    });
  };

  const handleEditImageUpload = async (file: File) => {
    setUploadingImage(true);
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
      editForm.setValue("image", data.data.publicUrl, { shouldValidate: true });
      toast.success("Image uploaded");
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const onSaveEdit = (values: EditValues) => {
    if (!editEvent) return;
    updateEvent.mutate(
      {
        id: editEvent.id,
        data: {
          title: values.title,
          description: values.description || undefined,
          image: values.image || undefined,
          startAt: new Date(values.startAt),
          endAt: new Date(values.endAt),
          location: values.location || undefined,
          locationUrl: values.locationUrl || undefined,
          reference: values.reference || undefined,
          isYearly: values.isYearly,
        },
      },
      {
        onSuccess: () => {
          toast.success("Event updated");
          setEditEvent(null);
        },
        onError: () => toast.error("Failed to update event"),
      },
    );
  };

  const onApprove = (
    id: string,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event?.stopPropagation();
    approve.mutate(id, {
      onSuccess: () => toast.success("Event approved"),
      onError: () => toast.error("Failed to approve event"),
    });
  };

  const onConfirmDelete = () => {
    if (!deleteId) return;
    deleteEvent.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Event deleted");
        setDeleteId(null);
      },
      onError: () => toast.error("Failed to delete event"),
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!session?.user.isAdmin) return null;

  const events = (data ?? []) as EventWithCreator[];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
      </div>

      {/* Filter row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id} onClick={() => setEditEvent(event)}>
                  <TableCell className="font-medium max-w-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="truncate">{event.title}</p>
                        {event.isYearly && (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1 shrink-0"
                          >
                            Yearly
                          </Badge>
                        )}
                      </div>
                      {event.location && (
                        <p className="text-xs text-muted-foreground truncate">
                          {event.location}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    <div>
                      <p>{format(new Date(event.startAt), "MMM d, yyyy")}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.startAt), "h:mm a")} –{" "}
                        {format(new Date(event.endAt), "h:mm a")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={event.createdByUser.image ?? undefined}
                          alt={event.createdByUser.name}
                        />
                        <AvatarFallback className="text-xs">
                          {event.createdByUser.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {event.createdByUser.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.isApproved ? "default" : "secondary"}>
                      {event.isApproved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!event.isApproved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => onApprove(event.id, e)}
                          disabled={approve.isPending}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(event);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(event.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Sheet */}
      <Sheet open={!!editEvent} onOpenChange={(o) => !o && setEditEvent(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
          {/* Poster info header */}
          {editEvent && (
            <div className="flex items-center gap-3 border-b px-6 py-4">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={editEvent.createdByUser.image ?? undefined}
                  alt={editEvent.createdByUser.name}
                />
                <AvatarFallback className="text-xs">
                  {editEvent.createdByUser.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <SheetTitle className="text-base leading-none">
                  Edit Event
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Posted by {editEvent.createdByUser.name}
                </p>
              </div>
            </div>
          )}
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onSaveEdit)}
              className="space-y-4 p-6 pt-0"
            >
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
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
                                editForm.setValue("image", "", {
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
                            disabled={uploadingImage}
                            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed p-6 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:bg-muted/30 disabled:opacity-50"
                          >
                            <Upload className="h-4 w-4" />
                            {uploadingImage
                              ? "Uploading…"
                              : "Click to upload banner"}
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
                            if (file) handleEditImageUpload(file);
                            e.target.value = "";
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
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

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={editForm.control}
                  name="startAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="endAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="locationUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Maps URL</FormLabel>
                    <FormControl>
                      <Input type="url" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="isYearly"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Yearly Event</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        This event repeats every year
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditEvent(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateEvent.isPending}>
                  {updateEvent.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The event will be removed from the
              calendar and all related data will be hidden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onConfirmDelete}
              disabled={deleteEvent.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
