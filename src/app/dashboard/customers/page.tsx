'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  Package,
  Phone,
  Mail,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Eye,
  Ruler,
  Users,
  TrendingUp,
  Scissors,
  ExternalLink,
  Star,
  Store,
  User,
  X
} from 'lucide-react';
import Modal from '@/components/Modal';
import ShopWideNote from '@/components/shared/ShopWideNote';
import PageHeader from '@/components/shared/PageHeader';
import { useCustomers } from '@/components/customers/useCustomers';
import { SUKI_TAG_CONFIG, isWalkInCustomer } from '@/components/customers/customerHelpers';

export default function CustomersPage() {
  const {
    router,
    customers,
    loading,
    search,
    setSearch,
    isModalOpen,
    setIsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    editingId,
    setEditingId,
    isSubmitting,
    formData,
    setFormData,
    error,
    setError,
    filterType,
    setFilterType,
    isWalkInEmail,
    handleAddCustomer,
    handleEditClick,
    handleDeleteClick,
    confirmDelete,
    closeModal,
    filtered,
  } = useCustomers();

  // Aggregate stats
  const totalSpendAll = customers.reduce((sum, c) => sum + (Number(c.total_spend) || 0), 0);
  const activeJobsTotal = customers.reduce((sum, c) => sum + (Number(c.active_jobs) || 0), 0);
  const onlineCount = customers.filter(c => !isWalkInCustomer(c)).length;
  const walkinCount = customers.filter(c => isWalkInCustomer(c)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relationships"
        title="Client Book"
        description={<>Manage your customer directory, loyalty suki tiers, and lifetime value. <ShopWideNote /></>}
        actions={
          <>
            <Link
              href="/dashboard/measurements"
              title="Search and manage measurement profiles across all customers"
              className="flex items-center gap-2 bg-surface hover:bg-sunken border border-line text-ink px-4 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-colors min-h-10.5 shadow-2xs"
            >
              <Ruler size={15} />
              <span className="hidden sm:inline">All </span>Measurements
            </Link>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', email: '', phone: '' });
                setError('');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-taupe hover:bg-taupe-hover text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all min-h-10.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              Add Customer
            </button>
          </>
        }
      />

      {/* Top CRM KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Total Registered Clients</span>
            <div className="text-2xl font-black text-ink">{customers.length}</div>
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span className="text-blue-600 font-semibold">{onlineCount} Online</span>
              <span>•</span>
              <span className="text-amber-700 font-semibold">{walkinCount} Walk-in</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Active In-Pipeline Jobs</span>
            <div className="text-2xl font-black text-ink">{activeJobsTotal}</div>
            <div className="text-xs text-ink-muted">Across current custom production</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sage/10 text-sage border border-sage/20 flex items-center justify-center shrink-0">
            <Scissors size={20} />
          </div>
        </div>

        <div className="bg-surface border border-line rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">Total Client Revenue</span>
            <div className="text-2xl font-black font-mono text-ink">₱{totalSpendAll.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className="text-xs text-ink-muted">Cumulative customer spend to date</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Header */}
      <div className="bg-surface border border-line rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-4 bg-canvas/30">
          
          {/* Channel Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Clients', count: customers.length },
              { id: 'online', label: 'Online Clients', count: onlineCount },
              { id: 'walkin', label: 'Walk-in Clients', count: walkinCount },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as 'all' | 'online' | 'walkin')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-taupe text-white shadow-2xs'
                    : 'bg-surface border border-line text-ink-muted hover:text-ink hover:bg-canvas'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  filterType === tab.id ? 'bg-white/20 text-white' : 'bg-canvas text-ink-faint'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-surface border border-line rounded-xl text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-ink-faint flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-taupe" />
            <span className="text-xs font-medium">Loading Client Book directory...</span>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="md:hidden divide-y divide-line">
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-ink-faint text-xs">
                  <Users size={28} className="mx-auto mb-2 opacity-40" />
                  No customers found matching your criteria.
                </div>
              ) : (
                filtered.map(customer => {
                  const sukiCfg = customer.suki_tag ? SUKI_TAG_CONFIG[customer.suki_tag] : null;

                  return (
                    <div
                      key={customer.id}
                      onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                      className="p-4 space-y-3 active:bg-sunken/20 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-canvas border border-line overflow-hidden shrink-0 flex items-center justify-center">
                          {customer.profile_picture ? (
                            <Image src={customer.profile_picture} alt={customer.name} className="w-full h-full object-cover" width={44} height={44} unoptimized />
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
                          <div className="text-[11px] text-ink-muted">Joined {new Date(customer.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/customers/${customer.id}`); }}
                            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors"
                            title="View Profile"
                          >
                            <Eye size={15} />
                          </button>
                          <button onClick={(e) => handleEditClick(e, customer)} className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-canvas transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={(e) => handleDeleteClick(e, customer.id)} className="p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-canvas transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-body pl-14">
                        {customer.email && !isWalkInEmail(customer.email) ? (
                          <span className="flex items-center gap-1 text-ink-muted truncate"><Mail size={12} className="text-ink-faint shrink-0" /> {customer.email}</span>
                        ) : (
                          <span className="inline-flex items-center text-[9px] font-bold bg-canvas text-ink-muted px-1.5 py-0.5 rounded border border-line uppercase tracking-wider">Walk-in</span>
                        )}
                        {customer.phone && (
                          <span className="flex items-center gap-1 text-ink-muted font-mono"><Phone size={12} className="text-ink-faint shrink-0" /> {customer.phone}</span>
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
                          <div className="font-bold text-ink text-xs font-mono">₱{Number(customer.total_spend).toLocaleString()}</div>
                          <div className="text-[10px] text-ink-faint">{customer.completed_jobs} completed</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Full Table Layout */}
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-ink-faint text-xs">
                        <Users size={32} className="mx-auto mb-2 opacity-40" />
                        No clients found matching your search. Click &quot;Add Customer&quot; to register a new client.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(customer => {
                      const sukiCfg = customer.suki_tag ? SUKI_TAG_CONFIG[customer.suki_tag] : null;

                      return (
                        <tr 
                          key={customer.id} 
                          onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
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
                                    unoptimized 
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
                                  Customer since {new Date(customer.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                            <div className="font-black text-ink text-sm font-mono">₱{Number(customer.total_spend).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                            <div className="text-[11px] text-ink-muted">{customer.completed_jobs} completed orders</div>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/customers/${customer.id}`);
                                }} 
                                className="h-8 w-8 rounded-lg bg-surface border border-line text-ink-muted hover:text-ink hover:border-taupe flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                                title="View Customer Profile"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleEditClick(e, customer)}
                                className="h-8 w-8 rounded-lg bg-surface border border-line text-ink-muted hover:text-ink hover:border-taupe flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                                title="Edit Customer Details"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(e, customer.id)}
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
          </>
        )}
      </div>

      {/* Add/Edit Customer Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Customer Info" : "Register New Customer"}>
        <form onSubmit={handleAddCustomer} className="space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger/50 text-danger px-4 py-3 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Full Name <span className="text-danger">*</span>
            </label>
            <input 
              id="name"
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink font-semibold focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
              placeholder="e.g. Maria Clara"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Email Address <span className="text-[10px] text-ink-faint font-normal lowercase">(optional for walk-ins)</span>
            </label>
            <input 
              id="email"
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
              placeholder="e.g. maria.clara@gmail.com"
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Phone Number <span className="text-danger">*</span>
            </label>
            <input 
              id="phone"
              type="tel" 
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-canvas border border-line rounded-xl px-3.5 py-2.5 text-xs text-ink font-mono focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
              placeholder="e.g. +63 917 123 4567"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-line">
            <button 
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-taupe hover:bg-taupe-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {editingId ? "Save Changes" : "Create Customer Record"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Remove Customer Record">
        <div className="space-y-4">
          <p className="text-ink text-xs leading-relaxed">
            Are you sure you want to remove this customer from your active Client Book? Historical job orders and measurements will remain archived for accounting.
          </p>
          <div className="pt-3 flex justify-end gap-2 border-t border-line">
            <button 
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-danger hover:bg-danger/90 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Yes, Remove
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

