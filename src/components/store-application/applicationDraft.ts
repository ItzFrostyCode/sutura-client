/**
 * Keeps an unfinished shop application through a page refresh (or the browser restoring the tab), and only then.
 *
 * - The typed answers live in sessionStorage (this tab only); photos and PDFs in IndexedDB (sessionStorage can't
 *   hold files). Both are best effort: in a private window, or with storage blocked, the form just starts empty.
 * - A draft is put back only when this page load is a reload. Leaving the form (Back, a link, another page) clears
 *   it, so coming back later starts fresh, as the owner expects.
 * - Everything read back is checked field by field: a value of the wrong shape (an older version of the form,
 *   edited storage) is dropped, never trusted. Values the server may no longer accept (a plan that was removed,
 *   an address outside Davao City) are dropped by the form itself once its lists load.
 */
import { EMPTY_PSGC_ADDRESS, type PsgcAddress } from '@/lib/psgc';
import type { SavedLocation } from '@/lib/customerLocation';
import { offeredSpecializations } from '@/lib/storeSpecializations';
import {
  EMPTY_OWNER, EMPTY_SHOP,
  type ApplicationStep, type BillingCycle, type BranchDraft, type DocumentKey, type OwnerFields, type ShopFields,
} from './applicationTypes';
import type { FaceMatch } from './faceMatch';

const KEY = 'sutura.storeApplication.draft';
const VERSION = 1;
const DB_NAME = 'sutura-drafts';
const DB_STORE = 'files';
const FILE_PREFIX = 'storeApplication:';

export interface ApplicationDraft {
  step: ApplicationStep;
  owner: OwnerFields;
  shop: ShopFields;
  governmentIdType: string;
  planId: number | null;
  billingCycle: BillingCycle;
  payOnline: boolean;
  /** The 14-day free trial was picked on the plan step. */
  freeTrial: boolean;
  privacyConsent: boolean;
  termsAccepted: boolean;
  /** The selfie's on-device face check, kept with the photo. */
  selfieMatch: FaceMatch | null;
}

export interface DraftFiles {
  files: Partial<Record<DocumentKey, File>>;
  permits: File[];
}

// ---------- the typed answers (sessionStorage) ----------

const str = (v: unknown, max = 500): string => (typeof v === 'string' ? v.slice(0, max) : '');
const bool = (v: unknown): boolean => v === true;
const strList = (v: unknown, max = 20): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max) : []);

function area(v: unknown): PsgcAddress {
  const a = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const out = { ...EMPTY_PSGC_ADDRESS };
  (Object.keys(out) as (keyof PsgcAddress)[]).forEach((k) => { out[k] = str(a[k], 120); });
  return out;
}

function location(v: unknown): SavedLocation | null {
  const l = (v && typeof v === 'object' ? v : null) as Record<string, unknown> | null;
  if (!l || typeof l.lat !== 'number' || typeof l.lng !== 'number' || !Number.isFinite(l.lat) || !Number.isFinite(l.lng)) return null;
  if (Math.abs(l.lat) > 90 || Math.abs(l.lng) > 180) return null;
  return { lat: l.lat, lng: l.lng, address: str(l.address, 300), district: str(l.district, 120), ...(typeof l.accuracy === 'number' ? { accuracy: l.accuracy } : {}) };
}

function branches(v: unknown): BranchDraft[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 10).flatMap((b) => {
    const o = (b && typeof b === 'object' ? b : null) as Record<string, unknown> | null;
    if (!o || typeof o.key !== 'string' || !o.key) return [];
    return [{ key: o.key.slice(0, 64), name: str(o.name, 191), address: str(o.address, 255), area: area(o.area) }];
  });
}

function faceMatch(v: unknown): FaceMatch | null {
  const m = (v && typeof v === 'object' ? v : null) as Record<string, unknown> | null;
  const results = ['likely', 'unsure', 'no_match', 'no_id_face', 'not_checked'];
  if (!m || typeof m.result !== 'string' || !results.includes(m.result)) return null;
  return { result: m.result as FaceMatch['result'], distance: typeof m.distance === 'number' ? m.distance : null };
}

