import { api } from './api';

/**
 * Dynamic pricing engine — a faithful port of the original explore page logic:
 *   1. Season factor   ×1.30 for Dec, Jan, May, Jun
 *   2. Weekend factor  ×1.15 for Fri/Sat nights
 *   3. Occupancy factor ×1.20 when >8 active bookings exist
 *   4. Last-minute     ×1.10 when check-in is within 2 days
 *   5. Long-stay       ×0.90 for 7+ nights
 *   6. Charm pricing   final total rounded up to nearest 100 minus 1 (₹…99)
 */

export interface PricingInput {
  basePrice: number;
  checkIn: string;
  checkOut: string;
  occupancyCount: number;
}

export interface PricingResult {
  nights: number;
  total: number;
  leadTimeDays: number;
}

export function calculateDynamicPrice({ basePrice, checkIn, checkOut, occupancyCount }: PricingInput): PricingResult {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (end <= start) return { nights: 0, total: 0, leadTimeDays: 0 };

  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const leadTimeDays = Math.ceil((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  let total = 0;
  const current = new Date(start);

  while (current < end) {
    let dailyMultiplier = 1.0;

    // 1. Season Factor (Peak: Dec, Jan, May, June)
    if ([11, 0, 4, 5].includes(current.getMonth())) dailyMultiplier *= 1.3;

    // 2. Weekend Factor (Fri/Sat)
    const day = current.getDay();
    if (day === 5 || day === 6) dailyMultiplier *= 1.15;

    // 3. Occupancy Factor
    if (occupancyCount > 8) dailyMultiplier *= 1.2;

    // 4. Last-minute Factor (within 2 days)
    if (leadTimeDays <= 2) dailyMultiplier *= 1.1;

    total += basePrice * dailyMultiplier;
    current.setDate(current.getDate() + 1);
  }

  // 5. Long Stay Factor (≥7 nights)
  if (nights >= 7) total *= 0.9;

  // 6. Charm Pricing
  const charmTotal = Math.ceil(total / 100) * 100 - 1;
  return { nights, total: charmTotal, leadTimeDays };
}

/** Fetch live occupancy for a property (used by the booking modal). */
export async function fetchOccupancy(propertyId: string): Promise<number> {
  try {
    const { count } = await api.occupancy(propertyId);
    return count;
  } catch {
    return 0;
  }
}
