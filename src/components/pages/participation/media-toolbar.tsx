"use client";

import { Camera, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Activity = { id: string; name: string };

export default function MediaToolbar({
  filterActivity,
  onFilterChange,
  gridSize,
  onGridSizeChange,
  showUpload,
  onUpload,
  isUploading,
  activities,
}: {
  filterActivity: string;
  onFilterChange: (v: string) => void;
  gridSize: "sm" | "md" | "lg";
  onGridSizeChange: (v: "sm" | "md" | "lg") => void;
  showUpload: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  activities?: Activity[];
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={filterActivity} onValueChange={onFilterChange}>
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
        <div className="flex border rounded-md">
          {(["sm", "md", "lg"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`px-2 py-1 text-xs ${gridSize === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              onClick={() => onGridSizeChange(s)}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
        {showUpload && (
          <Button size="sm" variant="outline" asChild>
            <label className="cursor-pointer">
              <Camera className="h-4 w-4 mr-1.5" />
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUpload}
                disabled={isUploading}
              />
            </label>
          </Button>
        )}
      </div>
    </div>
  );
}
