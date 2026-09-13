'use client';

import { useEffect, useState } from 'react';
import { api, Booking, Property } from '@/lib/api';
import { calculateDynamicPrice, fetchOccupancy } from '@/lib/pricing';
import { parseStatus, rupees } from '@/lib/utils';
import KartograferModal from './KartograferModal';
import LeafletMap from './LeafletMap';

/**
 * Booking modal — rules, amenities, availability, guest reviews and the
 * dynamic-pricing reservation form (ports the original rentModal logic).
 * After a successful reservation the Kartografer AI flow launches.
 */
export default function BookingModal({
  property,
  bookings,
  onClose,
}: {
  property: Property;
  bookings: Booking[];
  onClose: () => void;
}) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [occupancy, setOccupancy] = useState(0);
  const [total, setTotal] = useState(0);
  const [nights, setNights] = useState(0);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState('');
  const [karto, setKarto] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    fetchOccupancy(property.id).then(setOccupancy);
  }, [property.id]);

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setTotal(0);
      setNights(0);
      return;
    }
    const result = calculateDynamicPrice({
      basePrice: property.price,
      checkIn,
      checkOut,
      occupancyCount: occupancy,
    });
    setTotal(result.total);
    setNights(result.nights);
  }, [checkIn, checkOut, occupancy, property.price]);

  const reviews = bookings
    .filter((b) => b.property_id === property.id && b.status?.startsWith('reviewed|'))
    .map((b) => {
      const { rating, comment } = parseStatus(b.status);
      return {
        rating,
        comment,
        guestName: b.profiles?.full_name || 'Anonymous Guest',
        date: new Date(b.created_at).toLocaleDateString(),
      };
    });

  const reserve = async () => {
    setError('');
    const token = localStorage.getItem('villa_token');
    if (!token) {
      alert('Please login before booking.');
      window.location.href = '/login';
      return;
    }
    if (!checkIn || !checkOut) {
      setError('Please select dates.');
      return;
    }
    if (total <= 0) {
      setError('Please select valid dates to calculate price.');
      return;
    }

    setReserving(true);
    try {
      await api.createBooking({
        property_id: property.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        total_price: total,
      });
      setKarto(true); // Booking confirmed -> launch Kartografer AI
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setReserving(false);
    }
  };

  const maxG = property.max_guests || 1;

  if (karto) {
    return (
      <KartograferModal
        property={property}
        title="Booking Confirmed!"
        allowInputs={false}
        days={3}
        guests={guests}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-md flex items-center justify-center p-5" onClick={onClose}>
      <div
        className="bg-white dark:!bg-[#2a0a0f] w-full max-w-[900px] rounded-[20px] overflow-hidden relative shadow-lg border border-line animate-modalUp max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-6 text-[28px] text-ink-muted hover:text-primary z-10">×</button>
        <div className="grid md:grid-cols-[1.2fr_0.8fr]">
          {/* Left: details + reviews */}
          <div className="p-10 bg-section border-r border-line overflow-y-auto max-h-[80vh]">
            <h2 className="text-[1.8rem] font-extrabold mb-6">{property.room_type}</h2>
            <h4 className="text-sm font-extrabold uppercase text-primary mt-6 mb-2 tracking-wide">Rules</h4>
            <p className="text-ink-muted text-[15px] leading-relaxed">{property.rules || 'No smoking · No pets'}</p>
            <h4 className="text-sm font-extrabold uppercase text-primary mt-6 mb-2 tracking-wide">Amenities</h4>
            <p className="text-ink-muted text-[15px] leading-relaxed">
              {property.amenities?.length ? property.amenities.join(', ') : 'Wi-Fi, Kitchen, AC'}
            </p>
            <h4 className="text-sm font-extrabold uppercase text-primary mt-6 mb-2 tracking-wide">Availability</h4>
            <p className="text-ink-muted text-[15px] leading-relaxed">{property.avail_from} to {property.avail_to}</p>

            {property.latitude && property.longitude && (
              <div className="mt-6">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="text-xs font-bold uppercase tracking-wider text-primary border border-primary/30 px-3 py-1.5 rounded-md hover:bg-primary-light transition-all flex items-center gap-2"
                >
                  📍 {showMap ? 'Hide Spot Location' : 'Spot Precise Location'}
                </button>
                {showMap && (
                  <div className="mt-3 h-[220px] rounded-xl overflow-hidden border border-line animate-fadeIn">
                    <LeafletMap
                      properties={[property]}
                      center={[property.latitude, property.longitude]}
                      zoom={15}
                      focus={[property.latitude, property.longitude]}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mt-7 pt-5 border-t border-line">
              <h4 className="font-extrabold text-primary mb-4 border-b-2 border-primary-light pb-2">
                Guest Reviews ({reviews.length})
              </h4>
              {reviews.length === 0 ? (
                <p className="text-ink-muted italic text-sm bg-section p-4 rounded-xl border border-line">
                  No reviews yet for this stay. Be the first to book and share your experience!
                </p>
              ) : (
                <div className="max-h-[250px] overflow-y-auto flex flex-col gap-4">
                  {reviews.map((r, i) => (
                    <div key={i} className="bg-white dark:!bg-transparent p-4 rounded-xl border border-line shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-[30px] h-[30px] bg-primary-light text-primary rounded-full flex items-center justify-center font-extrabold text-xs">
                            {r.guestName.charAt(0)}
                          </div>
                          <strong className="text-sm">{r.guestName}</strong>
                        </div>
                        <span className="text-gold text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      </div>
                      <p className="text-[13px] italic leading-relaxed">&quot;{r.comment}&quot;</p>
                      <div className="text-right mt-1.5"><small className="text-ink-muted text-[10px]">Reviewed on {r.date}</small></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: reservation form */}
          <div className="p-10 flex flex-col">
            <h3 className="text-[22px] font-extrabold mb-6">
              {rupees(property.price)} <span className="text-sm font-medium text-ink-muted">/ night</span>
            </h3>
            <label className="field-label block mb-1.5">Check-in</label>
            <input
              type="date" min={property.avail_from} max={property.avail_to} value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full px-4 py-3 border border-line rounded-sm bg-section mb-5 font-semibold outline-none focus:border-primary focus:bg-white dark:!bg-transparent"
            />
            <label className="field-label block mb-1.5">Check-out</label>
            <input
              type="date" min={checkIn || property.avail_from} max={property.avail_to} value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full px-4 py-3 border border-line rounded-sm bg-section mb-5 font-semibold outline-none focus:border-primary focus:bg-white dark:!bg-transparent"
            />
            <label className="field-label block mb-1.5">
              Guests <span className="normal-case text-[#777]">(Max: {maxG})</span>
            </label>
            <input
              type="number" min={1} max={maxG} value={guests}
              onChange={(e) => setGuests(Math.min(parseInt(e.target.value) || 1, maxG))}
              className="w-full px-4 py-3 border border-line rounded-sm bg-section mb-5 font-semibold outline-none focus:border-primary focus:bg-white dark:!bg-transparent"
            />
            <div className="mt-auto pt-5 border-t border-line">
              {nights > 0 && (
                <div className="text-[13px] text-primary font-bold mb-1.5">✨ Dynamic Pricing: {nights} nights</div>
              )}
              <div className="text-xl font-extrabold text-primary text-right">
                {total > 0 ? `Total: ${rupees(total)}` : nights === 0 && (checkIn || checkOut) ? 'Check-out must be after check-in' : ''}
              </div>
              {error && <p className="text-primary text-xs mt-2 text-center">{error}</p>}
              <button onClick={reserve} disabled={reserving} className="btn-primary w-full py-4 rounded-md text-base font-extrabold mt-5 hover:-translate-y-0.5">
                {reserving ? 'Reserving...' : 'Reserve'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
