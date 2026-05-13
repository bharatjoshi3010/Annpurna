import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRODUCTION_URL = 'https://annpurna-fcxb.onrender.com';
const LOCAL_URL      = Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'   // Android emulator → host machine
    : 'http://localhost:5000';  // iOS simulator / web

const CACHED_URL_KEY = '@annpurna_api_url';

// Default to production — changed below by initApiConfig if local is reachable
export let API_BASE_URL: string = PRODUCTION_URL;

/**
 * Resolves the correct backend URL at startup.
 *
 * Strategy:
 *  1. Try the local dev server quickly (only useful when running in an emulator).
 *  2. If unreachable, use the production URL.
 *  3. Cache the winner so the next cold-start skips the ping entirely.
 */
export const initApiConfig = async (): Promise<void> => {
    try {
        // Fast path: read the cached URL from the previous launch
        const cached = await AsyncStorage.getItem(CACHED_URL_KEY);
        if (cached) {
            API_BASE_URL = cached;
            // Still probe the local server in the background so a dev switch is picked up
            pingLocalInBackground();
            return;
        }
    } catch {
        // AsyncStorage unavailable — continue with full probe
    }

    // First launch or cache cleared: probe synchronously
    await resolveAndCacheUrl();
};

/** Probe the local server without blocking the UI. */
const pingLocalInBackground = (): void => {
    resolveAndCacheUrl().catch(() => { /* ignore */ });
};

/** Tries local server; falls back to production; caches the result. */
const resolveAndCacheUrl = async (): Promise<void> => {
    try {
        console.log('🔗 Pinging local server...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const res = await fetch(`${LOCAL_URL}/api/health`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            console.log('✅ Connected to LOCAL backend');
            API_BASE_URL = LOCAL_URL;
            await AsyncStorage.setItem(CACHED_URL_KEY, LOCAL_URL).catch(() => {});
            return;
        }
    } catch {
        console.log('⚠️ Local server unreachable, using LIVE backend');
    }

    API_BASE_URL = PRODUCTION_URL;
    await AsyncStorage.setItem(CACHED_URL_KEY, PRODUCTION_URL).catch(() => {});
};
