import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  riderId: string | null;
  riderName: string | null;
  token: string | null;
  login: (token: string, riderId: string, name: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('jwt_token'),
  riderId: localStorage.getItem('rider_id'),
  riderName: localStorage.getItem('rider_name'),
  token: localStorage.getItem('jwt_token'),

  login: (token: string, riderId: string, name: string) => {
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('rider_id', riderId);
    localStorage.setItem('rider_name', name);
    set({ isAuthenticated: true, riderId, riderName: name, token });
  },

  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('rider_id');
    localStorage.removeItem('rider_name');
    localStorage.removeItem('admin_key');
    set({ isAuthenticated: false, riderId: null, riderName: null, token: null });
  },

  hydrate: () => {
    const token = localStorage.getItem('jwt_token');
    const riderId = localStorage.getItem('rider_id');
    const name = localStorage.getItem('rider_name');
    set({ isAuthenticated: !!token, riderId, riderName: name, token });
  },
}));
