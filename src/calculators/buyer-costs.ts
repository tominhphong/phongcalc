import { buyerClosingCosts } from '../utils/math';
import { usd, pct } from '../utils/format';
import { createDonut } from '../utils/charts';

export function render(): string {
    return `
    <h2 class="calc-title">🧾 Chi Phí Người Mua</h2>
    <p class="calc-desc">Tổng hợp tất cả chi phí người mua phải trả khi hoàn tất mua nhà.</p>

    <div class="card">
      <div class="card-title">🏠 Thông tin mua</div>
      <div class="input-group">
        <label class="input-label">Giá mua</label>
        <input type="text" id="buy-price" class="input-field" value="350,000" inputmode="numeric" />
      </div>
      <div class="input-group">
        <label class="input-label">Tiền trả trước (%)</label>
        <div class="slider-container">
          <input type="range" id="buy-down-slider" class="slider" min="0" max="50" value="20" />
          <span class="slider-value" id="buy-down-value">20%</span>
        </div>
      </div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Thuế BĐS (%/năm)</label>
          <input type="text" id="buy-tax" class="input-field" value="2.2" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label">Bảo hiểm/năm</label>
          <input type="text" id="buy-ins" class="input-field" value="1,500" inputmode="numeric" />
        </div>
      </div>
      <button class="calc-btn" id="buy-calc-btn">📊 Tính Ngay</button>
    </div>

    <div id="buy-results" style="display:none">
      <div class="result-card">
        <div class="result-big" id="buy-total"></div>
        <div class="result-big-label">Tổng tiền mặt cần chuẩn bị</div>
        <div class="chart-container">
          <canvas id="buy-chart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 Chi tiết chi phí</div>
        <div class="result-grid" id="buy-breakdown"></div>
      </div>
    </div>
  `;
}

function parseNum(id: string): number {
    return parseFloat((document.getElementById(id) as HTMLInputElement).value.replace(/[^0-9.-]/g, '')) || 0;
}

export function init() {
    const slider = document.getElementById('buy-down-slider') as HTMLInputElement;
    const label = document.getElementById('buy-down-value')!;
    slider.addEventListener('input', () => { label.textContent = slider.value + '%'; });

    ['buy-price', 'buy-ins'].forEach(id => {
        document.getElementById(id)?.addEventListener('blur', () => {
            const el = document.getElementById(id) as HTMLInputElement;
            const v = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(v)) el.value = v.toLocaleString('en-US');
        });
    });

    document.getElementById('buy-calc-btn')!.addEventListener('click', calculate);
    calculate();
}

function calculate() {
    const price = parseNum('buy-price');
    const downPct = parseInt((document.getElementById('buy-down-slider') as HTMLInputElement).value);
    const taxRate = parseNum('buy-tax');
    const insurance = parseNum('buy-ins');

    const result = buyerClosingCosts(price, downPct, 1, 500, 400, 1000, 800, 200, 3, 14, taxRate, insurance);
    const downPayment = price * (downPct / 100);

    document.getElementById('buy-results')!.style.display = 'block';
    document.getElementById('buy-total')!.textContent = usd(result.cashToClose);

    let itemsHTML = `<div class="result-item"><span class="result-label">Tiền trả trước (${pct(downPct, 0)})</span><span class="result-value primary">${usd(downPayment)}</span></div>`;
    result.items.forEach(item => {
        itemsHTML += `<div class="result-item"><span class="result-label">${item.label}</span><span class="result-value">${usd(item.amount)}</span></div>`;
    });
    itemsHTML += `<div class="result-item"><span class="result-label">Tổng phí đóng hồ sơ</span><span class="result-value warning">${usd(result.totalClosing)}</span></div>`;
    itemsHTML += `<div class="result-item"><span class="result-label"><strong>💰 Tổng cash to close</strong></span><span class="result-value positive"><strong>${usd(result.cashToClose)}</strong></span></div>`;

    document.getElementById('buy-breakdown')!.innerHTML = itemsHTML;

    createDonut('buy-chart', ['Trả trước', 'Phí đóng hồ sơ'], [downPayment, result.totalClosing], ['#4f8cff', '#fbbf24'], usd(result.cashToClose));
}
