import axios from 'axios';

// Automatically select localhost for dev and Render for production unless overridden
const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  // If in browser runtime on localhost or running in Vite dev mode
  if (
    import.meta.env.DEV ||
    (typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ) {
    return 'http://localhost:5000/api/v1';
  }

  // Production hosted backend fallback
  return 'https://edtech-crm-l36t.onrender.com/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // required for HTTP-only refresh cookies
});

let activeInstructorOverride: string | null = null;

if (typeof window !== 'undefined') {
  try {
    activeInstructorOverride = sessionStorage.getItem('edtech_instructor_override') || null;
  } catch (e) {
    // ignore
  }
}

export const setInstructorOverride = (id: string | null) => {
  activeInstructorOverride = id;
  if (typeof window !== 'undefined') {
    try {
      if (id && id.trim()) {
        sessionStorage.setItem('edtech_instructor_override', id.trim());
      } else {
        sessionStorage.removeItem('edtech_instructor_override');
      }
    } catch (e) {
      // ignore
    }
  }
};

export const getInstructorOverride = (): string | null => {
  if (activeInstructorOverride) return activeInstructorOverride;
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('edtech_instructor_override');
      if (stored) {
        activeInstructorOverride = stored;
        return stored;
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
};

// Request Interceptor: Attach Access Token and Optional Instructor Override Header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const override = getInstructorOverride();
    if (override && config.headers) {
      const url = config.url || '';
      const isRelevantRoute = url.includes('/instructor') || url.includes('/super-admin');
      if (isRelevantRoute) {
        config.headers['x-instructor-id'] = override;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency queue for token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const isPublicPath = (pathname: string): boolean => {
  const path = pathname.toLowerCase();
  if (
    path === '/' ||
    path === '/login' ||
    path === '/signup' ||
    path === '/register' ||
    path === '/choose-role' ||
    path === '/reset-password' ||
    path.startsWith('/course') ||
    path.startsWith('/topics') ||
    path.startsWith('/learning-paths') ||
    path.startsWith('/offerings') ||
    path.startsWith('/instructors') ||
    path.startsWith('/mentorship') ||
    path.startsWith('/webinar') ||
    path.startsWith('/cart') ||
    path.startsWith('/checkout') ||
    path.startsWith('/blog') ||
    path.startsWith('/help') ||
    path.startsWith('/community') ||
    path.startsWith('/career-support') ||
    path.startsWith('/about') ||
    path.startsWith('/contact') ||
    path.startsWith('/privacy') ||
    path.startsWith('/terms')
  ) {
    return true;
  }

  const isProtected =
    path.startsWith('/dashboard') ||
    path.startsWith('/admin') ||
    path.startsWith('/super-admin') ||
    path.startsWith('/student') ||
    (path.startsWith('/instructor') && !path.startsWith('/instructors')) ||
    path.startsWith('/profile') ||
    path.startsWith('/settings') ||
    path.startsWith('/messages') ||
    path.startsWith('/notifications') ||
    path.startsWith('/skill-passport');

  return !isProtected;
};

// Response Interceptor: Handle Token Refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        const newAccessToken = data?.data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('No access token returned from refresh');
        }
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        // Cleanly remove invalid authentication credentials
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session_expired'));
          const currentPath = window.location.pathname;
          const isPublic = isPublicPath(currentPath);

          if (!isPublic && !currentPath.startsWith('/login')) {
            window.location.href = `/login?session_expired=true&redirect=${encodeURIComponent(currentPath + window.location.search)}`;
          }
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
