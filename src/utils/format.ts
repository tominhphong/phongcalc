// Currency and number formatting utilities

/** Format as USD currency */
export function usd(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Format as USD with cents */
export function usdCents(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/** Format as percentage */
export function pct(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
}

/** Format number with commas */
export function num(value: number): string {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
}

/** Parse currency input string to number */
export function parseCurrency(str: string): number {
    return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
}

/** Create a labeled value display */
export function labelValue(label: string, value: string, colorClass: string = ''): string {
    return `<div class="result-item ${colorClass}">
    <span class="result-label">${label}</span>
    <span class="result-value">${value}</span>
  </div>`;
}
