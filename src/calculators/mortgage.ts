import { pmt } from '../utils/math';
import { usd, pct } from '../utils/format';
import { createDonut } from '../utils/charts';

export function render(): string {
    return `
    <h2 class="calc-title">💰 Tính Tiền Trả Hàng Tháng</h2>
    <p class="calc-desc">Ước tính số tiền trả góp hàng tháng cho khoản vay mua nhà.</p>

    <div class="card">
      <div class="card-title">📝 Thông tin khoản vay</div>

      <div class="input-group">
        <label class="input-label">Giá nhà</label>
        <input type="text" id="mtg-price" class="input-field" value="350,000" placeholder="350,000" inputmode="numeric" />
      </div>

      <div class="input-group">
        <label class="input-label">Tiền trả trước</label>
        <div class="slider-container">
          <input type="range" id="mtg-down-slider" class="slider" min="0" max="50" value="20" />
          <span class="slider-value" id="mtg-down-value">20%</span>
        </div>
        <input type="text" id="mtg-down" class="input-field" value="70,000" inputmode="numeric" style="margin-top:8px" />
      </div>

      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Lãi suất (%/năm)</label>
          <input type="text" id="mtg-rate" class="input-field" value="6.5" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label">Kỳ hạn</label>
          <select id="mtg-term" class="input-field">
            <option value="30" selected>30 năm</option>
            <option value="20">20 năm</option>
            <option value="15">15 năm</option>
            <option value="10">10 năm</option>
          </select>
        </div>
      </div>

      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Thuế BĐS/năm</label>
          <input type="text" id="mtg-tax" class="input-field" value="7,700" inputmode="numeric" />
        </div>
        <div class="input-group">
          <label class="input-label">Bảo hiểm/năm</label>
          <input type="text" id="mtg-insurance" class="input-field" value="1,500" inputmode="numeric" />
        </div>
      </div>

      <div class="input-group">
        <label class="input-label">Phí HOA/tháng</label>
        <input type="text" id="mtg-hoa" class="input-field" value="0" inputmode="numeric" />
      </div>

      <button class="calc-btn" id="mtg-calc-btn">📊 Tính Ngay</button>
    </div>

    <div id="mtg-results" style="display:none">
      <div class="result-card">
        <div class="result-big" id="mtg-total"></div>
        <div class="result-big-label">Tổng trả hàng tháng</div>
        <div class="chart-container">
          <canvas id="mtg-chart"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📋 Chi tiết hàng tháng</div>
        <div class="result-grid" id="mtg-breakdown"></div>
      </div>
    </div>
  `;
}

function parseNum(id: string): number {
    const el = document.getElementById(id) as HTMLInputElement;
    return parseFloat(el.value.replace(/[^0-9.-]/g, '')) || 0;
}

function formatInput(id: string) {
    const el = document.getElementById(id) as HTMLInputElement;
    const val = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
    if (!isNaN(val)) el.value = val.toLocaleString('en-US');
}

export function init() {
    const price = document.getElementById('mtg-price') as HTMLInputElement;
    const downSlider = document.getElementById('mtg-down-slider') as HTMLInputElement;
    const downValue = document.getElementById('mtg-down-value')!;
    const downInput = document.getElementById('mtg-down') as HTMLInputElement;
    const calcBtn = document.getElementById('mtg-calc-btn')!;

    // Slider sync
    downSlider.addEventListener('input', () => {
        const pctVal = parseInt(downSlider.value);
        downValue.textContent = pctVal + '%';
        const priceVal = parseNum('mtg-price');
        downInput.value = Math.round(priceVal * pctVal / 100).toLocaleString('en-US');
    });

    // Format inputs on blur
    ['mtg-price', 'mtg-down', 'mtg-tax', 'mtg-insurance', 'mtg-hoa'].forEach(id => {
        document.getElementById(id)?.addEventListener('blur', () => formatInput(id));
    });

    calcBtn.addEventListener('click', calculate);
    calculate(); // Initial calculation
}

function calculate() {
    const homePrice = parseNum('mtg-price');
    const downPayment = parseNum('mtg-down');
    const rate = parseNum('mtg-rate');
    const term = parseNum('mtg-term');
    const taxYearly = parseNum('mtg-tax');
    const insuranceYearly = parseNum('mtg-insurance');
    const hoa = parseNum('mtg-hoa');

    const loanAmount = homePrice - downPayment;
    const monthlyPI = pmt(loanAmount, rate, term);
    const monthlyTax = taxYearly / 12;
    const monthlyInsurance = insuranceYearly / 12;
    const total = monthlyPI + monthlyTax + monthlyInsurance + hoa;

    // Show results
    const results = document.getElementById('mtg-results')!;
    results.style.display = 'block';

    document.getElementById('mtg-total')!.textContent = usd(total) + '/tháng';

    // Breakdown
    const breakdown = document.getElementById('mtg-breakdown')!;
    breakdown.innerHTML = `
    <div class="result-item"><span class="result-label">Gốc & Lãi</span><span class="result-value primary">${usd(monthlyPI)}</span></div>
    <div class="result-item"><span class="result-label">Thuế BĐS</span><span class="result-value warning">${usd(monthlyTax)}</span></div>
    <div class="result-item"><span class="result-label">Bảo hiểm</span><span class="result-value">${usd(monthlyInsurance)}</span></div>
    ${hoa > 0 ? `<div class="result-item"><span class="result-label">HOA</span><span class="result-value">${usd(hoa)}</span></div>` : ''}
    <div class="result-item"><span class="result-label">Khoản vay</span><span class="result-value">${usd(loanAmount)}</span></div>
    <div class="result-item"><span class="result-label">Tỷ lệ trả trước</span><span class="result-value">${pct(downPayment / homePrice * 100, 1)}</span></div>
  `;

    // Chart
    const labels = ['Gốc & Lãi', 'Thuế', 'Bảo hiểm'];
    const data = [monthlyPI, monthlyTax, monthlyInsurance];
    if (hoa > 0) { labels.push('HOA'); data.push(hoa); }

    createDonut('mtg-chart', labels, data, undefined, usd(total));
}
