/** The digits a date can be written with: 0–9, or Devanagari ०–९. */
export type DigitSystem = "latin" | "devanagari";

/** Code point of Devanagari zero, ०. The digits ०–९ are consecutive from here. */
const DEVANAGARI_ZERO = 0x0966;
const DEVANAGARI_DIGIT = /[०-९]/g;

/** Rewrites 0–9 as ०–९. */
export function toDevanagariDigits(text: string): string {
  return text.replace(/[0-9]/g, (digit) => String.fromCharCode(DEVANAGARI_ZERO + Number(digit)));
}

/** Rewrites ०–९ as 0–9, leaving everything else as it is. */
export function toLatinDigits(text: string): string {
  return text.replace(DEVANAGARI_DIGIT, (digit) => String(digit.charCodeAt(0) - DEVANAGARI_ZERO));
}

/** Checks a DigitSystem from outside TypeScript. Throws RangeError for anything else. */
export function assertDigitSystem(digits: DigitSystem): void {
  if (digits !== "latin" && digits !== "devanagari") {
    throw new RangeError(`digits must be "latin" or "devanagari", got ${JSON.stringify(digits)}`);
  }
}
