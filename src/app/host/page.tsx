'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { api, Booking, Property } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { parseStatus, rupees, statusBadgeClass, todayStr } from '@/lib/utils';
import LeafletMap from '@/components/LeafletMap';
import ChatModal from '@/components/ChatModal';

const AMENITIES = [
  ['WiFi', '🌐 WiFi'], ['AC', '❄️ AC'], ['TV', '📺 TV'], ['Kitchen', '🍳 Kitchen'],
  ['Parking', '🚗 Parking'], ['Pool', '🏊 Pool'], ['Gym', '🏋️ Gym'], ['Laundry', '🧺 Laundry'],
];

const ROOM_TYPES = ['Single Room', 'Double Room', 'Entire Apartment', 'Private Villa', 'Studio Flat'];

type Panel = 'listings' | 'add' | 'bookings' | 'wishlist';

export default function HostPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [panel, setPanel] = useState<Panel>('listings');
  const [hostProps, setHostProps] = useState<Property[]>([]);
  const [hostBookings, setHostBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [allProps, setAllProps] = useState<Property[]>([]);

  // Multi-step form state
  const [step, setStep] = useState(0);
  const [roomType, setRoomType] = useState('');
  const [location, setLocation] = useState('');
  const [pickerCoords, setPickerCoords] = useState<[number, number] | null>(null);
  const [maxGuests, setMaxGuests] = useState(1);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [availFrom, setAvailFrom] = useState('');
  const [availTo, setAvailTo] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [rules, setRules] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [priceError, setPriceError] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Edit state
  const [editing, setEditing] = useState<Property | null>(null);
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [chatFor, setChatFor] = useState<Booking | null>(null);

  // Auth guard (hosts only)
  useEffect(() => {
    if (!authLoading && !user) {
      alert('Please login first!');
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [mine, books, all] = await Promise.all([
        api.myProperties(),
        api.hostBookings(),
        api.properties(),
      ]);
      setHostProps(mine);
      setHostBookings(books);
      setAllProps(all);
      setWishlistIds(user.wishlist || []);
    } catch (err) {
      console.error('Error fetching host data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      load();
      const t = setInterval(load, 15000); // poll for new guest bookings
      return () => clearInterval(t);
    }
  }, [user, load]);

  if (authLoading || !user) return <p className="text-center py-20 text-ink-muted">Checking session...</p>;

  // Analytics
  let earnings = 0;
  let ratingSum = 0;
  let ratingCount = 0;
  hostBookings.forEach((b) => {
    if (!b.status.startsWith('cancelled') && !b.status.startsWith('declined')) earnings += b.total_price;
    if (b.status.startsWith('reviewed|')) {
      ratingSum += parseStatus(b.status).rating;
      ratingCount++;
    }
  });
  const avgRating = ratingCount > 0 ? `⭐ ${(ratingSum / ratingCount).toFixed(1)} (${ratingCount})` : 'New';

  // Step form handlers
  const nextStep = () => {
    if (step === 0 && (!roomType || !location)) return alert('Please fill in type and location.');
    if (step === 1 && !price) return alert('Please set a price.');
    setStep((s) => Math.min(s + 1, 2));
  };

  const publish = async () => {
    if (!roomType || !location || !price) return alert('Please fill all required fields.');
    setPublishing(true);
    try {
      await api.createProperty({
        room_type: roomType,
        location,
        latitude: pickerCoords?.[0] ?? null,
        longitude: pickerCoords?.[1] ?? null,
        max_guests: maxGuests,
        avail_from: availFrom || todayStr(),
        avail_to: availTo || `${new Date().getFullYear() + 1}-12-31`,
        price: Number(price),
        amenities: selectedAmenities,
        rules,
        description,
        images,
      });
      alert('Property listed successfully!');
      // reset form
      setStep(0); setRoomType(''); setLocation(''); setPickerCoords(null); setMaxGuests(1);
      setDescription(''); setPrice(''); setAvailFrom(''); setAvailTo('');
      setSelectedAmenities([]); setRules(''); setImages([]);
      setPanel('listings');
      load();
    } catch (err) {
      alert('Error saving property: ' + (err as Error).message);
    } finally {
      setPublishing(false);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    const readers: Promise<string>[] = Array.from(files).map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        }),
    );
    setImages(await Promise.all(readers));
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing? This will also affect existing bookings.')) return;
    try {
      await api.deleteProperty(id);
      alert('Property deleted successfully.');
      load();
    } catch (err) {
      alert('Delete failed: ' + (err as Error).message);
    }
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.updateProperty(editing.id, {
        room_type: editing.room_type,
        location: editing.location,
        max_guests: editing.max_guests,
        description: editing.description || '',
        price: editing.price,
        avail_from: editing.avail_from,
        avail_to: editing.avail_to,
        rules: editing.rules || '',
        amenities: editAmenities,
        latitude: editing.latitude,
        longitude: editing.longitude,
      });
      alert('Listing updated successfully!');
      setEditing(null);
      load();
    } catch (err) {
      alert('Update failed: ' + (err as Error).message);
    }
  };

  const setBookingStatus = async (id: string, status: 'approved' | 'declined') => {
    try {
      await api.setBookingStatus(id, status);
      alert(`Booking ${status === 'approved' ? 'approved' : 'declined'} successfully.`);
      load();
    } catch (err) {
      alert('Action failed: ' + (err as Error).message);
    }
  };

  const removeFromWishlist = async (propId: string) => {
    const next = wishlistIds.filter((w) => w !== propId);
    setWishlistIds(next);
    try { await api.updateWishlist(next); } catch { /* local */ }
  };

  const pending = hostBookings.filter((b) => b.status === 'confirmed' || b.status === 'pending');
  const other = hostBookings.filter((b) => b.status !== 'confirmed' && b.status !== 'pending');

  return (
    <>
      <div className="max-w-[1200px] mx-auto my-10 px-5">
        {/* Analytics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {[
            ['💰 Total Earnings', rupees(earnings)],
            ['📅 Total Bookings', String(hostBookings.length)],
            ['🏡 Active Listings', String(hostProps.length)],
            ['⭐ Average Rating', avgRating],
          ].map(([label, value]) => (
            <div key={label} className="bg-white dark:!bg-[#2a0a0f] p-5 rounded-2xl shadow-sm text-center border border-line">
              <h3 className="m-0 text-[#888] text-[13px] uppercase font-bold tracking-wide">{label}</h3>
              <p className="text-[26px] font-bold text-primary mt-2.5 mb-0">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-5 mb-10 flex-wrap">
          {([['listings', 'My Listings'], ['add', 'Add New Property'], ['bookings', 'Manage Bookings'], ['wishlist', 'Wishlist']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPanel(key)}
              className={`px-[30px] py-3 cursor-pointer font-bold rounded-pill shadow-sm transition-all ${panel === key ? 'bg-primary text-white' : 'bg-white dark:!bg-[#2a0a0f] text-ink-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Listings */}
        {panel === 'listings' && (
          <div>
            <h2 className="text-center text-primary mb-7 text-2xl">Your Properties</h2>
            {loadingData ? (
              <p className="text-center">Loading properties...</p>
            ) : hostProps.length === 0 ? (
              <p className="text-center">You haven&apos;t listed any properties yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {hostProps.map((p) => (
                  <div key={p.id} className="bg-white dark:!bg-[#2a0a0f] rounded-2xl shadow-sm overflow-hidden flex flex-col border border-line text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images?.[0] || '/front.webp'} alt={p.room_type} className="w-full h-[180px] object-cover" />
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="m-0 mb-2.5 text-primary">{p.room_type}</h3>
                        <p className="my-1 text-sm text-ink-muted"><strong>📍 Location:</strong> {p.location}</p>
                        <p className="my-1 text-sm text-ink-muted"><strong>👥 Max Guests:</strong> {p.max_guests}</p>
                        <p className="my-1 text-sm text-ink-muted"><strong>💰 Price:</strong> {rupees(p.price)} / night</p>
                        <p className="my-1 text-sm text-ink-muted"><strong>📅 Available:</strong> {p.avail_from} to {p.avail_to}</p>
                      </div>
                      <div className="flex gap-2.5 mt-4">
                        <button onClick={() => { setEditing(p); setEditAmenities(p.amenities || []); }} className="flex-1 py-2.5 rounded-lg border-none font-bold text-[13px] bg-section text-ink-main dark:!text-white hover:brightness-95">Edit</button>
                        <button onClick={() => deleteListing(p.id)} className="flex-1 py-2.5 rounded-lg border-none font-bold text-[13px] bg-primary text-white hover:brightness-110">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add property */}
        {panel === 'add' && (
          <div className="bg-white dark:!bg-[#2a0a0f] p-[30px] w-full max-w-[640px] mx-auto rounded-2xl shadow-sm border border-line">
            <h2 className="text-center text-primary mb-6 text-2xl">List Your Property</h2>

            <div className="flex justify-between mb-7 relative">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#eee] -translate-y-1/2" />
              {[1, 2, 3].map((n, i) => (
                <div
                  key={n}
                  className={`w-[35px] h-[35px] rounded-full flex items-center justify-center z-10 font-bold border-2 transition-all ${
                    i === step ? 'border-primary text-primary bg-white dark:!bg-[#2a0a0f]' : i < step ? 'bg-primary border-primary text-white' : 'border-[#eee] text-[#999] bg-white dark:!bg-[#2a0a0f]'
                  }`}
                >
                  {n}
                </div>
              ))}
            </div>

            {step === 0 && (
              <div className="animate-fadeIn">
                <label className="host-label">What are you listing?</label>
                <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="host-input">
                  <option value="">Select Property Type</option>
                  {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>

                <label className="host-label">Where is it located?</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Area (e.g. Bangalore, Indiranagar)" className="host-input" />

                <label className="host-label">Pin Precise Location on Map</label>
                <div className="h-[250px] rounded-xl mb-2.5 border border-line overflow-hidden">
                  <MapPicker onPick={setPickerCoords} coords={pickerCoords} />
                </div>
                <p className="text-[11px] text-ink-muted mb-4">Click on the map to set the exact coordinates for your guests.</p>

                <label className="host-label">Maximum guests allowed</label>
                <input type="number" min={1} value={maxGuests} onChange={(e) => setMaxGuests(parseInt(e.target.value) || 1)} className="host-input" />

                <label className="host-label">Tell guests about your place</label>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mention what makes your stay unique..." className="host-input" />

                <div className="flex gap-2.5 mt-5">
                  <button onClick={nextStep} className="btn-primary flex-1 py-3.5 rounded-xl">Next: Pricing & Dates</button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="animate-fadeIn">
                <label className="host-label">Price per night (₹)</label>
                <input type="number" value={price} onChange={(e) => { const v = e.target.value; setPrice(v); const n = Number(v); setPriceError(n > 0 && n < 300 ? 'Min price: ₹300' : n > 50000 ? 'Max price: ₹50,000' : ''); }} placeholder="Suggested: ₹1500" className="host-input" />
                {priceError && <div className="text-red-600 text-xs mt-0.5">{priceError}</div>}

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="host-label">Available From</label>
                    <input type="date" min={todayStr()} value={availFrom} onChange={(e) => { setAvailFrom(e.target.value); if (availTo && availTo < e.target.value) setAvailTo(''); }} className="host-input" />
                  </div>
                  <div className="flex-1">
                    <label className="host-label">Available To</label>
                    <input type="date" min={availFrom || todayStr()} value={availTo} onChange={(e) => setAvailTo(e.target.value)} className="host-input" />
                  </div>
                </div>

                <div className="flex gap-2.5 mt-5">
                  <button onClick={() => setStep(0)} className="flex-1 py-3.5 rounded-xl bg-section text-ink-main dark:!text-white border-none font-bold cursor-pointer">Back</button>
                  <button onClick={nextStep} className="btn-primary flex-1 py-3.5 rounded-xl">Next: Amenities & Media</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fadeIn">
                <label className="host-label">Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2.5 mb-4">
                  {AMENITIES.map(([value, label]) => (
                    <label key={value} className={`flex items-center gap-2 text-[13px] p-2 rounded-lg cursor-pointer border transition-all ${selectedAmenities.includes(value) ? 'border-primary bg-primary-light' : 'border-transparent bg-section'}`}>
                      <input type="checkbox" checked={selectedAmenities.includes(value)} onChange={() => setSelectedAmenities((prev) => prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value])} className="m-0" />
                      {label}
                    </label>
                  ))}
                </div>

                <label className="host-label">Property Rules</label>
                <textarea rows={2} value={rules} onChange={(e) => setRules(e.target.value)} placeholder="e.g. No smoking, No parties, Pets allowed" className="host-input" />

                <label className="host-label">Upload Photos</label>
                <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e.target.files)} className="host-input" />
                {images.length > 0 && (
                  <div className="flex gap-2.5 flex-wrap mt-2.5">
                    {images.map((src, i) => (
                      <div key={i} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`preview ${i + 1}`} className="w-20 h-20 rounded-[10px] object-cover border border-line" />
                        <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-primary text-white rounded-full w-5 h-5 text-xs">×</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2.5 mt-5">
                  <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-xl bg-section text-ink-main dark:!text-white border-none font-bold cursor-pointer">Back</button>
                  <button onClick={publish} disabled={publishing} className="btn-primary flex-1 py-3.5 rounded-xl disabled:opacity-60">
                    {publishing ? 'Publishing...' : 'Publish Listing'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bookings */}
        {panel === 'bookings' && (
          <div>
            <h2 className="text-center text-primary mb-7 text-2xl">Bookings for Your Properties</h2>
            {loadingData ? (
              <p className="text-center">Loading bookings...</p>
            ) : hostBookings.length === 0 ? (
              <p className="text-center">No bookings found for your properties.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {pending.length > 0 && <h3 className="mt-5 mb-2.5 text-base text-ink-muted">Action Required</h3>}
                {pending.map((b) => bookingCard(b))}
                {other.length > 0 && <h3 className="mt-7 mb-2.5 text-base text-ink-muted">Booking History</h3>}
                {other.map((b) => bookingCard(b))}
              </div>
            )}
          </div>
        )}

        {/* Wishlist */}
        {panel === 'wishlist' && (
          <div>
            <h2 className="text-center text-primary mb-7 text-2xl">Your Saved Properties</h2>
            {wishlistIds.length === 0 ? (
              <p className="text-center">Your wishlist is empty.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {allProps
                  .filter((p) => wishlistIds.includes(p.id))
                  .map((p) => (
                    <div key={p.id} className="bg-white dark:!bg-[#2a0a0f] rounded-xl border border-line p-5 flex justify-between items-center flex-wrap gap-4 shadow-sm">
                      <div className="flex gap-4 items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.images?.[0] || '/front.webp'} alt={p.room_type} className="w-[100px] h-[70px] object-cover rounded-lg" />
                        <div>
                          <h4 className="m-0 mb-1 text-primary">{p.room_type}</h4>
                          <p className="my-0.5 text-[13px] text-ink-muted"><strong>📍 Location:</strong> {p.location}</p>
                          <p className="my-0.5 text-[13px] text-ink-muted"><strong>💰 Price:</strong> {rupees(p.price)} / night</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 min-w-[160px]">
                        <Link href={`/explore?id=${p.id}`} className="text-center no-underline py-2 rounded-lg bg-primary text-white font-bold text-[12px]">Book Now</Link>
                        <button onClick={() => removeFromWishlist(p.id)} className="py-2 rounded-lg bg-[#666] text-white border-none font-bold text-[12px]">Remove</button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-[1001] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:!bg-[#2a0a0f] p-[30px] w-full max-w-[640px] max-h-[90vh] overflow-y-auto rounded-2xl relative">
            <button onClick={() => setEditing(null)} className="absolute top-2.5 right-4 text-2xl cursor-pointer text-[#888]">×</button>
            <h2 className="mt-0 text-2xl text-primary">Edit Property Details</h2>
            <form onSubmit={saveEdit}>
              <label className="host-label">Property Type</label>
              <select value={editing.room_type} onChange={(e) => setEditing({ ...editing, room_type: e.target.value })} className="host-input">
                {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>

              <label className="host-label">Location</label>
              <input type="text" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} className="host-input" />

              <label className="host-label">Maximum Guests</label>
              <input type="number" min={1} value={editing.max_guests} onChange={(e) => setEditing({ ...editing, max_guests: parseInt(e.target.value) || 1 })} className="host-input" />

              <label className="host-label">Description</label>
              <textarea rows={3} value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="host-input" />

              <label className="host-label">Price per night (₹)</label>
              <input type="number" min={300} max={50000} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="host-input" />

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="host-label">Available From</label>
                  <input type="date" value={editing.avail_from} onChange={(e) => setEditing({ ...editing, avail_from: e.target.value })} className="host-input" />
                </div>
                <div className="flex-1">
                  <label className="host-label">Available To</label>
                  <input type="date" value={editing.avail_to} onChange={(e) => setEditing({ ...editing, avail_to: e.target.value })} className="host-input" />
                </div>
              </div>

              <label className="host-label">Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2.5 mb-4">
                {AMENITIES.map(([value, label]) => (
                  <label key={value} className={`flex items-center gap-2 text-[13px] p-2 rounded-lg cursor-pointer border transition-all ${editAmenities.includes(value) ? 'border-primary bg-primary-light' : 'border-transparent bg-section'}`}>
                    <input type="checkbox" checked={editAmenities.includes(value)} onChange={() => setEditAmenities((prev) => prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value])} className="m-0" />
                    {label}
                  </label>
                ))}
              </div>

              <label className="host-label">Rules</label>
              <textarea rows={2} value={editing.rules || ''} onChange={(e) => setEditing({ ...editing, rules: e.target.value })} className="host-input" />

              <button type="submit" className="btn-primary w-full mt-5 py-3.5 rounded-xl">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {chatFor && (
        <ChatModal
          bookingId={chatFor.id}
          title={chatFor.profiles?.full_name || 'Guest Interaction'}
          onClose={() => setChatFor(null)}
        />
      )}
    </>
  );

  function bookingCard(b: Booking) {
    const prop = hostProps.find((p) => p.id === b.property_id);
    const { label, rating, comment, isReviewed } = parseStatus(b.status);
    const badgeClass = statusBadgeClass(label);
    const showActions = b.status === 'confirmed' || b.status === 'pending';

    return (
      <div key={b.id} className="bg-white dark:!bg-[#2a0a0f] rounded-xl border border-line p-5 flex justify-between items-center flex-wrap gap-4 shadow-sm text-left">
        <div>
          <h4 className="m-0 mb-1.5 text-primary">{prop?.room_type || 'Unknown Property'}</h4>
          <p className="my-1 text-[13px] text-ink-muted"><strong>📍 Location:</strong> {prop?.location || 'N/A'}</p>
          <p className="my-1 text-[13px] text-ink-muted"><strong>👤 Guest:</strong> {b.profiles?.full_name || 'Anonymous'} ({b.profiles?.email || 'N/A'})</p>
          <p className="my-1 text-[13px] text-ink-muted"><strong>📅 Dates:</strong> {b.check_in} to {b.check_out} ({b.guests} Guests)</p>
          <p className="my-1 text-[13px] text-ink-muted"><strong>💰 Total Paid:</strong> {rupees(b.total_price)}</p>
          {isReviewed && <p className="my-1 text-[13px] text-ink-muted"><strong>⭐ Review:</strong> {rating} Stars - &quot;{comment}&quot;</p>}
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <span className={`inline-block px-2.5 py-1 rounded-xl font-bold text-[11px] uppercase ${badgeClass}`}>{label}</span>
          {(label === 'confirmed' || label === 'approved') && (
            <button
              onClick={() => setChatFor(b)}
              className="px-3 py-2 text-xs rounded-lg border-none font-bold bg-primary text-white hover:brightness-110 flex items-center gap-2"
            >
              💬 Chat with Guest
            </button>
          )}
          {showActions && (
            <div className="flex gap-2.5">
              <button onClick={() => setBookingStatus(b.id, 'approved')} className="px-3 py-2 text-xs rounded-lg border-none font-bold bg-[#2e7d32] text-white">Approve</button>
              <button onClick={() => setBookingStatus(b.id, 'declined')} className="px-3 py-2 text-xs rounded-lg border-none font-bold bg-[#c62828] text-white">Decline</button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

function MapPicker({ onPick, coords }: { onPick: (c: [number, number]) => void; coords: [number, number] | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !containerRef.current || mapRef.current) return;

    const initial = coords || [20.5937, 78.9629];
    mapRef.current = L.map(containerRef.current).setView(initial, coords ? 15 : 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapRef.current);

    if (coords) {
      markerRef.current = L.marker(coords).addTo(mapRef.current);
    }

    mapRef.current.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      onPick([lat, lng]);

      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        markerRef.current = L.marker(e.latlng).addTo(mapRef.current);
      }
    });

    setTimeout(() => mapRef.current.invalidateSize(), 200);
  }, [onPick]);

  return <div ref={containerRef} className="w-full h-full rounded-xl" />;
}
