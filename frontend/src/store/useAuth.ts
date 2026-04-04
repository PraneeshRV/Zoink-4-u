import { create } from 'zustand';

export interface User {
  id: number;
  name: string;
  phone: string;
  zone_id: string;
  zoink_score?: number;
  aadhaar_token?: string;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (userData) => {
    localStorage.setItem('user_id', String(userData.id));
    localStorage.setItem('user_data', JSON.stringify(userData));
    set({ user: userData, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_data');
    set({ user: null, isAuthenticated: false });
  },
}));
