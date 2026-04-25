import { Platform } from 'react-native';

const PRODUCTION_URL = 'https://annpurna-fcxb.onrender.com';
const LOCAL_URL      = Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'   // Android emulator → host machine
    : 'http://localhost:5000';  // iOS simulator / web

// By default, try local first. If it fails, we fall back to production.
export let API_BASE_URL: string = LOCAL_URL;

// This will run when the app starts
export const initApiConfig = async (): Promise<void> => {
    try {
        console.log('🔗 Pinging local server...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout

        const res = await fetch(`${LOCAL_URL}/api/health`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            console.log('✅ Connected to LOCAL backend');
            API_BASE_URL = LOCAL_URL;
            return;
        }
    } catch (error) {
        // Local server not reachable (network error or timeout)
        console.log('⚠️ Local server unreachable, falling back to LIVE backend');
    }

    API_BASE_URL = PRODUCTION_URL;
};
