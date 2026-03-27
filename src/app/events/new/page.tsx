"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import type { User } from "@prisma/client";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateEvent } from "@/hooks/events/useEvents";
import { useSearchUsers } from "@/hooks/users/useUsers";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Globe,
  Link as LinkIcon,
  Lock,
  MapPin,
  Search,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import ImageCropDialog from "@/components/ImageCropDialog";

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

function formatDateRange(start: string, end: string) {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;

  const dateOpts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  if (s.toDateString() === e.toDateString()) {
    return s.toLocaleDateString(undefined, dateOpts);
  }
  return `${s.toLocaleDateString(undefined, dateOpts)} – ${e.toLocaleDateString(undefined, dateOpts)}`;
}

// ─── Invitee Picker ───────────────────────────────────────────────────────────

function InviteePicker({
  selected,
  onChange,
}: {
  selected: Omit<User, "password">[];
  onChange: (users: Omit<User, "password">[]) => void;
}) {
  const { data: session } = useSession();
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
      (u) => u.id !== session?.user?.id && !selected.some((s) => s.id === u.id),
    );
  }, [results, session, selected]);

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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search people to invite…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>
      {searchQ && debouncedQ && (
        <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateEventPage() {
  const router = useRouter();
  const createEvent = useCreateEvent();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [cropFile, setCropFile] = React.useState<File | null>(null);
  const [invitees, setInvitees] = React.useState<Omit<User, "password">[]>([]);

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

  const watched = useWatch({ control: form.control });
  const isPrivate = watched.visibility === "PRIVATE";

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
        visibility: values.visibility as "PUBLIC" | "PRIVATE",
        inviteeIds:
          values.visibility === "PRIVATE"
            ? invitees.map((u) => u.id)
            : undefined,
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

  const handleCropComplete = (cropped: File | null) => {
    setCropFile(null);
    if (cropped) handleImageUpload(cropped);
  };

  const dateRange = formatDateRange(watched.startAt ?? "", watched.endAt ?? "");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create Event</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Events require admin approval before appearing on the calendar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Form */}
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
                              if (file) setCropFile(file);
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
              </CardContent>
            </Card>

            {/* Visibility */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Visibility</CardTitle>
                <CardDescription>
                  Control who can see this event.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PUBLIC">
                            <span className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Public — visible to everyone
                            </span>
                          </SelectItem>
                          <SelectItem value="PRIVATE">
                            <span className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              Private — only invitees and admins
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isPrivate && (
                  <>
                    <Separator />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Invite People</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Only you, admins, and invited people can see this event.
                      </p>
                    </div>
                    <InviteePicker selected={invitees} onChange={setInvitees} />
                  </>
                )}
              </CardContent>
            </Card>

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
                <div className="flex items-center gap-2">
                  {isPrivate && (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Private
                    </Badge>
                  )}
                  <Badge variant="secondary">Pending</Badge>
                </div>
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

      <ImageCropDialog
        file={cropFile}
        aspect={16 / 9}
        maxWidth={1200}
        quality={0.85}
        onComplete={handleCropComplete}
      />
    </main>
  );
}
