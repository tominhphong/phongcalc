import { trackPixel } from './utils/tracking';

const BOOKING_URL =
  'https://tidycal.com/phongto/hoi-nhanh-mua-nha-texas?utm_source=phongcalc&utm_medium=cta';

// Rendered under every calculator. Someone who has just seen their own numbers
// is the person most likely to have a follow-up question worth a call.
export function bookingCtaHtml(): string {
  return `
    <section class="booking-cta">
      <p class="booking-cta-title">
        <span class="vi-text">Con số trên có đúng với trường hợp của bạn?</span><span class="en-text">Do these numbers fit your situation?</span>
      </p>
      <p class="booking-cta-desc">
        <span class="vi-text">Đặt 15 phút nói chuyện miễn phí với Phong. Không bán gì, chỉ trả lời câu hỏi của bạn.</span><span class="en-text">Book a free 15-minute call with Phong. No pitch — just answers to your questions.</span>
      </p>
      <a class="booking-cta-btn" id="bookingCtaBtn" href="${BOOKING_URL}" target="_blank" rel="noopener">
        <span>📅</span>
        <span class="vi-text">Đặt 15 phút — miễn phí</span><span class="en-text">Book 15 minutes — free</span>
      </a>
      <p class="booking-cta-note">Phong To — Realtor, eXp Realty · TREC #843757</p>
    </section>`;
}

export function initBookingCta(): void {
  document.getElementById('bookingCtaBtn')?.addEventListener('click', () => {
    trackPixel('InitiateCheckout', { content_name: 'tidycal-15p' });
  });
}
