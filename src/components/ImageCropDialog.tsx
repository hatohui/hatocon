"use client";

import { useCallback, useRef, useState } from "react";
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
import { Loader2 } from "lucide-react";

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
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const previewUrl = file ? URL.createObjectURL(file) : null;

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
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>

        {previewUrl && (
          <div className="flex justify-center max-h-[60vh] overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop={aspect === 1}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={previewUrl}
                alt="Crop preview"
                onLoad={onImageLoad}
                style={{ maxHeight: "55vh" }}
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
