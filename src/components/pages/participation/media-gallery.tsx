"use client";

import { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Camera, Download, Filter, ImageIcon, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useActivities,
  useActivityMedia,
  useDeleteActivityMedia,
  useUploadActivityMedia,
} from "@/hooks/activities/useActivities";
import {
  useParticipationImages,
  useUploadParticipationImage,
  useDeleteParticipationImage,
} from "@/hooks/participations/useParticipations";

export default function MediaGallery({
  participationId,
  isOwner,
  userId,
}: {
  participationId: string;
  isOwner: boolean;
  userId: string;
}) {
  const [filterActivity, setFilterActivity] = useState<string>("all");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<"sm" | "md" | "lg">("md");

  const { data: activities } = useActivities(participationId);
  const { data: activityMedia } = useActivityMedia(participationId, {
    activityId: filterActivity !== "all" ? filterActivity : undefined,
  });
  const { data: participationImages } = useParticipationImages(participationId);

  const uploadActivityMedia = useUploadActivityMedia();
  const deleteActivityMedia = useDeleteActivityMedia();
  const uploadParticipationImage = useUploadParticipationImage();
  const deleteParticipationImage = useDeleteParticipationImage();

  // Merge all media: participation images + activity media
  type MediaItem = {
    id: string;
    url: string;
    caption?: string | null;
    createdAt: Date | string;
    source: "participation" | "activity";
    activityName?: string;
    activityId?: string;
    uploadedBy?: string;
  };

  const allMedia: MediaItem[] = [];

  // Add participation images
  if (filterActivity === "all" && participationImages) {
    participationImages.forEach((img) => {
      allMedia.push({
        id: img.id,
        url: img.url,
        caption: img.caption,
        createdAt: img.createdAt,
        source: "participation",
      });
    });
  }

  // Add activity media
  if (activityMedia) {
    activityMedia.forEach((m) => {
      allMedia.push({
        id: m.id,
        url: m.url,
        caption: m.caption,
        createdAt: m.createdAt,
        source: "activity",
        activityName: m.activity?.name,
        activityId: m.activityId,
        uploadedBy: m.uploadedBy,
      });
    });
  }

  // Sort by date desc
  allMedia.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const handleUploadParticipation = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    try {
      await uploadParticipationImage.mutateAsync({ participationId, file });
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Upload failed");
    }
    e.target.value = "";
  };

  const handleDeleteMedia = (item: MediaItem) => {
    if (item.source === "participation") {
      deleteParticipationImage.mutate(
        { participationId, imageId: item.id },
        {
          onSuccess: () => toast.success("Photo deleted"),
          onError: () => toast.error("Failed to delete"),
        },
      );
    } else if (item.activityId) {
      deleteActivityMedia.mutate(
        {
          participationId,
          activityId: item.activityId,
          mediaId: item.id,
        },
        {
          onSuccess: () => toast.success("Photo deleted"),
          onError: () => toast.error("Failed to delete"),
        },
      );
    }
  };

  const canDelete = (item: MediaItem) => {
    if (isOwner) return true;
    if (item.source === "activity" && item.uploadedBy === userId) return true;
    return false;
  };

  const gridCols = {
    sm: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6",
    md: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
    lg: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={filterActivity} onValueChange={setFilterActivity}>
            <SelectTrigger className="w-32 sm:w-48 h-8 text-xs">
              <SelectValue placeholder="All media" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All media</SelectItem>
              {activities?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid size toggle */}
          <div className="flex border rounded-md">
            {(["sm", "md", "lg"] as const).map((size) => (
              <button
                key={size}
                type="button"
                className={`px-2 py-1 text-xs ${gridSize === size ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                onClick={() => setGridSize(size)}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Upload button */}
          {isOwner && (
            <Button size="sm" variant="outline" asChild>
              <label className="cursor-pointer">
                <Camera className="h-4 w-4 mr-1.5" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadParticipation}
                  disabled={uploadParticipationImage.isPending}
                />
              </label>
            </Button>
          )}
        </div>
      </div>

      {/* Gallery grid */}
      {allMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-5 mb-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold">No media yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload photos to start building your memory gallery.
          </p>
        </div>
      ) : (
        <div className={`grid gap-2 ${gridCols[gridSize]}`}>
          {allMedia.map((item) => (
            <div key={`${item.source}-${item.id}`} className="group relative">
              <button
                type="button"
                className="w-full"
                onClick={() => setLightbox(item.url)}
              >
                <Image
                  src={item.url}
                  alt={item.caption || "Photo"}
                  width={400}
                  height={400}
                  className="aspect-square rounded-lg object-cover w-full"
                />
              </button>

              {/* Overlay info */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg pointer-events-none" />

              {/* Actions */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={item.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-6 w-6 rounded bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                >
                  <Download className="h-3 w-3" />
                </a>
                {canDelete(item) && (
                  <button
                    type="button"
                    className="h-6 w-6 rounded bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500"
                    onClick={() => handleDeleteMedia(item)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Activity badge */}
              {item.activityName && (
                <div className="absolute bottom-1 left-1 right-1">
                  <span className="text-[10px] bg-black/60 text-white rounded px-1.5 py-0.5 truncate block">
                    {item.activityName}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-0">
          <button
            type="button"
            className="absolute top-2 right-2 z-50 text-white/80 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="h-6 w-6" />
          </button>
          {lightbox && (
            <Image
              src={lightbox}
              alt="Full size"
              width={1200}
              height={800}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
