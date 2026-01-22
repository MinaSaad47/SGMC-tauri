import
{
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { useSyncStore } from "@/lib/sync-store";
import
{
  getBackupsQueryOptions,
  restoreBackupMutationOptions,
  uploadBackupMutationOptions,
} from "@/lib/tanstack-query/drive";
import { cn, formatDate } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Clock, Cloud, Download, Loader2, RefreshCw, Upload, Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SyncManager()
{
  const { t } = useTranslation();
  const { isAutoSyncEnabled, toggleAutoSync, lastSyncTime, isSyncing, isOnline, setIsSyncing, setLastSyncTime, lastSyncedFileId } = useSyncStore();
  const { syncIntervalMinutes } = useAutoSync();

  const backupsQuery = useQuery(getBackupsQueryOptions(isOnline));

  const restoreMutation = useMutation({
    ...restoreBackupMutationOptions(),
  });

  const uploadMutation = useMutation({
    ...uploadBackupMutationOptions(),
    onMutate: () => setIsSyncing(true),
    onSuccess: () => setLastSyncTime(Date.now()),
    onSettled: () => setIsSyncing(false),
  });

  const handleManualSync = async () =>
  {
    uploadMutation.mutate();
  };

  const handleRestore = async (fileId: string) =>
  {
    restoreMutation.mutate(fileId);
  };

  const backups = backupsQuery.data || [];
  const isFetchingBackups = backupsQuery.isFetching;

  return (
    <div className="space-y-6">
      {/* ... Sync Controls ... */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-muted/30 p-4 rounded-lg border">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 rtl:space-x-reverse">
            <Switch
              id="auto-sync"
              checked={isAutoSyncEnabled}
              onCheckedChange={toggleAutoSync}
            />
            <Label htmlFor="auto-sync" className="font-medium cursor-pointer">
              {t("sync.auto_sync_label", { minutes: syncIntervalMinutes })}
            </Label>
          </div>

          <div className="flex items-center gap-4">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
              isOnline ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? t("sync.online") : t("sync.offline")}
            </div>

            {lastSyncTime && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t("sync.last_synced")}: {formatDate(new Date(lastSyncTime))}
              </span>
            )}
          </div>
        </div>

        <Button onClick={handleManualSync} disabled={isSyncing || !isOnline} size="sm" className="gap-2">
          {isSyncing ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
          {t("sync.sync_now")}
        </Button>
      </div>

      {/* Backups List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            {t("sync.cloud_backups")}
          </h3>
          <Button variant="ghost" size="icon" onClick={() => backupsQuery.refetch()} disabled={isFetchingBackups || !isOnline}>
            <RefreshCw className={`h-4 w-4 ${isFetchingBackups ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden bg-background">
          <div className="bg-muted/50 px-4 py-2 text-xs font-medium grid grid-cols-2 text-muted-foreground">
            <span>{t("common.file")}</span>
            <span className="text-end">{t("common.actions")}</span>
          </div>
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {backupsQuery.isPending ? (
              <div className="p-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs animate-pulse">{t("sync.fetching_history")}</span>
              </div>
            ) : backups.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground italic">
                {t("sync.no_backups")}
              </div>
            ) : (
              backups.map((backup) => {
                const isActive = backup.id === lastSyncedFileId;
                return (
                  <div 
                    key={backup.id} 
                    className={cn(
                      "px-4 py-3 grid grid-cols-2 items-center transition-colors border-l-4",
                      isActive 
                        ? "bg-primary/5 border-l-primary hover:bg-primary/10" 
                        : "hover:bg-muted/30 border-l-transparent"
                    )}
                  >
                    <div className="flex flex-col gap-1 pr-4 rtl:pr-0 rtl:pl-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium break-all line-clamp-1">{backup.name}</span>
                        {isActive && (
                          <Badge variant="outline" className="h-5 px-1.5 gap-1 text-[10px] border-primary/30 text-primary bg-primary/5">
                            <Check className="h-3 w-3" /> {t("sync.active_backup")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{formatDate(backup.createdTime)}</span>
                        {backup.properties && (
                          <>
                            <span>•</span>
                            <span>{t("sync.app_version", { version: backup.properties.appVersion || "?" })}</span>
                            {backup.properties.patientCount && (
                              <>
                                <span>•</span>
                                <span>{t("sync.patients_count", { count: Number(backup.properties.patientCount) })}</span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end shrink-0">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2 h-8" disabled={!isOnline}>
                            <Download className="h-3 w-3" /> {t("sync.restore")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("sync.restore_confirm_title")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("sync.restore_confirm_desc", { date: formatDate(backup.createdTime) })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRestore(backup.id)} className="bg-destructive hover:bg-destructive/90 text-white">
                              {t("sync.restore_confirm_action")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
