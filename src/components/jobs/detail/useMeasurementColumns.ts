import { useEffect, useState } from 'react';
import type { MeasurementAreaChoice } from '@/components/measurements/recorder/AreaSelector';
import type { Job } from '../jobTypes';

export const DEFAULT_TOP_METRICS = ['Chest', 'Shoulder', 'Sleeve', 'Neck', 'Shirt Length'];
export const DEFAULT_BOTTOM_METRICS = ['Waist', 'Hips', 'Inseam', 'Outseam', 'Thigh'];
const KNOWN_BOTTOM_KEYS = new Set(['waist', 'hips', 'high hips', 'full hips', 'inseam', 'outseam', 'thigh', 'knee', 'bottom hem', 'crotch / rise', 'crotch', 'rise', 'skirt length', 'leg opening', 'ankle']);

export interface AreaColumns {
  readonly columns: string[];
  readonly add: (name: string) => void;
  readonly remove: (name: string) => void;
  readonly rename: (oldName: string, newName: string) => void;
}

/** The typed values and the Top / Bottom field lists of the measurement form, started from the order's current profile when it has one. */
export function useMeasurementColumns(measurement: Job['measurement'] | null | undefined) {
  const [metrics, setMetrics] = useState<Record<string, string>>({});
  const [area, setArea] = useState<MeasurementAreaChoice>('both');
  const [top, setTop] = useState<string[]>([...DEFAULT_TOP_METRICS]);
  const [bottom, setBottom] = useState<string[]>([...DEFAULT_BOTTOM_METRICS]);

  useEffect(() => {
    if (!measurement) return;
    const raw = measurement.metrics || {};
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) if (!k.startsWith('_')) clean[k] = String(v ?? '');
    setMetrics(clean);
    setArea((raw._area as MeasurementAreaChoice) || 'both');
    const topSet = new Set(DEFAULT_TOP_METRICS);
    const bottomSet = new Set(DEFAULT_BOTTOM_METRICS);
    for (const k of Object.keys(clean)) (KNOWN_BOTTOM_KEYS.has(k.toLowerCase()) ? bottomSet : topSet).add(k);
    setTop(Array.from(topSet));
    setBottom(Array.from(bottomSet));
  }, [measurement]);

  const columnsOf = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>): AreaColumns => ({
    columns: list,
    add: (name) => setList((prev) => (prev.some((c) => c.toLowerCase() === name.toLowerCase()) ? prev : [...prev, name])),
    remove: (name) => setList((prev) => prev.filter((c) => c !== name)),
    rename: (oldName, newName) => {
      setList((prev) => prev.map((c) => (c === oldName ? newName : c)));
      setMetrics((prev) => {
        if (prev[oldName] === undefined) return prev;
        const { [oldName]: value, ...rest } = prev;
        return { ...rest, [newName]: value };
      });
    },
  });

  return {
    metrics, area, setArea,
    setMetric: (key: string, value: string) => setMetrics((prev) => ({ ...prev, [key]: value })),
    top: columnsOf(top, setTop),
    bottom: columnsOf(bottom, setBottom),
  };
}
