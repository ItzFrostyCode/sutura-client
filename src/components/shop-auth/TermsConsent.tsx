import Link from 'next/link';

const LINK = 'font-semibold text-ink underline underline-offset-2';

/** "I agree to the Terms of Service and Privacy Policy": the same checkbox on customer and shop sign-up. Links open in a new tab so nothing typed is lost. */
export default function TermsConsent({ agreed, onChange, audience }: { readonly agreed: boolean; readonly onChange: (v: boolean) => void; readonly audience: 'owners' | 'customers' }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink">
      <input type="checkbox" checked={agreed} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#2B1E1A]" />
      <span>
        I agree to the <Link href={`/terms?for=${audience}`} target="_blank" rel="noopener noreferrer" className={LINK}>Terms of Service</Link> and{' '}
        <Link href="/privacy" target="_blank" rel="noopener noreferrer" className={LINK}>Privacy Policy</Link>.
      </span>
    </label>
  );
}
