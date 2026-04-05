"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, ZoomIn, ZoomOut } from "lucide-react";

type ImageCropDialogProps = {
  /** The file the user just selected */
  file: File | null;
  /** Aspect ratio — 1 for avatar (square), 16/9 for banners */
  aspect: number;
  /** Max output resolution in px (width). Height derived from aspect. */
  maxWidth?: number;
  /** WebP quality 0-1 */
  quality?: number;
  /** Called with the cropped blob, or null on cancel */
  onComplete: (result: File | null) => void;
};

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  maxWidth: number,
  aspect: number,
  quality: number,
): Promise<Blob | null> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", reject);
    img.src = imageSrc;
  });

  const outW = Math.min(pixelCrop.width, maxWidth);
  const outH = Math.round(outW / aspect);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH,
  );

  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

export default function ImageCropDialog({
  file,
  aspect,
  maxWidth = 512,
  quality = 0.85,
  onComplete,
}: ImageCropDialogProps) {
  const aspectLabel =
    aspect === 1
      ? "1:1"
      : aspect === 16 / 9
        ? "16:9"
        : `${aspect.toFixed(2)}:1`;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Delay mounting the Cropper until after the dialog zoom-in-95 animation (100ms)
  // so react-easy-crop computes the correct initial container dimensions.
  const [cropperReady, setCropperReady] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setCropperReady(false);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    const timer = setTimeout(() => setCropperReady(true), 150);
    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!previewUrl || !croppedAreaPixels) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(
        previewUrl,
        croppedAreaPixels,
        maxWidth,
        aspect,
        quality,
      );
      if (!blob) {
        onComplete(null);
        return;
      }
      const name = (file?.name ?? "image").replace(/\.[^.]+$/, ".webp");
      onComplete(new File([blob], name, { type: "image/webp" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={!!file}
      onOpenChange={(open) => {
        if (!open) onComplete(null);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Crop Image</DialogTitle>
            <Badge variant="secondary" className="gap-1 text-xs font-mono">
              <Lock className="h-3 w-3" />
              {aspectLabel}
            </Badge>
          </div>
        </DialogHeader>

        {/* Fixed-height crop canvas - react-easy-crop needs position:relative parent */}
        <div className="relative h-64 w-full rounded-md overflow-hidden bg-muted">
          {previewUrl && cropperReady ? (
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={aspect === 1 ? "round" : "rect"}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              zoomWithScroll
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(1)))}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
          </button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
            aria-label="Zoom level"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(1)))}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onComplete(null)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !croppedAreaPixels}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
