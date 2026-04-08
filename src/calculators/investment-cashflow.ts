import { investmentCashflow } from '../utils/math';
import { usd, pct } from '../utils/format';
import { createBar } from '../utils/charts';
import { parseNum } from '../utils/parse';
import { clearInputErrors, requirePositive, requireRange } from '../utils/validate';

export function render(): string {
    return `
    <h2 class="calc-title"><span class="vi-text">📈 Phân Tích Dòng Tiền</span><span class="en-text">📈 Investment Cashflow</span></h2>
    <p class="calc-desc">Tính lợi nhuận hàng tháng khi mua bất động sản để cho thuê.</p>

    <div class="card">
      <div class="card-title">🏠 Thông tin mua</div>
      <div class="input-group">
        <label class="input-label"><span class="vi-text">Giá nhà</span><span class="en-text">Home Price</span></label>
        <input type="text" id="inv-price" class="input-field" value="300,000" inputmode="numeric" />
      </div>
      <div class="input-group">
        <label class="input-label">Tiền trả trước (%)</label>
        <div class="slider-container">
          <input type="range" id="inv-down-slider" class="slider" min="5" max="50" value="25" />
          <span class="slider-value" id="inv-down-value">25%</span>
        </div>
      </div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Lãi suất (%)</label>
          <input type="text" id="inv-rate" class="input-field" value="7.0" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label">Kỳ hạn</label>
          <select id="inv-term" class="input-field">
            <option value="30" selected>30 năm</option>
            <option value="15">15 năm</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">💰 Thu nhập & Chi phí</div>
      <div class="input-group">
        <label class="input-label"><span class="vi-text">Tiền thuê/tháng</span><span class="en-text">Monthly Rent</span></label>
        <input type="text" id="inv-rent" class="input-field" value="2,200" inputmode="numeric" />
      </div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Thuế BĐS/tháng</label>
          <input type="text" id="inv-tax" class="input-field" value="550" inputmode="numeric" />
        </div>
        <div class="input-group">
          <label class="input-label">Bảo hiểm/tháng</label>
          <input type="text" id="inv-ins" class="input-field" value="125" inputmode="numeric" />
        </div>
      </div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Bảo trì/tháng</label>
          <input type="text" id="inv-maint" class="input-field" value="150" inputmode="numeric" />
        </div>
        <div class="input-group">
          <label class="input-label">HOA/tháng</label>
          <input type="text" id="inv-hoa" class="input-field" value="0" inputmode="numeric" />
        </div>
      </div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label"><span class="vi-text">Tỷ lệ trống (%)</span><span class="en-text">Vacancy Rate (%)</span></label>
          <input type="text" id="inv-vacancy" class="input-field" value="5" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label">Phí quản lý (%)</label>
          <input type="text" id="inv-mgmt" class="input-field" value="10" inputmode="decimal" />
        </div>
      </div>
      <button class="calc-btn" id="inv-calc-btn"><span class="vi-text">📊 Phân Tích</span><span class="en-text">📊 Analyze</span></button>
    </div>

    <div id="inv-results" style="display:none">
      <div class="result-card">
        <div class="result-big" id="inv-cashflow"></div>
        <div class="result-big-label"><span class="vi-text">Dòng tiền hàng tháng</span><span class="en-text">Monthly Cashflow</span></div>
      </div>
      <div class="card">
        <div class="card-title">📊 Thu nhập vs Chi phí</div>
        <div style="height:250px;position:relative">
          <canvas id="inv-chart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 Chi tiết</div>
        <div class="result-grid" id="inv-breakdown"></div>
      </div>
      <button class="calc-btn" onclick="window.print()" style="margin-top:16px"><span class="vi-text">🖨️ In</span><span class="en-text">🖨️ Print</span></button>
    </div>
  `;
}


export function init() {
    const slider = document.getElementById('inv-down-slider') as HTMLInputElement;
    const label = document.getElementById('inv-down-value')!;
    slider.addEventListener('input', () => { label.textContent = slider.value + '%'; });

    ['inv-price', 'inv-rent', 'inv-tax', 'inv-ins', 'inv-maint', 'inv-hoa'].forEach(id => {
        document.getElementById(id)?.addEventListener('blur', () => {
            const el = document.getElementById(id) as HTMLInputElement;
            const v = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(v)) el.value = v.toLocaleString('en-US');
        });
    });

    document.getElementById('inv-calc-btn')!.addEventListener('click', calculate);
    calculate();
}

function calculate() {
    clearInputErrors('inv-price', 'inv-rent');
    if (!requirePositive('inv-price', 'Giá nhà')) return;
    if (!requirePositive('inv-rent', 'Tiền thuê')) return;
    if (!requireRange('inv-rate', 'Lãi suất', 0.1, 30)) return;

    const price = parseNum('inv-price');
    const downPct = parseInt((document.getElementById('inv-down-slider') as HTMLInputElement).value);
    const rate = parseNum('inv-rate');
    const term = parseNum('inv-term');
    const rent = parseNum('inv-rent');
    const vacancy = parseNum('inv-vacancy');
    const mgmt = parseNum('inv-mgmt');
    const ins = parseNum('inv-ins');
    const tax = parseNum('inv-tax');
    const maint = parseNum('inv-maint');
    const hoa = parseNum('inv-hoa');

    const result = investmentCashflow(price, downPct, rate, term, rent, vacancy, mgmt, ins, tax, maint, hoa);
    const downPayment = price * (downPct / 100);

    document.getElementById('inv-results')!.style.display = 'block';

    const cfEl = document.getElementById('inv-cashflow')!;
    cfEl.textContent = usd(result.monthlyCashflow) + '/tháng';
    cfEl.className = result.monthlyCashflow >= 0 ? 'result-big' : 'result-big negative';

    // Chart
    const expenseLabels = result.expenses.map(e => e.label);
    const expenseData = result.expenses.map(e => Math.round(e.amount));

    createBar('inv-chart', expenseLabels, [
        { label: 'Chi phí', data: expenseData, color: '#f87171' },
    ]);

    let breakdown = `<div class="result-item"><span class="result-label">Tiền thuê hiệu quả</span><span class="result-value positive">${usd(result.income)}</span></div>`;
    result.expenses.forEach(e => {
        breakdown += `<div class="result-item"><span class="result-label">${e.label}</span><span class="result-value negative">${usd(e.amount)}</span></div>`;
    });
    breakdown += `
    <div class="result-item"><span class="result-label"><strong>Dòng tiền/tháng</strong></span><span class="result-value ${result.monthlyCashflow >= 0 ? 'positive' : 'negative'}"><strong>${usd(result.monthlyCashflow)}</strong></span></div>
    <div class="result-item"><span class="result-label">Dòng tiền/năm</span><span class="result-value ${result.monthlyCashflow >= 0 ? 'positive' : 'negative'}">${usd(result.monthlyCashflow * 12)}</span></div>
    <div class="result-item"><span class="result-label">Tỷ suất lợi nhuận/năm</span><span class="result-value ${result.annualReturn >= 0 ? 'positive' : 'negative'}">${pct(result.annualReturn)}</span></div>
    <div class="result-item"><span class="result-label">Tiền đầu tư (trả trước)</span><span class="result-value primary">${usd(downPayment)}</span></div>
  `;

    document.getElementById('inv-breakdown')!.innerHTML = breakdown;
}
