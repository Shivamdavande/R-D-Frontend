import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const REMOTE_API_URL = 'https://r-d-q9ix.onrender.com/api';
export const LOCAL_API_URL = 'http://localhost:5000/api';

const ENV_API_URL = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ? process.env.EXPO_PUBLIC_API_URL : null;

export const DEFAULT_API_URL = ENV_API_URL || REMOTE_API_URL;

export let API_BASE_URL = DEFAULT_API_URL;

// In-memory cache for fast synchronous access
let cachedCustomUrl: string | null = null;
let cachedToken: string | null = null;

// Initialize cache from AsyncStorage asynchronously on app launch
(async () => {
  try {
    cachedCustomUrl = await AsyncStorage.getItem('@r2r_custom_api_url');
    cachedToken = await AsyncStorage.getItem('@r2r_jwt_token');
  } catch (e) {
    // Ignore storage read error on init
  }
})();

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorizedCallback = (cb: (() => void) | null) => {
  onUnauthorizedCallback = cb;
};

export const setCachedToken = (token: string | null) => {
  cachedToken = token;
};

export const setCachedCustomUrl = (url: string | null) => {
  cachedCustomUrl = url;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Fast interceptor using cached values
api.interceptors.request.use(
  async (config) => {
    let customUrl = cachedCustomUrl;
    if (customUrl === null) {
      customUrl = await AsyncStorage.getItem('@r2r_custom_api_url');
      cachedCustomUrl = customUrl;
    }

    let baseUrl = (customUrl && customUrl.trim()) ? customUrl.trim() : DEFAULT_API_URL;
    baseUrl = baseUrl.replace(/\/+$/, '');
    if (!baseUrl.endsWith('/api')) {
      baseUrl = `${baseUrl}/api`;
    }
    config.baseURL = baseUrl;

    // Prevent duplicate /api/api in URL paths
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.substring(4);
    } else if (config.url && config.url.startsWith('api/')) {
      config.url = '/' + config.url.substring(4);
    }

    let token = cachedToken;
    if (token === null) {
      token = await AsyncStorage.getItem('@r2r_jwt_token');
      cachedToken = token;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthLoginEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/verify-otp') || url.includes('/auth/reset-password') || url.includes('/auth/forgot-password');

    if (error.response?.status === 401 && !isAuthLoginEndpoint) {
      setCachedToken(null);
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }

    const serverMsg = typeof error.response?.data === 'string'
      ? error.response.data
      : (error.response?.data?.message || error.response?.data?.error);
    const customError = serverMsg || error.message || 'Network error: Unable to connect to server';
    const errObj: any = new Error(customError);
    if (error.response) {
      errObj.response = error.response;
      errObj.status = error.response.status;
      errObj.data = error.response.data;
      errObj.requiresOtp = error.response.data?.requiresOtp;
    }
    return Promise.reject(errObj);
  }
);

/**
 * Helper to get absolute image URL for local uploaded files or ImageKit URLs.
 */
export const getFullImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const baseUrl = (API_BASE_URL || DEFAULT_API_URL).replace(/\/api\/?$/, '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

/**
 * Helper to get ultra-fast compressed thumbnail URL for gallery views.
 * If using ImageKit URL, appends transformation parameters (e.g., tr=w-350,h-350,q-60).
 */
export const getThumbnailUrl = (url?: string, width = 350, height = 350): string => {
  const fullUrl = getFullImageUrl(url);
  if (!fullUrl) return '';

  // Apply real-time ImageKit transformation if hosted on ImageKit
  if (fullUrl.includes('ik.imagekit.io')) {
    const transformParam = `tr=w-${width},h-${height},q-60,cm-extract`;
    if (fullUrl.includes('?')) {
      return `${fullUrl}&${transformParam}`;
    }
    return `${fullUrl}?${transformParam}`;
  }

  return fullUrl;
};

export default api;
