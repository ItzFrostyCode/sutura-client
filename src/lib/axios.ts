import axios from 'axios';
import { authToken, clearAuth } from './authStorage';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  if (globalThis.window !== undefined) {
    const token = authToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) config.data = await shrinkLargePhotos(config.data);
  }
  return config;
});

/**
 * Phone photos (3–8 MB) are over PHP's 2 MB upload limit and come back as "The file failed to upload". Every photo in an
 * upload that is over 1.8 MB is redrawn on the device as a smaller JPEG first (same as the shop application's photos),
 * so the logo, cover, GCash QR, post and design uploads all work. Smaller photos, PDFs and videos are sent as they are.
 */
const PHP_SAFE_BYTES = 1.8 * 1024 * 1024;
async function shrinkLargePhotos(data: FormData): Promise<FormData> {
  const big = [...data.entries()].filter(([, v]) => v instanceof File && v.size > PHP_SAFE_BYTES && v.type.startsWith('image/') && v.type !== 'image/gif');
  if (big.length === 0) return data;
  const { prepareUpload } = await import('@/components/store-application/uploadPrep');
  const out = new FormData();
  for (const [key, value] of data.entries()) {
    if (value instanceof File && big.some(([, v]) => v === value)) {
      const prepared = await prepareUpload(value, { allowPdf: false });
      out.append(key, prepared.file ?? value);
    } else {
      out.append(key, value);
    }
  }
  return out;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A request the app cancelled on purpose (e.g. the search box dropping
    // the previous suggestions request as you keep typing) isn't a failure:
    // pass it on to the caller without logging.
    if (axios.isCancel(error)) return Promise.reject(error);
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
        // Clear the dead login — only if it is still the one this request sent, so a late 401 can't sign out a newer
        // login made in another tab. Clearing it signs the other tabs out too (AuthHydrator's tab sync).
        const sent = String(error.config?.headers?.Authorization ?? '').replace(/^Bearer /, '');
        clearAuth(sent || null);

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
