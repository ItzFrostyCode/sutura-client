import React from 'react';
import Image from 'next/image';
import { Mail, Phone, Package, Eye, Pencil, Trash2, Users } from 'lucide-react';
import { CustomerData } from './customerTypes';
import { isWalkInCustomer, isWalkInEmail, SUKI_TAG_CONFIG } from './customerHelpers';

interface CustomerTableProps {
  readonly customers: CustomerData[];
  readonly onView: (id: number) => void;
  readonly onEdit: (e: React.MouseEvent, c: CustomerData) => void;
  readonly onDelete: (e: React.MouseEvent, id: number) => void;
}

export default function CustomerTable({
  customers,
  onView,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-canvas/50 border-b border-line text-[11px] uppercase tracking-wider text-ink-muted font-bold">
            <th className="p-4">Client Profile</th>
            <th className="p-4">Contact Info</th>
            <th className="p-4 text-center">Active Jobs</th>
            <th className="p-4 text-right">Lifetime Spend</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {customers.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-12 text-center text-ink-faint text-xs">
                <Users size={32} className="mx-auto mb-2 opacity-40" />
                No clients found matching your search. Click &quot;Add Customer&quot; to register a new client.
              </td>
            </tr>
          ) : (
            customers.map((customer) => {
              const sukiCfg = customer.suki_tag ? SUKI_TAG_CONFIG[customer.suki_tag] : null;

              return (
                <tr
                  key={customer.id}
                  onClick={() => onView(customer.id)}
                  className="hover:bg-canvas/60 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-canvas border border-line overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                        {customer.profile_picture ? (
                          <Image
                            src={customer.profile_picture}
                            alt={customer.name}
                            className="w-full h-full object-cover"
                            width={40}
                            height={40}
                          />
                        ) : (
                          <span className="text-sm font-black text-taupe">{customer.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink group-hover:text-taupe transition-colors text-sm">
                            {customer.name}
                          </span>
                          {sukiCfg && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${sukiCfg.badgeCls}`}>
                              {sukiCfg.label}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          Customer since{' '}
                          {new Date(customer.created_at).toLocaleDateString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="space-y-1">
                      {isWalkInCustomer(customer) ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center text-[9px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
                            Walk-in
                          </span>
                          {customer.email && !isWalkInEmail(customer.email) && (
                            <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                              <Mail size={12} className="text-ink-faint shrink-0" />
                              <span className="truncate max-w-45">{customer.email}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {customer.email && (
                            <div className="flex items-center gap-1.5 text-xs text-ink-body">
                              <Mail size={13} className="text-ink-faint shrink-0" />
                              <span className="truncate max-w-45">{customer.email}</span>
                            </div>
                          )}
                          <span className="inline-flex items-center text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 uppercase tracking-wider">
                            Online
                          </span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-ink-body font-mono">
                          <Phone size={12} className="text-ink-faint shrink-0" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    {(customer.active_jobs ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sage/10 text-sage border border-sage/20 shadow-2xs">
                        <Package size={12} />
                        {customer.active_jobs} Active
                      </span>
                    ) : (
                      <span className="text-ink-faint text-xs font-medium">-</span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <div className="font-black text-ink text-sm font-mono">
                      ₱{Number(customer.total_spend).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-ink-muted">{customer.completed_jobs} completed orders</div>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(customer.id);
                        }}
                        className="h-8 w-8 rounded-lg bg-surface border border-line text-ink-muted hover:text-ink hover:border-taupe flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                        title="View Customer Profile"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => onEdit(e, customer)}
                        className="h-8 w-8 rounded-lg bg-surface border border-line text-ink-muted hover:text-ink hover:border-taupe flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                        title="Edit Customer Details"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => onDelete(e, customer.id)}
                        className="h-8 w-8 rounded-lg bg-surface border border-line text-ink-muted hover:text-danger hover:border-danger/40 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                        title="Delete Customer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
