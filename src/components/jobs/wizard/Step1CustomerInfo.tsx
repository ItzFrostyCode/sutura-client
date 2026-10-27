'use client';

import React, { useState, useEffect } from 'react';
import { User, Search, UserPlus, Phone, Mail, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import type { CustomerData } from '../form/types';

interface Step1CustomerInfoProps {
  storeId?: number;
  customerMode: 'search' | 'new';
  setCustomerMode: (mode: 'search' | 'new') => void;
  customers: CustomerData[];
  selectedCustomerId: string;
  onSelectCustomer: (cust: CustomerData | null) => void;
  fullName: string;
  setFullName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  onProceed: () => void;
}

export default function Step1CustomerInfo({
  storeId,
  customerMode,
  setCustomerMode,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  onProceed,
}: Step1CustomerInfoProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CustomerData[]>(customers);

  // Sync initial customers
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(customers);
    }
  }, [customers, searchQuery]);

  // Live database search with debounce
  useEffect(() => {
    if (!storeId || customerMode !== 'search') return;
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults(customers);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      api
        .get(`/stores/${storeId}/customers`, { params: { search: query } })
        .then((res) => {
          const list = Array.isArray(res.data?.data) ? res.data.data : [];
          setSearchResults(list);
        })
        .catch((err) => {
          console.warn('Customer search failed, falling back to local list:', err);
          setSearchResults(
            customers.filter(
              (c) =>
                c.name.toLowerCase().includes(query.toLowerCase()) ||
                c.phone?.includes(query) ||
                c.email?.toLowerCase().includes(query.toLowerCase())
            )
          );
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, storeId, customerMode, customers]);

  const handleSelectExisting = (cust: CustomerData) => {
    onSelectCustomer(cust);
    setFullName(cust.name);
    const cleanEmail = cust.email && (cust.email.startsWith('walkin_') && cust.email.endsWith('@sutura.com'))
      ? ''
      : (cust.email || '');
    setEmail(cleanEmail);
    setPhone(cust.phone || '');
    setErrorMsg('');
  };

  const handleNextClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter the customer\'s full name before proceeding.');
      return;
    }
    setErrorMsg('');
    onProceed();
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-6 sm:p-7 shadow-2xs space-y-6">
      {/* Step Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-ink">Customer Information</h2>
        <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
          Choose whether this job order is for a returning client or a new walk-in customer.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <button
          type="button"
          onClick={() => {
            setCustomerMode('search');
            setErrorMsg('');
          }}
          className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
            customerMode === 'search'
              ? 'bg-taupe text-white border-taupe shadow-xs'
              : 'bg-surface border-line text-ink-muted hover:text-ink hover:bg-canvas'
          }`}
        >
          <Search size={15} />
          <span>Search Existing</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCustomerMode('new');
            onSelectCustomer(null);
            setErrorMsg('');
          }}
          className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
            customerMode === 'new'
              ? 'bg-taupe text-white border-taupe shadow-xs'
              : 'bg-surface border-line text-ink-muted hover:text-ink hover:bg-canvas'
          }`}
        >
          <UserPlus size={15} />
          <span>Add New / Walk-in</span>
        </button>
      </div>

      {/* Search Mode UI */}
      {customerMode === 'search' && (
        <div className="space-y-3.5 p-4 rounded-xl bg-canvas/40 border border-line/70">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted">
              Query Customer Database
            </label>
            {isSearching && (
              <span className="text-[11px] text-taupe font-semibold flex items-center gap-1.5 animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                <span>Searching records...</span>
              </span>
            )}
          </div>

          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search database by client name, mobile phone, or email..."
              className="w-full h-11 pl-10 pr-4 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
            />
          </div>

          {/* Customer list results */}
          <div className="max-h-56 overflow-y-auto divide-y divide-line/60 rounded-xl border border-line bg-surface shadow-2xs">
            {searchResults.length === 0 ? (
              <div className="p-5 text-center text-xs text-ink-muted space-y-1">
                <p className="font-semibold text-ink">No matching customer found in database.</p>
                <p>Switch to &quot;Add New / Walk-in&quot; above to auto-create their customer profile.</p>
              </div>
            ) : (
              searchResults.map((cust) => {
                const isSelected = selectedCustomerId === cust.id.toString();
                const isWalkIn = cust.is_walk_in === true || cust.intake_channel === 'walk_in' || (cust.email && cust.email.startsWith('walkin_'));
                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleSelectExisting(cust)}
                    className={`w-full p-3 sm:p-3.5 text-left flex items-center justify-between gap-3 hover:bg-canvas/70 transition-colors cursor-pointer ${
                      isSelected ? 'bg-taupe/10 border-l-4 border-taupe' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-ink flex items-center gap-2 flex-wrap">
                        <User size={13} className="text-taupe shrink-0" />
                        <span className="truncate">{cust.name}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isWalkIn
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isWalkIn ? 'Walk-in' : 'Online Client'}
                        </span>
                        {typeof cust.active_jobs === 'number' && cust.active_jobs > 0 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {cust.active_jobs} active in pipeline
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-muted mt-1 flex items-center gap-3 flex-wrap">
                        {cust.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone size={10} className="text-ink-faint" />
                            {cust.phone}
                          </span>
                        )}
                        {cust.email && !cust.email.startsWith('walkin_') && (
                          <span className="flex items-center gap-1">
                            <Mail size={10} className="text-ink-faint" />
                            {cust.email}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Input Fields */}
      <div className="space-y-4 pt-2">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            Full Name <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <User
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
            />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="e.g. Juan Dela Cruz"
              className="w-full h-11 pl-10 pr-4 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
            />
          </div>
        </div>

        {/* Contact & Email Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Contact Number
            </label>
            <div className="relative">
              <Phone
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0917 123 4567"
                className="w-full h-11 pl-10 pr-4 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. juan@example.com"
                className="w-full h-11 pl-10 pr-4 bg-surface border border-line rounded-xl text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:ring-1 focus:ring-taupe focus:border-taupe shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Validation Error Message */}
      {errorMsg && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-xl text-xs text-danger font-semibold flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bottom Action */}
      <div className="pt-4 border-t border-line flex justify-end">
        <button
          type="button"
          onClick={handleNextClick}
          className="h-11 px-6 rounded-xl bg-taupe hover:bg-taupe-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-all active:scale-[0.99] cursor-pointer"
        >
          <span>Proceed to Measurements</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
