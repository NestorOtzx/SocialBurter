import { create } from 'zustand';

export const useNetworkStore = create((set) => ({
  isOffline: false,
  isSyncing: false,
  setOffline: (offline) => set({ isOffline: offline }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),
}));
