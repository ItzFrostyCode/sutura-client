import { Check } from 'lucide-react';
import { PASSWORD_RULES } from '@/lib/passwordRules';

/** The same live rule list as Create Account. */
export default function PasswordChecklist({ password }: { readonly password: string }) {
  return (
    <ul className="mt-3 space-y-1.5" aria-live="polite">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li key={rule.key} className="flex items-center gap-2 text-xs">
            <span className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${met ? 'bg-taupe border-taupe text-white' : 'border-line-strong text-transparent'}`}>
              <Check size={10} strokeWidth={3} />
            </span>
            <span className={met ? 'text-ink' : 'text-ink-muted'}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