/** A draft read back from storage, every field checked; null when there is nothing usable. */
function parse(raw: string | null): ApplicationDraft | null {
  if (!raw) return null;
  let d: Record<string, unknown>;
  try { d = JSON.parse(raw); } catch { return null; }
  if (!d || typeof d !== 'object' || d.v !== VERSION) return null;
  const o = (d.owner && typeof d.owner === 'object' ? d.owner : {}) as Record<string, unknown>;
  const s = (d.shop && typeof d.shop === 'object' ? d.shop : {}) as Record<string, unknown>;
  const owner: OwnerFields = { ...EMPTY_OWNER };
  (Object.keys(EMPTY_OWNER) as (keyof OwnerFields)[]).forEach((k) => { (owner as unknown as Record<string, string>)[k] = str(o[k], 191); });
  const gender = str(o.gender);
  if (gender === 'male' || gender === 'female') owner.gender = gender;
  const shop: ShopFields = {
    ...EMPTY_SHOP,
    store_name: str(s.store_name, 191),
    address: str(s.address, 255),
    area: area(s.area),
    specializations: offeredSpecializations(strList(s.specializations, 30)),
    custom_services: strList(s.custom_services, 5).map((x) => x.slice(0, 40)),
    location: location(s.location),
    branches: branches(s.branches),
  };
  const step = [1, 2, 3, 4].includes(d.step as number) ? (d.step as ApplicationStep) : 1;
  return {
    step,
    owner,
    shop,
    governmentIdType: str(d.governmentIdType, 100),
    planId: typeof d.planId === 'number' && Number.isInteger(d.planId) && d.planId > 0 ? d.planId : null,
    billingCycle: d.billingCycle === 'yearly' ? 'yearly' : 'monthly',
    payOnline: d.payOnline !== false && d.freeTrial !== true,
    freeTrial: bool(d.freeTrial),
    privacyConsent: bool(d.privacyConsent),
    termsAccepted: bool(d.termsAccepted),
    selfieMatch: faceMatch(d.selfieMatch),
  };
}

/** True when this page load is the browser reloading it (F5, pull to refresh, Cmd+Shift+R). */
export function isReload(): boolean {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return nav?.type === 'reload';
  } catch {
    return false;
  }
}

export function readDraft(): ApplicationDraft | null {
  try { return parse(sessionStorage.getItem(KEY)); } catch { return null; }
}

export function writeDraft(d: ApplicationDraft): void {
  try { sessionStorage.setItem(KEY, JSON.stringify({ v: VERSION, ...d })); } catch { /* storage full or blocked: not kept */ }
}

// ---------- the files (IndexedDB) ----------

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(DB_STORE)) req.result.createObjectStore(DB_STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

type StoredFile = { name: string; type: string; blob: Blob };
const toStored = (f: File): StoredFile => ({ name: f.name, type: f.type, blob: f });
const fromStored = (s: unknown): File | null => {
  const o = s as StoredFile | null;
  if (!o || typeof o.name !== 'string' || !(o.blob instanceof Blob)) return null;
  return new File([o.blob], o.name, { type: typeof o.type === 'string' ? o.type : o.blob.type });
};

/** Saves the attached files (replacing what was saved). */
export async function writeDraftFiles({ files, permits }: DraftFiles): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.put(Object.fromEntries(Object.entries(files).map(([k, f]) => [k, toStored(f as File)])), `${FILE_PREFIX}files`);
    store.put(permits.map(toStored), `${FILE_PREFIX}permits`);
    await new Promise<void>((res) => { tx.oncomplete = () => res(); tx.onerror = () => res(); tx.onabort = () => res(); });
  } catch { /* quota or private mode: files are just not kept */ } finally { db.close(); }
}

export async function readDraftFiles(): Promise<DraftFiles> {
  const empty: DraftFiles = { files: {}, permits: [] };
  const db = await openDb();
  if (!db) return empty;
  try {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const get = (k: string) => new Promise<unknown>((res) => { const r = store.get(k); r.onsuccess = () => res(r.result); r.onerror = () => res(null); });
    const [rawFiles, rawPermits] = await Promise.all([get(`${FILE_PREFIX}files`), get(`${FILE_PREFIX}permits`)]);
    const keys: DocumentKey[] = ['landmark_image', 'dti_registration', 'tin_id', 'brgy_clearance', 'government_id', 'selfie_with_id', 'payment_receipt'];
    const files: Partial<Record<DocumentKey, File>> = {};
    if (rawFiles && typeof rawFiles === 'object') {
      keys.forEach((k) => { const f = fromStored((rawFiles as Record<string, unknown>)[k]); if (f) files[k] = f; });
    }
    const permits = Array.isArray(rawPermits) ? rawPermits.map(fromStored).filter((f): f is File => f !== null).slice(0, 5) : [];
    return { files, permits };
  } catch {
    return empty;
  } finally {
    db.close();
  }
}

/** Forgets the draft: answers and files. */
export async function clearDraft(): Promise<void> {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  const db = await openDb();
  if (!db) return;
  try {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(`${FILE_PREFIX}files`);
    tx.objectStore(DB_STORE).delete(`${FILE_PREFIX}permits`);
  } catch { /* ignore */ } finally { db.close(); }
}
