import HomeSectionHeader from './HomeSectionHeader';
import { ServiceCardSkeleton, SkeletonRow } from './HomeSkeletons';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import SearchServiceCard from '@/components/search/SearchServiceCard';
import ServiceCarouselRow from '@/components/search/ServiceCarouselRow';
import type { SearchServiceResult } from '@/components/search/types';

interface HomeServicesProps {
  readonly services: SearchServiceResult[];
  readonly loading: boolean;
}

/** Real services shops offer (not the service categories — those are one tap away in Categories). */
export default function HomeServices({ services, loading }: HomeServicesProps) {
  const gate = useGuestGatedHref();
  const offered = services.filter((s) => s.store?.slug);

  return (
    <section aria-labelledby="home-services-title">
      <HomeSectionHeader id="home-services-title" title="Services" href="/search?tab=services" linkLabel="See All Services" />
      {loading ? (
        <SkeletonRow>{(i) => <ServiceCardSkeleton key={i} />}</SkeletonRow>
      ) : offered.length === 0 ? (
        <p className="mobile-body-md card-soft px-6 py-8 text-center text-ink-muted">No services are listed yet.</p>
      ) : (
        <ServiceCarouselRow>
          {offered.map((service) => (
            <SearchServiceCard key={service.id} service={service} storeSlug={service.store!.slug} gate={gate} soft />
          ))}
        </ServiceCarouselRow>
      )}
    </section>
  );
}
