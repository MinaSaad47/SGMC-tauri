import { mutationOptions, infiniteQueryOptions } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { rename, writeFile } from "@tauri-apps/plugin-fs";
import { relaunch } from "@tauri-apps/plugin-process";
import { toast } from "sonner";
import { googleDrive } from "../google-drive";
import i18n from "../i18n";
import { useSyncStore } from "../sync-store";

export function getBackupsQueryKey()
{
  return ["drive", "backups"] as const;
}

export function getBackupsInfiniteQueryOptions(enabled: boolean = true)
{
  return infiniteQueryOptions({
    queryKey: getBackupsQueryKey(),
    queryFn: async ({ pageParam }: { pageParam?: string }) =>
    {
      return await googleDrive.listBackups(pageParam);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    enabled,
  });
}

export function uploadBackupMutationOptions()
{
  return mutationOptions({
    mutationFn: async () =>
    {
      const fileId = await googleDrive.uploadBackup();
      useSyncStore.getState().setLastSyncedFileId(fileId);
      return fileId;
    },
    onMutate: () =>
    {
      toast.loading(i18n.t("sync.syncing"), { id: "backup-progress" });
    },
    onSettled: () =>
    {
      toast.dismiss("backup-progress");
    },
    meta: {
      invalidatesQueries: [getBackupsQueryKey()],
      successMessage: i18n.t("sync.success"),
      errorMessage: i18n.t("sync.failed"),
    },
  });
}

export function restoreBackupMutationOptions()
{
  return mutationOptions({
    mutationFn: async (fileId: string) =>
    {
      const data = await googleDrive.downloadBackup(fileId);
      const dbPath = await invoke<string>("get_db_path");
      const tempPath = `${dbPath}.tmp`;

      // 1. Write to temp file
      await writeFile(tempPath, data);

      // 2. Atomic Rename (Safe Replace)
      await rename(tempPath, dbPath);

      useSyncStore.getState().setLastSyncedFileId(fileId);

      // Delay relaunch slightly to allow UI to show success state if needed, 
      // but typically we want to restart ASAP.
      setTimeout(async () =>
      {
        await relaunch();
      }, 1500);
    },
    onMutate: () =>
    {
      toast.loading(i18n.t("sync.restoring"), { id: "restore-progress" });
    },
    onSettled: () =>
    {
      toast.dismiss("restore-progress");
    },
    meta: {
      successMessage: i18n.t("sync.restore_success"),
      errorMessage: i18n.t("sync.restore_failed"),
    },
  });
}