import './style.css';

// Calculator modules
import * as mortgage from './calculators/mortgage';
import * as amortization from './calculators/amortization';
import * as refinance from './calculators/refinance';
import * as affordability from './calculators/affordability';
import * as loanCompare from './calculators/loan-compare';
import * as rentVsBuy from './calculators/rent-vs-buy';
import * as sellerNet from './calculators/seller-net';
import * as buyerCosts from './calculators/buyer-costs';
import * as investmentCashflow from './calculators/investment-cashflow';
import * as rentEstimator from './calculators/rent-estimator';

const EMAIL_KEY = 'phongto_email';
const LEADS_KEY = 'phongto_leads';

// Calculator registry
const calculators: Record<string, { render: () => string; init: () => void }> = {
  'mortgage': mortgage,
  'amortization': amortization,
  'refinance': refinance,
  'affordability': affordability,
  'loan-compare': loanCompare,
  'rent-vs-buy': rentVsBuy,
  'seller-net': sellerNet,
  'buyer-costs': buyerCosts,
  'investment': investmentCashflow,
  'rent-estimate': rentEstimator,
};

let activeCalc = 'mortgage';
let emailCallback: (() => void) | null = null;

let currentLang: 'vi' | 'en' = 'vi';

export function getCurrentLang(): 'vi' | 'en' {
  return currentLang;
}

// Check if email already captured
export function isEmailCaptured(): boolean {
  return !!localStorage.getItem(EMAIL_KEY);
}

// Show email gate modal
export function showEmailGate(callback: () => void) {
  emailCallback = callback;
  document.getElementById('emailModal')?.classList.add('active');
}

function hideEmailGate() {
  document.getElementById('emailModal')?.classList.remove('active');
}

// Save lead data
function saveLead(name: string, email: string, phone: string) {
  localStorage.setItem(EMAIL_KEY, email);

  // Save to leads list
  const leads = JSON.parse(localStorage.getItem(LEADS_KEY) || '[]');
  const lead = {
    name,
    email,
    phone,
    timestamp: new Date().toISOString(),
    calculator: activeCalc,
  };
  leads.push(lead);
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));

  // Sync to HubSpot via Diaflow webhook (fire-and-forget, CORS ✅, on_error: skip)
  syncToDiaflow(lead);
}

// Sync lead to HubSpot via existing Diaflow lead-capture flow
// Flow: webhook → GPT qualify → [FeedGuardians reply (on_error:skip)] → HubSpot contact
async function syncToDiaflow(lead: { name: string; email: string; phone: string; calculator: string; timestamp: string }) {
  try {
    const calcLabels: Record<string, string> = {
      'mortgage': 'Tính trả góp',
      'amortization': 'Lịch trả nợ',
      'refinance': 'Tái tài trợ',
      'affordability': 'Khả năng mua',
      'loan-compare': 'So sánh vay',
      'rent-vs-buy': 'Thuê vs Mua',
      'seller-net': 'Net người bán',
      'buyer-costs': 'Chi phí người mua',
      'investment': 'Đầu tư',
      'rent-estimate': 'Ước tính tiền thuê',
    };
    const calcLabel = calcLabels[lead.calculator] || lead.calculator;
    const commentText = `[PhongCalc Lead] Công cụ: ${calcLabel}. Email: ${lead.email}. Phone: ${lead.phone || 'N/A'}. Muốn tải báo cáo tài chính BĐS DFW.`;

    await fetch(
      'https://api.diaflow.io/api/v1/builders/HeQE0EOnt6/webhook?api_key=sk-3e0ece9bce3f4413802b345c804507df',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_id: `phongcalc_${Date.now()}`,
          comment_text: commentText,
          commenter_name: lead.name,
          platform: 'PhongCalc',
          source: 'phongcalc',
        }),
      }
    );
  } catch {
    // Silent fail — localStorage is the primary store
  }
}

// Switch calculator
function switchCalc(calcId: string) {
  activeCalc = calcId;
  const content = document.getElementById('calcContent')!;
  const calc = calculators[calcId];

  if (calc) {
    content.innerHTML = calc.render();
    calc.init();
  }

  // Update active tab
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-calc') === calcId);
  });

  // Scroll active tab into view
  const activeTab = document.querySelector('.tab.active') as HTMLElement;
  if (activeTab) {
    activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}

// Toggle language
function toggleLang() {
  currentLang = currentLang === 'vi' ? 'en' : 'vi';
  document.body.classList.toggle('lang-en', currentLang === 'en');
  const btn = document.getElementById('lang-toggle') as HTMLButtonElement;
  if (btn) btn.textContent = currentLang === 'en' ? '🇻🇳 VI' : '🇺🇸 EN';
  // Re-render current calculator with new language
  switchCalc(activeCalc);
}

// Initialize app
function initApp() {
  // Language toggle
  document.getElementById('lang-toggle')?.addEventListener('click', toggleLang);

  // Tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const calcId = tab.getAttribute('data-calc');
      if (calcId) switchCalc(calcId);
    });
  });

  // Email modal
  const emailForm = document.getElementById('emailForm') as HTMLFormElement;
  const modalClose = document.getElementById('modalClose')!;

  emailForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('emailName') as HTMLInputElement).value;
    const email = (document.getElementById('emailInput') as HTMLInputElement).value;
    const phone = (document.getElementById('emailPhone') as HTMLInputElement).value;

    saveLead(name, email, phone);
    hideEmailGate();

    if (emailCallback) {
      emailCallback();
      emailCallback = null;
    }
  });

  modalClose.addEventListener('click', hideEmailGate);

  document.getElementById('emailModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideEmailGate();
  });

  // Load default calculator
  switchCalc('mortgage');
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
