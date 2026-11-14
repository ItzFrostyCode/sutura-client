'use client';

import { useCallback, useEffect, useState } from 'react';
import type { useOrderData } from './useOrderData';
import { phoneDigits, type Area, type Unit } from './orderPoints';

export type Mode = 'individual' | 'group';
export type Source = 'saved' | 'standard' | 'own' | 'shop';
export type Material = 'shop' | 'own' | '';
export type PayMethod = 'gcash' | 'cash' | '';

/**
 * One person on a Group order. area is what this person gets ('' = the order's part). size is a chart size or
 * CUSTOM_FIT (then fit holds their measurements). extra holds the service's own list columns (Jersey Number…).
 */
export interface RosterRow {
  id: string;
  name: string;
  area: Area | '';
  size: string;
  bottomSize: string;
  fit: Record<string, string>;
  /** This person's own unit for each measurement (inches unless switched). */
  units: Record<string, Unit>;
  extra: Record<string, string>;
  /** This person's own option on a group order (Complete set / Blouse only…); null = the order's option. */
  pricingId?: number | null;
}

export const CUSTOM_FIT = 'Custom Fit';

/** What this person gets: the option's part when it decides it, else their own choice, else the order's part. */
export const rowArea = (row: RosterRow, orderArea: Area | '', locked: boolean): Area | '' => (locked ? orderArea : row.area || orderArea);

/** The part a Custom Fit person is measured for: only the part(s) whose size is Custom Fit. */
export function customArea(row: RosterRow, area: Area | ''): Area | '' {
  if (area !== 'both') return area;
  const top = row.size === CUSTOM_FIT;
  const bottom = row.bottomSize === CUSTOM_FIT;
  return top && bottom ? 'both' : top ? 'top' : bottom ? 'bottom' : '';
}
const newRow = (): RosterRow => ({ id: Math.random().toString(36).slice(2), name: '', area: '', size: '', bottomSize: '', fit: {}, units: {}, extra: {} });

