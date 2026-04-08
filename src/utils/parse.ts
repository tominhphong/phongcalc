/**
 * Shared input parsing utilities for all calculators.
 * Extracted from 9 duplicate local parseNum() functions.
 */

/** Parse a currency/number input field by ID → number */
export function parseNum(id: string): number {
  const el = document.getElementById(id) as HTMLInputElement;
  if (!el) return 0;
  return parseFloat(el.value.replace(/[^0-9.-]/g, '')) || 0;
}

/** Parse percentage input (returns raw number, e.g. 6.5 for 6.5%) */
export function parsePct(id: string): number {
  return parseNum(id);
}

/** Format input field value with thousands separator on blur */
export function formatInput(id: string): void {
  const el = document.getElementById(id) as HTMLInputElement;
  if (!el) return;
  const val = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
  if (!isNaN(val)) el.value = val.toLocaleString('en-US');
}
