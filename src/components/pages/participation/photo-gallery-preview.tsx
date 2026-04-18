"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, ImageIcon, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  useDeleteParticipationImage,
  useUploadParticipationImage,
} from "@/hooks/participations/useParticipations";

type GalleryImage = {
  id: string;
  url: string;
  caption?: string | null;
  uploadedBy?: string | null;
};

type Props = {
  images: GalleryImage[];
  participationId: string;
  onViewAll: () => void;
  isOwner?: boolean;
  isAdmin?: boolean;
  userId?: string;
};

export default function PhotoGalleryPreview({
  images,
  participationId,
  onViewAll,
  isOwner,
  isAdmin,
  userId,
}: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const uploadMutation = useUploadParticipationImage();
  const deleteMutation = useDeleteParticipationImage();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    try {
      await uploadMutation.mutateAsync({ participationId, file });
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Upload failed");
    }
    e.target.value = "";
  };

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ImageIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mb-4">No photos yet</p>
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <label className="cursor-pointer">
                <Camera className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Upload First Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploadMutation.isPending}
                />
              </label>
            </Button>
            <Button size="sm" variant="ghost" onClick={onViewAll}>
              <span className="hidden sm:inline">Open Gallery</span>
              <span className="sm:hidden">Gallery</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Photos ({images.length})</h3>
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs text-primary hover:underline"
            >
              View all →
            </button>
          </div>
          <Button size="sm" variant="outline" asChild>
            <label className="cursor-pointer gap-0 sm:gap-1.5">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
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
        <div className="relative px-8">
          <Carousel className="w-full" opts={{ align: "start", loop: false }}>
            <CarouselContent className="-ml-2">
              {images.map((img) => (
                <CarouselItem
                  key={img.id}
                  className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4"
                >
                  <div className="group relative">
                    <button
                      type="button"
                      className="w-full"
                      onClick={() => setLightbox(img.url)}
                    >
                      <Image
                        src={img.url}
                        alt={img.caption || "Trip photo"}
                        width={300}
                        height={300}
                        className="aspect-square rounded-lg object-cover"
                      />
                    </button>
                    {(isOwner || isAdmin || img.uploadedBy === userId) && (
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
                    )}
                    {img.caption && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {img.caption}
                      </p>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 3 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
              </>
            )}
          </Carousel>
        </div>
      </div>

      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-0">
          <VisuallyHidden>
            <DialogTitle>Image preview</DialogTitle>
          </VisuallyHidden>
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
    </>
  );
}
