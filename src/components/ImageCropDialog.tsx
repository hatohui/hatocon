"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock } from "lucide-react";

type ImageCropDialogProps = {
  /** The file the user just selected */
  file: File | null;
  /** Aspect ratio — 1 for avatar (square), 16/9 for banners */
  aspect: number;
  /** Max output resolution in px (width). Height derived from aspect. */
  maxWidth?: number;
  /** WebP quality 0–1 */
  quality?: number;
  /** Called with the cropped blob, or null on cancel */
  onComplete: (result: File | null) => void;
};

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

function getCroppedCanvas(
  image: HTMLImageElement,
  crop: PixelCrop,
  maxWidth: number,
  aspect: number,
): HTMLCanvasElement {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const sourceX = crop.x * scaleX;
  const sourceY = crop.y * scaleY;
  const sourceW = crop.width * scaleX;
  const sourceH = crop.height * scaleY;

  const outW = Math.min(sourceW, maxWidth);
  const outH = Math.round(outW / aspect);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, outW, outH);
  return canvas;
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
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    const url = URL.createObjectURL(file);
    return url;
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const c = centerAspectCrop(width, height, aspect);
      setCrop(c);
    },
    [aspect],
  );

  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) return;
    setSaving(true);
    try {
      const canvas = getCroppedCanvas(
        imgRef.current,
        completedCrop,
        maxWidth,
        aspect,
      );
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, "image/webp", quality),
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

        {previewUrl && (
          <div className="flex justify-center overflow-hidden">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop={aspect === 1}
              style={{ maxHeight: "60vh", maxWidth: "100%" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={previewUrl}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{
                  maxHeight: "60vh",
                  maxWidth: "100%",
                  display: "block",
                }}
              />
            </ReactCrop>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onComplete(null)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !completedCrop}>
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
