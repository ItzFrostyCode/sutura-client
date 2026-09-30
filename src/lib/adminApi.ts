import axios from 'axios';

/**
 * The System Admin portal's own API client — deliberately NOT the shared
 * `@/lib/axios` instance. The admin session lives under its own key in
 * sessionStorage (cleared when the browser closes), so:
 *  - signing in as admin never makes the storefront think an admin is
 *    "logged in" as a customer, and vice versa;
 *  - the storefront's 401 handler can't wipe the admin session;
 *  - an unattended admin tab doesn't stay signed in across restarts.
 */
export const ADMIN_TOKEN_KEY = 'sutura_admin_token';
export const ADMIN_USER_KEY = 'sutura_admin_user';

const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  if (globalThis.window !== undefined) {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const onLogin = globalThis.window?.location.pathname === '/admin/login';
    // 401 = token revoked/expired; 403 = token isn't an admin's. Either way
    // this session can't use the console any more.
    if ((status === 401 || status === 403) && globalThis.window !== undefined && !onLogin
      && !error.config?.url?.includes('/auth/admin/login')) {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      sessionStorage.removeItem(ADMIN_USER_KEY);
      globalThis.location.href = '/admin/login';
    }
    return Promise.reject(error);
  },
);

export default adminApi;
