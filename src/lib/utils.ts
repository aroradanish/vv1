export const rupees = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const todayStr = () => new Date().toISOString().split('T')[0];

/** Booking status convention: 'reviewed|<rating>|<comment>' encodes guest reviews. */
export function parseStatus(status: string): { label: string; rating: number; comment: string; isReviewed: boolean } {
  if (status && status.startsWith('reviewed|')) {
    const parts = status.split('|');
    return {
      label: 'Reviewed',
      rating: parseInt(parts[1]) || 5,
      comment: parts[2] || '',
      isReviewed: true,
    };
  }
  return { label: status, rating: 0, comment: '', isReviewed: false };
}

export function statusBadgeClass(label: string): string {
  const l = (label || '').toLowerCase();
  if (l.startsWith('approved')) return 'bg-[#e8f5e9] text-[#2e7d32]';
  if (l === 'reviewed') return 'bg-[#f3e5f5] text-[#8e24aa]';
  if (l.startsWith('cancelled')) return 'bg-[#ffebee] text-[#c62828]';
  if (l.startsWith('declined')) return 'bg-[#efebe9] text-[#4e342e]';
  return 'bg-[#fff8e1] text-[#ffb300]';
}
