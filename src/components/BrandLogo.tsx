import SuturaLogo from '@/components/brand/SuturaLogo';
import SuturaMark from '@/components/brand/SuturaMark';

// Dashboard / auth-page brand mark: the Tailor Pin icon alone, or the full
// lockup with the SUTURA wordmark.
export default function BrandLogo({ className = '', iconOnly = false }: { readonly className?: string; readonly iconOnly?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {/* This system's logo has the mark as its own component (no `variant` prop). */}
      {iconOnly ? <SuturaMark className="h-9 w-9" /> : <SuturaLogo className="h-10" />}
    </div>
  );
}
