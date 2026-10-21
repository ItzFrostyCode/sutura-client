import { useMemo, useState } from 'react';
import type { Service } from './serviceHelpers';
import type { GarmentCategory } from '@/lib/garmentTaxonomy';
import type { ServiceStatusFilter } from './ServiceFilterBody';
import { DEFAULT_SERVICE_SORT, isServicePriceSort, type ServiceSortOption } from './serviceSort';
import { garmentOptions, kindOptions, matchesGarmentCategory, searchText, taskOptions } from './serviceTaxonomyFilters';

const effectivePrice = (s: Service) => {
  if (s.sale_price != null && Number(s.sale_price) > 0) return Number(s.sale_price);
  if (s.base_price != null && Number(s.base_price) > 0) return Number(s.base_price);
  const minTierPrice = (s.pricing ?? [])
    .map((p) => Number(p.amount))
    .filter((a) => !isNaN(a) && a > 0);
  if (minTierPrice.length > 0) return Math.min(...minTierPrice);
  return 0;
};

/** Search, sort and the filters of the Services page: status, kind of work, garment category, task. */
export function useServiceFilters(services: Service[]) {
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<ServiceSortOption>(DEFAULT_SERVICE_SORT);
  const [statusFilter, setStatusFilter] = useState<ServiceStatusFilter>('');
  const [kindFilter, setKindFilter] = useState('');
  const [garmentFilter, setGarmentFilter] = useState('');
  const [taskFilter, setTaskFilter] = useState('');

  const options = useMemo(() => ({
    // Tasks belong to a kind of work, so they are offered only once one is picked — otherwise it is one long mixed list.
    kinds: kindOptions(services), garments: garmentOptions(services), tasks: kindFilter ? taskOptions(services, kindFilter) : [],
  }), [services, kindFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services
      .filter((s) => {
        if (statusFilter === 'active' && !s.is_active) return false;
        if (statusFilter === 'paused' && s.is_active) return false;
        if (kindFilter && s.service_category !== kindFilter) return false;
        if (garmentFilter && !matchesGarmentCategory(s, garmentFilter as GarmentCategory)) return false;
        if (taskFilter && !(s.capabilities ?? []).includes(taskFilter)) return false;
        return !q || searchText(s).includes(q);
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case 'price_asc': return effectivePrice(a) - effectivePrice(b);
          case 'price_desc': return effectivePrice(b) - effectivePrice(a);
          case 'top_rated': return Number(b.reviews_avg_rating ?? 0) - Number(a.reviews_avg_rating ?? 0);
          case 'most_saved': return (b.saves_count ?? 0) - (a.saves_count ?? 0);
          default: return (b.job_orders_count ?? 0) - (a.job_orders_count ?? 0);
        }
      });
  }, [services, search, sortOrder, statusFilter, kindFilter, garmentFilter, taskFilter]);

  const activeFiltersCount = [isServicePriceSort(sortOrder), statusFilter, kindFilter, garmentFilter, taskFilter].filter(Boolean).length;
  const resetAll = () => {
    setSortOrder(DEFAULT_SERVICE_SORT); setStatusFilter(''); setKindFilter(''); setGarmentFilter(''); setTaskFilter('');
  };
  // A task belongs to a kind of work: switching kind drops a task that kind does not have.
  const chooseKind = (v: string) => { setKindFilter(v); setTaskFilter(''); };

  return {
    search, setSearch, sortOrder, setSortOrder, statusFilter, setStatusFilter, kindFilter, chooseKind,
    garmentFilter, setGarmentFilter, taskFilter, setTaskFilter, options, filtered, activeFiltersCount, resetAll,
  };
}

export type ServiceFilters = ReturnType<typeof useServiceFilters>;
