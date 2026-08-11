import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly id?: string;
  readonly disabled?: boolean;
}

/**
 * The one search-input style every list toolbar in the dashboard should
 * use — matches StaffListView's search bar exactly (confirmed by the user
 * as the reference to match everywhere: light background fill + border,
 * sitting inside the outer toolbar card). Previously each page
 * (Appointments, Payments, Jobs, Customers, Catalog, Packages, Staff,
 * Services) hand-rolled a slightly different version of this same input.
 */
export default function SearchInput({ value, onChange, placeholder = 'Search...', className = '', id, disabled }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A] pointer-events-none" size={16} />
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full pl-9 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors disabled:opacity-50"
      />
    </div>
  );
}
