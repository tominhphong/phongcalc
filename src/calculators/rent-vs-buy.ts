import { rentVsBuyAnalysis } from '../utils/math';
import { usd } from '../utils/format';
import { createLine } from '../utils/charts';
import { parseNum } from '../utils/parse';
import { clearInputErrors, requirePositive, requireRange } from '../utils/validate';

export function render(): string {
    return `
    <h2 class="calc-title"><span class="vi-text">🏡 Thuê hay Mua?</span><span class="en-text">🏡 Rent vs Buy</span></h2>
    <p class="calc-desc">So sánh chi phí thuê nhà và mua nhà trong dài hạn để ra quyết định đúng đắn.</p>

    <div class="card">
      <div class="card-title">🏠 Thông tin mua nhà</div>
      <div class="input-group">
        <label class="input-label"><span class="vi-text">Giá nhà muốn mua</span><span class="en-text">Home Purchase Price</span></label>
        <input type="text" id="rvb-price" class="input-field" value="350,000" inputmode="numeric" />
      </div>
      <div class="input-group">
        <label class="input-label">Tiền trả trước</label>
        <input type="text" id="rvb-down" class="input-field" value="70,000" inputmode="numeric" />
      </div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Lãi suất (%)</label>
          <input type="text" id="rvb-rate" class="input-field" value="6.5" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label">Thuế BĐS (%)</label>
          <input type="text" id="rvb-tax" class="input-field" value="2.2" inputmode="decimal" />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">🏘️ Thông tin thuê nhà</div>
      <div class="input-group">
        <label class="input-label"><span class="vi-text">Tiền thuê/tháng</span><span class="en-text">Monthly Rent</span></label>
        <input type="text" id="rvb-rent" class="input-field" value="1,800" inputmode="numeric" />
      </div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Tăng thuê/năm (%)</label>
          <input type="text" id="rvb-rent-inc" class="input-field" value="3" inputmode="decimal" />
        </div>
        <div class="input-group">
          <label class="input-label">Nhà tăng giá/năm (%)</label>
          <input type="text" id="rvb-appr" class="input-field" value="3" inputmode="decimal" />
        </div>
      </div>
      <div class="input-group">
        <label class="input-label"><span class="vi-text">Số năm so sánh</span><span class="en-text">Years to Compare</span></label>
        <div class="slider-container">
          <input type="range" id="rvb-years-slider" class="slider" min="1" max="30" value="10" />
          <span class="slider-value" id="rvb-years-value">10 năm</span>
        </div>
      </div>
      <button class="calc-btn" id="rvb-calc-btn"><span class="vi-text">📊 So Sánh</span><span class="en-text">📊 Compare</span></button>
    </div>

    <div id="rvb-results" style="display:none">
      <div class="result-card" id="rvb-verdict"></div>
      <div class="card">
        <div class="card-title">📈 Chi phí lũy kế theo năm</div>
        <div style="height:280px;position:relative">
          <canvas id="rvb-chart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📋 Chi tiết</div>
        <div class="result-grid" id="rvb-breakdown"></div>
      </div>
      <button class="calc-btn" onclick="window.print()" style="margin-top:16px"><span class="vi-text">🖨️ In</span><span class="en-text">🖨️ Print</span></button>
    </div>
  `;
}


export function init() {
    const slider = document.getElementById('rvb-years-slider') as HTMLInputElement;
    const label = document.getElementById('rvb-years-value')!;
    slider.addEventListener('input', () => { label.textContent = slider.value + ' năm'; });

    ['rvb-price', 'rvb-down', 'rvb-rent'].forEach(id => {
        document.getElementById(id)?.addEventListener('blur', () => {
            const el = document.getElementById(id) as HTMLInputElement;
            const v = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(v)) el.value = v.toLocaleString('en-US');
        });
    });

    document.getElementById('rvb-calc-btn')!.addEventListener('click', calculate);
    calculate();
}

function calculate() {
    clearInputErrors('rvb-price', 'rvb-rent');
    if (!requirePositive('rvb-price', 'Giá nhà')) return;
    if (!requirePositive('rvb-rent', 'Tiền thuê')) return;
    if (!requireRange('rvb-rate', 'Lãi suất', 0.1, 30)) return;

    const price = parseNum('rvb-price');
    const down = parseNum('rvb-down');
    const rate = parseNum('rvb-rate');
    const rent = parseNum('rvb-rent');
    const rentInc = parseNum('rvb-rent-inc');
    const appr = parseNum('rvb-appr');
    const taxRate = parseNum('rvb-tax');
    const years = parseInt((document.getElementById('rvb-years-slider') as HTMLInputElement).value);

    const results = rentVsBuyAnalysis(price, rent, down, rate, years, appr, rentInc, taxRate);
    const lastYear = results[results.length - 1];

    document.getElementById('rvb-results')!.style.display = 'block';

    const verdict = document.getElementById('rvb-verdict')!;
    if (lastYear.buyCost < lastYear.rentCost) {
        const savings = lastYear.rentCost - lastYear.buyCost;
        verdict.innerHTML = `<div class="result-big positive"><span class="vi-text">🏠 Mua nhà có lợi hơn!</span><span class="en-text">🏠 Buying is Better!</span></div><div class="result-big-label">Tiết kiệm ${usd(savings)} sau ${years} năm so với thuê</div>`;
    } else {
        const savings = lastYear.buyCost - lastYear.rentCost;
        verdict.innerHTML = `<div class="result-big" style="color:#fbbf24"><span class="vi-text">🏘️ Thuê nhà có lợi hơn</span><span class="en-text">🏘️ Renting is Better</span></div><div class="result-big-label">Tiết kiệm ${usd(savings)} sau ${years} năm so với mua</div>`;
    }

    // Chart
    const labels = results.map(r => `Năm ${r.year}`);
    createLine('rvb-chart', labels, [
        { label: 'Chi phí thuê', data: results.map(r => Math.round(r.rentCost)), color: '#f87171' },
        { label: 'Chi phí mua (trừ equity)', data: results.map(r => Math.round(r.buyCost)), color: '#34d399' },
    ]);

    document.getElementById('rvb-breakdown')!.innerHTML = `
    <div class="result-item"><span class="result-label">Tổng chi phí thuê (${years} năm)</span><span class="result-value negative">${usd(lastYear.rentCost)}</span></div>
    <div class="result-item"><span class="result-label">Tổng chi phí mua (${years} năm)</span><span class="result-value primary">${usd(lastYear.buyCost)}</span></div>
    <div class="result-item"><span class="result-label">Chênh lệch</span><span class="result-value ${lastYear.buyCost < lastYear.rentCost ? 'positive' : 'negative'}">${usd(Math.abs(lastYear.rentCost - lastYear.buyCost))}</span></div>
    <div class="result-item"><span class="result-label">Giá trị nhà sau ${years} năm</span><span class="result-value positive">${usd(price * Math.pow(1 + appr / 100, years))}</span></div>
  `;
}