/** Every answer the customer types, step by step. Pure state: the rules live in orderRules.ts. */
export function useOrderForm(data: ReturnType<typeof useOrderData>, designFromLink: number | null, accountPhone: string) {
  // Details
  const [phone, setPhoneRaw] = useState('');
  const [branchId, setBranchId] = useState<number | null>(null);
  // Order
  const [pricingId, setPricingId] = useState<number | null>(null);
  const [areaChoice, setAreaChoice] = useState<Area | ''>('');
  const [mode, setMode] = useState<Mode>('individual');
  const [quantity, setQuantity] = useState(1);
  // Sizes — one person
  const [wearer, setWearer] = useState('');
  // The fit one person is cut for (Men's / Ladies' / Kids); '' = the shop decides or asks.
  const [cut, setCut] = useState('');
  const [source, setSource] = useState<Source>('shop');
  const [measurementId, setMeasurementId] = useState<number | null>(null);
  const [size, setSize] = useState('');
  const [sizeBottom, setSizeBottom] = useState('');
  const [unit, setUnitRaw] = useState<Unit | ''>('');
  const [points, setPoints] = useState<Record<string, string>>({});
  const [sheets, setSheets] = useState<string[]>([]);
  // Sizes — group
  const [teamName, setTeamName] = useState('');
  // With a shop chart, a group picks chart sizes ('standard') or types measurements ('measure') instead.
  const [groupSizing, setGroupSizing] = useState<'standard' | 'measure'>('standard');
  // Measuring columns the customer removed from the group's table (labels).
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  // Measuring columns the customer added to the Top or the Bottom of the group's table.
  const [customCols, setCustomCols] = useState<{ top: string[]; bottom: string[] }>({ top: [], bottom: [] });
  const addCustomCol = (part: 'top' | 'bottom', label: string) => setCustomCols((c) => ({ ...c, [part]: [...c[part], label] }));
  const removeCustomCol = (label: string) => setCustomCols((c) => ({ top: c.top.filter((l) => l !== label), bottom: c.bottom.filter((l) => l !== label) }));
  const toggleCol = (label: string) => setHiddenCols((cols) => (cols.includes(label) ? cols.filter((c) => c !== label) : [...cols, label]));
  const [roster, setRoster] = useState<RosterRow[]>([]);
  // Style
  const [designId, setDesignId] = useState<number | null>(designFromLink);
  const [photos, setPhotos] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [material, setMaterial] = useState<Material>('');
  const [materialNote, setMaterialNote] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  // Review
  const [neededBy, setNeededBy] = useState('');
  const [rush, setRush] = useState(false);
  const [payFull, setPayFull] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('');

  const setPhone = (v: string) => setPhoneRaw(phoneDigits(v));
  useEffect(() => { if (accountPhone) setPhoneRaw((p) => p || phoneDigits(accountPhone)); }, [accountPhone]);

  const svc = data.service;
  useEffect(() => {
    if (!svc) return;
    // The first option the shop listed is picked to start with; the customer can change it.
    if ((svc.pricing ?? []).length > 0) setPricingId((id) => id ?? svc.pricing![0].id);
  }, [svc]);
  // Measurements the shop already has: offered first.
  useEffect(() => {
    if (data.saved.length === 0) return;
    setSource((s) => (s === 'shop' ? 'saved' : s));
    setMeasurementId((id) => id ?? data.saved[0].id);
  }, [data.saved]);

  /** Switching unit clears the numbers: they were typed in the other unit and are never converted behind your back. */
  const setUnit = (next: Unit) => {
    setUnitRaw(next);
    setPoints({});
    setRoster((rows) => rows.map((r) => ({ ...r, fit: {} })));
  };
  const hasNumbers = Object.values(points).some((v) => v.trim()) || roster.some((r) => Object.values(r.fit).some((v) => v.trim()));

  /** A group starts with exactly the minimum number of people, so the customer sees how many to fill in. */
  const startGroup = useCallback((min: number) => {
    setMode('group');
    setRoster((rows) => (rows.length >= min ? rows : [...rows, ...Array.from({ length: min - rows.length }, newRow)]));
  }, []);
  const addPeople = (n: number) => setRoster((rows) => [...rows, ...Array.from({ length: n }, newRow)]);
  const updateRow = (id: string, patch: Partial<RosterRow>) => setRoster((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) => setRoster((rows) => rows.filter((r) => r.id !== id));
  /** Paste a list of names (one per line): fills the empty rows first, then adds rows. */
  const pasteNames = (text: string) => {
    const names = text.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean);
    setRoster((rows) => {
      const out = rows.map((r) => ({ ...r }));
      for (const name of names) {
        const empty = out.find((r) => !r.name.trim());
        if (empty) empty.name = name;
        else out.push({ ...newRow(), name });
      }
      return out;
    });
  };

  return {
    phone, setPhone, branchId, setBranchId,
    pricingId, setPricingId, areaChoice, setAreaChoice, mode, setMode, startGroup, quantity, setQuantity,
    wearer, setWearer, cut, setCut, source, setSource, measurementId, setMeasurementId, size, setSize, sizeBottom, setSizeBottom,
    unit, setUnit, hasNumbers, points, setPoints, sheets, setSheets,
    teamName, setTeamName, groupSizing, setGroupSizing, hiddenCols, toggleCol, customCols, addCustomCol, removeCustomCol, roster, addPeople, updateRow, removeRow, pasteNames,
    designId, setDesignId, photos, setPhotos, link, setLink, material, setMaterial, materialNote, setMaterialNote,
    answers, setAnswers, notes, setNotes,
    neededBy, setNeededBy, rush, setRush, payFull, setPayFull, payMethod, setPayMethod,
  };
}

export type OrderForm = ReturnType<typeof useOrderForm>;
