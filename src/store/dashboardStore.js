import { create } from 'zustand';

export const useDashboardStore = create((set) => ({
  activeView: 'my-status', // Default view
  setActiveView: (view) => set({ activeView: view }),
}));
