import { sellerNetProceeds } from '../utils/math';
import { usd, pct } from '../utils/format';
import { createDonut } from '../utils/charts';

export function render(): string {
    return `
    <h2 class="calc-title">💵 Lợi Nhuận Người Bán</h2>
    <p class="calc-desc">Ước tính số tiền bạn nhận được sau khi bán nhà, trừ tất cả chi phí.</p>

    <div class="card">
      <div class="card-title">🏠 Thông tin bán</div>
      <div class="input-group">
        <label class="input-label">Giá bán dự kiến</label>
        <input type="text" id="sell-price" class="input-field" value="400,000" inputmode="numeric" />
      </div>
      <div class="input-group">
        <label class="input-label">Số dư nợ hiện tại</label>
        <input type="text" id="sell-mortgage" class="input-field" value="250,000" inputmode="numeric" />
      </div>
    </div>

    <div class="card">
      <div class="card-title">💰 Chi phí bán</div>
      <div class="input-group">
        <label class="input-label">Hoa hồng môi giới (%)</label>
        <div class="slider-container">
          <input type="range" id="sell-comm-slider" class="slider" min="0" max="8" step="0.5" value="6" />
          <span class="slider-value" id="sell-comm-value">6%</span>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">Phí đóng hồ sơ</label>
        <input type="text" id="sell-closing" class="input-field" value="3,000" inputmode="numeric" />
      </div>
      <div class="input-group">
        <label class="input-label">Chi phí sửa chữa</label>
        <input type="text" id="sell-repairs" class="input-field" value="0" inputmode="numeric" />
      </div>
      <button class="calc-btn" id="sell-calc-btn">📊 Tính Ngay</button>
    </div>

    <div id="sell-results" style="display:none">
      <div class="result-card">
        <div class="result-big" id="sell-total"></div>
        <div class="result-big-label">Tiền bạn nhận được</div>
        <div class="chart-container">
          <canvas id="sell-chart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 Chi tiết</div>
        <div class="result-grid" id="sell-breakdown"></div>
      </div>
    </div>
  `;
}

function parseNum(id: string): number {
    return parseFloat((document.getElementById(id) as HTMLInputElement).value.replace(/[^0-9.-]/g, '')) || 0;
}

export function init() {
    const slider = document.getElementById('sell-comm-slider') as HTMLInputElement;
    const label = document.getElementById('sell-comm-value')!;
    slider.addEventListener('input', () => { label.textContent = parseFloat(slider.value) + '%'; });

    ['sell-price', 'sell-mortgage', 'sell-closing', 'sell-repairs'].forEach(id => {
        document.getElementById(id)?.addEventListener('blur', () => {
            const el = document.getElementById(id) as HTMLInputElement;
            const v = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(v)) el.value = v.toLocaleString('en-US');
        });
    });

    document.getElementById('sell-calc-btn')!.addEventListener('click', calculate);
    calculate();
}

function calculate() {
    const price = parseNum('sell-price');
    const mortgage = parseNum('sell-mortgage');
    const commPct = parseFloat((document.getElementById('sell-comm-slider') as HTMLInputElement).value);
    const closing = parseNum('sell-closing');
    const repairs = parseNum('sell-repairs');

    const result = sellerNetProceeds(price, mortgage, commPct, closing, repairs);

    document.getElementById('sell-results')!.style.display = 'block';

    const totalEl = document.getElementById('sell-total')!;
    totalEl.textContent = usd(result.proceeds);
    totalEl.className = result.proceeds >= 0 ? 'result-big' : 'result-big negative';

    document.getElementById('sell-breakdown')!.innerHTML = `
    <div class="result-item"><span class="result-label">Giá bán</span><span class="result-value">${usd(price)}</span></div>
    <div class="result-item"><span class="result-label">Trả nợ</span><span class="result-value negative">-${usd(mortgage)}</span></div>
    <div class="result-item"><span class="result-label">Hoa hồng (${pct(commPct)})</span><span class="result-value negative">-${usd(result.commission)}</span></div>
    <div class="result-item"><span class="result-label">Phí đóng hồ sơ</span><span class="result-value negative">-${usd(closing)}</span></div>
    ${repairs > 0 ? `<div class="result-item"><span class="result-label">Sửa chữa</span><span class="result-value negative">-${usd(repairs)}</span></div>` : ''}
    <div class="result-item"><span class="result-label"><strong>Tiền nhận về</strong></span><span class="result-value ${result.proceeds >= 0 ? 'positive' : 'negative'}"><strong>${usd(result.proceeds)}</strong></span></div>
  `;

    createDonut('sell-chart', ['Tiền nhận về', 'Trả nợ', 'Chi phí bán'], [Math.max(0, result.proceeds), mortgage, result.totalCosts], ['#34d399', '#4f8cff', '#f87171'], usd(result.proceeds));
}
