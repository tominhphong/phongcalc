import { pmt, amortizationSchedule } from '../utils/math';
import { usd } from '../utils/format';
import { createLine } from '../utils/charts';
import { showEmailGate, isEmailCaptured } from '../main';
import { parseNum } from '../utils/parse';
import { clearInputErrors, requirePositive, requireRange } from '../utils/validate';

export function render(): string {
    return `
    <h2 class="calc-title">📋 <span class="vi-text">Lịch Trả Nợ Chi Tiết</span><span class="en-text">Amortization Schedule</span></h2>
    <p class="calc-desc">Xem chi tiết từng khoản gốc, lãi qua từng năm. Thêm tiền trả thêm để rút ngắn thời gian.</p>

    <div class="card">
      <div class="card-title">📝 Thông tin khoản vay</div>
      <div class="input-group">
        <label class="input-label"><span class="vi-text">Khoản vay</span><span class="en-text">Loan Amount</span></label>
        <input type="text" id="amort-loan" class="input-field" value="280,000" inputmode="numeric" />
      </div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label"><span class="vi-text">Lãi suất (%/năm)</span><span class="en-text">Interest Rate (%/yr)</span></label>
          <input type="text" id="amort-rate" class="input-field" value="6.5" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label"><span class="vi-text">Kỳ hạn</span><span class="en-text">Loan Term</span></label>
          <select id="amort-term" class="input-field">
            <option value="30" selected>30 năm</option>
            <option value="20">20 năm</option>
            <option value="15">15 năm</option>
          </select>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label"><span class="vi-text">Trả thêm hàng tháng</span><span class="en-text">Extra Monthly</span></label>
        <input type="text" id="amort-extra" class="input-field" value="0" inputmode="numeric" />
        <span class="input-hint">💡 Trả thêm giúp tiết kiệm hàng chục ngàn đô tiền lãi!</span>
      </div>
      <button class="calc-btn" id="amort-calc-btn">📊 <span class="vi-text">Tính Ngay</span><span class="en-text">Calculate</span></button>
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
        <div class="card-title">📊 Bảng chi tiết</div>
        <div class="table-toggle-group" id="amort-table-toggle">
          <button class="table-toggle-btn active" data-view="yearly">📅 <span class="vi-text">Theo năm</span><span class="en-text">Yearly</span></button>
          <button class="table-toggle-btn" data-view="monthly">📋 <span class="vi-text">Theo tháng</span><span class="en-text">Monthly</span></button>
        </div>
        <div id="amort-table-wrap"></div>
      </div>

      <div class="button-group">
        <button class="print-btn" id="amort-print-btn">📥 <span class="vi-text">Lưu / In PDF</span><span class="en-text">Save / Print PDF</span></button>
        <button class="print-btn" id="amort-csv-btn">📊 <span class="vi-text">Tải CSV</span><span class="en-text">Download CSV</span></button>
      </div>
    </div>
  `;
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
    clearInputErrors('amort-loan', 'amort-rate', 'amort-term');
    if (!requirePositive('amort-loan', 'Khoản vay')) return;
    if (!requireRange('amort-rate', 'Lãi suất', 0.1, 30)) return;
    if (!requireRange('amort-term', 'Kỳ hạn', 1, 50)) return;

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
    let viewMode: 'yearly' | 'monthly' = 'yearly';

    const renderTable = () => {
        const tableHTML = viewMode === 'yearly' ? buildYearlyTable(schedule) : buildMonthlyTable(schedule);

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
    };

    // Toggle buttons for yearly/monthly view
    const toggleBtns = document.querySelectorAll('#amort-table-toggle .table-toggle-btn') as NodeListOf<HTMLButtonElement>;
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            viewMode = (btn.dataset.view as 'yearly' | 'monthly') || 'yearly';
            renderTable();
        });
    });

    // CSV download button
    const csvBtn = document.getElementById('amort-csv-btn') as HTMLButtonElement;
    if (csvBtn) {
        csvBtn.addEventListener('click', () => {
            showEmailGate(() => downloadCSV(schedule, extra));
        });
    }

    // Print button with lead capture
    const printBtn = document.getElementById('amort-print-btn') as HTMLButtonElement;
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            showEmailGate(() => window.print());
        });
    }

    // Initial render
    renderTable();
}

function buildYearlyTable(schedule: ReturnType<typeof amortizationSchedule>): string {
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

function buildMonthlyTable(schedule: ReturnType<typeof amortizationSchedule>): string {
    let rows = '';
    for (let i = 0; i < schedule.length; i++) {
        const row = schedule[i];
        const month = row.month;
        const monthNum = ((month - 1) % 12) + 1;
        const monthYear = `T${monthNum.toString().padStart(2, '0')}/${Math.floor((month - 1) / 12) + 1}`;

        const monthPrincipal = i === 0 ? row.totalPrincipal : row.totalPrincipal - schedule[i - 1].totalPrincipal;
        const monthInterest = i === 0 ? row.totalInterest : row.totalInterest - schedule[i - 1].totalInterest;

        rows += `<tr>
      <td>${monthYear}</td>
      <td>${usd(monthPrincipal)}</td>
      <td>${usd(monthInterest)}</td>
      <td>${usd(row.payment - monthInterest)}</td>
      <td>${usd(row.balance)}</td>
    </tr>`;
    }

    return `<table class="data-table">
    <thead><tr>
      <th>Tháng/Năm</th><th>Trả gốc</th><th>Trả lãi</th><th>Trả thêm</th><th>Số dư</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function downloadCSV(schedule: ReturnType<typeof amortizationSchedule>, extra: number): void {
    // Build CSV content
    const headers = ['Tháng,Kỳ hạn,Trả gốc,Trả lãi,Trả thêm,Tổng trả,Số dư còn lại'];
    const rows: string[] = [];

    for (let i = 0; i < schedule.length; i++) {
        const row = schedule[i];
        const month = row.month;
        const monthNum = ((month - 1) % 12) + 1;

        const monthPrincipal = i === 0 ? row.totalPrincipal : row.totalPrincipal - schedule[i - 1].totalPrincipal;
        const monthInterest = i === 0 ? row.totalInterest : row.totalInterest - schedule[i - 1].totalInterest;

        rows.push(
            `T${monthNum},${month},${monthPrincipal.toFixed(2)},${monthInterest.toFixed(2)},${extra.toFixed(2)},${row.payment.toFixed(2)},${row.balance.toFixed(2)}`
        );
    }

    const csvContent = headers.concat(rows).join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const filename = `amortization-phongcalc-${dateStr}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
