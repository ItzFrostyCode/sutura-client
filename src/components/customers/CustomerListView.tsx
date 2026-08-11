import React from 'react';
import Image from 'next/image';
import { Search, Mail, Phone, Package, Eye, Pencil, Trash2, Star, Store, User, type LucideIcon } from 'lucide-react';
import { isWalkInEmail } from './customerHelpers';
import { CustomerData } from './customerTypes';
import SearchInput from '@/components/shared/SearchInput';

type FilterType = 'all' | 'online' | 'walkin' | 'b2b_suki' | 'reseller' | 'walk_in_retail';

interface CustomerListViewProps {
  readonly customers: CustomerData[];
  readonly filteredCustomers: CustomerData[];
  readonly loading: boolean;
  readonly search: string;
  readonly onSearchChange: (val: string) => void;
  readonly filterType: FilterType;
  readonly onFilterTypeChange: (val: FilterType) => void;
  readonly onView: (id: number) => void;
  readonly onEdit: (customer: CustomerData) => void;
  readonly onDelete: (id: number) => void;
}

export default function CustomerListView({
  customers,
  filteredCustomers,
  loading,
  search,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  onView,
  onEdit,
  onDelete,
}: CustomerListViewProps) {
  const renderTableBody = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF6F3] shrink-0" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-[#FAF6F3] rounded" />
                <div className="h-3 w-20 bg-[#FAF6F3] rounded" />
              </div>
            </div>
          </td>
          <td className="p-4 space-y-2">
            <div className="h-4 w-40 bg-[#FAF6F3] rounded" />
            <div className="h-4 w-24 bg-[#FAF6F3] rounded" />
          </td>
          <td className="p-4 text-center">
            <div className="h-6 w-20 bg-[#FAF6F3] rounded-full mx-auto" />
          </td>
          <td className="p-4 text-right space-y-2 flex flex-col items-end">
            <div className="h-4 w-20 bg-[#FAF6F3] rounded" />
            <div className="h-3 w-24 bg-[#FAF6F3] rounded" />
          </td>
          <td className="p-4">
            <div className="flex justify-end gap-2">
              <div className="h-6 w-6 bg-[#FAF6F3] rounded" />
              <div className="h-6 w-6 bg-[#FAF6F3] rounded" />
              <div className="h-6 w-6 bg-[#FAF6F3] rounded" />
            </div>
          </td>
        </tr>
      ));
    }

    if (filteredCustomers.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="p-16">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4">
                <Search size={24} className="text-[#C5BDBA]" />
              </div>
              <p className="text-sm font-semibold text-[#2D2A26]">No customers found</p>
              <p className="text-xs text-[#A8A19A] mt-1 max-w-sm">
                {search || filterType !== 'all' 
                  ? 'We couldn\'t find any customers matching your current filters.' 
                  : 'Click "Add Customer" to start building your Client Book.'}
              </p>
            </div>
          </td>
        </tr>
      );
    }

    return filteredCustomers.map(customer => (
      <tr 
        key={customer.id} 
        onClick={() => onView(customer.id)}
        className="hover:bg-[#F0EAE3]/20 transition-colors group cursor-pointer"
      >
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F0EAE3] overflow-hidden shrink-0 flex items-center justify-center border border-[#D1C7BD]">
              {customer.profile_picture ? (
                <Image 
                  src={customer.profile_picture} 
                  alt={customer.name} 
                  className="w-full h-full object-cover" 
                  width={40} 
                  height={40} 
                  unoptimized 
                />
              ) : (
                <span className="text-[#827A73] font-bold">{customer.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#2D2A26] group-hover:text-taupe transition-colors">{customer.name}</span>
                {customer.suki_tag && (() => {
                  const tagMap: Record<string, { label: string; cls: string }> = {
                    b2b_suki: { label: 'B2B Suki', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                    reseller: { label: 'Reseller', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
                    walk_in_retail: { label: 'Walk-in', cls: 'bg-[#FAF6F3] text-[#827A73] border-[#EBE6E0]' },
                  };
                  const tag = tagMap[customer.suki_tag] ?? { label: customer.suki_tag, cls: 'bg-[#FAF6F3] text-[#827A73] border-[#EBE6E0]' };
                  return (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${tag.cls}`}>
                      {tag.label}
                    </span>
                  );
                })()}
              </div>
              <div className="text-xs text-[#A8A19A]">Joined {new Date(customer.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </td>
        <td className="p-4">
          <div className="space-y-1">
            {customer.email && !isWalkInEmail(customer.email) ? (
              <>
                <div className="flex items-center gap-2 text-sm text-[#524A44]">
                  <Mail size={14} className="text-[#A8A19A]" />
                  {customer.email}
                </div>
                <span className="inline-flex items-center text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">Online</span>
              </>
            ) : (
              <span className="inline-flex items-center text-[9px] font-bold bg-[#FAF6F3] text-[#827A73] px-1.5 py-0.5 rounded border border-[#EBE6E0] uppercase tracking-wider">Walk-in</span>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-[#524A44]">
                <Phone size={14} className="text-[#A8A19A]" />
                {customer.phone}
              </div>
            )}
          </div>
        </td>
        <td className="p-4 text-center">
          {customer.active_jobs && customer.active_jobs > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#BCA89F]/10 text-[#BCA89F] border border-[#BCA89F]/20">
              <Package size={12} />
              {customer.active_jobs} Active
            </span>
          ) : (
            <span className="text-[#A8A19A] text-sm">-</span>
          )}
        </td>
        <td className="p-4 text-right">
          <div className="font-semibold text-[#2D2A26]">₱{Number(customer.total_spend).toLocaleString()}</div>
          <div className="text-xs text-[#A8A19A]">{customer.completed_jobs} completed orders</div>
        </td>
        <td className="p-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onView(customer.id);
              }} 
              className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1 cursor-pointer"
              title="View Profile"
            >
              <Eye size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(customer);
              }} 
              className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1 cursor-pointer"
            >
              <Pencil size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(customer.id);
              }} 
              className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1 cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="space-y-6 text-[#2D2A26]">
      {/* Primary Tabs */}
      <div className="flex border-b border-[#EBE6E0] gap-6">
        {[
          { id: 'all',     label: 'All Clients',    count: customers.length },
          { id: 'online',  label: 'Online Clients',  count: customers.filter(c => !isWalkInEmail(c.email)).length },
          { id: 'walkin',  label: 'Walk-in Clients', count: customers.filter(c => isWalkInEmail(c.email)).length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => onFilterTypeChange(tab.id as FilterType)}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 flex items-center gap-2 cursor-pointer ${
              filterType === tab.id
                ? 'border-taupe text-[#2D2A26]'
                : 'border-transparent text-[#A8A19A] hover:text-[#524A44]'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              filterType === tab.id ? 'bg-[#9A8073]/10 text-taupe' : 'bg-[#F0EAE3] text-[#827A73]'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Suki Classification Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-[#A8A19A] uppercase tracking-wider">Suki Type:</span>
        {([
          { id: 'b2b_suki',       label: 'B2B Suki',        cls: 'amber',  Icon: Star },
          { id: 'reseller',       label: 'Reseller',        cls: 'purple', Icon: Store },
          { id: 'walk_in_retail', label: 'Walk-in Retail',  cls: 'gray',   Icon: User },
        ] as Array<{ id: FilterType; label: string; cls: string; Icon: LucideIcon }>).map(tag => {
          const TagIcon = tag.Icon;
          let selectedClasses = 'bg-white text-[#827A73] border-[#EBE6E0] hover:border-[#D1C7BD]';
          if (filterType === tag.id) {
            if (tag.cls === 'amber') {
              selectedClasses = 'bg-amber-100 text-amber-700 border-amber-300';
            } else if (tag.cls === 'purple') {
              selectedClasses = 'bg-purple-100 text-purple-700 border-purple-300';
            } else {
              selectedClasses = 'bg-[#F0EAE3] text-[#524A44] border-[#D1C7BD]';
            }
          }

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onFilterTypeChange(filterType === tag.id ? 'all' : tag.id as FilterType)}
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border transition-all cursor-pointer ${selectedClasses}`}
            >
              <TagIcon size={11} />
              {tag.label}
            </button>
          );
        })}
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#EBE6E0] flex items-center justify-between bg-white">
          <SearchInput value={search} onChange={onSearchChange} placeholder="Search clients by name or email..." disabled={loading} className="w-80" />
          <div className="text-sm text-[#827A73] font-medium">
            Total Clients: {customers.length}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF6F3]/50 border-b border-[#EBE6E0] text-xs uppercase tracking-wider text-[#827A73]">
                <th className="p-4 font-semibold">Client</th>
                <th className="p-4 font-semibold">Contact</th>
                <th className="p-4 font-semibold text-center">Active Jobs</th>
                <th className="p-4 font-semibold text-right">Lifetime Spend</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE6E0]">
              {renderTableBody()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
