import Link from 'next/link';

interface ServiceRequestLinkProps {
  readonly href: string;
  /** "repair" for alterations and repairs (price list), "order" for a made-to-measure request. */
  readonly kind?: 'order' | 'repair';
}

/** A quiet second way in that does not need a visit: ask for a price, or send a garment for repair. */
export default function ServiceRequestLink({ href, kind = 'order' }: Readonly<ServiceRequestLinkProps>) {
  return (
    <p className="mobile-body-sm px-4 pt-3 font-normal text-ink-body min-[375px]:px-6 min-[600px]:px-0">
      {kind === 'repair' ? 'Have a garment to fix? ' : 'Not ready to visit? '}
      <Link href={href} className="font-semibold text-taupe underline-offset-2 hover:underline">
        {kind === 'repair' ? 'Request a repair' : 'Send an order request'}
      </Link>
      {kind === 'repair' ? ' and pick what needs fixing from the shop’s price list.' : ' and the shop will reply with a price.'}
    </p>
  );
}
