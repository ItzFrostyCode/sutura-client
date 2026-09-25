import { PORTFOLIO_COLOR_OPTIONS } from '@/components/store-storefront/types';
import type { NavColumn } from './navColumns';

export const DEPARTMENT_KEY_MAP: Record<string, string> = {
  men: 'men',
  women: 'women',
  wedding: 'wedding',
  corporate_teams: 'office',
};

/**
 * Builds a standardized, unified COLOR column matching the /search filter palette
 * (PORTFOLIO_COLOR_OPTIONS). Guarantees exact labels, hex codes, and URL params.
 */
export function buildUnifiedColorColumn(baseHref: string, department?: string): NavColumn {
  let targetHref = baseHref;
  if (department && !targetHref.includes('department=')) {
    const sep = targetHref.includes('?') ? '&' : '?';
    targetHref = `${targetHref}${sep}department=${encodeURIComponent(department)}`;
  }

  return {
    title: 'COLOR',
    items: PORTFOLIO_COLOR_OPTIONS.map((c) => {
      const sep = targetHref.includes('?') ? '&' : '?';
      return {
        label: c.label,
        href: `${targetHref}${sep}color=${encodeURIComponent(c.label)}`,
        hex: c.hex,
      };
    }),
  };
}
