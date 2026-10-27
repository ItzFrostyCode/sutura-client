import SuturaLogo from '@/components/brand/SuturaLogo';

// Dashboard / auth-page brand mark: the Tailor Pin icon alone, or the full
// lockup with the SUTURA wordmark.
export default function BrandLogo({ className = '', iconOnly = false }: { readonly className?: string; readonly iconOnly?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <SuturaLogo variant={iconOnly ? 'mark' : 'lockup'} className={iconOnly ? 'h-9' : 'h-10'} />
    </div>
  );
}
