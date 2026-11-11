import ServiceMiniCard from '@/components/account/ServiceMiniCard';

/** A service as the customer lists return it (/my-saved-services, /my-service-reviews). */
export interface AccountService {
  id: number;
  name: string;
  description: string | null;
  base_price: string | number | null;
  estimated_days: number | null;
  estimated_days_max?: number | null;
  image_url: string | null;
  reviews_count: number;
  reviews_avg_rating: number | null;
  store: { id: number; name: string; slug: string } | null;
}

/** The Services tab of My Saved and My Ratings: one card per service, linking to its page. */
export default function AccountServiceGrid({ services }: { readonly services: AccountService[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {services.filter((s) => s.store).map((s) => (
        <ServiceMiniCard
          key={s.id}
          href={`/store/${s.store!.slug}/service/${s.id}`}
          name={s.name}
          imageUrl={s.image_url}
          eyebrow={s.store!.name}
          basePrice={s.base_price}
          estimatedDays={s.estimated_days}
          estimatedDaysMax={s.estimated_days_max}
          rating={s.reviews_avg_rating}
          reviewsCount={s.reviews_count ?? 0}
        />
      ))}
    </div>
  );
}
