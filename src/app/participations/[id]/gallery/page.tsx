"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Grid2x2,
  ImageIcon,
  LayoutGrid,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

import {
  useParticipationById,
  useUploadParticipationImage,
  useDeleteParticipationImage,
} from "@/hooks/participations/useParticipations";

type GridSize = "sm" | "md" | "lg";

const GRID_CONFIGS: Record<GridSize, string> = {
  sm: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  md: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  lg: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
};

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  images,
  initialIndex,
  onClose,
  onDelete,
  isDeleting,
}: {
  images: {
    id: string;
    url: string;
    caption?: string | null;
    createdAt: Date;
  }[];
  initialIndex: number;
  onClose: () => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [index, setIndex] = useState(initialIndex);
  const current = images[index];

  const prev = useCallback(
    () => setIndex((i) => (i > 0 ? i - 1 : images.length - 1)),
    [images.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i < images.length - 1 ? i + 1 : 0)),
    [images.length],
  );

  // Keyboard navigation
  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") onClose();
    },
    [prev, next, onClose],
  );

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onKeyDown={handleKey}
      tabIndex={0}
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <span className="text-white/60 text-sm tabular-nums">
          {index + 1} / {images.length}
        </span>

        <div className="flex items-center gap-2">
          <a
            href={current.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Download"
          >
            <Download className="h-5 w-5" />
          </a>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="text-white/70 hover:text-red-400 transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isDeleting}
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => {
                    onDelete(current.id);
                    // Move to previous if possible
                    if (index > 0) setIndex((i) => i - 1);
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <button
            className="text-white/70 hover:text-white transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-14">
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          onClick={prev}
          aria-label="Previous"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>

        <div className="relative w-full h-full flex items-center justify-center">
          <Image
            key={current.url}
            src={current.url}
            alt={current.caption || `Photo ${index + 1}`}
            width={1600}
            height={1000}
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: "calc(100vh - 130px)" }}
          />
        </div>

        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
          onClick={next}
          aria-label="Next"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </div>

      {/* Bottom: caption + thumbnails */}
      <div className="shrink-0 pb-4 space-y-3">
        {current.caption && (
          <p className="text-center text-white/70 text-sm px-4">
            {current.caption}
          </p>
        )}
        <p className="text-center text-white/40 text-xs">
          {format(new Date(current.createdAt), "MMMM d, yyyy")}
        </p>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 px-4 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setIndex(i)}
                className={cn(
                  "shrink-0 h-12 w-12 rounded overflow-hidden ring-2 transition-all",
                  i === index
                    ? "ring-white"
                    : "ring-transparent opacity-50 hover:opacity-80",
                )}
              >
                <Image
                  src={img.url}
                  alt={`Thumb ${i + 1}`}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ParticipationGalleryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: participation, isLoading } = useParticipationById(params.id);
  const uploadMutation = useUploadParticipationImage();
  const deleteMutation = useDeleteParticipationImage();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [gridSize, setGridSize] = useState<GridSize>("md");

  const images = participation?.group?.images ?? [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    try {
      await uploadMutation.mutateAsync({ participationId: params.id, file });
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Upload failed");
    }
    e.target.value = "";
  };

  const handleDelete = (imageId: string) => {
    deleteMutation.mutate(
      { participationId: params.id, imageId },
      {
        onSuccess: () => {
          toast.success("Photo deleted");
          // Close lightbox if no images remain
          if (images.length <= 1) setLightboxIndex(null);
        },
        onError: () => toast.error("Failed to delete photo"),
      },
    );
  };

  const title = participation?.event?.title ?? "Stand-alone Leave";

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" asChild>
              <Link href={`/participations/${params.id}`}>
                <ArrowLeft className="h-4 w-4" />
                Back to Plan
              </Link>
            </Button>
          </div>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
              {isLoading ? (
                <Skeleton className="h-4 w-48 mt-1" />
              ) : (
                <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Grid size toggles */}
              <div className="flex items-center border rounded-md overflow-hidden">
                <button
                  className={cn(
                    "p-1.5 transition-colors",
                    gridSize === "lg"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                  onClick={() => setGridSize("lg")}
                  aria-label="Large grid"
                >
                  <Grid2x2 className="h-4 w-4" />
                </button>
                <button
                  className={cn(
                    "p-1.5 transition-colors",
                    gridSize === "md"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                  onClick={() => setGridSize("md")}
                  aria-label="Medium grid"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  className={cn(
                    "p-1.5 transition-colors",
                    gridSize === "sm"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                  onClick={() => setGridSize("sm")}
                  aria-label="Small grid"
                >
                  <LayoutGrid className="h-3 w-3" />
                </button>
              </div>

              <Button size="sm" asChild>
                <label className="cursor-pointer gap-1.5">
                  <Camera className="h-4 w-4" />
                  Upload
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
          </div>

          {!isLoading && (
            <p className="text-sm text-muted-foreground">
              {images.length} {images.length === 1 ? "photo" : "photos"}
            </p>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className={cn("grid gap-2", GRID_CONFIGS["md"])}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="font-semibold">No photos yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Upload some trip photos to fill this gallery.
            </p>
            <Button asChild>
              <label className="cursor-pointer gap-1.5">
                <Camera className="h-4 w-4" />
                Upload First Photo
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
        ) : (
          <div className={cn("grid gap-2", GRID_CONFIGS[gridSize])}>
            {images.map((img, i) => (
              <div key={img.id} className="group relative">
                <button
                  type="button"
                  className="w-full block"
                  onClick={() => setLightboxIndex(i)}
                >
                  <Image
                    src={img.url}
                    alt={img.caption || `Photo ${i + 1}`}
                    width={400}
                    height={400}
                    className="aspect-square rounded-lg object-cover w-full transition-opacity group-hover:opacity-90"
                  />
                </button>

                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-lg pointer-events-none group-hover:bg-black/10 transition-colors" />

                {/* Delete button */}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(img.id);
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>

                {img.caption && (
                  <p className="mt-1 text-xs text-muted-foreground truncate px-0.5">
                    {img.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightboxIndex !== null && images.length > 0 && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </>
  );
}
