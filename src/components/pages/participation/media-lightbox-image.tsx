"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaItem } from "@/types/participation";

export default function MediaLightboxImage({
  item,
  index,
  total,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onLoad,
}: {
  item: MediaItem;
  index: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onLoad: (w: number, h: number) => void;
}) {
  return (
    <div className="relative flex-1 flex items-center justify-center min-h-0 min-w-0">
      <Image
        src={item.url}
        alt={item.caption || "Photo"}
        fill
        className="object-contain"
        onLoad={(e) => {
          const img = e.target as HTMLImageElement;
          onLoad(img.naturalWidth, img.naturalHeight);
        }}
      />
      {hasPrev && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white hover:bg-white/10 h-12 w-12"
          onClick={onPrev}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}
      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white/70 hover:text-white hover:bg-white/10 h-12 w-12"
          onClick={onNext}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/50 text-xs bg-black/40 rounded-full px-3 py-1 pointer-events-none">
        {index + 1} / {total}
      </div>
    </div>
  );
}
