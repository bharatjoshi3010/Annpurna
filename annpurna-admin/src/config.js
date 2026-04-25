/**
 * Central API configuration for the Annpurna Admin Panel.
 *
 * Switch between local dev and production by changing USE_PRODUCTION below.
 * The app reads VITE_API_URL from .env files first; this flag is the fallback.
 */

const PRODUCTION_URL = 'https://annpurna-fcxb.onrender.com';
const LOCAL_URL      = 'http://localhost:5000';

// Auto-detect based on Vite's dev/prod mode
export const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === 'development' ? LOCAL_URL : PRODUCTION_URL);

export const ADMIN_API_URL = `${API_BASE_URL}/api/admin`;
