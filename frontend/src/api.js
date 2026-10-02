// Centralized API Base configuration for ForgeOS
// Normalizes VITE_API_URL so it always has the correct /api suffix and no trailing slashes
const rawApi = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const API = rawApi 
  ? (rawApi.endsWith('/api') ? rawApi : `${rawApi}/api`)
  : '/api';

export default API;
