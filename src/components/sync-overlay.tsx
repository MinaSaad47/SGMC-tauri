import { Spinner } from "@/components/ui/spinner";
import { useSyncStore } from "@/lib/sync-store";
import { CloudUpload } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SyncOverlay()
{
  const { t } = useTranslation();
  const isSyncing = useSyncStore((state) => state.isSyncing);

  if (!isSyncing) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background p-8 rounded-xl shadow-lg flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
        <div className="relative flex flex-col items-center gap-2">
          <CloudUpload className="h-12 w-12 text-primary" />
          <Spinner />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold">{t("sync.syncing")}</h3>
          <p className="text-sm text-muted-foreground">{t("sync.do_not_close")}</p>
        </div>
      </div>
    </div>
  );
}
