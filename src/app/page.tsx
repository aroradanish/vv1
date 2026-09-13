'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { api, Property } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { POPULAR_LOCATIONS, generateItinerary, coordsFor } from '@/lib/karto';
import { rupees } from '@/lib/utils';
import PropertyCard from '@/components/PropertyCard';
import SectionHeader from '@/components/SectionHeader';
import LeafletMap from '@/components/LeafletMap';

const DESTINATIONS = [
  { name: 'Goa', img: '/images/destination_goa.jpg', sub: 'Beach villas & resorts · 45+ Stays' },
  { name: 'Manali', img: '/images/destination_manali.jpg', sub: 'Mountain chalets & views · 30+ Stays' },
  { name: 'Jaipur', img: '/images/destination_jaipur.jpg', sub: 'Royal havelis & palaces · 25+ Stays' },
  { name: 'Kerala', img: '/images/destination_kerala.jpg', sub: 'Backwater houseboats & homestays · 38+ Stays' },
  { name: 'Chennai', img: '/images/bali.webp', sub: 'Coastal penthouses · 20+ Stays' },
];

const FAQS = [
  { q: 'How does VillaVista work?', a: 'VillaVista lets you search and compare homestays, apartments, and luxury villas across major cities and travel destinations. You can filter by price, date, and guest count to reserve stays directly.' },
  { q: 'Can I cancel my booking for free?', a: 'Most properties offer free cancellation up to 48 hours before check-in. Specific cancellation policies are clearly detailed on each property details card before payment.' },
  { q: 'Are reviews on VillaVista verified?', a: 'Yes! Only verified guests who have completed a stay at a property can leave ratings and reviews.' },
  { q: 'How do host payouts and registration work?', a: 'Property owners can log in to the Host & Admin Dashboard to list properties, manage availability, view reservations, and set nightly rates dynamically.' },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [destination, setDestination] = useState('');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState(2);
  const [showAuto, setShowAuto] = useState(false);

  const [properties, setProperties] = useState<Property[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Home Kartografer mini-planner
  const [aiDest, setAiDest] = useState('');
  const [aiDays, setAiDays] = useState(3);
  const [aiGuests, setAiGuests] = useState(2);
  const [aiVibe, setAiVibe] = useState('Relaxing');
  const [aiPlan, setAiPlan] = useState<ReturnType<typeof generateItinerary> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setWishlist(JSON.parse(localStorage.getItem('villa_wishlist_ids') || '[]'));
    api.properties().then(setProperties).catch(() => setProperties([]));
  }, []);

  const autocomplete = useMemo(() => {
    const v = destination.toLowerCase().trim();
    if (!v) return [];
    return POPULAR_LOCATIONS.filter((l) => l.name.toLowerCase().includes(v) || l.desc.toLowerCase().includes(v));
  }, [destination]);

  const search = () => {
    if (checkin && checkout && new Date(checkout) <= new Date(checkin)) {
      alert('Check-out date must be after check-in date.');
      return;
    }
    const params = new URLSearchParams();
    if (destination) params.set('location', destination);
    if (checkin) params.set('checkin', checkin);
    if (checkout) params.set('checkout', checkout);
    params.set('guests', String(guests));
    router.push(`/explore?${params.toString()}`);
  };

  const toggleWishlist = async (id: string) => {
    const next = wishlist.includes(id) ? wishlist.filter((w) => w !== id) : [...wishlist, id];
    setWishlist(next);
    localStorage.setItem('villa_wishlist_ids', JSON.stringify(next));
    if (user) {
      try { await api.updateWishlist(next); } catch { /* offline fallback keeps localStorage */ }
    }
  };

  const runPlanner = () => {
    if (!aiDest.trim()) {
      alert('Please enter a destination to plan!');
      return;
    }
    setAiLoading(true);
    setTimeout(() => {
      setAiPlan(generateItinerary(aiDest, aiDays, aiGuests, aiVibe));
      setAiLoading(false);
    }, 1500);
  };

  return (
    <>
      {/* Hero section with background image behind nav */}
      <section className="relative min-h-[650px] flex items-center pt-24 pb-16 px-5 -mt-24">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero.png"
            alt="Hero Background"
            className="w-full h-full object-cover brightness-[0.85] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#fcfafb] dark:to-[#050001]" />
        </div>

        <div className="max-w-[1100px] mx-auto w-full relative z-10">
          <div className="mb-10">
            <h1 className="text-[2.8rem] md:text-[3.5rem] font-extrabold text-white mb-4 tracking-tight drop-shadow-lg leading-[1.1]">
              Where will your <br />
              <span className="text-primary-light">next stay be?</span>
            </h1>
            <p className="text-white/90 text-lg font-medium max-w-[500px] drop-shadow-md">
              Discover unique homestays and luxury villas across India's most breathtaking destinations.
            </p>
          </div>

          <div className="flex gap-3 mb-6 overflow-x-auto pb-2 hide-scrollbar">
            {['🏠 All Stays', '🏡 Villas', '🏢 Apartments', '⛵ Experiences'].map((cat, idx) => (
              <button
                key={cat}
                onClick={() => idx > 0 && router.push(`/explore?category=${cat.split(' ')[1].toLowerCase()}`)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold backdrop-blur-md transition-all border ${idx === 0 ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white/20 text-white border-white/30 hover:bg-white/40'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="bg-white dark:!bg-[#0f0003] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-1 flex flex-col md:flex-row gap-0 border border-primary/20 relative max-w-[1100px] mx-auto group">
            <div className="flex-1 flex flex-wrap items-center relative">
              {/* TO / DESTINATION */}
              <div className="flex-1 min-w-full sm:min-w-0 px-5 py-2 relative border-r border-line/40 hover:bg-primary/5 transition-colors cursor-pointer group/dest">
                <label className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider block mb-0.5">To / Destination</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => { setDestination(e.target.value); setShowAuto(true); }}
                    onBlur={() => setTimeout(() => setShowAuto(false), 150)}
                    placeholder="Where to? (e.g. Goa, Jaipur)"
                    className="w-full bg-transparent outline-none text-[15px] font-bold text-ink-main dark:!text-white placeholder:text-ink-soft/40"
                  />
                </div>
                {showAuto && autocomplete.length > 0 && (
                  <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[300px] bg-white dark:!bg-[#0f0003] rounded-xl shadow-2xl border border-line z-[100] max-h-[300px] overflow-y-auto overflow-x-hidden backdrop-blur-xl animate-fadeIn">
                    {autocomplete.map((m) => (
                      <div
                        key={m.name}
                        onMouseDown={() => { setDestination(m.name); setShowAuto(false); }}
                        className="px-5 py-3 flex items-center gap-4 cursor-pointer border-b border-line/30 hover:bg-primary/5 transition-all group/item"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-white transition-colors">
                          <span className="text-xl">📍</span>
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-ink-main dark:text-white">{m.name}</div>
                          <div className="text-[10px] text-ink-muted uppercase tracking-widest mt-0.5">{m.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CHECK-IN */}
              <div className="px-5 py-2 border-t sm:border-t-0 sm:border-r border-line/40 flex-1 min-w-[150px] hover:bg-primary/5 transition-colors cursor-pointer">
                <label className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider block mb-0.5">Check-in</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    min={todayStr()}
                    value={checkin}
                    onChange={(e) => setCheckin(e.target.value)}
                    className="w-full bg-transparent outline-none text-[15px] font-bold dark:!text-white cursor-pointer uppercase"
                  />
                </div>
              </div>

              {/* CHECK-OUT */}
              <div className="px-5 py-2 border-t sm:border-t-0 sm:border-r border-line/40 flex-1 min-w-[150px] hover:bg-primary/5 transition-colors cursor-pointer">
                <label className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider block mb-0.5">Check-out</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    min={checkin || todayStr()}
                    value={checkout}
                    onChange={(e) => setCheckout(e.target.value)}
                    className="w-full bg-transparent outline-none text-[15px] font-bold dark:!text-white cursor-pointer uppercase"
                  />
                </div>
              </div>

              {/* GUESTS & ROOMS */}
              <div className="px-5 py-2 hidden lg:block min-w-[140px] hover:bg-primary/5 transition-colors cursor-pointer">
                <label className="text-[10px] font-extrabold text-ink-muted uppercase tracking-wider block mb-0.5">Guests & Rooms</label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="bg-transparent border-none font-extrabold cursor-pointer outline-none dark:!text-white text-[15px] appearance-none w-full"
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests</option>
                  <option value={4}>4 Guests</option>
                  <option value={6}>6+ Guests</option>
                </select>
              </div>
            </div>

            {/* SEARCH BUTTON */}
            <button
              onClick={search}
              className="bg-primary text-white rounded-xl h-[50px] px-8 flex items-center justify-center gap-3 text-base font-black transition-all hover:bg-primary-hover active:scale-[0.98] shadow-[0_10px_20px_rgba(128,0,32,0.2)] ml-2 self-center mr-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-5 h-5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

        </div>
      </section>

      {/* Trust banner */}
      <section className="py-10 px-5 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            ['🔍', 'Search & Compare', 'Compare hundreds of verified homestays and villas in top tourist spots.'],
            ['💰', 'No Hidden Fees', 'Transparent night rates and breakdown with zero surprise charges at checkout.'],
            ['⭐', 'Verified Reviews', 'Real ratings and detailed host reviews from actual guests.'],
            ['⚡', 'Instant Confirmation', 'Book with confidence and get immediate booking reservation slips.'],
          ].map(([icon, title, text]) => (
            <div key={title} className="surface-card dark:!bg-[#2a0a0f] p-5 rounded-lg border border-line flex items-start gap-4 hover:shadow-lg hover:border-primary hover:-translate-y-1 transition-all duration-300">
              <div className="w-11 h-11 bg-primary-light text-primary rounded-full flex items-center justify-center text-xl shrink-0">{icon}</div>
              <div>
                <h4 className="text-[15px] font-bold mb-1">{title}</h4>
                <p className="text-[13px] text-ink-muted leading-snug">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Kartografer AI section */}
      <section className="max-w-[1200px] mx-auto my-10 px-5">
        <div className="bg-white dark:!bg-[#2a0a0f] border-2 border-primary rounded-[24px] p-10 shadow-lg">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-[2.5rem] font-extrabold mb-4 leading-tight">
                <span className="text-gradient-primary">🗺️ Kartografer AI</span>
              </h2>
              <p className="text-[1.1rem] text-ink-muted mb-8">
                Plan your entire trip in seconds. Get hyper-local recommendations for cafes, hidden gems, and restaurants tailored to your vibe.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-section rounded-xl p-3 border border-line">
                  <label className="field-label block mb-1">Where to?</label>
                  <input value={aiDest} onChange={(e) => setAiDest(e.target.value)} placeholder="e.g. Goa" className="w-full bg-transparent outline-none font-semibold dark:!text-white" />
                </div>
                <div className="bg-section rounded-xl p-3 border border-line">
                  <label className="field-label block mb-1">How many days?</label>
                  <input type="number" min={1} value={aiDays} onChange={(e) => setAiDays(parseInt(e.target.value) || 1)} className="w-full bg-transparent outline-none font-semibold dark:!text-white" />
                </div>
                <div className="bg-section rounded-xl p-3 border border-line">
                  <label className="field-label block mb-1">Guests</label>
                  <input type="number" min={1} value={aiGuests} onChange={(e) => setAiGuests(parseInt(e.target.value) || 1)} className="w-full bg-transparent outline-none font-semibold dark:!text-white" />
                </div>
                <div className="bg-section rounded-xl p-3 border border-line">
                  <label className="field-label block mb-1">Trip Type</label>
                  <select value={aiVibe} onChange={(e) => setAiVibe(e.target.value)} className="w-full bg-transparent outline-none font-semibold dark:!text-white">
                    <option>🧘 Relaxing</option>
                    <option>🧗 Adventure</option>
                    <option>👨‍👩‍👧‍👦 Family</option>
                    <option>🍴 Foodie</option>
                  </select>
                </div>
              </div>
              <button onClick={runPlanner} className="btn-primary w-full mt-6 py-3.5 rounded-xl">
                {aiLoading ? '✨ Mapping your journey...' : '✨ Generate My Plan'}
              </button>
              {aiPlan && (
                <div className="mt-5 bg-section rounded-xl p-4 border border-line text-sm">
                  <strong className="text-primary">{planDaysLabel(aiPlan.days.length)} · {aiPlan.city}</strong>
                  {aiPlan.days.map((d) => (
                    <p key={d.day} className="mt-1.5 text-ink-muted text-[13px]">
                      <b>Day {d.day}:</b> {d.place} · ☕ {d.cafe} · 🍲 {d.restaurant}
                    </p>
                  ))}
                  <p className="mt-2 font-bold text-primary">Est. local cost: {rupees(aiPlan.localCost)}</p>
                </div>
              )}
            </div>
            <div className="relative h-[400px]">
              {aiPlan ? (
                <div className="w-full h-full rounded-[20px] overflow-hidden shadow-md border border-line">
                  <LeafletMap
                    properties={[]}
                    center={coordsFor(aiPlan.city)}
                    zoom={12}
                  />
                </div>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/bali.webp" alt="Bali" className="w-full h-full object-cover rounded-[20px] shadow-md" />
                  <div className="absolute bottom-5 left-5 right-5 bg-white/90 p-4 rounded-xl border-l-[5px] border-primary">
                    <p className="font-extrabold text-sm text-primary mb-1">RECENTLY PLANNED</p>
                    <p className="text-[13px] font-semibold">&quot;A perfect 4-day foodie trail in Jaipur with heritage cafes and hidden rooftop dining.&quot;</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="max-w-[1200px] mx-auto py-8 px-5">
        <SectionHeader title="Popular Destinations in India" subtitle="Explore trending spots and unique stays chosen by travelers" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {DESTINATIONS.map((d) => (
            <div
              key={d.name}
              onClick={() => router.push(`/explore?location=${encodeURIComponent(d.name)}`)}
              className="relative rounded-lg overflow-hidden h-[260px] cursor-pointer shadow-sm hover:shadow-lg group transition-shadow duration-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.img} alt={d.name} className="w-full h-full object-cover transition-transform group-hover:scale-[1.08]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-4 text-white">
                <div className="text-xl font-bold">{d.name}</div>
                <div className="text-[13px] opacity-90">{d.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured stays */}
      <section className="max-w-[1200px] mx-auto py-8 px-5">
        <SectionHeader title="Featured Homestays & Stays" subtitle="Top rated properties with instant booking availability" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {properties.slice(0, 8).map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              wishlisted={wishlist.includes(p.id)}
              onToggleWishlist={toggleWishlist}
              onViewDeal={() => router.push(`/explore?id=${p.id}`)}
              badge="Verified Host"
            />
          ))}
          {properties.length === 0 && (
            <p className="col-span-full text-center py-10 text-ink-muted">Loading verified homestays...</p>
          )}
        </div>
      </section>

      <section className="max-w-[900px] mx-auto my-10 px-5">
        <div className="text-center mb-7">
          <h2 className="text-[1.6rem] font-extrabold">Frequently Asked Questions</h2>
          <p className="text-ink-muted text-sm mt-1">Everything you need to know about booking homestays on VillaVista</p>
        </div>
        <div className="flex flex-col gap-3 mt-5">
          {FAQS.map((f, i) => (
            <div key={i} className={`surface-card dark:!bg-[#2a0a0f] border border-line rounded-lg overflow-hidden transition-all duration-300 ${faqOpen === i ? 'shadow-md border-primary/40' : 'hover:shadow-sm'}`}>
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full px-6 py-[18px] font-bold text-base flex justify-between items-center cursor-pointer hover:bg-section text-left"
              >
                <span className={faqOpen === i ? 'text-primary' : ''}>{f.q}</span>
                <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs bg-section dark:bg-white/5 transition-transform duration-300 ${faqOpen === i ? 'rotate-180 bg-primary-light text-primary' : ''}`}>▼</span>
              </button>
              <div className={`px-6 overflow-hidden transition-all duration-300 ${faqOpen === i ? 'max-h-[220px] pb-5' : 'max-h-0'}`}>
                <p className="text-ink-muted text-sm leading-relaxed">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </>
  );
}

function planDaysLabel(n: number) {
  return `${n}-Day Plan`;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}
