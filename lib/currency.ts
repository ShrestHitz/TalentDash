export const CURRENCY_RATES: Record<string, number> = {
  INR: 1,
  USD: 83.5,
  GBP: 105.2,
  EUR: 90.3,
};

export function toINR(amount: number, currency: string): number {
  return amount * (CURRENCY_RATES[currency] ?? 1);
}

export function fromINR(inr: number, targetCurrency: string): number {
  return inr / (CURRENCY_RATES[targetCurrency] ?? 1);
}

export function formatCurrency(
  amount: number,
  currency: string,
  displayCurrency: string = currency
): string {
  const inr = toINR(amount, currency);
  const converted = fromINR(inr, displayCurrency);

  if (displayCurrency === "INR") {
    return formatINR(converted);
  }
  return formatInternational(converted, displayCurrency);
}

function formatINR(amount: number): string {
  if (amount >= 10_000_000) {
    return `Rs ${(amount / 10_000_000).toFixed(2)} Cr`;
  }
  if (amount >= 100_000) {
    return `Rs ${(amount / 100_000).toFixed(2)} LPA`;
  }
  return `Rs ${Math.round(amount).toLocaleString("en-IN")}`;
}

function formatInternational(amount: number, currency: string): string {
  const symbols: Record<string, string> = { USD: "$", GBP: "GBP ", EUR: "EUR " };
  const sym = symbols[currency] ?? `${currency} `;
  if (amount >= 1_000_000) {
    return `${sym}${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `${sym}${(amount / 1000).toFixed(0)}K`;
  }
  return `${sym}${Math.round(amount).toLocaleString()}`;
}

export function computeTC(base: number, bonus: number, stock: number): number {
  return base + (bonus ?? 0) + (stock ?? 0);
}
