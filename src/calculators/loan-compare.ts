import { pmt } from '../utils/math';
import { usd } from '../utils/format';
import { parseNum } from '../utils/parse';
import { clearInputErrors, requirePositive } from '../utils/validate';

export function render(): string {
    return `
    <h2 class="calc-title"><span class="vi-text">⚖️ So Sánh Khoản Vay</span><span class="en-text">⚖️ Loan Comparison</span></h2>
    <p class="calc-desc">So sánh song song 2 lựa chọn vay để tìm phương án tốt nhất.</p>

    <div class="compare-grid">
      <div class="compare-col">
        <div class="compare-col-title a"><span class="vi-text">Phương án A</span><span class="en-text">Option A</span></div>
        <div class="input-group">
          <label class="input-label"><span class="vi-text">Giá nhà</span><span class="en-text">Home Price</span></label>
          <input type="text" id="cmp-price-a" class="input-field" value="350,000" inputmode="numeric" />
        </div>
        <div class="input-group">
          <label class="input-label">Trả trước</label>
          <input type="text" id="cmp-down-a" class="input-field" value="70,000" inputmode="numeric" />
        </div>
        <div class="input-group">
          <label class="input-label"><span class="vi-text">Lãi suất</span><span class="en-text">Interest Rate</span></label>
          <input type="text" id="cmp-rate-a" class="input-field" value="6.5" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label">Kỳ hạn</label>
          <select id="cmp-term-a" class="input-field">
            <option value="30" selected>30 năm</option>
            <option value="20">20 năm</option>
            <option value="15">15 năm</option>
          </select>
        </div>
      </div>
      <div class="compare-col">
        <div class="compare-col-title b"><span class="vi-text">Phương án B</span><span class="en-text">Option B</span></div>
        <div class="input-group">
          <label class="input-label"><span class="vi-text">Giá nhà</span><span class="en-text">Home Price</span></label>
          <input type="text" id="cmp-price-b" class="input-field" value="350,000" inputmode="numeric" />
        </div>
        <div class="input-group">
          <label class="input-label">Trả trước</label>
          <input type="text" id="cmp-down-b" class="input-field" value="35,000" inputmode="numeric" />
        </div>
        <div class="input-group">
          <label class="input-label"><span class="vi-text">Lãi suất</span><span class="en-text">Interest Rate</span></label>
          <input type="text" id="cmp-rate-b" class="input-field" value="7.0" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label">Kỳ hạn</label>
          <select id="cmp-term-b" class="input-field">
            <option value="30" selected>30 năm</option>
            <option value="20">20 năm</option>
            <option value="15">15 năm</option>
          </select>
        </div>
      </div>
    </div>
    <button class="calc-btn" id="cmp-calc-btn" style="margin-top:16px"><span class="vi-text">📊 So Sánh</span><span class="en-text">📊 Compare</span></button>

    <div id="cmp-results" style="display:none">
      <div class="result-card" id="cmp-winner"></div>
      <div class="card">
        <div class="card-title">📋 So sánh chi tiết</div>
        <div class="result-grid" id="cmp-breakdown"></div>
      </div>
      <button class="calc-btn" onclick="window.print()" style="margin-top:16px"><span class="vi-text">🖨️ In</span><span class="en-text">🖨️ Print</span></button>
    </div>
  `;
}


export function init() {
    document.getElementById('cmp-calc-btn')!.addEventListener('click', calculate);

    ['cmp-price-a', 'cmp-down-a', 'cmp-price-b', 'cmp-down-b'].forEach(id => {
        document.getElementById(id)?.addEventListener('blur', () => {
            const el = document.getElementById(id) as HTMLInputElement;
            const v = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(v)) el.value = v.toLocaleString('en-US');
        });
    });

    calculate();
}

function calculate() {
    clearInputErrors('cmp-price-a', 'cmp-price-b');
    if (!requirePositive('cmp-price-a', 'Giá nhà A')) return;
    if (!requirePositive('cmp-price-b', 'Giá nhà B')) return;

    const priceA = parseNum('cmp-price-a'), downA = parseNum('cmp-down-a'), rateA = parseNum('cmp-rate-a'), termA = parseNum('cmp-term-a');
    const priceB = parseNum('cmp-price-b'), downB = parseNum('cmp-down-b'), rateB = parseNum('cmp-rate-b'), termB = parseNum('cmp-term-b');

    const loanA = priceA - downA, loanB = priceB - downB;
    const monthlyA = pmt(loanA, rateA, termA), monthlyB = pmt(loanB, rateB, termB);
    const totalA = monthlyA * termA * 12, totalB = monthlyB * termB * 12;
    const interestA = totalA - loanA, interestB = totalB - loanB;
    const diff = Math.abs(monthlyA - monthlyB);

    document.getElementById('cmp-results')!.style.display = 'block';

    const winner = document.getElementById('cmp-winner')!;
    if (monthlyA < monthlyB) {
        winner.innerHTML = `<div class="result-big positive">Phương án A tiết kiệm hơn</div><div class="result-big-label">Ít hơn ${usd(diff)}/tháng so với B</div>`;
    } else if (monthlyB < monthlyA) {
        winner.innerHTML = `<div class="result-big positive">Phương án B tiết kiệm hơn</div><div class="result-big-label">Ít hơn ${usd(diff)}/tháng so với A</div>`;
    } else {
        winner.innerHTML = `<div class="result-big">Hai lựa chọn tương đương</div>`;
    }

    document.getElementById('cmp-breakdown')!.innerHTML = `
    <div class="result-item"><span class="result-label">Trả góp/tháng A</span><span class="result-value primary">${usd(monthlyA)}</span></div>
    <div class="result-item"><span class="result-label">Trả góp/tháng B</span><span class="result-value" style="color:#a78bfa">${usd(monthlyB)}</span></div>
    <div class="result-item"><span class="result-label">Chênh lệch/tháng</span><span class="result-value warning">${usd(diff)}</span></div>
    <div class="result-item"><span class="result-label">Tổng lãi A</span><span class="result-value negative">${usd(interestA)}</span></div>
    <div class="result-item"><span class="result-label">Tổng lãi B</span><span class="result-value negative">${usd(interestB)}</span></div>
    <div class="result-item"><span class="result-label">Chênh lệch tổng lãi</span><span class="result-value ${interestA < interestB ? 'positive' : 'negative'}">${usd(Math.abs(interestA - interestB))}</span></div>
  `;
}
