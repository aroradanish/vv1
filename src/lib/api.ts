/**
 * Central API client for the VillaVista NestJS backend.
 * Mirrors the data shapes of the original Supabase schema.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'host';
  wishlist: string[];
  created_at: string;
}

export interface Property {
  id: string;
  created_by: string;
  room_type: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  max_guests: number;
  price: number;
  amenities: string[];
  rules: string | null;
  description: string | null;
  images: string[];
  avail_from: string;
  avail_to: string;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string; // confirmed | approved | declined | cancelled|... | reviewed|rating|comment
  created_at: string;
  profiles?: { full_name: string; email: string };
  property?: { room_type: string; location: string };
}

export interface Experience {
  id: string;
  title: string;
  type: string;
  location: string;
  desc: string;
  price: number;
  image: string;
  badge?: string;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('villa_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // ---- auth ----
  register: (email: string, password: string, fullName: string, role: string) =>
    request<{ user: Profile; session: { access_token: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role }),
    }),

  login: (email: string, password: string) =>
    request<{ user: Profile; session: { access_token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<Profile>('/auth/me'),

  updateWishlist: (wishlist: string[]) =>
    request<Profile>('/auth/wishlist', { method: 'PUT', body: JSON.stringify({ wishlist }) }),

  // ---- properties ----
  properties: () => request<Property[]>('/properties'),
  property: (id: string) => request<Property>(`/properties/${id}`),
  myProperties: () => request<Property[]>('/properties/host/mine'),
  createProperty: (dto: Record<string, unknown>) =>
    request<Property>('/properties', { method: 'POST', body: JSON.stringify(dto) }),
  updateProperty: (id: string, dto: Record<string, unknown>) =>
    request<Property>(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteProperty: (id: string) =>
    request<{ success: boolean }>(`/properties/${id}`, { method: 'DELETE' }),

  // ---- bookings ----
  myBookings: () => request<Booking[]>('/bookings/mine'),
  hostBookings: () => request<Booking[]>('/bookings/host'),
  createBooking: (dto: { property_id: string; check_in: string; check_out: string; guests: number; total_price: number }) =>
    request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(dto) }),
  cancelBooking: (id: string) =>
    request<Booking>(`/bookings/${id}/cancel`, { method: 'PATCH' }),
  reviewBooking: (id: string, rating: number, comment: string) =>
    request<Booking>(`/bookings/${id}/review`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),
  setBookingStatus: (id: string, status: 'approved' | 'declined') =>
    request<Booking>(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  occupancy: (propertyId: string) =>
    request<{ count: number }>(`/bookings/occupancy?property_id=${propertyId}`),

  // ---- experiences ----
  experiences: () => request<Experience[]>('/experiences'),
  bookExperience: (id: string) =>
    request<{ success: boolean; booking_id: string }>(`/experiences/${id}/book`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  // ---- itineraries ----
  saveItinerary: (dto: { location: string; vibe: string; content: string; estimated_cost: string }) =>
    request<{ success: boolean }>('/itineraries', { method: 'POST', body: JSON.stringify(dto) }),
};
