'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Search, Package, Phone, Mail, Plus, Loader2, Pencil, Trash2, Eye, Ruler } from 'lucide-react';
import Modal from '@/components/Modal';
import ShopWideNote from '@/components/shared/ShopWideNote';
import { useCustomers } from '@/components/customers/useCustomers';

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

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Client Book</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage your customer relationships and lifetime value.</p>
          <ShopWideNote />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard/measurements"
            className="flex items-center gap-2 bg-white hover:bg-[#FAF6F3] border border-[#EBE6E0] text-[#524A44] px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            title="Search and manage measurement profiles across all customers"
          >
            <Ruler size={16} />
            All Measurements
          </Link>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', email: '', phone: '' });
              setError('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Tabs for separating Online and Walk-in clients */}
      <div className="flex border-b border-[#EBE6E0] gap-6">
        {[
          { id: 'all', label: 'All Clients', count: customers.length },
          { id: 'online', label: 'Online Clients', count: customers.filter(c => !isWalkInEmail(c.email)).length },
          { id: 'walkin', label: 'Walk-in Clients', count: customers.filter(c => isWalkInEmail(c.email)).length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id as 'all' | 'online' | 'walkin')}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 flex items-center gap-2 ${
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

      {loading ? (
        <div className="py-12 text-center text-[#A8A19A] animate-pulse">Loading CRM directory...</div>
      ) : (
        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#EBE6E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
              <input
                type="text"
                placeholder="Search clients by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
              />
            </div>
            <div className="text-sm text-[#827A73] font-medium">
              Total Clients: {customers.length}
            </div>
          </div>

          {/* Mobile cards — no sideways scroll needed */}
          <div className="md:hidden divide-y divide-[#EBE6E0]">
            {filtered.length === 0 ? (
              <p className="p-8 text-center text-[#A8A19A] text-sm">
                No customers found. Click &quot;Add Customer&quot; to start building your Client Book.
              </p>
            ) : filtered.map(customer => (
              <div
                key={customer.id}
                onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
                className="p-4 space-y-3 active:bg-[#F0EAE3]/20 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F0EAE3] overflow-hidden shrink-0 flex items-center justify-center border border-[#D1C7BD]">
                    {customer.profile_picture ? (
                      <Image src={customer.profile_picture} alt={customer.name} className="w-full h-full object-cover" width={40} height={40} unoptimized />
                    ) : (
                      <span className="text-[#827A73] font-bold">{customer.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#2D2A26] truncate">{customer.name}</div>
                    <div className="text-xs text-[#A8A19A]">Joined {new Date(customer.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/customers/${customer.id}`); }}
                      className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1.5"
                      title="View Profile"
                    >
                      <Eye size={16} />
                    </button>
                    <button onClick={(e) => handleEditClick(e, customer)} className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1.5">
                      <Pencil size={16} />
                    </button>
                    <button onClick={(e) => handleDeleteClick(e, customer.id)} className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1.5">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#524A44] pl-[52px]">
                  {customer.email && !isWalkInEmail(customer.email) ? (
                    <span className="flex items-center gap-1"><Mail size={12} className="text-[#A8A19A]" /> {customer.email}</span>
                  ) : (
                    <span className="inline-flex items-center text-[9px] font-bold bg-[#FAF6F3] text-[#827A73] px-1.5 py-0.5 rounded border border-[#EBE6E0] uppercase tracking-wider">Walk-in</span>
                  )}
                  {customer.phone && (
                    <span className="flex items-center gap-1"><Phone size={12} className="text-[#A8A19A]" /> {customer.phone}</span>
                  )}
                </div>

                <div className="flex items-center justify-between pl-[52px] pt-1 border-t border-[#EBE6E0]/70">
                  {customer.active_jobs > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#BCA89F]/10 text-[#BCA89F] border border-[#BCA89F]/20">
                      <Package size={12} /> {customer.active_jobs} Active
                    </span>
                  ) : <span />}
                  <div className="text-right">
                    <div className="font-semibold text-[#2D2A26] text-sm">₱{Number(customer.total_spend).toLocaleString()}</div>
                    <div className="text-[11px] text-[#A8A19A]">{customer.completed_jobs} completed orders</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
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
              <tbody className="divide-y divide-zinc-800/50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#A8A19A] text-sm">
                      No customers found. Click &quot;Add Customer&quot; to start building your Client Book.
                    </td>
                  </tr>
                ) : filtered.map(customer => (
                  <tr 
                    key={customer.id} 
                    onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
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
                          <div className="font-semibold text-[#2D2A26] group-hover:text-taupe transition-colors">{customer.name}</div>
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
                      {customer.active_jobs > 0 ? (
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
                            router.push(`/dashboard/customers/${customer.id}`);
                          }} 
                          className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1"
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </button>
                        <button onClick={(e) => handleEditClick(e, customer)} className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1">
                          <Pencil size={16} />
                        </button>
                        <button onClick={(e) => handleDeleteClick(e, customer.id)} className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Customer" : "Add New Customer"}>
        <form onSubmit={handleAddCustomer} className="space-y-4">
          {error && (
            <div className="bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#524A44] mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input 
              id="name"
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
              placeholder="Juan Dela Cruz"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#524A44] mb-1">
              Email Address <span className="text-xs text-[#827A73] font-normal">(Optional)</span>
            </label>
            <input 
              id="email"
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
              placeholder="juan@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-[#524A44] mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input 
              id="phone"
              type="tel" 
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
              placeholder="+63 900 000 0000"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {editingId ? "Save Changes" : "Save Customer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Remove Customer">
        <div className="space-y-4">
          <p className="text-[#524A44] text-sm">
            Are you sure you want to remove this customer? This will not delete their historical job orders.
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Yes, Remove
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
