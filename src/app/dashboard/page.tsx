'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Booking, Property } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { parseStatus, rupees, statusBadgeClass } from '@/lib/utils';
import LeafletMap from '@/components/LeafletMap';
import ChatModal from '@/components/ChatModal';

const EXPERIENCES = [
  { id: 'exp1', title: 'North Goa Surf Session', image: '/images/destination_goa.jpg', loc: 'Goa' },
  { id: 'exp2', title: 'Beas River Rafting & Camping', image: '/images/destination_manali.jpg', loc: 'Manali' },
  { id: 'exp3', title: 'Old City Heritage Walk', image: '/images/destination_jaipur.jpg', loc: 'Jaipur' },
  { id: 'exp4', title: 'Traditional Kathakali Night', image: '/images/destination_kerala.jpg', loc: 'Kochi' },
  { id: 'exp5', title: 'Nilgiri Tea Estate Tour', image: '/images/bali.webp', loc: 'Ooty' },
];

type Tab = 'upcoming' | 'past' | 'wishlist' | 'cancelled';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, refresh, setWishlist: setWishlistCtx } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [reviewFor, setReviewFor] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [mapFor, setMapFor] = useState<string | null>(null);
  const [chatFor, setChatFor] = useState<Booking | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      alert('Please login first!');
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [books, props] = await Promise.all([api.myBookings(), api.properties()]);
      setBookings(books);
      setProperties(props);
    } catch {
      alert('Error loading dashboard data.');
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      load();
      // Poll for host-side status changes (replaces Supabase realtime).
      const t = setInterval(load, 15000);
      return () => clearInterval(t);
    }
  }, [user, load]);

  if (authLoading || !user) return <p className="text-center py-20 text-ink-muted">Checking session...</p>;

  const wishlist = user.wishlist || [];
  const today = new Date().toISOString().split('T')[0];

  const cancelled = bookings.filter((b) => b.status.startsWith('cancelled') || b.status.startsWith('declined'));
  const active = bookings.filter((b) => !cancelled.includes(b));
  const upcoming = active.filter((b) => !(b.check_out < today || parseStatus(b.status).isReviewed));
  const past = active.filter((b) => b.check_out < today || parseStatus(b.status).isReviewed);

  const cancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.cancelBooking(id);
      alert('Booking cancelled successfully.');
      load();
    } catch (err) {
      alert('Cancellation failed: ' + (err as Error).message);
    }
  };

  const submitReview = async () => {
    if (!reviewFor) return;
    try {
      await api.reviewBooking(reviewFor.id, rating, comment.trim());
      alert('Thank you for your review!');
      setReviewFor(null);
      setComment('');
      setRating(5);
      load();
    } catch (err) {
      alert('Failed to submit review: ' + (err as Error).message);
    }
  };

  const removeFromWishlist = async (propId: string) => {
    const next = wishlist.filter((w) => w !== propId);
    setWishlistCtx(next);
    try { await api.updateWishlist(next); } catch { /* local */ }
    await refresh();
  };

  const tripCard = (b: Booking, category: 'upcoming' | 'past' | 'cancelled') => {
    const prop = properties.find((p) => p.id === b.property_id);
    const exp = EXPERIENCES.find((e) => e.id === b.property_id);
    const title = prop?.room_type || exp?.title || 'VillaVista Homestay';
    const location = prop?.location || exp?.loc || 'Destination India';
    const img = prop?.images?.[0] || exp?.image || '/front.webp';
    const { label, rating: revRating, comment: revComment, isReviewed } = parseStatus(b.status);
    const badgeClass = statusBadgeClass(label);

    return (
      <div key={b.id} className="flex flex-col gap-0">
        <div className="bg-white dark:!bg-[#2a0a0f] rounded-2xl border border-line shadow-sm overflow-hidden flex flex-col md:flex-row gap-5 p-4 text-left relative z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={title} className="w-full md:w-[180px] h-[130px] rounded-xl object-cover" />
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h4 className="text-primary text-xl font-bold m-0 mb-1">{title}</h4>
              <p className="text-sm text-ink-muted my-0.5"><strong>📍 Location:</strong> {location}</p>
              <p className="text-sm text-ink-muted my-0.5"><strong>📅 Dates:</strong> {b.check_in} to {b.check_out}</p>
              <p className="text-sm text-ink-muted my-0.5"><strong>👥 Guests:</strong> {b.guests} guest(s)</p>
              <p className="text-sm text-ink-muted my-0.5"><strong>💰 Paid:</strong> {rupees(b.total_price)}</p>
              {prop?.latitude && prop?.longitude && (
                <button
                  onClick={() => setMapFor(mapFor === b.id ? null : b.id)}
                  className="mt-2 text-[11px] font-bold text-primary flex items-center gap-1.5 hover:underline"
                >
                  📍 {mapFor === b.id ? 'Hide Precise Location' : 'Spot Precise Location'}
                </button>
              )}
            </div>
            <div className="mt-3"><span className={`inline-block px-3 py-1.5 rounded-[20px] text-xs font-bold capitalize ${badgeClass}`}>{label}</span></div>
          </div>
          <div className="flex md:flex-col justify-center gap-2.5 md:min-w-[150px]">
            {category === 'upcoming' && (
              <button onClick={() => cancelBooking(b.id)} className="px-4 py-2.5 rounded-lg border-none font-bold text-[13px] bg-[#ffebee] text-[#c62828] hover:!bg-[#c62828] hover:text-white transition-all">Cancel Trip</button>
            )}
            {(label === 'confirmed' || label === 'approved') && (
              <button
                onClick={() => setChatFor(b)}
                className="px-4 py-2.5 rounded-lg border-none font-bold text-[13px] bg-primary-light text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <span>💬 Interact</span>
              </button>
            )}
            {category === 'past' && isReviewed && (
              <div className="text-xs text-[#777] mb-1">
                <strong>My Rating:</strong> {'⭐'.repeat(revRating)}
                <p className="italic my-0.5">&quot;{revComment}&quot;</p>
              </div>
            )}
            {category === 'past' && (
              <button
                onClick={() => { setReviewFor(b); setRating(parseStatus(b.status).rating || 5); setComment(parseStatus(b.status).comment); }}
                className={`px-4 py-2.5 rounded-lg border-none font-bold text-[13px] transition-all ${isReviewed ? 'bg-[#f3e5f5] text-[#8e24aa] hover:!bg-[#8e24aa] hover:text-white' : 'bg-primary text-white hover:brightness-110'}`}
              >
                {isReviewed ? 'Edit Review' : 'Leave a Review'}
              </button>
            )}
          </div>
        </div>
        {mapFor === b.id && prop?.latitude && prop?.longitude && (
          <div className="px-4 pb-4 -mt-4 pt-8 bg-section border border-t-0 border-line rounded-b-2xl animate-fadeIn relative z-0">
            <div className="h-[200px] rounded-xl overflow-hidden border border-line">
              <LeafletMap
                properties={[prop]}
                center={[prop.latitude, prop.longitude]}
                zoom={15}
                focus={[prop.latitude, prop.longitude]}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-7 max-w-[1200px] mx-auto my-10 px-5">
      {/* Profile card */}
      <div className="bg-white dark:!bg-[#2a0a0f] p-7 pb-5 rounded-2xl shadow-sm border border-line text-center h-fit">
        <div className="w-20 h-20 bg-primary text-white text-[32px] font-bold rounded-full flex items-center justify-center mx-auto mb-5 shadow-glow">
          {user.full_name.charAt(0).toUpperCase()}
        </div>
        <h3 className="mt-2.5 mb-1 font-bold">{user.full_name}</h3>
        <p className="my-1 text-sm text-ink-muted">{user.email}</p>
        <div className="inline-block bg-primary-light text-primary px-3 py-1.5 rounded-xl text-xs font-bold mt-2.5 capitalize">{user.role}</div>
        <p className="mt-5 text-xs text-[#888]">
          Member since {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Bookings */}
      <div className="flex flex-col gap-6">
        <div className="flex gap-4 border-b-2 border-line pb-2.5 flex-wrap">
          {([['upcoming', 'Upcoming Trips'], ['past', 'Past Stays'], ['wishlist', 'Wishlist'], ['cancelled', 'Cancelled']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-2.5 px-5 font-bold cursor-pointer transition-all border-b-[3px] border-transparent ${tab === key ? 'text-primary !border-primary' : 'text-ink-muted hover:text-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loadingData && <p className="text-center py-8 text-ink-muted">Fetching data...</p>}

        {!loadingData && tab === 'upcoming' && (
          <div className="flex flex-col gap-5">
            {upcoming.length === 0 ? <p className="text-center py-8 text-[#888]">No upcoming stays found.</p> : upcoming.map((b) => tripCard(b, 'upcoming'))}
          </div>
        )}
        {!loadingData && tab === 'past' && (
          <div className="flex flex-col gap-5">
            {past.length === 0 ? <p className="text-center py-8 text-[#888]">No past stays found.</p> : past.map((b) => tripCard(b, 'past'))}
          </div>
        )}
        {!loadingData && tab === 'cancelled' && (
          <div className="flex flex-col gap-5">
            {cancelled.length === 0 ? <p className="text-center py-8 text-[#888]">No cancelled trips found.</p> : cancelled.map((b) => tripCard(b, 'cancelled'))}
          </div>
        )}
        {!loadingData && tab === 'wishlist' && (
          <div className="flex flex-col gap-5">
            {wishlist.length === 0 ? (
              <p className="text-center py-8 text-[#888]">Your wishlist is empty.</p>
            ) : (
              properties
                .filter((p) => wishlist.includes(p.id))
                .map((p) => (
                  <div key={p.id} className="bg-white dark:!bg-[#2a0a0f] rounded-2xl border border-line shadow-sm flex flex-col md:flex-row gap-5 p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images?.[0] || '/front.webp'} alt={p.room_type} className="w-full md:w-[180px] h-[130px] rounded-xl object-cover" />
                    <div className="flex-1">
                      <h4 className="text-primary text-xl font-bold m-0 mb-1">{p.room_type}</h4>
                      <p className="text-sm text-ink-muted my-0.5"><strong>📍 Location:</strong> {p.location}</p>
                      <p className="text-sm text-ink-muted my-0.5"><strong>💰 Price:</strong> {rupees(p.price)} / night</p>
                      {p.description && <p className="text-sm text-ink-muted my-0.5">{p.description}</p>}
                    </div>
                    <div className="flex md:flex-col justify-center gap-2.5 md:min-w-[150px]">
                      <Link href={`/explore?id=${p.id}`} className="px-4 py-2.5 rounded-lg font-bold text-[13px] bg-primary text-white text-center no-underline hover:brightness-110">Book Now</Link>
                      <button onClick={() => removeFromWishlist(p.id)} className="px-4 py-2.5 rounded-lg font-bold text-[13px] bg-[#ffebee] text-[#c62828] hover:!bg-[#c62828] hover:text-white">Remove</button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewFor && (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-white dark:!bg-[#2a0a0f] p-10 rounded-[24px] max-w-[500px] w-[90%] shadow-lg border border-line relative text-center">
            <button onClick={() => setReviewFor(null)} className="absolute top-5 right-6 text-2xl text-ink-muted">×</button>
            <h2 className="text-primary font-extrabold mb-2.5">{parseStatus(reviewFor.status).comment ? 'Edit Your Review' : 'Write a Review'}</h2>
            <p className="text-ink-muted mb-6 text-sm">How was your stay? Your feedback helps the community.</p>

            <div className="mb-6">
              <label className="field-label block mb-2.5">Select Rating</label>
              <div className="flex justify-center gap-2.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className={`text-[35px] leading-none transition-colors ${n <= rating ? 'text-gold' : 'text-[#ddd]'}`}
                    aria-label={`${n} star`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 text-left">
              <label className="field-label block mb-2">Share your experience</label>
              <textarea
                rows={4} value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="What did you love about this place?"
                className="w-full p-4 rounded-xl border border-line bg-section outline-none resize-none font-medium"
              />
            </div>

            <button onClick={submitReview} className="btn-primary w-full py-4 rounded-xl text-base font-extrabold">Submit Review</button>
          </div>
        </div>
      )}

      {chatFor && (
        <ChatModal
          bookingId={chatFor.id}
          title={properties.find(p => p.id === chatFor.property_id)?.room_type || 'Host Interaction'}
          onClose={() => setChatFor(null)}
        />
      )}
    </div>
  );
}
