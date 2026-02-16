import { pmt, amortizationSchedule } from '../utils/math';
import { usd } from '../utils/format';
import { createLine } from '../utils/charts';
import { showEmailGate, isEmailCaptured } from '../main';

export function render(): string {
    return `
    <h2 class="calc-title">📋 Lịch Trả Nợ Chi Tiết</h2>
    <p class="calc-desc">Xem chi tiết từng khoản gốc, lãi qua từng năm. Thêm tiền trả thêm để rút ngắn thời gian.</p>

    <div class="card">
      <div class="card-title">📝 Thông tin khoản vay</div>
      <div class="input-group">
        <label class="input-label">Khoản vay</label>
        <input type="text" id="amort-loan" class="input-field" value="280,000" inputmode="numeric" />
      </div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Lãi suất (%/năm)</label>
          <input type="text" id="amort-rate" class="input-field" value="6.5" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label">Kỳ hạn</label>
          <select id="amort-term" class="input-field">
            <option value="30" selected>30 năm</option>
            <option value="20">20 năm</option>
            <option value="15">15 năm</option>
          </select>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">Trả thêm hàng tháng</label>
        <input type="text" id="amort-extra" class="input-field" value="0" inputmode="numeric" />
        <span class="input-hint">💡 Trả thêm giúp tiết kiệm hàng chục ngàn đô tiền lãi!</span>
      </div>
      <button class="calc-btn" id="amort-calc-btn">📊 Tính Ngay</button>
    </div>

    <div id="amort-results" style="display:none">
      <div class="result-card">
        <div class="result-big" id="amort-monthly"></div>
        <div class="result-big-label">Trả hàng tháng (Gốc & Lãi)</div>
      </div>

      <div class="card">
        <div class="card-title">📋 Tóm tắt</div>
        <div class="result-grid" id="amort-summary"></div>
      </div>

      <div class="card">
        <div class="card-title">📈 Biểu đồ theo năm</div>
        <div style="height:250px;position:relative">
          <canvas id="amort-chart"></canvas>
        </div>
      </div>

      <div class="card" id="amort-table-card">
        <div class="card-title">📊 Bảng chi tiết theo năm</div>
        <div id="amort-table-wrap"></div>
      </div>
    </div>
  `;
}

function parseNum(id: string): number {
    const el = document.getElementById(id) as HTMLInputElement;
    return parseFloat(el.value.replace(/[^0-9.-]/g, '')) || 0;
}

export function init() {
    const calcBtn = document.getElementById('amort-calc-btn')!;
    calcBtn.addEventListener('click', calculate);

    ['amort-loan', 'amort-extra'].forEach(id => {
        document.getElementById(id)?.addEventListener('blur', () => {
            const el = document.getElementById(id) as HTMLInputElement;
            const val = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(val)) el.value = val.toLocaleString('en-US');
        });
    });

    calculate();
}

