"use client";

import Image from "next/image";
import { Download, Trash2 } from "lucide-react";
import type { MediaItem } from "@/types/participation";

const COLS = {
  sm: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6",
  md: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  lg: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
};

export default function MediaGrid({
  items,
  gridSize,
  onSelect,
  onDelete,
  canDelete,
}: {
  items: MediaItem[];
  gridSize: "sm" | "md" | "lg";
  onSelect: (index: number) => void;
  onDelete: (item: MediaItem) => void;
  canDelete: (item: MediaItem) => boolean;
}) {
  return (
    <div className={`grid gap-2 ${COLS[gridSize]}`}>
      {items.map((item, i) => (
        <div key={`${item.source}-${item.id}`} className="group relative">
          <button type="button" className="w-full" onClick={() => onSelect(i)}>
            <Image
              src={item.url}
              alt={item.caption || "Photo"}
              width={400}
              height={400}
              className="aspect-square rounded-lg object-cover w-full"
            />
          </button>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg pointer-events-none" />
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
                onClick={() => onDelete(item)}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
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
  );
}
