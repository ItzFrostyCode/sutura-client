'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/axios';
import { getSavedLocation, LOCATION_CHANGED_EVENT, requestCurrentLocation, type SavedLocation } from '@/lib/customerLocation';
import type { StoreResult } from '@/components/home/homeTypes';
import type { MyOrder } from '@/components/account/orders/ordersTypes';
import type { MyAppointment } from '@/components/account/hub/accountTypes';
import { optionById, type AskOption, type AskParams, type MenuKey } from './askQuestions';

export type AskShop = StoreResult & { matching_items_count?: number; services_count?: number };

export type AskAnswer =
  | { kind: 'loading' }
  | { kind: 'error'; optionId: string }
  | { kind: 'text'; text: string }
  | { kind: 'shops'; optionId: string; about: string; empty: string; shops: AskShop[]; total: number; needsLocation: boolean; seeAllHref: string }
  | { kind: 'orders'; orders: MyOrder[]; total: number }
  | { kind: 'appointments'; appointments: MyAppointment[]; total: number }
  | { kind: 'steps' };

export type AskMessage =
  | { id: number; from: 'customer'; text: string }
  | { id: number; from: 'sutura'; answer: AskAnswer };

const PER_PAGE = 5;

async function fetchShops(params: AskParams, location: SavedLocation | null) {
  const res = await api.get('/public/stores', {
    params: { ...params, ...(location ? { lat: location.lat, lng: location.lng } : {}), per_page: PER_PAGE },
  });
  const shops: AskShop[] = res.data.data ?? [];
  return { shops, total: Number(res.data.meta?.total ?? shops.length) };
}

/** Answers one menu choice from live data. `total` always comes from the server, never from the short list shown. */
async function answerFor(option: AskOption, here: SavedLocation | null): Promise<AskAnswer> {
  const { action } = option;
  switch (action.kind) {
    case 'menu':
      return { kind: 'text', text: action.prompt };
    case 'steps':
      return { kind: 'steps' };
    case 'orders': {
      const res = await api.get('/my-orders', { params: { active: 1, per_page: PER_PAGE } });
      return { kind: 'orders', orders: res.data.data ?? [], total: Number(res.data.meta?.total ?? 0) };
    }
    case 'appointments': {
      const res = await api.get('/my-appointments', { params: { upcoming: 1, per_page: 3 } });
      return { kind: 'appointments', appointments: res.data.data ?? [], total: Number(res.data.meta?.total ?? 0) };
    }
    case 'shops': {
      const { shops, total } = await fetchShops(action.params, here);
      return {
        kind: 'shops', optionId: option.id, about: action.about, empty: action.empty, shops, total,
        // "Near me" without a location lists Davao's shops and offers to turn the location on.
        needsLocation: !!action.nearby && !here,
        seeAllHref: action.seeAllHref,
      };
    }
  }
}

/** The conversation: each tapped choice is shown as the customer's question, then answered in turn. */
export function useAskSutura() {
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [menu, setMenu] = useState<MenuKey>('main');
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const nextId = useRef(1);
  const busy = messages.some((m) => m.from === 'sutura' && m.answer.kind === 'loading');

  useEffect(() => {
    setLocation(getSavedLocation());
    const onChange = (e: Event) => setLocation((e as CustomEvent<SavedLocation>).detail ?? getSavedLocation());
    window.addEventListener(LOCATION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(LOCATION_CHANGED_EVENT, onChange);
  }, []);

  const choose = useCallback(async (optionId: string, here: SavedLocation | null = location) => {
    const option = optionById(optionId);
    if (!option || busy) return;
    const askId = nextId.current++;
    const replyId = nextId.current++;
    setMessages((ms) => [...ms, { id: askId, from: 'customer', text: option.label }, { id: replyId, from: 'sutura', answer: { kind: 'loading' } }]);
    // A sub-menu stays open until something is picked from it; any answer brings back the main menu.
    setMenu(option.action.kind === 'menu' ? option.action.menu : 'main');

    let answer: AskAnswer;
    try {
      answer = await answerFor(option, here);
    } catch {
      answer = { kind: 'error', optionId };
    }
    setMessages((ms) => ms.map((m) => (m.id === replyId ? { id: replyId, from: 'sutura', answer } : m)));
  }, [busy, location]);

  const reset = useCallback(() => { setMessages([]); setMenu('main'); }, []);

  // "Shops near me" asked without a location: get it, then ask the same question again.
  const [locating, setLocating] = useState(false);
  const locateAndAsk = useCallback((optionId: string) => {
    setLocating(true);
    requestCurrentLocation(
      (loc) => { setLocating(false); setLocation(loc); void choose(optionId, loc); },
      () => setLocating(false),
    );
  }, [choose]);

  return { messages, menu, choose, busy, reset, location, locating, locateAndAsk };
}
