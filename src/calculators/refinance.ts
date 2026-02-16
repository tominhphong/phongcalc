import { pmt } from '../utils/math';
import { usd, pct } from '../utils/format';
import { createDonut } from '../utils/charts';

export function render(): string {
    return `
    <h2 class="calc-title">🔄 Tái Cấp Vốn Rút Tiền</h2>
    <p class="calc-desc">Tính toán khi thay khoản vay cũ bằng khoản vay mới lớn hơn để rút tiền mặt.</p>

    <div class="card">
      <div class="card-title">🏠 Thông tin hiện tại</div>
      <div class="input-group">
        <label class="input-label">Giá trị nhà hiện tại</label>
        <input type="text" id="refi-value" class="input-field" value="400,000" inputmode="numeric" />
      </div>
      <div class="input-group">
        <label class="input-label">Số dư nợ hiện tại</label>
        <input type="text" id="refi-balance" class="input-field" value="250,000" inputmode="numeric" />
      </div>
      <div class="input-group">
        <label class="input-label">Số tiền muốn rút</label>
        <input type="text" id="refi-cashout" class="input-field" value="50,000" inputmode="numeric" />
      </div>
    </div>

    <div class="card">
      <div class="card-title">📝 Khoản vay mới</div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Lãi suất mới (%)</label>
          <input type="text" id="refi-rate" class="input-field" value="6.5" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label">Kỳ hạn mới</label>
          <select id="refi-term" class="input-field">
            <option value="30" selected>30 năm</option>
            <option value="20">20 năm</option>
            <option value="15">15 năm</option>
          </select>
        </div>
      </div>
      <button class="calc-btn" id="refi-calc-btn">📊 Tính Ngay</button>
    </div>

    <div id="refi-results" style="display:none">
      <div class="result-card">
        <div class="result-big" id="refi-monthly"></div>
        <div class="result-big-label">Trả hàng tháng (khoản vay mới)</div>
        <div class="chart-container">
          <canvas id="refi-chart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 Chi tiết</div>
        <div class="result-grid" id="refi-breakdown"></div>
      </div>
    </div>
  `;
}

function parseNum(id: string): number {
    return parseFloat((document.getElementById(id) as HTMLInputElement).value.replace(/[^0-9.-]/g, '')) || 0;
}

export function init() {
    document.getElementById('refi-calc-btn')!.addEventListener('click', calculate);

    ['refi-value', 'refi-balance', 'refi-cashout'].forEach(id => {
        document.getElementById(id)?.addEventListener('blur', () => {
            const el = document.getElementById(id) as HTMLInputElement;
            const v = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(v)) el.value = v.toLocaleString('en-US');
        });
    });

    calculate();
}

function calculate() {
    const homeValue = parseNum('refi-value');
    const currentBalance = parseNum('refi-balance');
    const cashOut = parseNum('refi-cashout');
    const rate = parseNum('refi-rate');
    const term = parseNum('refi-term');

    const newLoan = currentBalance + cashOut;
    const ltv = (newLoan / homeValue) * 100;
    const maxCashOut = homeValue * 0.8 - currentBalance;
    const monthlyPayment = pmt(newLoan, rate, term);
    const equity = homeValue - currentBalance;

    document.getElementById('refi-results')!.style.display = 'block';
    document.getElementById('refi-monthly')!.textContent = usd(monthlyPayment) + '/tháng';

    document.getElementById('refi-breakdown')!.innerHTML = `
    <div class="result-item"><span class="result-label">Khoản vay mới</span><span class="result-value primary">${usd(newLoan)}</span></div>
    <div class="result-item"><span class="result-label">Tỷ lệ LTV</span><span class="result-value ${ltv > 80 ? 'negative' : 'positive'}">${pct(ltv)}</span></div>
    <div class="result-item"><span class="result-label">Vốn sở hữu hiện có</span><span class="result-value positive">${usd(equity)}</span></div>
    <div class="result-item"><span class="result-label">Tiền mặt rút được</span><span class="result-value positive">${usd(cashOut)}</span></div>
    <div class="result-item"><span class="result-label">Rút tối đa (80% LTV)</span><span class="result-value">${usd(Math.max(0, maxCashOut))}</span></div>
    ${ltv > 80 ? '<div class="result-item"><span class="result-label">⚠️ Cảnh báo</span><span class="result-value negative">LTV > 80%</span></div>' : ''}
  `;

    createDonut('refi-chart', ['Nợ hiện tại', 'Tiền rút', 'Vốn còn lại'], [currentBalance, cashOut, Math.max(0, homeValue - newLoan)], ['#4f8cff', '#34d399', '#555577'], usd(newLoan));
}
