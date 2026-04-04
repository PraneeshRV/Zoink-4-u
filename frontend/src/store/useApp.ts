import { create } from 'zustand';

interface AppState {
  activePolicy: any | null;
  setActivePolicy: (policy: any) => void;
  walletBalance: number;
  setWalletBalance: (b: number) => void;
  communityFund: any | null;
  setCommunityFund: (fund: any) => void;
  weather: any | null;
  setWeather: (w: any) => void;
  zoinkScore: number;
  setZoinkScore: (s: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activePolicy: null,
  setActivePolicy: (policy) => set({ activePolicy: policy }),
  walletBalance: 0,
  setWalletBalance: (b) => set({ walletBalance: b }),
  communityFund: null,
  setCommunityFund: (fund) => set({ communityFund: fund }),
  weather: null,
  setWeather: (w) => set({ weather: w }),
  zoinkScore: 65,
  setZoinkScore: (s) => set({ zoinkScore: s }),
}));
