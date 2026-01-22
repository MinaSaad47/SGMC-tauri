import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SyncState {
  isSyncing: boolean; // Manual blocking sync
  isAutoSyncing: boolean; // Background non-blocking sync
  isAutoSyncEnabled: boolean;
  isOnline: boolean;
  lastSyncTime: number | null;
  lastSyncedFileId: string | null;
  setIsSyncing: (isSyncing: boolean) => void;
  setIsAutoSyncing: (isAutoSyncing: boolean) => void;
  toggleAutoSync: (enabled: boolean) => void;
  setIsOnline: (isOnline: boolean) => void;
  setLastSyncTime: (time: number) => void;
  setLastSyncedFileId: (id: string | null) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      isSyncing: false,
      isAutoSyncing: false,
      isAutoSyncEnabled: false,
      isOnline: navigator.onLine,
      lastSyncTime: null,
      lastSyncedFileId: null,
      setIsSyncing: (isSyncing) => set({ isSyncing }),
      setIsAutoSyncing: (isAutoSyncing) => set({ isAutoSyncing }),
      toggleAutoSync: (enabled) => set({ isAutoSyncEnabled: enabled }),
      setIsOnline: (isOnline) => set({ isOnline }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      setLastSyncedFileId: (id) => set({ lastSyncedFileId: id }),
    }),
    {
      name: "sync-storage",
      partialize: (state) => ({ 
        isAutoSyncEnabled: state.isAutoSyncEnabled,
        lastSyncTime: state.lastSyncTime,
        lastSyncedFileId: state.lastSyncedFileId
      }),
    }
  )
);
