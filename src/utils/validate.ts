/**
 * Input validation utilities for all calculators.
 * Provides inline error display and clearing.
 */

/** Show red border + error message below an input field */
export function showInputError(id: string, message: string): void {
  const el = document.getElementById(id) as HTMLInputElement;
  if (!el) return;
  el.style.borderColor = '#f87171';
  el.style.boxShadow = '0 0 0 2px rgba(248,113,113,0.2)';

  // Remove existing error
  document.getElementById(id + '-err')?.remove();

  const errEl = document.createElement('span');
  errEl.id = id + '-err';
  errEl.className = 'input-error-msg';
  errEl.textContent = message;
  el.parentNode?.insertBefore(errEl, el.nextSibling);
}

/** Clear error state from a list of input IDs */
export function clearInputErrors(...ids: string[]): void {
  ids.forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement;
    if (el) {
      el.style.borderColor = '';
      el.style.boxShadow = '';
    }
    document.getElementById(id + '-err')?.remove();
  });
}

/** Validate a number is positive. Returns false and shows error if invalid. */
export function requirePositive(id: string, label: string): boolean {
  const el = document.getElementById(id) as HTMLInputElement;
  if (!el) return false;
  const val = parseFloat(el.value.replace(/[^0-9.-]/g, '')) || 0;
  if (val <= 0) {
    showInputError(id, `${label} phải lớn hơn 0`);
    return false;
  }
  return true;
}

/** Validate a number is within range. Returns false and shows error if invalid. */
export function requireRange(id: string, label: string, min: number, max: number): boolean {
  const el = document.getElementById(id) as HTMLInputElement;
  if (!el) return false;
  const val = parseFloat(el.value.replace(/[^0-9.-]/g, '')) || 0;
  if (val < min || val > max) {
    showInputError(id, `${label} phải từ ${min} đến ${max}`);
    return false;
  }
  return true;
}
