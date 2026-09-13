'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { api, Booking, Property } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import PropertyCard from '@/components/PropertyCard';
import BookingModal from '@/components/BookingModal';
import KartograferModal from '@/components/KartograferModal';
import LeafletMap from '@/components/LeafletMap';

type ViewMode = 'list' | 'split' | 'map';

function ExploreInner() {
  const params = useSearchParams();
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [location, setLocation] = useState(params.get('location') || params.get('search') || '');
  const [checkin, setCheckin] = useState(params.get('checkin') || '');
  const [checkout, setCheckout] = useState(params.get('checkout') || '');
  const [maxPrice, setMaxPrice] = useState('');
  const [minGuests, setMinGuests] = useState(params.get('guests') || '1');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [sort, setSort] = useState('recommended');
  const [view, setView] = useState<ViewMode>('list');

  const [selected, setSelected] = useState<Property | null>(null);
  const [aiProperty, setAiProperty] = useState<Property | null>(null);
  const [spotFocus, setSpotFocus] = useState<[number, number] | null>(null);

  useEffect(() => {
    setWishlist(JSON.parse(localStorage.getItem('villa_wishlist_ids') || '[]'));

    Promise.all([
      api.properties(),
      api.myBookings().catch(() => [] as Booking[]),
    ])
      .then(([props, books]) => {
        setProperties(props);
        setBookings(books);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const filtered = useMemo(() => {
    const loc = location.toLowerCase().trim();
    const maxP = parseFloat(maxPrice);
    const minG = parseInt(minGuests) || 1;

    let out = properties.filter((p) => {
      if (loc && !p.location.toLowerCase().includes(loc) && !p.room_type.toLowerCase().includes(loc)) return false;
      if (!isNaN(maxP) && p.price > maxP) return false;
      if (p.max_guests && p.max_guests < minG) return false;
      if (checkin && p.avail_from && checkin < p.avail_from) return false;
      if (checkout && p.avail_to && checkout > p.avail_to) return false;
      if (amenities.length > 0) {
        const pAmen = (p.amenities || []).map((a) => a.toLowerCase());
        const hasAll = amenities.every((a) => pAmen.includes(a.toLowerCase()));
        if (!hasAll) return false;
      }
      return true;
    });

    if (sort === 'price_low') out = [...out].sort((a, b) => a.price - b.price);
    else if (sort === 'price_high') out = [...out].sort((a, b) => b.price - a.price);
    return out;
  }, [properties, location, maxPrice, minGuests, checkin, checkout, amenities, sort]);

  const resetFilters = () => {
    setLocation('');
    setMaxPrice('');
    setCheckin('');
    setCheckout('');
    setAmenities([]);
  };

  const toggleWishlist = useCallback(
    async (id: string) => {
      const next = wishlist.includes(id) ? wishlist.filter((w) => w !== id) : [...wishlist, id];
      setWishlist(next);
      localStorage.setItem('villa_wishlist_ids', JSON.stringify(next));
      if (user) {
        try { await api.updateWishlist(next); } catch { /* local fallback */ }
      }
    },
    [wishlist, user],
  );

  // Deep link: /explore?id=<propertyId> opens the booking modal
  useEffect(() => {
    const id = params.get('id');
    if (!id || loading || properties.length === 0) return;
    const target = properties.find((p) => p.id === id);
    if (target) {
      setSelected(target);
      if (target.latitude && target.longitude) {
        setSpotFocus([target.latitude, target.longitude]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, properties, params]);

  useEffect(() => {
    if (selected && selected.latitude && selected.longitude) {
      setSpotFocus([selected.latitude, selected.longitude]);
    }
  }, [selected]);

  const aiSpotlight = params.get('ai') === '1';

  return (
    <>
      <div className="max-w-[1300px] mx-auto my-5 px-5 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Filter sidebar */}
        <aside className="surface-card rounded-md p-5 h-fit lg:sticky lg:top-24 shadow-sm">
          <div className="flex justify-between items-center pb-2.5 mb-4 border-b border-line">
            <span className="font-extrabold text-base">Filter Results</span>
            <button onClick={resetFilters} className="bg-transparent border-none text-primary text-xs font-bold cursor-pointer">Reset All</button>
          </div>

          <div className="mb-5">
            <label className="filter-label">Destination / Keyword</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Goa, Manali, Kerala" className="w-full px-3 py-2.5 rounded-sm border border-line bg-section mb-3 text-sm font-medium outline-none" />
          </div>

          <div className="mb-5">
            <label className="filter-label">Check-in Date</label>
            <input type="date" min={today()} value={checkin} onChange={(e) => { setCheckin(e.target.value); if (checkout && checkout < e.target.value) setCheckout(''); }} className="w-full px-3 py-2.5 rounded-sm border border-line bg-section mb-3 text-sm font-medium outline-none" />
            <label className="filter-label">Check-out Date</label>
            <input type="date" min={checkin || today()} value={checkout} onChange={(e) => setCheckout(e.target.value)} className="w-full px-3 py-2.5 rounded-sm border border-line bg-section mb-3 text-sm font-medium outline-none" />
          </div>

          <div className="mb-5">
            <label className="filter-label">Max Price / Night (₹)</label>
            <input type="number" step={100} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="e.g. 1500" className="w-full px-3 py-2.5 rounded-sm border border-line bg-section mb-3 text-sm font-medium outline-none" />
          </div>

          <div className="mb-5">
            <label className="filter-label">Minimum Guests</label>
            <select value={minGuests} onChange={(e) => setMinGuests(e.target.value)} className="w-full px-3 py-2.5 rounded-sm border border-line bg-section mb-3 text-sm font-medium outline-none">
              <option value="1">1+ Guests</option>
              <option value="2">2+ Guests</option>
              <option value="4">4+ Guests</option>
              <option value="6">6+ Guests</option>
            </select>
          </div>

          <div className="mb-5">
            <label className="filter-label">Amenities</label>
            <div className="flex flex-col gap-2.5">
              {['Wi-Fi', 'Kitchen', 'AC', 'Pool'].map((a) => (
                <label key={a} className="flex items-center gap-2 text-[13px] font-semibold cursor-pointer">
                  <input type="checkbox" checked={amenities.includes(a)} onChange={() => toggleAmenity(a)} /> {a}
                </label>
              ))}
            </div>
          </div>

          <button onClick={() => setView(view)} className="btn-primary w-full py-3 rounded-sm">Apply Filters</button>
        </aside>

        {/* Results */}
        <main>
          <div className="surface-card rounded-md px-5 py-3.5 mb-4 flex flex-wrap justify-between items-center gap-3 shadow-sm">
            <div className="text-[15px] font-bold">
              {loading ? 'Loading available stays...' : `${filtered.length} Stays Available`}
            </div>
            <div className="flex gap-2">
              {([['list', '📋 List View'], ['split', '🌗 Split View'], ['map', '🗺️ Map View']] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setView(mode)}
                  className={`px-4 py-2 rounded-pill border text-[13px] font-semibold transition-all ${
                    view === mode ? 'bg-primary text-white border-primary' : 'border-line bg-white dark:!bg-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2.5 text-[13px] font-semibold">
              <label>Sort:</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 rounded-sm border border-line bg-section outline-none w-[150px]">
                <option value="recommended">Recommended</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {aiSpotlight && (
            <div className="bg-gradient-to-r from-primary to-[#1a1c1e] text-white p-5 rounded-xl mb-5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="m-0 font-bold">✨ Kartografer AI Recommendations Active</h3>
                <p className="mt-1 mb-0 opacity-90 text-sm">Browse stays below and click <strong>&quot;AI Plan&quot;</strong> to see custom itineraries for each location.</p>
              </div>
              <button onClick={(e) => ((e.target as HTMLElement).parentElement!.style.display = 'none')} className="bg-white/20 border-none text-white px-4 py-2 rounded-lg cursor-pointer font-bold">
                Dismiss
              </button>
            </div>
          )}

          <div className={view === 'split' ? 'grid lg:grid-cols-2 gap-5' : 'block'}>
            <div className={view === 'map' ? 'hidden' : view === 'split' ? 'grid grid-cols-1 gap-5' : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'}>
              {filtered.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  wishlisted={wishlist.includes(p.id)}
                  onToggleWishlist={toggleWishlist}
                  onViewDeal={setSelected}
                  onAiPlan={setAiProperty}
                  badge="Verified"
                  showRating
                />
              ))}
              {!loading && filtered.length === 0 && (
                <div className="col-span-full text-center py-12 text-ink-muted">
                  <h3 className="text-lg font-bold mb-1">No homestays match your search criteria</h3>
                  <p>Try clearing filters or changing your search terms.</p>
                </div>
              )}
              {loading && <p className="col-span-full text-center py-12 text-ink-muted">Loading stays...</p>}
            </div>

            {view !== 'list' && (
              <div className={view === 'split' ? 'lg:sticky lg:top-24 h-[600px]' : 'h-[650px]'}>
                <LeafletMap properties={filtered} onSelect={setSelected} focus={spotFocus} />
              </div>
            )}
          </div>
        </main>
      </div>

      {selected && (
        <BookingModal
          property={selected}
          bookings={bookings}
          onClose={() => setSelected(null)}
        />
      )}
      {aiProperty && <KartograferModal property={aiProperty} onClose={() => setAiProperty(null)} />}
    </>
  );
}

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<p className="text-center py-20 text-ink-muted">Loading explore...</p>}>
      <ExploreInner />
    </Suspense>
  );
}
