import { maxHomePrice, pmt } from '../utils/math';
import { usd, pct } from '../utils/format';
import { createDonut } from '../utils/charts';

export function render(): string {
    return `
    <h2 class="calc-title">🏠 Khả Năng Mua Nhà</h2>
    <p class="calc-desc">Tính giá nhà tối đa bạn có thể mua dựa trên thu nhập và nợ hiện tại.</p>

    <div class="card">
      <div class="card-title">💼 Thu nhập & Nợ</div>
      <div class="input-group">
        <label class="input-label">Thu nhập gộp/năm</label>
        <input type="text" id="aff-income" class="input-field" value="85,000" inputmode="numeric" />
      </div>
      <div class="input-group">
        <label class="input-label">Nợ hàng tháng (xe, thẻ tín dụng...)</label>
        <input type="text" id="aff-debt" class="input-field" value="500" inputmode="numeric" />
      </div>
      <div class="input-group">
        <label class="input-label">Tiền trả trước</label>
        <input type="text" id="aff-down" class="input-field" value="40,000" inputmode="numeric" />
      </div>
    </div>

    <div class="card">
      <div class="card-title">📊 Mức chấp nhận rủi ro</div>
      <div class="input-group">
        <label class="input-label">Tỷ lệ Nợ/Thu nhập (DTI)</label>
        <div class="slider-container">
          <input type="range" id="aff-dti-slider" class="slider" min="20" max="50" value="36" />
          <span class="slider-value" id="aff-dti-value">36%</span>
        </div>
        <span class="input-hint" id="aff-dti-label">✅ An toàn — Ngân hàng thường chấp nhận</span>
      </div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Lãi suất (%)</label>
          <input type="text" id="aff-rate" class="input-field" value="6.5" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label">Kỳ hạn</label>
          <select id="aff-term" class="input-field">
            <option value="30" selected>30 năm</option>
            <option value="15">15 năm</option>
          </select>
        </div>
      </div>
      <button class="calc-btn" id="aff-calc-btn">📊 Tính Ngay</button>
    </div>

    <div id="aff-results" style="display:none">
      <div class="result-card">
        <div class="result-big" id="aff-max"></div>
        <div class="result-big-label">Giá nhà tối đa bạn có thể mua</div>
        <div class="chart-container">
          <canvas id="aff-chart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 Chi tiết</div>
        <div class="result-grid" id="aff-breakdown"></div>
      </div>
    </div>
  `;
}

function parseNum(id: string): number {
    return parseFloat((document.getElementById(id) as HTMLInputElement).value.replace(/[^0-9.-]/g, '')) || 0;
}

export function init() {
    const slider = document.getElementById('aff-dti-slider') as HTMLInputElement;
    const dtiValue = document.getElementById('aff-dti-value')!;
    const dtiLabel = document.getElementById('aff-dti-label')!;

    slider.addEventListener('input', () => {
        const v = parseInt(slider.value);
        dtiValue.textContent = v + '%';
        if (v <= 36) dtiLabel.textContent = '✅ An toàn — Ngân hàng thường chấp nhận';
        else if (v <= 43) dtiLabel.textContent = '⚠️ Hơi căng — Cần thu nhập ổn định';
        else dtiLabel.textContent = '🔴 Rủi ro cao — Khó được duyệt';
    });

    ['aff-income', 'aff-debt', 'aff-down'].forEach(id => {
        document.getElementById(id)?.addEventListener('blur', () => {
            const el = document.getElementById(id) as HTMLInputElement;
            const v = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(v)) el.value = v.toLocaleString('en-US');
        });
    });

    document.getElementById('aff-calc-btn')!.addEventListener('click', calculate);
    calculate();
}

function calculate() {
    const income = parseNum('aff-income');
    const debt = parseNum('aff-debt');
    const down = parseNum('aff-down');
    const dti = parseNum('aff-dti-slider') / 100;
    const rate = parseNum('aff-rate');
    const term = parseNum('aff-term');

    const max = maxHomePrice(income, debt, down, rate, term, dti);
    const loanAmount = max - down;
    const monthlyPayment = pmt(loanAmount, rate, term);
    const maxMonthlyHousing = (income / 12) * dti - debt;

    document.getElementById('aff-results')!.style.display = 'block';
    document.getElementById('aff-max')!.textContent = usd(max);

    document.getElementById('aff-breakdown')!.innerHTML = `
    <div class="result-item"><span class="result-label">Khoản vay ước tính</span><span class="result-value primary">${usd(loanAmount)}</span></div>
    <div class="result-item"><span class="result-label">Trả góp/tháng</span><span class="result-value">${usd(monthlyPayment)}</span></div>
    <div class="result-item"><span class="result-label">Tối đa cho nhà/tháng</span><span class="result-value positive">${usd(maxMonthlyHousing)}</span></div>
    <div class="result-item"><span class="result-label">Thu nhập/tháng</span><span class="result-value">${usd(income / 12)}</span></div>
    <div class="result-item"><span class="result-label">DTI sau khi mua</span><span class="result-value ${dti > 0.43 ? 'negative' : 'positive'}">${pct(dti * 100)}</span></div>
  `;

    createDonut('aff-chart', ['Trả góp nhà', 'Nợ khác', 'Còn lại'], [monthlyPayment, debt, Math.max(0, income / 12 - monthlyPayment - debt)], ['#4f8cff', '#f87171', '#34d399'], usd(max));
}
