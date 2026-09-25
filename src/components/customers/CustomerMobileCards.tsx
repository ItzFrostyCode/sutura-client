import React from 'react';
import Image from 'next/image';
import { Mail, Phone, Package, Eye, Pencil, Trash2, Users } from 'lucide-react';
import { CustomerData } from './customerTypes';
import { isWalkInEmail, SUKI_TAG_CONFIG } from './customerHelpers';

interface CustomerMobileCardsProps {
  readonly customers: CustomerData[];
  readonly onView: (id: number) => void;
  readonly onEdit: (e: React.MouseEvent, c: CustomerData) => void;
  readonly onDelete: (e: React.MouseEvent, id: number) => void;
}

export default function CustomerMobileCards({
  customers,
  onView,
  onEdit,
  onDelete,
}: CustomerMobileCardsProps) {
  if (customers.length === 0) {
    return (
      <div className="md:hidden p-10 text-center text-ink-faint text-xs">
        <Users size={28} className="mx-auto mb-2 opacity-40" />
        No customers found matching your criteria.
      </div>
    );
  }

  return (
    <div className="md:hidden divide-y divide-line">
      {customers.map((customer) => {
        const sukiCfg = customer.suki_tag ? SUKI_TAG_CONFIG[customer.suki_tag] : null;

        return (
          <div
            key={customer.id}
            onClick={() => onView(customer.id)}
            className="p-4 space-y-3 active:bg-sunken/20 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-canvas border border-line overflow-hidden shrink-0 flex items-center justify-center">
                {customer.profile_picture ? (
                  <Image
                    src={customer.profile_picture}
                    alt={customer.name}
                    className="w-full h-full object-cover"
                    width={44}
                    height={44}
                  />
                ) : (
                  <span className="text-sm font-black text-taupe">{customer.name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-ink text-sm truncate">{customer.name}</span>
                  {sukiCfg && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${sukiCfg.badgeCls}`}>
                      {sukiCfg.label}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-ink-muted">
                  Joined{' '}
                  {new Date(customer.created_at).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(customer.id);
                  }}
                  className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
                  title="View Profile"
                >
                  <Eye size={15} />
                </button>
                <button
                  type="button"
                  onClick={(e) => onEdit(e, customer)}
                  className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
                  title="Edit Customer"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={(e) => onDelete(e, customer.id)}
                  className="p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-canvas transition-colors"
                  title="Delete Customer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-body pl-14">
              {customer.email && !isWalkInEmail(customer.email) ? (
                <span className="flex items-center gap-1 text-ink-muted truncate">
                  <Mail size={12} className="text-ink-faint shrink-0" /> {customer.email}
                </span>
              ) : (
                <span className="inline-flex items-center text-[9px] font-bold bg-canvas text-ink-muted px-1.5 py-0.5 rounded border border-line uppercase tracking-wider">
                  Walk-in
                </span>
              )}
              {customer.phone && (
                <span className="flex items-center gap-1 text-ink-muted font-mono">
                  <Phone size={12} className="text-ink-faint shrink-0" /> {customer.phone}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pl-14 pt-2 border-t border-line/60">
              {(customer.active_jobs ?? 0) > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sage/10 text-sage border border-sage/20">
                  <Package size={11} /> {customer.active_jobs} Active Jobs
                </span>
              ) : (
                <span className="text-[11px] text-ink-faint">No active orders</span>
              )}
              <div className="text-right">
                <div className="font-bold text-ink text-xs font-mono">
                  ₱{Number(customer.total_spend).toLocaleString()}
                </div>
                <div className="text-[10px] text-ink-faint">{customer.completed_jobs} completed</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
