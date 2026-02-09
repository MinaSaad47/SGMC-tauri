import { Button } from "@/components/ui/button";
import
{
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { getAppConfig } from "@/lib/config/app";
import { listen } from "@tauri-apps/api/event";
import { error } from "@tauri-apps/plugin-log";
import { Upload } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface ScannerModalProps
{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScanReceived: (data: { mime: string; data: string }) => void;
}

export function ScannerModal({ isOpen, onOpenChange, onScanReceived }: ScannerModalProps)
{
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() =>
  {
    let unlisten: (() => void) | undefined;

    const setup = async () =>
    {
      try
      {
        const config = await getAppConfig();
        setUrl(`http://${config.ip_address}:${config.port}/scan`);

        unlisten = await listen<{ mime: string; data: string }>("scan-received", (event) =>
        {
          onScanReceived(event.payload);
          onOpenChange(false);
        });
      } catch (e: any)
      {
        setErrorMessage("Failed to start scanner service");
        error(e);
      }
    };

    if (isOpen)
    {
      setup();
    }

    return () =>
    {
      if (unlisten) unlisten();
    };
  }, [isOpen, onOpenChange, onScanReceived]);

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) =>
  {
    const file = e.target.files?.[0];
    if (file)
    {
      const reader = new FileReader();
      reader.onload = () =>
      {
        const result = reader.result as string;
        // Result is "data:image/jpeg;base64,..."
        // We need to parse it to match the event payload structure if our parent expects raw base64 or full data uri.
        // Looking at parent, it expects { mime: string, data: string } usually, but wait.
        // scanner_server.rs emits: { mime: "image/jpeg", data: "base64..." } (raw base64)
        // FileReader result includes the prefix.

        const [prefix, data] = result.split(",");
        const mime = prefix.match(/:(.*?);/)?.[1] || "image/jpeg";

        onScanReceived({ mime, data });
        onOpenChange(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("scanner.title", "Scan Document")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          {errorMessage ? (
            <p className="text-destructive">{errorMessage}</p>
          ) : url ? (
            <>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <QRCodeSVG value={url} size={200} />
              </div>
              <p className="text-sm text-muted-foreground text-center px-4">
                {t("scanner.instruction", "Scan this QR code with your phone to upload a photo directly from your camera.")}
              </p>

              <div className="relative w-full flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t("common.or", "Or")}
                  </span>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleManualUpload}
              />
              <Button variant="secondary" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                {t("scanner.upload_manual", "Upload from Computer")}
              </Button>

              <p className="text-xs text-muted-foreground font-mono bg-muted p-1 rounded">
                {url}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
