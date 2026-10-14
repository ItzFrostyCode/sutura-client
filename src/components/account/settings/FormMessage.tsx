import { AlertCircle, CheckCircle2 } from 'lucide-react';

/** A short success or error line under a form, as a soft tinted box. */
export default function FormMessage({ message }: { readonly message: { type: 'success' | 'error'; text: string } | null }) {
  if (!message) return null;
  return (
    <div className={`mobile-caption mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5 ${message.type === 'success' ? 'bg-sage/10 text-sage' : 'bg-danger/5 text-danger'}`}>
      {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {message.text}
    </div>
  );
}
