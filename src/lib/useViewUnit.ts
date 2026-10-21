'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MeasureUnit } from './measurementUnit';

const KEY = 'sutura_view_unit';

/** The unit a customer likes to read measurements in ('' = each as it was recorded). Kept in this browser only. */
export function useViewUnit(): [MeasureUnit | '', (u: MeasureUnit | '') => void] {
  const [unit, setUnit] = useState<MeasureUnit | ''>('');
  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v === 'in' || v === 'cm') setUnit(v); } catch { /* storage unavailable: the choice just is not remembered */ }
  }, []);
  const choose = useCallback((u: MeasureUnit | '') => {
    setUnit(u);
    try { if (u) localStorage.setItem(KEY, u); else localStorage.removeItem(KEY); } catch { /* not remembered */ }
  }, []);
  return [unit, choose];
}
