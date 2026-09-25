import { CheckCircle2, Mail, Phone } from 'lucide-react';
import { BookingCustomer } from '../../types';

interface UserInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface BookingContactSectionProps {
  user: UserInfo | null;
  customer: BookingCustomer;
  setCustomer: React.Dispatch<React.SetStateAction<BookingCustomer>>;
}

export default function BookingContactSection({
  user,
  customer,
  setCustomer,
}: Readonly<BookingContactSectionProps>) {
  return (
    <div className="space-y-3">
      <h2 className="mobile-h3 font-semibold text-ink">Contact Details</h2>

      {user ? (
        <div className="p-4 bg-surface border border-line rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-taupe/15 border border-taupe/30 flex items-center justify-center text-taupe font-bold text-sm shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="mobile-h4 font-medium text-ink truncate">{user.name}</p>
                <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Verified
                </span>
              </div>
              <p className="mobile-caption text-ink-muted truncate mt-0.5 flex items-center gap-1 font-normal">
                <Mail size={12} className="text-ink-faint shrink-0" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-line">
            <label htmlFor="customer-quick-phone" className="mobile-caption font-semibold text-ink-body flex items-center gap-1 mb-1.5">
              <Phone size={14} className="text-taupe" /> Contact Number
            </label>
            <input
              id="customer-quick-phone"
              type="tel"
              value={customer.phone}
              onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="e.g. 0912 345 6789"
              className="w-full form-input-mobile bg-canvas border border-line rounded-lg text-base text-ink font-normal focus:outline-none focus:border-taupe"
            />
            <p className="mobile-caption text-ink-faint mt-1 font-normal">
              Para sa appointment updates at SMS notifications.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5 p-4 bg-surface border border-line rounded-2xl">
          <p className="mobile-body-sm text-ink-muted mb-1 font-normal">
            Pakilagay ang inyong impormasyon upang makipag-ugnayan ang sastre para sa inyong appointment.
          </p>
          <div>
            <label htmlFor="customer-name" className="mobile-caption font-semibold text-ink-body mb-1 block">
              Full Name *
            </label>
            <input
              id="customer-name"
              type="text"
              required
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="w-full form-input-mobile bg-canvas border border-line rounded-lg text-base text-ink font-normal focus:outline-none focus:border-taupe"
            />
          </div>
          <div>
            <label htmlFor="customer-email" className="mobile-caption font-semibold text-ink-body mb-1 block">
              Email Address *
            </label>
            <input
              id="customer-email"
              type="email"
              required
              value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              className="w-full form-input-mobile bg-canvas border border-line rounded-lg text-base text-ink font-normal focus:outline-none focus:border-taupe"
            />
          </div>
          <div>
            <label htmlFor="customer-phone" className="mobile-caption font-semibold text-ink-body mb-1 block">
              Contact Number
            </label>
            <input
              id="customer-phone"
              type="tel"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              placeholder="e.g. 0912 345 6789"
              className="w-full form-input-mobile bg-canvas border border-line rounded-lg text-base text-ink font-normal focus:outline-none focus:border-taupe"
            />
          </div>
        </div>
      )}
    </div>
  );
}
