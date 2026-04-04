import axios from 'axios';

// The core backend running locally
export const coreApi = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// The ML engine backend running locally
export const mlApi = axios.create({
  baseURL: 'http://localhost:8001',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Add interceptors if needed later
