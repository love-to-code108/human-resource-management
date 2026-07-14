import { create } from 'zustand';

export const useDashboardStore = create((set) => ({
  activeView: 'overview', // Default view
  setActiveView: (view) => set({ activeView: view }),
}));
