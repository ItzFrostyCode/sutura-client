import React from 'react';
import { Globe, ExternalLink, Info, Clock, Pencil } from 'lucide-react';
import { StoreProfile } from '../types';
import { formatTime12h, getSocialUrl, getMessengerUrl } from '../storeStorefrontHelpers';
import ProfileAboutTab from '@/components/profile/ProfileAboutTab';

interface StoreAboutTabProps {
  readonly store: StoreProfile;
  readonly isStoreCurrentlyOpen: boolean;
  readonly isOwnerViewingOwnStore: boolean;
  readonly onOpenHoursModal: () => void;
}

export default function StoreAboutTab({
  store,
  isStoreCurrentlyOpen,
  isOwnerViewingOwnStore,
  onOpenHoursModal,
}: StoreAboutTabProps) {
  return (
    <div className="space-y-3.5 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
        {/* LEFT: Social Links + Description */}
        <div className="space-y-3.5">
          {/* Social Links */}
          <div className="bg-surface border border-line p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={16} className="text-taupe" />
              <h3 className="text-sm font-bold text-ink">Social Links</h3>
            </div>

            {store.social_links && store.social_links.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {store.social_links.map((link) => {
                  const lower = link.label?.toLowerCase() || '';
                  const isFb = lower.includes('facebook') || lower.includes('fb');
                  const isIg = lower.includes('instagram') || lower.includes('ig');
                  const isTiktok = lower.includes('tiktok');

                  return (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] inline-flex items-center gap-2.5 px-4 py-2 border border-line bg-canvas hover:bg-sunken text-sm font-medium text-ink transition-all active:scale-[0.98]"
                    >
                      {isFb ? (
                        <svg className="w-4 h-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      ) : isIg ? (
                        <svg className="w-4 h-4 fill-[#E4405F] shrink-0" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      ) : isTiktok ? (
                        <span className="text-xs font-black shrink-0">🎵</span>
                      ) : (
                        <Globe size={16} className="text-taupe shrink-0" />
                      )}
                      <span>{link.label || 'Social Link'}</span>
                      <ExternalLink size={13} className="text-ink-faint ml-0.5" />
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="mobile-body-sm text-ink-muted flex items-center justify-between py-1">
                <span>No social links listed yet.</span>
                <a
                  href={getMessengerUrl(getSocialUrl(store.social_links, 'facebook'))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-taupe font-semibold hover:underline inline-flex items-center gap-1.5 min-h-[44px]"
                >
                  Message on Facebook <ExternalLink size={13} />
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-surface border border-line p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-2">
              <Info size={16} className="text-taupe" />
              <h3 className="mobile-h4 text-ink">Description</h3>
            </div>
            <p className="mobile-body-sm text-ink-body font-normal leading-relaxed whitespace-pre-line">
              {store.description || 'No description provided yet.'}
            </p>
          </div>
        </div>

        {/* RIGHT: Opening Hours */}
        <div className="bg-surface border border-line p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-taupe" />
              <h3 className="mobile-h4 text-ink">Opening hours</h3>
            </div>
            <span
              className={`text-xs font-semibold px-3 py-1 border ${
                isStoreCurrentlyOpen
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-ink-muted bg-sunken border-line'
              }`}
            >
              {isStoreCurrentlyOpen ? 'Open now' : 'Closed now'}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            {[
              { key: 'sunday', label: 'Sunday' },
              { key: 'monday', label: 'Monday' },
              { key: 'tuesday', label: 'Tuesday' },
              { key: 'wednesday', label: 'Wednesday' },
              { key: 'thursday', label: 'Thursday' },
              { key: 'friday', label: 'Friday' },
              { key: 'saturday', label: 'Saturday' },
            ].map(({ key, label }) => {
              const dayHours = store.operating_hours?.[key];
              const isToday =
                ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
                  new Date().getDay()
                ] === key;
              const isOpen = dayHours?.is_open && dayHours.open && dayHours.close;

              return (
                <div
                  key={key}
                  className={`flex items-center justify-between py-2 px-2.5 transition-colors ${
                    isToday ? 'bg-taupe/10 font-medium' : 'text-ink-body font-normal'
                  }`}
                >
                  <span className={`capitalize ${isToday ? 'font-semibold text-ink' : 'text-ink-body'}`}>
                    {label} {isToday && <span className="text-[11px] text-taupe font-semibold ml-1">(Today)</span>}
                  </span>
                  {isOpen ? (
                    <span className={`font-medium ${isToday ? 'text-ink font-semibold' : 'text-ink-body'}`}>
                      {formatTime12h(dayHours.open)} – {formatTime12h(dayHours.close)}
                    </span>
                  ) : (
                    <span className="text-ink-faint font-normal">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
          {isOwnerViewingOwnStore && (
            <button
              type="button"
              onClick={onOpenHoursModal}
              className="mt-3 min-h-[44px] text-xs font-semibold text-taupe hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Pencil size={13} /> Edit Hours
            </button>
          )}
        </div>
      </div>

      {/* Owner-only About settings panel */}
      {isOwnerViewingOwnStore && (
        <div className="pt-4 border-t border-line">
          <ProfileAboutTab />
        </div>
      )}
    </div>
  );
}
