import { getAppConfig } from "@/lib/config/app";
import { googleDrive } from "@/lib/google-drive";
import { useSyncStore } from "@/lib/sync-store";
import { uploadBackupMutationOptions } from "@/lib/tanstack-query/drive";
import { useMutation } from "@tanstack/react-query";
import { error } from "@tauri-apps/plugin-log";
import { useEffect, useRef, useState } from "react";

export function useAutoSync()
{
  const { isAutoSyncEnabled, setIsAutoSyncing, setLastSyncTime } = useSyncStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState(60);

  const uploadMutation = useMutation({
    ...uploadBackupMutationOptions(),
    onMutate: () => setIsAutoSyncing(true),
    onSuccess: () =>
    {
      setLastSyncTime(Date.now());
    },
    onSettled: () => setIsAutoSyncing(false),
  });

  useEffect(() =>
  {
    // Fetch runtime interval from Rust
    getAppConfig().then((config) => setSyncIntervalMinutes(config.sync_interval_minutes))
      .catch((err) => error("Failed to get sync interval:", err));
  }, []);

  const performAutoSync = async () =>
  {
    // 1. Check Connectivity
    if (!navigator.onLine) return;

    // 2. Check Auth (silently)
    const isAuth = await googleDrive.isAuthenticated();
    if (!isAuth) return;

    // 3. Start Sync (Non-blocking)
    uploadMutation.mutate();
  };

  useEffect(() =>
  {
    if (isAutoSyncEnabled)
    {
      if (intervalRef.current)
      {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() =>
      {
        performAutoSync();
      }, syncIntervalMinutes * 60 * 1000);
    } else
    {
      if (intervalRef.current)
      {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () =>
    {
      if (intervalRef.current)
      {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoSyncEnabled, syncIntervalMinutes]);

  return { syncIntervalMinutes };
}

