/**
 * Single source of truth for API configuration.
 * Safe fallback logic that prevents double `/api` concatenation bugs and works across Web and Expo Native.
 */
let expoExtra: Record<string, string> = {};

try {
  // Dynamic safe import for Expo Constants in native environments
  const Constants = require('expo-constants');
  expoExtra = Constants?.default?.expoConfig?.extra || Constants?.expoConfig?.extra || {};
} catch (_e) {
  // Web / Vite fallback
  expoExtra = {
    API_BASE_URL: (import.meta as any).env?.VITE_API_BASE_URL || "https://wildlife-safety-api.onrender.com",
    ML_SERVICE_URL: (import.meta as any).env?.VITE_ML_SERVICE_URL || "https://wildlife-safety-app-1.onrender.com",
    GEMINI_MODEL: "gemini-1.5-flash",
  };
}

const getExtra = (key: string, fallback: string = ""): string => {
    return expoExtra[key] || fallback;
};

const rawApiUrl = getExtra('API_BASE_URL', "https://wildlife-safety-api.onrender.com");
const rawMlUrl = getExtra('ML_SERVICE_URL', "https://wildlife-safety-app-1.onrender.com");

export const getApiBaseUrl = (): string => {
    let url = rawApiUrl.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    // Standardize: ensure path ends with /api cleanly
    if (!url.endsWith('/api')) {
        url = `${url}/api`;
    }
    return url;
};

export const getMlServiceUrl = (): string => {
    let url = rawMlUrl.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    return url;
};

export const API_BASE_URL = getApiBaseUrl();
export const ML_SERVICE_URL = getMlServiceUrl();

export const CONFIG = {
    API_BASE_URL: getApiBaseUrl(),
    ML_SERVICE_URL: getMlServiceUrl(),
    OPENAI_API_KEY: getExtra('OPENAI_API_KEY'),
    OPENAI_MODEL: getExtra('OPENAI_MODEL', 'gpt-3.5-turbo'),
    GEMINI_API_KEY: getExtra('GEMINI_API_KEY'),
    GEMINI_MODEL: getExtra('GEMINI_MODEL', 'gemini-1.5-flash'),
    WEATHER_API_KEY: getExtra('WEATHER_API_KEY', '0f965eb13fcac3cab46a6d13af345eac'),
    tileUrl: getExtra('TILE_URL') || getExtra('OSM_TILE_URL') || '',
};
