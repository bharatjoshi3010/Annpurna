/**
 * ─── Annpurna Mobile App — API Config ────────────────────────────────────────
 *
 * HOW TO SWITCH:
 *   • Production  →  set USE_PRODUCTION = true   (uses Render live server)
 *   • Local dev   →  set USE_PRODUCTION = false  (uses 10.0.2.2:5000 on Android
 *                                                  or localhost:5000 on iOS sim)
 */

import { Platform } from 'react-native';

const PRODUCTION_URL = 'https://annpurna-fcxb.onrender.com';
const LOCAL_URL      = Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'   // Android emulator → host machine
    : 'http://localhost:5000';  // iOS simulator / web

// ← Toggle this flag to switch environments
const USE_PRODUCTION = true;

export const API_BASE_URL: string = USE_PRODUCTION ? PRODUCTION_URL : LOCAL_URL;
