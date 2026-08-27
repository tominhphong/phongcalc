// Meta Pixel event helpers.
// The pixel base code lives in index.html; window.fbq may be missing when an
// ad blocker strips it, so every call goes through this guard.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackPixel(event: string, params?: Record<string, unknown>): void {
  try {
    window.fbq?.('track', event, params);
  } catch {
    // Tracking must never break the calculator.
  }
}

// TidyCal sends people back here with ?booked=1 after they confirm a slot.
// That redirect is the only signal the site gets that a booking happened.
export function trackBookingReturn(): void {
  const params = new URLSearchParams(window.location.search);
  if (params.get('booked') !== '1') return;
  trackPixel('Schedule', { content_name: 'tidycal-hoi-nhanh-mua-nha-texas' });
  params.delete('booked');
  const rest = params.toString();
  window.history.replaceState({}, '', window.location.pathname + (rest ? '?' + rest : ''));
}
