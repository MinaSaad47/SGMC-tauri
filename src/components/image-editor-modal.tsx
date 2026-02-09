import { Button } from "@/components/ui/button";
import
{
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Check, RotateCw, Scan } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageEditorModalProps
{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageData: string; // Base64
  onSave: (processedData: string) => void;
}

export function ImageEditorModal({
  isOpen,
  onOpenChange,
  imageData,
  onSave,
}: ImageEditorModalProps)
{
  const { t } = useTranslation();

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [isBW, setIsBW] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(new Image());

  const imageSrc = useMemo(() => `data:image/jpeg;base64,${imageData}`, [imageData]);

  useEffect(() =>
  {
    const img = imageRef.current;
    img.src = imageSrc;
    img.onload = () =>
    {
      updateCanvas();
      setCrop(centerCrop(
        makeAspectCrop({ unit: '%', width: 90 }, 1, img.width, img.height),
        img.width,
        img.height
      ));
    };
  }, [imageSrc]);

  useEffect(() =>
  {
    updateCanvas();
  }, [rotation]);

  const updateCanvas = () =>
  {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rotRad = (rotation * Math.PI) / 180;
    const width = Math.abs(Math.cos(rotRad) * image.naturalWidth) + Math.abs(Math.sin(rotRad) * image.naturalHeight);
    const height = Math.abs(Math.sin(rotRad) * image.naturalWidth) + Math.abs(Math.cos(rotRad) * image.naturalHeight);

    canvas.width = width;
    canvas.height = height;

    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotRad);
    ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  };

  const applyAdaptiveThreshold = (ctx: CanvasRenderingContext2D, width: number, height: number) =>
  {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const grayData = new Uint8ClampedArray(width * height);

    for (let i = 0; i < data.length; i += 4)
    {
      grayData[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }

    const integral = new Int32Array(width * height);
    for (let y = 0; y < height; y++)
    {
      let rowSum = 0;
      for (let x = 0; x < width; x++)
      {
        rowSum += grayData[y * width + x];
        integral[y * width + x] = (y > 0 ? integral[(y - 1) * width + x] : 0) + rowSum;
      }
    }

    const blockSize = Math.floor(Math.min(width, height) / 16) | 1;
    const halfBlock = Math.floor(blockSize / 2);
    const C = 10;

    for (let y = 0; y < height; y++)
    {
      for (let x = 0; x < width; x++)
      {
        const x1 = Math.max(0, x - halfBlock);
        const y1 = Math.max(0, y - halfBlock);
        const x2 = Math.min(width - 1, x + halfBlock);
        const y2 = Math.min(height - 1, y + halfBlock);
        const area = (x2 - x1 + 1) * (y2 - y1 + 1);

        let sum = integral[y2 * width + x2];
        if (y1 > 0) sum -= integral[(y1 - 1) * width + x2];
        if (x1 > 0) sum -= integral[y2 * width + (x1 - 1)];
        if (y1 > 0 && x1 > 0) sum += integral[(y1 - 1) * width + (x1 - 1)];

        const threshold = (sum / area) - C;
        const val = grayData[y * width + x] > threshold ? 255 : 0;

        const idx = (y * width + x) * 4;
        data[idx] = data[idx + 1] = data[idx + 2] = val;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const handleSave = async () =>
  {
    if (!canvasRef.current || !completedCrop) return;

    const sourceCanvas = canvasRef.current;

    // IMPORTANT: Mapping displayed coords to internal pixel coords
    // completedCrop values are relative to the CSS size of the canvasRef.current element.
    const displayedWidth = sourceCanvas.clientWidth;
    const displayedHeight = sourceCanvas.clientHeight;

    const scaleX = sourceCanvas.width / displayedWidth;
    const scaleY = sourceCanvas.height / displayedHeight;

    const pixelWidth = completedCrop.width * scaleX;
    const pixelHeight = completedCrop.height * scaleY;
    const pixelX = completedCrop.x * scaleX;
    const pixelY = completedCrop.y * scaleY;

    const destCanvas = document.createElement('canvas');
    destCanvas.width = pixelWidth;
    destCanvas.height = pixelHeight;

    const destCtx = destCanvas.getContext('2d');
    if (!destCtx) return;

    destCtx.drawImage(
      sourceCanvas,
      pixelX,
      pixelY,
      pixelWidth,
      pixelHeight,
      0,
      0,
      pixelWidth,
      pixelHeight
    );

    if (isBW)
    {
      applyAdaptiveThreshold(destCtx, destCanvas.width, destCanvas.height);
    }

    const base64 = destCanvas.toDataURL("image/jpeg", 0.9).split(",")[1];
    onSave(base64);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[95vw] max-w-[95vw] w-full h-[95vh] p-0 flex flex-col overflow-hidden gap-0 border-none shadow-2xl">
        <div className="flex items-center justify-between p-4 bg-background border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Scan className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{t("scanner.edit_image")}</DialogTitle>
              <p className="text-xs text-muted-foreground">{t("scanner.edit_hint")}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
          <div className="w-full md:w-80 bg-zinc-50 dark:bg-zinc-950 border-e overflow-y-auto p-6 space-y-8 shrink-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold text-muted-foreground">
                <span className="flex items-center gap-2"><RotateCw className="h-4 w-4" /> {t("scanner.rotate")}</span>
                <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">{rotation}°</span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <Separator />

            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="bw-mode" className="font-bold cursor-pointer text-sm">{t("scanner.bw_filter")}</Label>
                <Switch id="bw-mode" checked={isBW} onCheckedChange={setIsBW} />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed italic">{t("scanner.bw_desc")}</p>
            </div>
          </div>

          <div className="flex-1 relative bg-zinc-900 flex items-center justify-center p-4 md:p-8 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                className="shadow-2xl inline-block"
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(95vh - 200px)',
                    display: 'block',
                  }}
                  className={cn(
                    "bg-white",
                    isBW && "filter grayscale contrast-[200%] brightness-[1.1]"
                  )}
                />
              </ReactCrop>
            </div>
          </div>
        </div>

        <div className="p-4 bg-background border-t shrink-0 flex items-center justify-end gap-4 px-8">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-8 rounded-xl font-bold h-11 border-zinc-200 hover:bg-zinc-50">
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} className="px-12 rounded-xl font-bold h-11 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Check className="mr-2 h-4 w-4" />
            {t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
