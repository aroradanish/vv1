'use client';

import { useEffect, useState } from 'react';
import { generateItinerary, ItineraryPlan, coordsFor } from '@/lib/karto';
import { api, Property } from '@/lib/api';
import { rupees } from '@/lib/utils';
import LeafletMap from './LeafletMap';

const VIBES = [
  { key: 'Relaxing', emoji: '🧘' },
  { key: 'Adventure', emoji: '🧗' },
  { key: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { key: 'Foodie', emoji: '🍴' },
];

/**
 * Kartografer AI planner modal — vibe selection, simulated "mapping" state,
 * day-by-day itinerary and estimated trip budget (stay + local expenses).
 */
export default function KartograferModal({
  property,
  onClose,
  guests: defaultGuests = 2,
  days: defaultDays = 3,
  title = '✨ AI Trip Preview',
  allowInputs = true,
}: {
  property: Property;
  onClose: () => void;
  guests?: number;
  days?: number;
  title?: string;
  allowInputs?: boolean;
}) {
  const [vibe, setVibe] = useState('');
  const [guests, setGuests] = useState(defaultGuests);
  const [days, setDays] = useState(defaultDays);
  const [stage, setStage] = useState<'pick' | 'loading' | 'result'>('pick');
  const [plan, setPlan] = useState<ItineraryPlan | null>(null);
  const [saved, setSaved] = useState(false);

  const start = () => {
    if (!vibe) return;
    setStage('loading');
    setTimeout(() => {
      setPlan(generateItinerary(property.location, days, guests, vibe, property.price));
      setStage('result');
    }, 1500);
  };

  const save = async () => {
    if (!plan) return;
    try {
      await api.saveItinerary({
        location: property.location,
        vibe,
        content: plan.days.map((d) => `Day ${d.day}: ${d.place} · ${d.cafe} · ${d.restaurant}`).join('\n'),
        estimated_cost: rupees(plan.totalCost),
      });
    } catch {
      // Guests not logged in: keep it local-only like the original fallback.
    }
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-[550px] max-h-[85vh] border border-white/20 rounded-[28px] overflow-hidden flex flex-col bg-white dark:!bg-[#0f0003] shadow-2xl animate-modalUp">
        {stage === 'pick' && (
          <div className="p-8 text-center flex-1 overflow-y-auto">
            <div className="text-4xl mb-4">🗺️</div>
            <h2 className="font-extrabold text-primary mb-2 text-xl">{title}</h2>
            <p className="text-ink-muted mb-6 text-sm">
              Custom itinerary for your stay at <strong>{property.location.split(',')[0]}</strong>.
            </p>

            {allowInputs && (
              <div className="grid grid-cols-2 gap-3 mb-6 text-left max-w-sm mx-auto">
                <div className="bg-section rounded-xl p-2.5 border border-line">
                  <label className="text-[10px] font-bold uppercase text-ink-muted block mb-1">Days</label>
                  <input type="number" min={1} value={days} onChange={(e) => setDays(parseInt(e.target.value) || 1)} className="w-full bg-transparent outline-none font-bold text-sm" />
                </div>
                <div className="bg-section rounded-xl p-2.5 border border-line">
                  <label className="text-[10px] font-bold uppercase text-ink-muted block mb-1">Guests</label>
                  <input type="number" min={1} value={guests} onChange={(e) => setGuests(parseInt(e.target.value) || 1)} className="w-full bg-transparent outline-none font-bold text-sm" />
                </div>
              </div>
            )}

            <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-ink-muted">Choose your vibe</h3>
            <div className="grid grid-cols-2 gap-3 mb-8 max-w-sm mx-auto">
              {VIBES.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setVibe(v.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all font-bold text-sm ${
                    vibe === v.key ? 'border-primary bg-primary/5 text-primary' : 'border-line bg-white dark:!bg-[#1a0006]/40 text-ink-main dark:!text-white hover:border-primary/50'
                  }`}
                >
                  <span className="text-xl">{v.emoji}</span>
                  <span>{v.key}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 max-w-sm mx-auto">
              <button onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-line font-bold text-sm text-ink-muted hover:bg-section transition-all">
                Not now
              </button>
              <button onClick={start} disabled={!vibe} className="flex-[2] btn-primary py-3 rounded-xl text-sm font-black disabled:opacity-40 shadow-glow">
                ✨ Generate
              </button>
            </div>
          </div>
        )}

        {stage === 'loading' && (
          <div className="p-12 text-center flex-1 flex flex-col items-center justify-center">
            <div className="neu-spinner !w-[50px] !h-[50px] !border-[4px] mb-6" />
            <h2 className="text-primary font-black text-lg">Kartografer is mapping your journey...</h2>
            <p className="text-ink-muted mt-2 text-sm max-w-[280px] mx-auto">Finding the best local spots and travel routes near your villa.</p>
          </div>
        )}

        {stage === 'result' && plan && (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-line flex justify-between items-center bg-white dark:!bg-[#0f0003]">
              <div>
                <h2 className="font-extrabold text-primary m-0 text-lg">✨ AI Itinerary</h2>
                <p className="text-[10px] text-ink-muted font-bold uppercase">{plan.city} · {vibe}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-section hover:bg-primary-light hover:text-primary transition-colors">×</button>
            </div>

            <div className="h-[180px] w-full border-b border-line">
              <LeafletMap
                properties={[]}
                center={coordsFor(property.location, property.latitude, property.longitude)}
                zoom={13}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {plan.days.map((d) => (
                <div key={d.day} className="bg-section dark:!bg-[#1a0006]/40 p-4 rounded-2xl border border-line">
                  <div className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-primary text-white flex items-center justify-center rounded-full text-[10px]">{d.day}</span>
                    Day {d.day}
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">☀️</span>
                      <div>
                        <p className="text-[10px] font-bold text-ink-muted uppercase">Morning</p>
                        <p className="text-sm font-bold">{d.place}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">☕</span>
                      <div>
                        <p className="text-[10px] font-bold text-ink-muted uppercase">Cafe</p>
                        <p className="text-sm font-bold">{d.cafe}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">🍲</span>
                      <div>
                        <p className="text-[10px] font-bold text-ink-muted uppercase">Dinner</p>
                        <p className="text-sm font-bold">{d.restaurant}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20 mt-4 space-y-3">
                <p className="text-[11px] font-black text-primary uppercase tracking-wider border-b border-primary/10 pb-2">Estimated Trip Budget</p>

                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-ink-muted">🏠 Stay ({days} nights)</span>
                  <span className="font-bold">{rupees(plan.stayCost)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-ink-muted">🥪 Local Exp. ({guests} guests)</span>
                  <span className="font-bold">{rupees(plan.localCost)}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-primary/10">
                  <span className="text-primary font-black uppercase text-xs">Total Estimate</span>
                  <span className="text-xl font-black text-primary">{rupees(plan.totalCost)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white dark:!bg-[#0f0003] border-t border-line">
              <button onClick={save} disabled={saved} className="btn-primary w-full py-3.5 rounded-xl font-black text-sm">
                {saved ? '✔ Saved to My Trips' : '💾 Save to My Trips'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
