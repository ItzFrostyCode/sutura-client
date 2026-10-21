import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (globalThis.window !== undefined) {
    const token = sessionStorage.getItem('sutura_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? error.code ?? 'NETWORK_ERROR';
    // 4xx is an answer the calling form already shows (wrong password,
    // validation) — a warning, not console.error, which Next's dev overlay
    // turns into a red "Issue". Server errors and network failures stay errors.
    const expected = typeof error.response?.status === 'number' && error.response.status < 500;
    (expected ? console.warn : console.error)(
      `[AxiosError] ${status} on ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
      error.response?.data?.message || error.response?.data || error.message
    );
    if (error.response?.status === 401) {
      if (globalThis.window !== undefined) {
        // Clear invalid auth credentials from storage
        sessionStorage.removeItem('sutura_token');
        sessionStorage.removeItem('sutura_user');
        sessionStorage.removeItem('sutura_store');
        sessionStorage.removeItem('sutura_staff');

        const pathname = globalThis.window.location.pathname;
        const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
        
        // Only redirect to /login if user is currently inside a protected workspace (e.g. dashboard).
        // Public browsing surfaces (landing page /, /search, /stores, /store/*, /map) must remain accessible to guests!
        const isProtectedRoute = pathname.startsWith('/dashboard') ||
          (pathname.startsWith('/account/') && pathname !== '/account');

        if (isProtectedRoute && pathname !== '/login' && !isAuthEndpoint) {
          // replace: the page that failed should not stay behind the sign-in page in the history.
          globalThis.location.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
