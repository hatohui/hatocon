"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import MediaLightboxImage from "./media-lightbox-image";
import MediaLightboxDetail from "./media-lightbox-detail";
import { useMediaNavigation } from "@/hooks/participations/useParticipationGroup";
import type { MediaItem, MediaMember } from "@/types/participation";

function formatBytes(n: number) {
  return n < 1_048_576
    ? `${(n / 1024).toFixed(1)} KB`
    : `${(n / 1_048_576).toFixed(1)} MB`;
}

export default function MediaLightbox({
  items,
  index,
  onIndexChange,
  members,
  canDelete,
  onDelete,
  currentUserId,
}: {
  items: MediaItem[];
  index: number | null;
  onIndexChange: (i: number | null) => void;
  members: MediaMember[];
  canDelete: (item: MediaItem) => boolean;
  onDelete: (item: MediaItem) => void;
  currentUserId?: string;
}) {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>();
  const [fileSize, setFileSize] = useState<string>();
  const item = index !== null ? items[index] : null;
  const { goPrev, goNext, hasPrev, hasNext } = useMediaNavigation({
    index,
    total: items.length,
    onIndexChange,
  });

  // Reset metadata and fetch file size when item changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setDimensions(undefined);
    setFileSize(undefined);
    if (!item) return;
    fetch(item.url, { method: "HEAD" })
      .then((r) => {
        const cl = r.headers.get("content-length");
        if (cl) setFileSize(formatBytes(parseInt(cl, 10)));
      })
      .catch(() => {});
  }, [item?.id]);

  return (
    <Dialog
      open={index !== null}
      onOpenChange={(open) => !open && onIndexChange(null)}
    >
      <DialogContent
        showCloseButton={false}
        className="fixed! inset-0! top-0! left-0! translate-x-0! translate-y-0! max-w-none! w-full! h-full! rounded-none! p-0 ring-0 bg-black/95 flex flex-col md:flex-row overflow-hidden gap-0"
      >
        <VisuallyHidden>
          <DialogTitle>Image viewer</DialogTitle>
        </VisuallyHidden>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-50 text-white/80 hover:text-white hover:bg-white/10"
          onClick={() => onIndexChange(null)}
        >
          <X className="h-5 w-5" />
        </Button>
        {item && (
          <MediaLightboxImage
            item={item}
            index={index!}
            total={items.length}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={goPrev}
            onNext={goNext}
            onLoad={(w, h) => setDimensions({ width: w, height: h })}
          />
        )}
        {item && (
          <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-white/10 bg-black/60 overflow-y-auto shrink-0 max-h-52 md:max-h-none">
            <MediaLightboxDetail
              item={item}
              members={members}
              dimensions={dimensions}
              fileSize={fileSize}
              canDelete={canDelete(item)}
              onDelete={() => onDelete(item)}
              currentUserId={currentUserId}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
