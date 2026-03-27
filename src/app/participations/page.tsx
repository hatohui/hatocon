"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  format,
  differenceInCalendarDays,
  startOfYear,
  endOfYear,
} from "date-fns";
import {
  Calendar,
  Camera,
  ImageIcon,
  Plane,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useMyParticipations,
  useDeleteParticipation,
  useParticipationImages,
  useDeleteParticipationImage,
  useUploadParticipationImage,
} from "@/hooks/participations/useParticipations";
import type { ParticipationWithEvent } from "@/types/participation.d";
import { toast } from "sonner";

const LEAVE_COLOURS: Record<string, string> = {
  ANNUAL: "bg-blue-100 text-blue-800",
  SICK: "bg-amber-100 text-amber-800",
  UNPAID: "bg-gray-100 text-gray-800",
};

// ─── Image Gallery Dialog ────────────────────────────────────────────────────

function ImageGallery({
  participationId,
  open,
  onOpenChange,
}: {
  participationId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: images, isLoading } = useParticipationImages(participationId);
  const uploadMutation = useUploadParticipationImage();
  const deleteMutation = useDeleteParticipationImage();
  const [preview, setPreview] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    try {
      await uploadMutation.mutateAsync({ participationId, file });
      toast.success("Image uploaded!");
    } catch {
      toast.error("Upload failed");
    }
    e.target.value = "";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trip Photos</DialogTitle>
          </DialogHeader>

          <div className="flex justify-end">
            <Button size="sm" variant="outline" asChild>
              <label className="cursor-pointer">
                <Camera className="h-4 w-4 mr-1.5" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploadMutation.isPending}
                />
              </label>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : !images?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No photos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {images.map((img) => (
                <div key={img.id} className="group relative">
                  <button
                    type="button"
                    className="w-full"
                    onClick={() => setPreview(img.url)}
                  >
                    <Image
                      src={img.url}
                      alt={img.caption || "Trip photo"}
                      width={300}
                      height={300}
                      className="aspect-square rounded-lg object-cover"
                    />
                  </button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() =>
                      deleteMutation.mutate({
                        participationId,
                        imageId: img.id,
                      })
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  {img.caption && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {img.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-0">
          <button
            type="button"
            className="absolute top-2 right-2 z-50 text-white/80 hover:text-white"
            onClick={() => setPreview(null)}
          >
            <X className="h-6 w-6" />
          </button>
          {preview && (
            <Image
              src={preview}
              alt="Full size"
              width={1200}
              height={800}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Participation Card ──────────────────────────────────────────────────────

function ParticipationCard({
  p,
  onDelete,
  isDeleting,
}: {
  p: ParticipationWithEvent;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const days = differenceInCalendarDays(new Date(p.to), new Date(p.from)) + 1;
  const [galleryOpen, setGalleryOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Event title or stand-alone leave */}
            {p.event ? (
              <Link
                href={`/events?selected=${p.event.id}`}
                className="font-medium hover:underline line-clamp-1"
              >
                {p.event.title}
              </Link>
            ) : (
              <p className="font-medium text-muted-foreground">
                Stand-alone leave
              </p>
            )}

            {/* Dates + duration */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(p.from), "MMM d")} –{" "}
                {format(new Date(p.to), "MMM d, yyyy")}
              </span>
              <span>
                {days} {days === 1 ? "day" : "days"}
              </span>
            </div>

            {/* Leave type badge */}
            <Badge
              variant="secondary"
              className={LEAVE_COLOURS[p.leaveType] ?? ""}
            >
              {p.leaveType.charAt(0) + p.leaveType.slice(1).toLowerCase()}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setGalleryOpen(true)}
            >
              <Camera className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Your leave record and any
                    associated photos will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>

      <ImageGallery
        participationId={p.id}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
      />
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MyParticipationsPage() {
  const from = startOfYear(new Date());
  const to = endOfYear(new Date());
  const { data, isLoading } = useMyParticipations(from, to);
  const deleteMutation = useDeleteParticipation();

  const sorted = data
    ?.slice()
    .sort((a, b) => new Date(b.from).getTime() - new Date(a.from).getTime());

  const upcoming = sorted?.filter((p) => new Date(p.to) >= new Date()) ?? [];
  const past = sorted?.filter((p) => new Date(p.to) < new Date()) ?? [];

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Plan deleted"),
      onError: () => toast.error("Failed to delete plan"),
    });
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Plans</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()} leave plans &amp; trip photos
          </p>
        </div>
        <Button asChild>
          <Link href="/leave/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Plan
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : !sorted?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Plane className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-4">No plans yet this year</p>
            <Button asChild variant="outline">
              <Link href="/leave/new">Create your first plan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Upcoming</h2>
              {upcoming.map((p) => (
                <ParticipationCard
                  key={p.id}
                  p={p}
                  onDelete={() => handleDelete(p.id)}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">
                Past
              </h2>
              {past.map((p) => (
                <ParticipationCard
                  key={p.id}
                  p={p}
                  onDelete={() => handleDelete(p.id)}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
