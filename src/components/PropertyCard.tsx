'use client';

import { Property } from '@/lib/api';
import { rupees } from '@/lib/utils';

export default function PropertyCard({
  property,
  wishlisted,
  onToggleWishlist,
  onViewDeal,
  onAiPlan,
  badge = 'Verified',
  showRating = false,
}: {
  property: Property;
  wishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onViewDeal: (p: Property) => void;
  onAiPlan?: (p: Property) => void;
  badge?: string;
  showRating?: boolean;
}) {
  const mainImg = property.images?.[0] || '/images/paris.webp';

  return (
    <div className="bg-white dark:!bg-[#2a0a0f] rounded-lg border border-line overflow-hidden transition-all duration-300 relative flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-primary/50">
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mainImg} alt={property.room_type} className="w-full h-full object-cover transition-transform hover:scale-[1.04]" />
        <button
          onClick={() => onToggleWishlist(property.id)}
          aria-label="Toggle wishlist"
          className={`absolute top-3 right-3 w-[34px] h-[34px] rounded-full bg-white/85 backdrop-blur border-none cursor-pointer flex items-center justify-center text-base z-10 transition-all duration-200 hover:scale-110 shadow-sm ${
            wishlisted ? 'text-primary scale-110' : 'text-[#444]'
          }`}
        >
          ♥
        </button>
        <span className="absolute top-3 left-3 bg-[rgba(128,0,32,0.85)] backdrop-blur text-white text-[11px] font-bold px-2.5 py-1 rounded-pill uppercase shadow-sm">
          {badge}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div className="mb-3">
          <div className="text-xs font-bold text-ink-muted uppercase tracking-wide mb-1">📍 {property.location}</div>
          <h3 className="text-base font-bold leading-tight mb-1.5">{property.room_type}</h3>
          {showRating && (
            <div className="flex items-center gap-1 text-[13px] font-semibold">
              <span className="text-gold">★</span> 4.85
            </div>
          )}
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-line mt-2.5">
          <div className="flex flex-col">
            <span className="text-lg font-extrabold text-primary">{rupees(property.price)}</span>
            <span className="text-xs text-ink-muted font-medium">/ night</span>
          </div>
          <div className="flex gap-2">
            {onAiPlan && (
              <button
                onClick={() => onAiPlan(property)}
                className="rounded-sm text-[13px] font-bold px-3 py-2 border border-line bg-section text-primary hover:bg-primary hover:text-white hover:border-primary hover:shadow-glow transition-all duration-200"
              >
                ✨ AI Plan
              </button>
            )}
            <button onClick={() => onViewDeal(property)} className="card-btn rounded-sm text-[13px] font-bold px-3 py-2 border border-line bg-white dark:bg-[#1a0006] text-ink-main dark:text-white hover:bg-primary hover:text-white hover:border-primary hover:shadow-glow transition-all duration-200">
              View Deal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
