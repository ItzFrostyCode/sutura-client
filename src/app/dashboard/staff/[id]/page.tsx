'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import {
  ArrowLeft, Loader2, Pencil, Mail, Phone, Calendar, UserCircle,
  Briefcase, CheckCircle2, Clock, Wifi, ArrowRight,
} from 'lucide-react';
import { Staff, formatLastSeen, roleLabel } from '@/components/staff/staffHelpers';
import StaffFormModal from '@/components/staff/StaffFormModal';

interface Assignment {
  job_order_id: number;
  order_number: string | null;
  job_status: string;
  stage: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  customer_name: string | null;
}

interface StaffDetail {
  staff: Staff;
  total_assigned: number;
  total_completed: number;
  active: number;
  assignments: Assignment[];
}

/**
 * Staff Profile — same page shape as the Customer profile
 * (dashboard/customers/[id]) at the user's request: header card with
 * avatar/contact, stat cards, and tabs — instead of cramming everything
 * into the list table. Owner-only, same as the rest of Staff Management
 * (see dashboard/layout.tsx's isShopOwner nav gate and the backend's
 * role:shop_owner route group) — never reachable by a customer.
 */
export default function StaffProfilePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);
  const { shop } = useAuthStore();
  const router = useRouter();
  const toast = useToast();

  const [detail, setDetail] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', role: 'tailor',
    additional_roles: [] as string[], specialization: '',
    hired_at: new Date().toISOString().split('T')[0],
    is_active: true, shop_branch_id: '', is_branch_manager: false,
    bio: '', is_available: true,
  });

  const loadData = useCallback(async () => {
    if (!shop || !id) return;
    try {
      const res = await api.get(`/shops/${shop.id}/staff/${id}`);
      setDetail(res.data.data);
    } catch (err) {
      console.error('Failed to load staff profile', err);
    } finally {
      setLoading(false);
    }
  }, [shop, id]);

  useEffect(() => {
    setTimeout(() => { void loadData(); }, 0);
  }, [loadData]);

  const member = detail?.staff;

  const openEdit = () => {
    if (!member) return;
    setFormData({
      name: member.user?.name || '',
      email: member.user?.email || '',
      password: '',
      phone: member.user?.phone || '',
      role: member.role || 'tailor',
      additional_roles: member.additional_roles || [],
      specialization: Array.isArray(member.specialization)
        ? member.specialization.join(', ')
        : (member.specialization || ''),
      hired_at: member.hired_at || new Date().toISOString().split('T')[0],
      is_active: member.is_active,
      shop_branch_id: member.shop_branch_id ? String(member.shop_branch_id) : '',
      is_branch_manager: member.is_branch_manager || false,
      bio: member.bio || '',
      is_available: member.is_available !== false,
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!shop || !member) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        additional_roles: formData.additional_roles.filter(r => r && r !== formData.role),
        specialization: formData.specialization
          ? formData.specialization.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        hired_at: formData.hired_at,
        shop_branch_id: formData.shop_branch_id ? Number.parseInt(formData.shop_branch_id, 10) : null,
        is_branch_manager: formData.is_branch_manager,
        bio: formData.bio,
        is_active: formData.is_active,
        is_available: formData.is_available,
      };
      if (formData.password) payload.password = formData.password;

      await api.put(`/shops/${shop.id}/staff/${member.id}`, payload);
      setShowEditModal(false);
      toast.success('Staff profile updated.');
      void loadData();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#A8A19A]">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-taupe mx-auto" />
        <span className="text-sm font-medium">Loading staff profile...</span>
      </div>
    );
  }

  if (!detail || !member) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center">
        <p className="text-[#827A73]">Staff member not found.</p>
        <button onClick={() => router.push('/dashboard/staff')} className="mt-4 text-taupe hover:underline text-sm font-medium">
          Back to Staff Management
        </button>
      </div>
    );
  }

  const { label: lastSeenLabel, isOnline } = formatLastSeen(member.user?.last_seen_at);
  const specializations = Array.isArray(member.specialization)
    ? member.specialization
    : (member.specialization ? [member.specialization] : []);
  // Only what's still open — the completed side of the log is exactly the
  // "queue of what already happened" the owner didn't want to see here.
  const currentAssignments = detail.assignments.filter(a => !a.completed_at);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Panel */}
      <div className="flex items-start justify-between bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#827A73] hover:text-[#2D2A26] transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full bg-[#F0EAE3] flex items-center justify-center text-[#827A73] overflow-hidden">
              {member.user?.profile_picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.user.profile_picture} alt={member.user.name} className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={28} />
              )}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${isOnline ? 'bg-[#7A8B76]' : 'bg-[#C5BDBA]'}`}
              title={isOnline ? 'Online' : `Last seen ${lastSeenLabel}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">{member.user?.name}</h1>
              <button
                onClick={openEdit}
                className="p-1.5 rounded-lg border border-[#EBE6E0] text-[#827A73] hover:bg-[#FAF6F3] hover:text-[#2D2A26] transition-all cursor-pointer"
                title="Edit Staff Profile"
              >
                <Pencil size={13} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F0EAE3] text-[#524A44]">
                {roleLabel(member.role)}
              </span>
              {member.additional_roles?.map(r => (
                <span key={r} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F0EAE3]/50 text-[#827A73] border border-[#EBE6E0]">
                  {roleLabel(r)}
                </span>
              ))}
              {member.is_branch_manager && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#9A8073]/10 text-[#9A8073] border border-[#9A8073]/20">
                  Branch Manager
                </span>
              )}
              {member.is_active ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20">Active</span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-zinc-500/10 text-[#827A73] border-zinc-500/20">Inactive</span>
              )}
              {member.is_active && member.is_available === false && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">On Leave</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-[#827A73] mt-2 flex-wrap">
              {member.user?.email && (
                <span className="flex items-center gap-1"><Mail size={12} /> {member.user.email}</span>
              )}
              {member.user?.phone && (
                <span className="flex items-center gap-1"><Phone size={12} /> {member.user.phone}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Hired {member.hired_at ? new Date(member.hired_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'N/A'}
              </span>
              {isOnline ? (
                <span className="flex items-center gap-1 font-semibold text-[#7A8B76]"><Wifi size={12} /> Online now</span>
              ) : (
                <span className="flex items-center gap-1"><Clock size={12} /> Last seen {lastSeenLabel}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Jobs', value: member.active_jobs ?? 0, icon: Briefcase, color: 'bg-amber-50 text-amber-700 border-amber-100' },
          { label: 'Completed Jobs', value: member.completed_jobs ?? 0, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Total Stage Assignments', value: detail.total_assigned, icon: Briefcase, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Branch', value: member.branch?.name || 'All branches', icon: Calendar, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-[#EBE6E0] rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-[#827A73] uppercase tracking-wider block">{stat.label}</span>
                <span className="text-lg font-bold text-[#2D2A26] mt-0.5 block truncate">{stat.value}</span>
              </div>
              <div className={`p-2.5 rounded-lg border ${stat.color} shrink-0`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Single merged view — no tabs, no raw historical log. The full
          per-stage assignment record already lives on each Job Order page
          (JobStaffAssignmentCard) — duplicating that whole queue here just
          to show "who worked what stage when" was noise, not signal, for
          an owner looking at THIS person. This only ever links out to the
          real job order instead of re-showing its data. */}
      <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <p className="text-xs font-semibold text-[#827A73] uppercase tracking-wide mb-1">Bio</p>
          {member.bio ? (
            <p className="text-sm text-[#524A44] whitespace-pre-wrap">{member.bio}</p>
          ) : (
            <p className="text-sm text-[#A8A19A] italic">No bio added yet — only visible to you, never shown to customers.</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-[#827A73] uppercase tracking-wide mb-2">Specialization</p>
          {specializations.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {specializations.map(s => (
                <span key={s} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[#EBE6E0]/50 text-[#524A44] border border-[#EBE6E0]">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#A8A19A] italic">Not specified.</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
        <p className="text-xs font-semibold text-[#827A73] uppercase tracking-wide mb-3">
          Currently Assigned ({currentAssignments.length})
        </p>
        {currentAssignments.length === 0 ? (
          <p className="text-sm text-[#827A73] text-center py-6">No open job assignments right now.</p>
        ) : (
          <div className="divide-y divide-[#EBE6E0] border border-[#EBE6E0] rounded-xl overflow-hidden">
            {currentAssignments.map(a => (
              <Link
                key={`${a.job_order_id}-${a.stage}`}
                href={`/dashboard/jobs/${a.job_order_id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-[#F0EAE3]/20 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#2D2A26] truncate">{a.order_number || `#${a.job_order_id}`}</p>
                  <p className="text-xs text-[#827A73] truncate">
                    {a.customer_name || 'Walk-in'}{a.stage ? ` · ${a.stage}` : ''}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 capitalize shrink-0">
                  {a.job_status}
                  <ArrowRight size={13} className="text-[#A8A19A] group-hover:text-taupe transition-colors" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <StaffFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleSubmit}
        editingId={member.id}
        saving={saving}
        formData={formData}
        setFormData={setFormData}
      />
    </div>
  );
}
