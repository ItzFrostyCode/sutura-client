'use client';

import React from 'react';
import { Loader2, Pencil, Trash2, Package as PackageIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import { ServicePackage } from './serviceHelpers';
import SearchInput from '@/components/shared/SearchInput';

interface ServicePackageListViewProps {
  readonly filteredPackages: ServicePackage[];
  readonly loading: boolean;
  readonly search: string;
  readonly onSearchChange: (val: string) => void;
  readonly onEdit: (pkg: ServicePackage) => void;
  readonly onDelete: (id: number) => void;
  // Optional so existing /services page caller (which doesn't pass it) still compiles
  readonly onToggleActive?: (pkg: ServicePackage) => void;
}

export default function ServicePackageListView({
  filteredPackages,
  loading,
  search,
  onSearchChange,
  onEdit,
  onDelete,
  onToggleActive,
}: ServicePackageListViewProps) {
  return (
    <div className="space-y-4">
      <SearchInput id="package-search" value={search} onChange={onSearchChange} placeholder="Search packages..." className="max-w-sm" />

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-ink-faint">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : filteredPackages.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16 bg-canvas/50 border border-dashed border-line rounded-2xl">
          <PackageIcon size={28} className="mx-auto text-ink-faint mb-2" />
          {search ? (
            <p className="text-sm text-ink-muted">No packages match &ldquo;{search}&rdquo;.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-ink-body mb-1">No packages yet</p>
              <p className="text-xs text-ink-muted">
                Bundle 2 or more services into a combo deal to get started.
              </p>
            </>
          )}
        </div>
      ) : (
        /* Package grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.map((pkg) => {
            const sumPrice = pkg.services.reduce(
              (sum, s) => sum + (Number(s.base_price) || 0),
              0,
            );
            const bundlePrice = pkg.bundle_price ? Number(pkg.bundle_price) : null;
            const displayPrice = bundlePrice ?? sumPrice;
            const hasSavings = bundlePrice !== null && sumPrice > bundlePrice && sumPrice > 0;
            const savingsPct =
              hasSavings ? Math.round(((sumPrice - bundlePrice!) / sumPrice) * 100) : 0;

            return (
              <div
                key={pkg.id}
                className={`bg-white border rounded-2xl p-4 flex flex-col gap-3 transition-opacity ${
                  pkg.is_active ? 'border-line' : 'border-line opacity-60'
                }`}
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-taupe/10 text-taupe flex items-center justify-center shrink-0">
                      <PackageIcon size={16} />
                    </div>
                    <h3 className="font-semibold text-sm text-ink truncate">{pkg.name}</h3>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      pkg.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-sunken text-ink-faint border border-line'
                    }`}
                  >
                    {pkg.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Description */}
                {pkg.description && (
                  <p className="text-xs text-ink-muted line-clamp-2">{pkg.description}</p>
                )}

                {/* Included services */}
                <div className="flex flex-wrap gap-1.5">
                  {pkg.services.map((s) => (
                    <span
                      key={s.id}
                      className="text-[11px] bg-canvas text-ink-body border border-line rounded-full px-2 py-0.5"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>

                {/* Price row + actions */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-line">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink">
                        ₱{displayPrice.toLocaleString()}
                      </p>
                      {hasSavings && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-bold">
                          -{savingsPct}%
                        </span>
                      )}
                    </div>
                    {hasSavings && (
                      <p className="text-[11px] text-ink-faint line-through">
                        ₱{sumPrice.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5">
                    {/* Toggle active/inactive */}
                    {onToggleActive && (
                      <button
                        type="button"
                        onClick={() => onToggleActive(pkg)}
                        title={pkg.is_active ? 'Deactivate package' : 'Activate package'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          pkg.is_active
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-ink-faint hover:text-ink hover:bg-sunken'
                        }`}
                      >
                        {pkg.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEdit(pkg)}
                      title="Edit package"
                      className="p-1.5 text-ink-faint hover:text-ink hover:bg-sunken rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(pkg.id)}
                      title="Delete package"
                      className="p-1.5 text-ink-faint hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
