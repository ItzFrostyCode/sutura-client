import SuturaMark from '@/components/brand/SuturaMark';

/** SUTURA's face in the conversation: the Tailor Pin on a linen square. */
export default function AskBadge({ size }: { readonly size: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'h-20 w-20' : 'h-8 w-8';
  return (
    <span className={`relative flex shrink-0 items-center justify-center bg-[#EFE6DA] ${box}`} aria-hidden="true">
      <SuturaMark detail={size === 'lg' ? 'full' : 'small'} className={size === 'lg' ? 'h-16 w-16' : 'h-7 w-7'} />
    </span>
  );
}
