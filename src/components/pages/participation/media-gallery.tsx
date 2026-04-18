"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";

import {
  useActivities,
  useActivityMedia,
  useDeleteActivityMedia,
} from "@/hooks/activities/useActivities";
import {
  useParticipationImages,
  useUploadParticipationImage,
  useDeleteParticipationImage,
} from "@/hooks/participations/useParticipations";
import MediaToolbar from "./media-toolbar";
import MediaGrid from "./media-grid";
import MediaLightbox from "./media-lightbox";
import type { MediaItem, MediaMember } from "@/types/participation";

export default function MediaGallery({
  participationId,
  isOwner,
  isMember,
  isAdmin,
  userId,
  members = [],
}: {
  participationId: string;
  isOwner: boolean;
  isMember?: boolean;
  isAdmin?: boolean;
  userId: string;
  members?: MediaMember[];
}) {
  const [filterActivity, setFilterActivity] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [gridSize, setGridSize] = useState<"sm" | "md" | "lg">("md");

  const { data: activities } = useActivities(participationId);
  const { data: activityMedia } = useActivityMedia(participationId, {
    activityId: filterActivity !== "all" ? filterActivity : undefined,
  });
  const { data: participationImages } = useParticipationImages(participationId);
  const deleteActivityMedia = useDeleteActivityMedia();
  const uploadParticipationImage = useUploadParticipationImage();
  const deleteParticipationImage = useDeleteParticipationImage();

  const allMedia: MediaItem[] = [];
  if (filterActivity === "all") {
    participationImages?.forEach((img) =>
      allMedia.push({
        id: img.id,
        url: img.url,
        caption: img.caption,
        createdAt: img.createdAt,
        source: "participation",
        uploadedBy: img.uploadedBy ?? undefined,
      }),
    );
  }
  activityMedia?.forEach((m) =>
    allMedia.push({
      id: m.id,
      url: m.url,
      caption: m.caption,
      createdAt: m.createdAt,
      source: "activity",
      activityName: m.activity?.name,
      activityId: m.activityId,
      uploadedBy: m.uploadedBy,
    }),
  );
  allMedia.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const canDelete = (item: MediaItem) =>
    !!(isOwner || isAdmin || item.uploadedBy === userId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleDelete = (item: MediaItem) => {
    const opts = {
      onSuccess: () => toast.success("Photo deleted"),
      onError: () => toast.error("Failed to delete"),
    };
    if (item.source === "participation") {
      deleteParticipationImage.mutate(
        { participationId, imageId: item.id },
        opts,
      );
    } else if (item.activityId) {
      deleteActivityMedia.mutate(
        { participationId, activityId: item.activityId, mediaId: item.id },
        opts,
      );
    }
  };

  return (
    <div className="space-y-4">
      <MediaToolbar
        filterActivity={filterActivity}
        onFilterChange={setFilterActivity}
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        showUpload={isOwner || !!isMember}
        onUpload={handleUpload}
        isUploading={uploadParticipationImage.isPending}
        activities={activities}
      />
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
        <MediaGrid
          items={allMedia}
          gridSize={gridSize}
          onSelect={setLightboxIndex}
          onDelete={handleDelete}
          canDelete={canDelete}
        />
      )}
      <MediaLightbox
        items={allMedia}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        members={members}
        canDelete={canDelete}
        onDelete={handleDelete}
        currentUserId={userId}
      />
    </div>
  );
}
