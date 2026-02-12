import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Extend Axios config to allow _retry flag
 */
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Main API client
 * Used for all protected & normal requests
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Separate refresh client (IMPORTANT)
 * This prevents infinite interceptor loops
 */
const refreshClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

/**
 * Refresh control variables
 */
let isRefreshing = false;

let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * Process queued requests
 */
const processQueue = (error: unknown) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(null);
    }
  });

  failedQueue = [];
};

/**
 * RESPONSE INTERCEPTOR
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    /**
     * Conditions where we DO NOT attempt refresh:
     * - Not 401
     * - Already retried
     * - Refresh endpoint itself
     */
    if (
      status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    /**
     * If refresh already happening → queue this request
     */
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      /**
       * Silent refresh (HTTP-only cookie)
       */
      await refreshClient.post('/auth/refresh');

      processQueue(null);

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

      /**
       * If refresh fails → logout
       */
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
