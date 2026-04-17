import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const ML_BASE = import.meta.env.VITE_ML_BASE_URL || 'http://localhost:8001';

// Main backend API
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ML engine API
const mlApi = axios.create({
  baseURL: ML_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// JWT interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Admin key
  const adminKey = localStorage.getItem('admin_key');
  if (adminKey) {
    config.headers['X-Admin-Key'] = adminKey;
  }
  return config;
});

// Response error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.detail || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('rider_id');
      window.location.href = '/onboarding';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────
export const authAPI = {
  register: (data: {
    name: string; phone: string; platform: string; zone_h3: string;
    city: string; shift_start: string; shift_end: string;
    aadhaar_last4: string; mock_otp: string;
  }) => api.post('/auth/register', data),

  login: (data: { phone: string; mock_otp: string }) =>
    api.post('/auth/login', data),
};

// ─── Riders ───────────────────────────────────────
export const ridersAPI = {
  getProfile: () => api.get('/riders/me'),
  updateProfile: (data: any) => api.put('/riders/me', data),
  getClaims: (page = 1) => api.get(`/riders/me/claims?page=${page}`),
  getEarnings: () => api.get('/riders/me/earnings-summary'),
};

// ─── Policies ─────────────────────────────────────
export const policiesAPI = {
  getQuote: (data: { rider_id: string; tier: string }) =>
    api.post('/policies/quote', data),
  subscribe: (data: { rider_id: string; tier: string }) =>
    api.post('/policies/subscribe', data),
  getPolicy: (id: string) => api.get(`/policies/${id}`),
  getActive: () => api.get('/policies/active/current'),
};

// ─── Triggers ─────────────────────────────────────
export const triggersAPI = {
  getCurrentConditions: (zone_h3: string, city: string) =>
    api.get(`/triggers/current-conditions?zone_h3=${zone_h3}&city=${city}`),
  simulate: (data: {
    event_type: string; zone_h3: string; city: string;
    severity: number; duration_hours: number;
  }) => api.post('/triggers/simulate', data),
  nasaPull: () => api.post('/triggers/nasa-pull'),
  getActive: () => api.get('/triggers/active'),
};

// ─── Claims ───────────────────────────────────────
export const claimsAPI = {
  getClaim: (id: string) => api.get(`/claims/${id}`),
  approve: (id: string) => api.post(`/claims/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.post(`/claims/${id}/reject`, { reason }),
  getPending: (page = 1) => api.get(`/claims/pending/list?page=${page}`),
};

// ─── Payouts ──────────────────────────────────────
export const payoutsAPI = {
  process: (claimId: string) => api.post(`/payouts/process/${claimId}`),
  history: (riderId?: string) =>
    api.get(`/payouts/history${riderId ? `?rider_id=${riderId}` : ''}`),
  getStatus: (payoutId: string) => api.get(`/payouts/status/${payoutId}`),
  getActive: () => api.get('/payouts/active'),
  webhookSim: (payoutId: string) => api.get(`/payouts/webhook-sim/${payoutId}`),
};

// ─── Admin ────────────────────────────────────────
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getRiders: (page = 1, search = '') =>
    api.get(`/admin/riders?page=${page}&search=${search}`),
  getClaims: (status = '', page = 1) =>
    api.get(`/admin/claims?status=${status}&page=${page}`),
  getDisruptionEvents: (active = false) =>
    api.get(`/admin/disruption-events?active=${active}`),
  getZoneHeatmap: () => api.get('/admin/zone-heatmap'),
};

// ─── Analytics ────────────────────────────────────
export const analyticsAPI = {
  getLossRatioTrend: (weeks = 8) =>
    api.get(`/admin/analytics/loss-ratio-trend?weeks=${weeks}`),
  getPredictions: () => api.get('/admin/analytics/predictions'),
  getFraudStats: () => api.get('/admin/analytics/fraud-stats'),
  getRevenue: () => api.get('/admin/analytics/revenue'),
};

// ─── ML Engine ────────────────────────────────────
export const mlEngineAPI = {
  calculatePremium: (data: {
    zone_h3: string; city: string; tier: string;
    work_hours_per_week: number; platform: string; zoink_score: number;
  }) => mlApi.post('/premium/calculate', data),

  checkFraud: (data: any) => mlApi.post('/fraud/check', data),

  getRiskProfile: (data: {
    zone_h3: string; city: string; work_hours_per_week: number;
    platform: string; months_active: number;
  }) => mlApi.post('/risk/profile', data),

  getForecast: (zone_h3: string, city: string) =>
    mlApi.get(`/forecast/zone?zone_h3=${zone_h3}&city=${city}`),

  getModelsStatus: () => mlApi.get('/models/status'),
};

export default api;
