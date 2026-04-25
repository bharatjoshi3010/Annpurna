/**
 * Central API configuration for the Annpurna Admin Panel.
 *
 * Switch between local dev and production by changing USE_PRODUCTION below.
 * The app reads VITE_API_URL from .env files first; this flag is the fallback.
 */

const PRODUCTION_URL = 'https://annpurna-fcxb.onrender.com';
const LOCAL_URL      = 'http://localhost:5000';

// Set to true → production Render server, false → local dev server
const USE_PRODUCTION = true;

export const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (USE_PRODUCTION ? PRODUCTION_URL : LOCAL_URL);

export const ADMIN_API_URL = `${API_BASE_URL}/api/admin`;