function calculate() {
    const loan = parseNum('amort-loan');
    const rate = parseNum('amort-rate');
    const term = parseNum('amort-term');
    const extra = parseNum('amort-extra');

    const monthly = pmt(loan, rate, term);
    const schedule = amortizationSchedule(loan, rate, term, extra);
    const lastRow = schedule[schedule.length - 1];
    const totalPaid = lastRow.totalPrincipal + lastRow.totalInterest;
    const payoffMonths = schedule.length;
    const payoffYears = Math.floor(payoffMonths / 12);
    const payoffRemainMonths = payoffMonths % 12;

    // Show results
    document.getElementById('amort-results')!.style.display = 'block';
    document.getElementById('amort-monthly')!.textContent = usd(monthly + extra) + '/tháng';

    // Summary
    const savedInterest = extra > 0 ? (() => {
        const noExtraSchedule = amortizationSchedule(loan, rate, term, 0);
        const noExtraLast = noExtraSchedule[noExtraSchedule.length - 1];
        return noExtraLast.totalInterest - lastRow.totalInterest;
    })() : 0;

    document.getElementById('amort-summary')!.innerHTML = `
    <div class="result-item"><span class="result-label">Khoản vay</span><span class="result-value">${usd(loan)}</span></div>
    <div class="result-item"><span class="result-label">Tổng lãi phải trả</span><span class="result-value negative">${usd(lastRow.totalInterest)}</span></div>
    <div class="result-item"><span class="result-label">Tổng phải trả</span><span class="result-value">${usd(totalPaid)}</span></div>
    <div class="result-item"><span class="result-label">Thời gian trả hết</span><span class="result-value primary">${payoffYears} năm ${payoffRemainMonths} tháng</span></div>
    ${savedInterest > 0 ? `<div class="result-item"><span class="result-label">💰 Tiết kiệm được</span><span class="result-value positive">${usd(savedInterest)}</span></div>` : ''}
  `;

    // Chart - yearly data
    const yearlyLabels: string[] = [];
    const yearlyBalance: number[] = [];
    const yearlyPrincipal: number[] = [];
    const yearlyInterest: number[] = [];

    for (let i = 11; i < schedule.length; i += 12) {
        const year = Math.floor(i / 12) + 1;
        yearlyLabels.push(`Năm ${year}`);
        yearlyBalance.push(Math.round(schedule[i].balance));
        yearlyPrincipal.push(Math.round(schedule[i].totalPrincipal));
        yearlyInterest.push(Math.round(schedule[i].totalInterest));
    }
    // Add final if not aligned to 12
    if (schedule.length % 12 !== 0) {
        const last = schedule[schedule.length - 1];
        yearlyLabels.push(`Năm ${Math.ceil(schedule.length / 12)}`);
        yearlyBalance.push(Math.round(last.balance));
        yearlyPrincipal.push(Math.round(last.totalPrincipal));
        yearlyInterest.push(Math.round(last.totalInterest));
    }

    createLine('amort-chart', yearlyLabels, [
        { label: 'Số dư nợ', data: yearlyBalance, color: '#f87171' },
        { label: 'Tổng gốc đã trả', data: yearlyPrincipal, color: '#34d399' },
        { label: 'Tổng lãi đã trả', data: yearlyInterest, color: '#fbbf24' },
    ]);

    // Table - gated behind email
    const tableWrap = document.getElementById('amort-table-wrap')!;
    const tableHTML = buildTable(schedule);

    if (isEmailCaptured()) {
        tableWrap.innerHTML = tableHTML;
    } else {
        tableWrap.innerHTML = `
      <div class="blur-gate">
        <div class="blur-content">${tableHTML}</div>
        <div class="blur-overlay" id="amort-unlock">
          <span class="blur-overlay-icon">🔓</span>
          <span class="blur-overlay-text">Nhập email để xem bảng chi tiết</span>
        </div>
      </div>
    `;
        document.getElementById('amort-unlock')?.addEventListener('click', () => {
            showEmailGate(() => {
                tableWrap.innerHTML = tableHTML;
            });
        });
    }
}

function buildTable(schedule: ReturnType<typeof amortizationSchedule>): string {
    let rows = '';
    for (let i = 11; i < schedule.length; i += 12) {
        const row = schedule[i];
        const year = Math.floor(i / 12) + 1;
        const yearPrincipal = i >= 12 ? row.totalPrincipal - schedule[i - 12].totalPrincipal : row.totalPrincipal;
        const yearInterest = i >= 12 ? row.totalInterest - schedule[i - 12].totalInterest : row.totalInterest;
        rows += `<tr>
      <td>Năm ${year}</td>
      <td>${usd(yearPrincipal)}</td>
      <td>${usd(yearInterest)}</td>
      <td>${usd(row.balance)}</td>
    </tr>`;
    }

    return `<table class="data-table">
    <thead><tr>
      <th>Năm</th><th>Gốc</th><th>Lãi</th><th>Số dư</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}
