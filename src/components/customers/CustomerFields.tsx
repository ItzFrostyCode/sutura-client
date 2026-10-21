import type { ReactNode } from 'react';
import GenderPicker, { type Gender } from '@/components/shared/GenderPicker';

export interface CustomerFieldValues { name: string; email: string; phone: string; gender: Gender | '' }

interface Props {
  readonly value: CustomerFieldValues;
  readonly onChange: (next: CustomerFieldValues) => void;
  /** Only when editing: a new customer is registered by name, mobile number and gender; the email is not asked. */
  readonly showEmail?: boolean;
  readonly children?: ReactNode;
}

const INPUT = 'w-full min-h-11 bg-canvas border border-line rounded-lg px-4 py-2 text-base sm:text-sm text-ink focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe';
const LABEL = 'block text-sm font-medium text-ink-body mb-1';

/** The one set of fields behind every "add / edit customer" form. Name, mobile number and gender are all required. */
export default function CustomerFields({ value, onChange, showEmail = false, children }: Props) {
  return (
    <>
      <div>
        <label htmlFor="name" className={LABEL}>Full name <span className="text-danger">*</span></label>
        <input id="name" type="text" required autoComplete="off" value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} className={INPUT} placeholder="Juan Dela Cruz" />
      </div>
      <div>
        <label htmlFor="phone" className={LABEL}>Mobile number <span className="text-danger">*</span></label>
        <input
          id="phone" type="tel" inputMode="tel" required autoComplete="off" maxLength={16}
          value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value.replace(/[^\d+\s-]/g, '') })}
          className={INPUT} placeholder="0917 123 4567"
        />
        {(() => {
          const digits = value.phone.replace(/\D+/g, '');
          if (!digits) {
            return <p className="mt-1 text-xs text-ink-muted">Enter an 11-digit number starting with 09 (e.g. 0977 704 4683)</p>;
          }
          if (digits.startsWith('09')) {
            if (digits.length === 11) {
              return <p className="mt-1 text-xs text-emerald-600 font-medium">✓ 11-digit Philippine mobile number</p>;
            }
            if (digits.length > 11) {
              return <p className="mt-1 text-xs text-rose-600 font-medium">⚠️ {digits.length} digits entered — Philippine numbers must be exactly 11 digits</p>;
            }
            return <p className="mt-1 text-xs text-ink-muted">{digits.length}/11 digits (Philippine numbers have 11 digits)</p>;
          }
          if (digits.startsWith('63') && digits.length === 12) {
            return <p className="mt-1 text-xs text-emerald-600 font-medium">✓ Valid Philippine mobile number (+63)</p>;
          }
          return <p className="mt-1 text-xs text-amber-600">Philippine mobile numbers start with 09 (e.g. 0977 704 4683)</p>;
        })()}
      </div>
      <GenderPicker value={value.gender} onChange={(gender) => onChange({ ...value, gender })} optional={false} />
      {showEmail && (
        <div>
          <label htmlFor="email" className={LABEL}>Email <span className="text-xs font-normal text-ink-muted">(optional)</span></label>
          <input id="email" type="email" inputMode="email" value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} className={INPUT} placeholder="juan@example.com" />
        </div>
      )}
      {children}
    </>
  );
}
