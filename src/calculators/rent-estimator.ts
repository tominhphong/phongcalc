import { usd } from '../utils/format';
import { parseNum } from '../utils/parse';
import { clearInputErrors, requirePositive } from '../utils/validate';

export function render(): string {
    return `
    <h2 class="calc-title"><span class="vi-text">🏘️ Ước Tính Tiền Thuê</span><span class="en-text">🏘️ Rent Estimator</span></h2>
    <p class="calc-desc">Tính mức giá thuê hợp lý cho bất động sản dựa trên thông số nhà.</p>

    <div class="card">
      <div class="card-title">🏠 Thông tin nhà</div>
      <div class="input-group">
        <label class="input-label"><span class="vi-text">Giá trị nhà</span><span class="en-text">Home Value</span></label>
        <input type="text" id="rent-value" class="input-field" value="350,000" inputmode="numeric" />
      </div>
      <div class="input-row">
        <div class="input-group">
          <label class="input-label">Phòng ngủ</label>
          <select id="rent-beds" class="input-field">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3" selected>3</option>
            <option value="4">4</option>
            <option value="5">5+</option>
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Phòng tắm</label>
          <select id="rent-baths" class="input-field">
            <option value="1">1</option>
            <option value="2" selected>2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label"><span class="vi-text">Diện tích (sqft)</span><span class="en-text">Square Footage (sqft)</span></label>
        <input type="text" id="rent-sqft" class="input-field" value="1,800" inputmode="numeric" />
      </div>
    </div>

    <div class="card">
      <div class="card-title">📊 Phương pháp ước tính</div>
      <div class="input-group">
        <label class="input-label"><span class="vi-text">Phương pháp tính</span><span class="en-text">Estimation Method</span></label>
        <select id="rent-method" class="input-field">
          <option value="1pct">Quy tắc 1% (Giá trị × 1%)</option>
          <option value="sqft" selected>Theo diện tích ($/sqft)</option>
          <option value="custom">Tùy chỉnh</option>
        </select>
      </div>
      <div class="input-group" id="rent-rate-group" style="display:none">
        <label class="input-label">Giá thuê/sqft/tháng ($)</label>
        <input type="text" id="rent-rate" class="input-field" value="1.20" inputmode="decimal" />
      </div>
      <button class="calc-btn" id="rent-calc-btn"><span class="vi-text">📊 Ước Tính</span><span class="en-text">📊 Estimate</span></button>
    </div>

    <div id="rent-results" style="display:none">
      <div class="result-card">
        <div class="result-big" id="rent-estimate"></div>
        <div class="result-big-label"><span class="vi-text">Tiền thuê đề xuất/tháng</span><span class="en-text">Recommended Monthly Rent</span></div>
      </div>
      <div class="card">
        <div class="card-title">📋 Phân tích</div>
        <div class="result-grid" id="rent-breakdown"></div>
      </div>
      <div class="card">
        <div class="card-title">💡 Phạm vi giá thuê</div>
        <div class="result-grid" id="rent-range"></div>
      </div>
      <button class="calc-btn" onclick="window.print()" style="margin-top:16px"><span class="vi-text">🖨️ In</span><span class="en-text">🖨️ Print</span></button>
    </div>
  `;
}


export function init() {
    const method = document.getElementById('rent-method') as HTMLSelectElement;
    const rateGroup = document.getElementById('rent-rate-group')!;

    method.addEventListener('change', () => {
        rateGroup.style.display = method.value === 'sqft' || method.value === 'custom' ? 'block' : 'none';
    });
    rateGroup.style.display = 'block'; // default is sqft

    ['rent-value', 'rent-sqft'].forEach(id => {
        document.getElementById(id)?.addEventListener('blur', () => {
            const el = document.getElementById(id) as HTMLInputElement;
            const v = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(v)) el.value = v.toLocaleString('en-US');
        });
    });

    document.getElementById('rent-calc-btn')!.addEventListener('click', calculate);
    calculate();
}

function calculate() {
    clearInputErrors('rent-value');
    if (!requirePositive('rent-value', 'Giá trị nhà')) return;

    const value = parseNum('rent-value');
    const beds = parseInt((document.getElementById('rent-beds') as HTMLSelectElement).value);
    const baths = parseInt((document.getElementById('rent-baths') as HTMLSelectElement).value);
    const sqft = parseNum('rent-sqft');
    const method = (document.getElementById('rent-method') as HTMLSelectElement).value;
    const ratePerSqft = parseNum('rent-rate');

    let estimate = 0;
    let methodName = '';

    if (method === '1pct') {
        estimate = value * 0.01;
        methodName = 'Quy tắc 1%';
    } else if (method === 'sqft') {
        estimate = sqft * ratePerSqft;
        methodName = `$${ratePerSqft.toFixed(2)}/sqft`;
    } else {
        estimate = sqft * ratePerSqft;
        methodName = 'Tùy chỉnh';
    }

    // DFW market adjustment: 4+ bedrooms command ~10% premium, 1 bed = -15%
    const bedAdjust = beds >= 4 ? 1.1 : beds <= 1 ? 0.85 : 1;
    estimate *= bedAdjust;

    // ±15% range reflects typical DFW rental market variance
    const low = estimate * 0.85;
    const high = estimate * 1.15;
    const annualRent = estimate * 12;
    const grossYield = (annualRent / value) * 100;

    document.getElementById('rent-results')!.style.display = 'block';
    document.getElementById('rent-estimate')!.textContent = usd(estimate) + '/tháng';

    document.getElementById('rent-breakdown')!.innerHTML = `
    <div class="result-item"><span class="result-label">Phương pháp</span><span class="result-value primary">${methodName}</span></div>
    <div class="result-item"><span class="result-label">Phòng ngủ / tắm</span><span class="result-value">${beds} / ${baths}</span></div>
    <div class="result-item"><span class="result-label">Diện tích</span><span class="result-value">${sqft.toLocaleString()} sqft</span></div>
    <div class="result-item"><span class="result-label">Tiền thuê/năm</span><span class="result-value positive">${usd(annualRent)}</span></div>
    <div class="result-item"><span class="result-label">Tỷ suất thuê gộp</span><span class="result-value ${grossYield >= 6 ? 'positive' : 'warning'}">${grossYield.toFixed(1)}%</span></div>
  `;

    document.getElementById('rent-range')!.innerHTML = `
    <div class="result-item"><span class="result-label">🔻 Thấp</span><span class="result-value">${usd(low)}</span></div>
    <div class="result-item"><span class="result-label">✅ Đề xuất</span><span class="result-value positive">${usd(estimate)}</span></div>
    <div class="result-item"><span class="result-label">🔺 Cao</span><span class="result-value">${usd(high)}</span></div>
  `;
}
