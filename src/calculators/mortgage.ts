import { pmt, calculatePMI } from '../utils/math';
import { usd, pct } from '../utils/format';
import { createDonut } from '../utils/charts';
import { parseNum, formatInput } from '../utils/parse';
import { clearInputErrors, requirePositive, requireRange } from '../utils/validate';

export function render(): string {
    return `
    <h2 class="calc-title">💰 <span class="vi-text">Tính Tiền Trả Hàng Tháng</span><span class="en-text">Monthly Payment Calculator</span></h2>
    <p class="calc-desc"><span class="vi-text">Ước tính số tiền trả góp hàng tháng cho khoản vay mua nhà.</span><span class="en-text">Estimate your monthly mortgage payment including taxes and insurance.</span></p>

    <div class="card">
      <div class="card-title">📝 Thông tin khoản vay</div>

      <div class="input-group">
        <label class="input-label"><span class="vi-text">Giá nhà</span><span class="en-text">Home Price</span></label>
        <input type="text" id="mtg-price" class="input-field" value="350,000" placeholder="350,000" inputmode="numeric" />
      </div>

      <div class="input-group">
        <label class="input-label"><span class="vi-text">Tiền trả trước</span><span class="en-text">Down Payment</span></label>
        <div class="slider-container">
          <input type="range" id="mtg-down-slider" class="slider" min="0" max="50" value="20" />
          <span class="slider-value" id="mtg-down-value">20%</span>
        </div>
        <input type="text" id="mtg-down" class="input-field" value="70,000" inputmode="numeric" style="margin-top:8px" />
      </div>

      <div class="input-row">
        <div class="input-group">
          <label class="input-label"><span class="vi-text">Lãi suất (%/năm)</span><span class="en-text">Interest Rate (%/yr)</span></label>
          <input type="text" id="mtg-rate" class="input-field" value="6.5" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label"><span class="vi-text">Kỳ hạn</span><span class="en-text">Loan Term</span></label>
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
          <label class="input-label"><span class="vi-text">Thuế BĐS/năm</span><span class="en-text">Property Tax/yr</span></label>
          <input type="text" id="mtg-tax" class="input-field" value="7,700" inputmode="numeric" />
        </div>
        <div class="input-group">
          <label class="input-label"><span class="vi-text">Bảo hiểm/năm</span><span class="en-text">Insurance/yr</span></label>
          <input type="text" id="mtg-insurance" class="input-field" value="1,500" inputmode="numeric" />
        </div>
      </div>

      <div class="input-group">
        <label class="input-label"><span class="vi-text">Phí HOA/tháng</span><span class="en-text">HOA Fee/mo</span></label>
        <input type="text" id="mtg-hoa" class="input-field" value="0" inputmode="numeric" />
      </div>

      <button class="calc-btn" id="mtg-calc-btn">📊 <span class="vi-text">Tính Ngay</span><span class="en-text">Calculate</span></button>
    </div>

    <div id="mtg-results" style="display:none">
      <div class="result-card">
        <div class="result-big" id="mtg-total"></div>
        <div class="result-big-label"><span class="vi-text">Tổng trả hàng tháng</span><span class="en-text">Total monthly payment</span></div>
        <div class="chart-container">
          <canvas id="mtg-chart"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📋 Chi tiết hàng tháng</div>
        <div class="result-grid" id="mtg-breakdown"></div>
      </div>

      <button class="print-btn" onclick="window.print()">📥 <span class="vi-text">Lưu / In PDF</span><span class="en-text">Save / Print PDF</span></button>
    </div>
  `;
}

export function init() {
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
    clearInputErrors('mtg-price', 'mtg-rate', 'mtg-term');
    if (!requirePositive('mtg-price', 'Giá nhà')) return;
    if (!requireRange('mtg-rate', 'Lãi suất', 0.1, 30)) return;
    if (!requireRange('mtg-term', 'Kỳ hạn', 1, 50)) return;

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
    const ltv = loanAmount / homePrice;
    const pmiMonthly = calculatePMI(loanAmount, homePrice);
    const total = monthlyPI + monthlyTax + monthlyInsurance + hoa + pmiMonthly;

    // Show results
    const results = document.getElementById('mtg-results')!;
    results.style.display = 'block';

    document.getElementById('mtg-total')!.textContent = usd(total) + '/tháng';

    // Breakdown
    const breakdown = document.getElementById('mtg-breakdown')!;
    breakdown.innerHTML = `
    <div class="result-item"><span class="result-label">Gốc & Lãi</span><span class="result-value primary">${usd(monthlyPI)}</span></div>
    <div class="result-item"><span class="result-label"><span class="vi-text">Thuế BĐS</span><span class="en-text">Property Tax</span></span><span class="result-value warning">${usd(monthlyTax)}</span></div>
    <div class="result-item"><span class="result-label"><span class="vi-text">Bảo hiểm</span><span class="en-text">Insurance</span></span><span class="result-value">${usd(monthlyInsurance)}</span></div>
    ${hoa > 0 ? `<div class="result-item"><span class="result-label">HOA</span><span class="result-value">${usd(hoa)}</span></div>` : ''}
    ${pmiMonthly > 0 ? `<div class="result-item"><span class="result-label"><span class="vi-text">⚠️ Bảo hiểm PMI</span><span class="en-text">⚠️ PMI Insurance</span></span><span class="result-value danger">${usd(pmiMonthly)}</span></div>` : ''}
    <div class="result-item"><span class="result-label">Khoản vay</span><span class="result-value">${usd(loanAmount)}</span></div>
    <div class="result-item"><span class="result-label">Tỷ lệ trả trước</span><span class="result-value">${pct(downPayment / homePrice * 100, 1)}</span></div>
    ${ltv > 0.8 && pmiMonthly > 0 ? `<div class="pmi-warning"><span class="vi-text">⚠️ Trả trước < 20% → cần PMI. PMI tự hủy khi vốn sở hữu đạt 20%.</span><span class="en-text">⚠️ Down payment < 20% requires PMI. PMI cancels when equity reaches 20%.</span></div>` : ''}
  `;

    // Chart
    const labels = ['Gốc & Lãi', 'Thuế', 'Bảo hiểm'];
    const data = [monthlyPI, monthlyTax, monthlyInsurance];
    if (hoa > 0) { labels.push('HOA'); data.push(hoa); }

    createDonut('mtg-chart', labels, data, undefined, usd(total));
}
