'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import { getSavedLocation, LOCATION_CHANGED_EVENT, requestCurrentLocation, type SavedLocation } from '@/lib/customerLocation';
import { readQuestion, RELAX_ORDER, type AskParams, type AskTerm } from '@/lib/askSutura';
import type { StoreResult } from '@/components/home/homeTypes';

export type AskShop = StoreResult & { matching_items_count?: number; services_count?: number };

export type AskAnswer =
  | { kind: 'loading' }
  | { kind: 'error'; question: string }
  | { kind: 'link'; reply: string; href: string; cta: string }
  | { kind: 'unclear' }
  | {
      kind: 'shops';
      question: string;
      terms: AskTerm[];
      dropped: { key: keyof AskParams; label: string }[];
      shops: AskShop[];
      total: number;
      needsLocation: boolean;
      seeAllHref: string;
    };

export type AskMessage =
  | { id: number; from: 'customer'; text: string }
  | { id: number; from: 'sutura'; answer: AskAnswer };

const PER_PAGE = 5;

function seeAllHref(p: AskParams): string {
  const s = new URLSearchParams();
  if (p.q) s.set('q', p.q);
  if (p.specialization) s.set('specialization', p.specialization);
  if (p.department) s.set('department', p.department);
  if (p.max_price) s.set('maxPrice', String(p.max_price));
  if (p.min_rating) s.set('minRating', String(p.min_rating));
  if (p.district) s.set('district', p.district);
  if (p.sort_by) s.set('sortBy', p.sort_by);
  const qs = s.toString();
  return qs ? `/search?${qs}` : '/search';
}

async function fetchShops(params: AskParams, location: SavedLocation | null) {
  const res = await api.get('/public/stores', {
    params: { ...params, ...(location ? { lat: location.lat, lng: location.lng } : {}), per_page: PER_PAGE },
  });
  const shops: AskShop[] = res.data.data ?? [];
  return { shops, total: Number(res.data.meta?.total ?? shops.length) };
}

/** The conversation: each question is read, searched, and answered in turn. */
export function useAskSutura() {
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const nextId = useRef(1);
  const busy = messages.some((m) => m.from === 'sutura' && m.answer.kind === 'loading');

  useEffect(() => {
    setLocation(getSavedLocation());
    const onChange = (e: Event) => setLocation((e as CustomEvent<SavedLocation>).detail ?? getSavedLocation());
    window.addEventListener(LOCATION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(LOCATION_CHANGED_EVENT, onChange);
  }, []);

  const ask = useCallback(async (raw: string, here: SavedLocation | null = location) => {
    const text = raw.trim();
    if (!text || busy) return;
    const askId = nextId.current++;
    const replyId = nextId.current++;
    const answer = (a: AskAnswer) =>
      setMessages((ms) => ms.map((m) => (m.id === replyId ? { id: replyId, from: 'sutura', answer: a } : m)));

    setMessages((ms) => [...ms, { id: askId, from: 'customer', text }, { id: replyId, from: 'sutura', answer: { kind: 'loading' } }]);

    const intent = readQuestion(text);
    if (intent.kind === 'link') { answer(intent); return; }
    if (intent.terms.length === 0) { answer({ kind: 'unclear' }); return; }

    const params: AskParams = { ...intent.params };
    let terms = intent.terms;
    // "Near me" without a location can't be measured: search all of Davao
    // and say so, instead of returning nothing.
    const needsLocation = intent.wantsNearby && !here;
    if (needsLocation) {
      delete params.radius_km;
      terms = terms.filter((t) => t.key !== 'radius_km');
    }

    try {
      let result = await fetchShops(params, here);
      const dropped: typeof RELAX_ORDER = [];
      for (const step of RELAX_ORDER) {
        if (result.total > 0) break;
        if (params[step.key] === undefined) continue;
        delete params[step.key];
        dropped.push(step);
        result = await fetchShops(params, here);
      }
      answer({
        kind: 'shops',
        question: text,
        terms,
        dropped: result.total > 0 ? dropped : [],
        shops: result.shops,
        total: result.total,
        needsLocation,
        seeAllHref: seeAllHref(params),
      });
    } catch {
      answer({ kind: 'error', question: text });
    }
  }, [busy, location]);

  const reset = useCallback(() => setMessages([]), []);

  // "Near me" asked without a location: get it, then ask the same question again.
  const [locating, setLocating] = useState(false);
  const locateAndAsk = useCallback((question: string) => {
    setLocating(true);
    requestCurrentLocation(
      (loc) => { setLocating(false); setLocation(loc); void ask(question, loc); },
      () => setLocating(false),
    );
  }, [ask]);

  return { messages, ask, busy, reset, location, locating, locateAndAsk };
}
