'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import {
  ArrowLeft, Loader2, Pencil, Mail, Phone, Calendar, UserCircle,
  Briefcase, CheckCircle2, Clock, Wifi, ArrowRight, Building2, Scissors,
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
      <div className="flex flex-col items-center justify-center py-24 text-ink-faint">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-taupe mx-auto" />
        <span className="text-sm font-medium">Loading staff profile...</span>
      </div>
    );
  }

  if (!detail || !member) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center">
        <p className="text-ink-muted">Staff member not found.</p>
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
  
  const currentAssignments = detail.assignments.filter(a => !a.completed_at);
  const activeJobCount = detail.active;
  const completedJobCount = detail.total_completed;

  return (
    <div className="space-y-6 animate-fade-in text-ink">
      {/* Header Panel */}
      <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button 
              type="button"
              onClick={() => router.push('/dashboard/staff')}
              className="h-10 w-10 rounded-xl bg-canvas border border-line text-ink-muted hover:text-ink hover:border-taupe flex items-center justify-center transition-all shadow-2xs shrink-0 cursor-pointer"
              title="Back to Staff"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">{member.user?.name}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-taupe/15 text-taupe border border-taupe/20">
                  {roleLabel(member.role)}
                </span>
                {member.is_branch_manager && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                    Branch Manager
                  </span>
                )}
                {member.is_active ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-zinc-100 text-ink-muted border border-zinc-200">
                    Inactive
                  </span>
                )}
                {member.is_active && member.is_available === false && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                    On Leave
                  </span>
                )}
                <button 
                  type="button"
                  onClick={openEdit}
                  className="h-7 w-7 rounded-lg border border-line text-ink-muted hover:bg-canvas hover:text-ink flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Edit Staff Info"
                >
                  <Pencil size={12} />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
                {member.user?.email && (
                  <a href={`mailto:${member.user.email}`} className="flex items-center gap-1 hover:text-taupe transition-colors">
                    <Mail size={12} className="text-ink-faint shrink-0" /> {member.user.email}
                  </a>
                )}
                {member.user?.phone && (
                  <a href={`tel:${member.user.phone}`} className="flex items-center gap-1 hover:text-taupe transition-colors font-mono">
                    <Phone size={12} className="text-ink-faint shrink-0" /> {member.user.phone}
                  </a>
                )}
                <span className="flex items-center gap-1 text-ink-faint">
                  <Calendar size={12} className="shrink-0" /> Hired {member.hired_at ? new Date(member.hired_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                </span>
                <span className="flex items-center gap-1 text-ink-faint">
                  <Building2 size={12} className="shrink-0" /> {member.branch?.name || 'All Branches'}
                </span>
                <span className="text-ink-faint">
                  {isOnline ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                    </span>
                  ) : (
                    `Last seen ${lastSeenLabel}`
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={openEdit}
              className="h-9 px-3.5 rounded-xl bg-taupe hover:bg-taupe-hover text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Pencil size={13} />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Leveled KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: 'Active Jobs', value: String(activeJobCount), sub: 'Currently assigned', icon: Scissors, color: 'bg-amber-50 text-amber-800 border-amber-200' },
          { label: 'Completed Jobs', value: String(completedJobCount), sub: 'Fulfilled garments', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: 'Stage Tasks', value: String(detail.total_assigned), sub: 'Lifetime assignments', icon: Briefcase, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Branch', value: member.branch?.name || 'All Branches', sub: 'Assigned location', icon: Building2, color: 'bg-canvas text-ink-muted border-line' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="h-24 bg-surface border border-line rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">{stat.label}</span>
                <div className={`p-1.5 rounded-lg border ${stat.color} shrink-0`}>
                  <Icon size={13} />
                </div>
              </div>
              <div>
                <div className="h-6 flex items-baseline font-black font-mono text-lg text-ink truncate">
                  {stat.value}
                </div>
                <p className="text-[11px] text-ink-muted truncate">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Balanced Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <h3 className="font-bold text-ink text-xs uppercase tracking-wider pb-3 border-b border-line">
              Bio & Specialization
            </h3>

            <div>
              <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1">Bio</p>
              {member.bio ? (
                <p className="text-sm text-ink-body whitespace-pre-wrap">{member.bio}</p>
              ) : (
                <p className="text-xs text-ink-muted italic">No bio provided.</p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Specialization</p>
              {specializations.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {specializations.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-md text-xs font-semibold bg-canvas text-ink-body border border-line">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-muted italic">Not specified.</p>
              )}
            </div>

            {member.additional_roles && member.additional_roles.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Additional Roles</p>
                <div className="flex flex-wrap gap-1.5">
                  {member.additional_roles.map(r => (
                    <span key={r} className="px-2 py-0.5 rounded-md text-xs font-semibold bg-canvas text-ink-body border border-line">
                      {roleLabel(r)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
            <h3 className="font-bold text-ink text-xs uppercase tracking-wider pb-3 border-b border-line">
              Workstation & Access
            </h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-muted">Primary Role</span>
                <span className="font-bold text-ink">{roleLabel(member.role)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-muted">Assigned Branch</span>
                <span className="font-bold text-ink">{member.branch?.name || 'All Branches'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-line/60">
                <span className="text-ink-muted">Branch Manager</span>
                <span className="font-bold text-ink">{member.is_branch_manager ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-ink-muted">Account Status</span>
                <span className="font-bold text-emerald-700">{member.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Currently Assigned (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="font-bold text-ink text-xs uppercase tracking-wider">
                Currently Assigned ({currentAssignments.length})
              </h3>
              <span className="text-xs text-ink-muted">Active workroom queue</span>
            </div>

            {currentAssignments.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-10">No active job assignments right now.</p>
            ) : (
              <div className="divide-y divide-line border border-line rounded-xl overflow-hidden">
                {currentAssignments.map(a => (
                  <Link
                    key={`${a.job_order_id}-${a.stage}`}
                    href={`/dashboard/jobs/${a.job_order_id}`}
                    className="flex items-center justify-between p-3.5 hover:bg-canvas/50 transition-colors group cursor-pointer"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-ink">{a.order_number || `#JO-${a.job_order_id}`}</span>
                        {a.stage && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-canvas px-2 py-0.5 rounded border border-line text-ink-body">
                            {a.stage.replaceAll('_', ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted truncate">
                        Client: <span className="font-semibold text-ink-body">{a.customer_name || 'Walk-in Client'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {a.job_status.replaceAll('_', ' ')}
                      </span>
                      <ArrowRight size={14} className="text-ink-muted group-hover:text-taupe group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Edit Modal */}
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
