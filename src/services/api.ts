import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const DEFAULT_API_URL = 'https://r-d-q9ix.onrender.com/api';

export let API_BASE_URL = DEFAULT_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Dynamic Base URL interceptor
api.interceptors.request.use(
  async (config) => {
    const customUrl = await AsyncStorage.getItem('@r2r_custom_api_url');
    if (customUrl) {
      config.baseURL = customUrl;
    }
    const token = await AsyncStorage.getItem('@r2r_jwt_token');
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
    const customError = error.response?.data?.message || error.message || 'Network error: Unable to connect to laptop server';
    return Promise.reject(new Error(customError));
  }
);

export default api;
