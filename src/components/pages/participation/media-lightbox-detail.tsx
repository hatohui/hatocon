"use client";

import { format } from "date-fns";
import {
  Activity,
  Calendar,
  Download,
  ImageIcon,
  Trash2,
  User2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { MediaItem, MediaMember } from "@/types/participation";

export default function MediaLightboxDetail({
  item,
  members,
  dimensions,
  fileSize,
  canDelete,
  onDelete,
  currentUserId,
}: {
  item: MediaItem;
  members: MediaMember[];
  dimensions?: { width: number; height: number };
  fileSize?: string;
  canDelete: boolean;
  onDelete: () => void;
  currentUserId?: string;
}) {
  const uploader = members.find((m) => m.id === item.uploadedBy);
  const uploaderName = uploader?.name ?? (item.uploadedBy === currentUserId ? "You" : undefined);

  return (
    <div className="flex flex-col p-5 gap-3 text-sm text-white/90">
      {item.caption && (
        <p className="font-medium leading-snug">{item.caption}</p>
      )}
      {uploaderName && (
        <div className="flex items-center gap-2 text-white/60">
          <User2 className="h-3.5 w-3.5 shrink-0" />
          <span>{uploaderName}</span>
        </div>
      )}
      <div className="flex items-center gap-2 text-white/60">
        <Calendar className="h-3.5 w-3.5 shrink-0" />
        <span>{format(new Date(item.createdAt), "MMM d, yyyy · HH:mm")}</span>
      </div>
      {item.activityName && (
        <div className="flex items-center gap-2 text-white/60">
          <Activity className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{item.activityName}</span>
        </div>
      )}
      {(dimensions || fileSize) && (
        <div className="flex items-center gap-2 text-white/60">
          <ImageIcon className="h-3.5 w-3.5 shrink-0" />
          {dimensions && (
            <span>
              {dimensions.width} × {dimensions.height}
            </span>
          )}
          {fileSize && <span>· {fileSize}</span>}
        </div>
      )}
      <Separator className="my-1 bg-white/10" />
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
          asChild
        >
          <a href={item.url} download target="_blank" rel="noopener noreferrer">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download
          </a>
        </Button>
        {canDelete && (
          <Button
            size="sm"
            variant="destructive"
            className="w-full"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
